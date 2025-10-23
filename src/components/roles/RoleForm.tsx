'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { createRole, updateRole } from '@/apis/roles';
import { sideBarItems } from '@/components/lib/StaticData/sideBarItems';
import { ablSideBarItems } from '@/components/lib/StaticData/ablSideBarItems';

const CLAIM_VALUES = ['Read', 'Create', 'Update', 'Delete', 'Execute'] as const;

interface SelectedPermission {
  system: 'ZMS' | 'ABL';
  category: string;
  form: string;
  subForm?: string;
  permissions: string[];
  href: string;
}

interface PermissionBuilder {
  selectedSystems: ('ZMS' | 'ABL')[];
  selectedCategories: { [system: string]: string[] };
  selectedForms: { [systemCategory: string]: string[] };
  selectedSubForms: { [formKey: string]: string[] };
  currentFormPermissions: { [formKey: string]: string[] };
}

interface MenuItem {
  system: 'ZMS' | 'ABL';
  category: string;
  forms: { name: string; href: string; hasSubMenu: boolean; subForms: { name: string; href: string }[] }[];
}

interface FormItem {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  resourcesKeywords: z.string().optional(),
  claims: z.array(
    z.object({
      claimType: z.string().min(1),
      claimValue: z.string().min(1),
    })
  ).optional(),
});

type RoleFormValues = z.infer<typeof formSchema>;

interface RoleFormProps {
  id?: string;
  initialData?: Partial<RoleFormValues> & { id?: string };
  onClose?: (refresh?: boolean) => void;
}

const getMenuItems = (items: any[], system: 'ZMS' | 'ABL'): MenuItem[] => {
  const menuStructure: MenuItem[] = [];
  items.forEach(item => {
    if (item.type !== 'heading' && item.text && !['HOME', 'ABL', 'TRANSACTIONS', 'REPORTS', 'Voucher', 'Voucher Report', 'ACCOUNTS & USERS'].includes(item.text)) {
      if (item.sub_menu?.length) {
        menuStructure.push({
          system,
          category: item.text,  
          forms: item.sub_menu.map((subItem: any) => ({
            name: subItem.text,
            href: subItem.href || '',
            hasSubMenu: !!subItem.sub_menu?.length,
            subForms: subItem.sub_menu?.map((subSubItem: any) => ({
              name: subSubItem.text,
              href: subSubItem.href || '',
            })) || [],
          })),
        });
      } else if (item.href) {
        menuStructure.push({
          system,
          category: 'General',
          forms: [{ name: item.text, href: item.href, hasSubMenu: false, subForms: [] }],
        });
      }
    }
  });
  return menuStructure;
};

const RoleForm: React.FC<RoleFormProps> = ({ id, initialData, onClose }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || { name: '', resourcesKeywords: '', claims: [] },
  });

  const [permissionBuilder, setPermissionBuilder] = useState<PermissionBuilder>({
    selectedSystems: [],
    selectedCategories: {},
    selectedForms: {},
    selectedSubForms: {},
    currentFormPermissions: {},
  });
  const claims = watch('claims') || [];
  const zmsMenuStructure = getMenuItems(sideBarItems, 'ZMS');
  const ablMenuStructure = getMenuItems(ablSideBarItems, 'ABL');

  const getMenuStructureForSystem = (system: 'ZMS' | 'ABL'): MenuItem[] => system === 'ZMS' ? zmsMenuStructure : ablMenuStructure;
  const getCategoriesForSystem = (system: 'ZMS' | 'ABL'): string[] => Array.from(new Set(getMenuStructureForSystem(system).map((item: MenuItem) => item.category)));
  const getFormsForSystemCategory = (system: 'ZMS' | 'ABL', category: string): FormItem[] => {
    const categoryData = getMenuStructureForSystem(system).find((item: MenuItem) => item.category === category);
    return categoryData ? categoryData.forms.map((form: any) => ({ id: form.name, name: form.name })) : [];
  };
  const getSubFormsForSystemForm = (system: 'ZMS' | 'ABL', category: string, formName: string): FormItem[] => {
    const categoryData = getMenuStructureForSystem(system).find((item: MenuItem) => item.category === category);
    const form = categoryData?.forms.find((f: any) => f.name === formName);
    return form?.subForms?.length ? form.subForms.map((subForm: any) => ({ id: subForm.name, name: subForm.name })) : [];
  };

  const buildFinalPermissions = () => {
    const finalPermissions: SelectedPermission[] = [];
    permissionBuilder.selectedSystems.forEach(system => {
      const menuStructure = getMenuStructureForSystem(system);
      (permissionBuilder.selectedCategories[system] || []).forEach(category => {
        const systemCategoryKey = `${system}-${category}`;
        const forms = permissionBuilder.selectedForms[systemCategoryKey] || [];
        forms.forEach((form: string) => {
          const formKey = `${system}-${category}-${form}`;
          const permissions = permissionBuilder.currentFormPermissions[formKey] || [];
          if (permissions.length) {
            const formData = menuStructure.find((item: MenuItem) => item.category === category)?.forms.find((f: any) => f.name === form);
            finalPermissions.push({ system, category, form, permissions, href: formData?.href || '' });
          }
          (permissionBuilder.selectedSubForms[formKey] || []).forEach((subForm: string) => {
            const subFormKey = `${formKey}-${subForm}`;
            const subFormPermissions = permissionBuilder.currentFormPermissions[subFormKey] || [];
            if (subFormPermissions.length) {
              const subFormData = menuStructure.find((item: MenuItem) => item.category === category)?.forms.find((f: any) => f.name === form)?.subForms.find((sf: any) => sf.name === subForm);
              finalPermissions.push({ system, category, form, subForm, permissions: subFormPermissions, href: subFormData?.href || '' });
            }
          });
        });
      });
    });
    setValue('claims', finalPermissions.map(perm => ({
      claimType: perm.subForm ? `${perm.system}-${perm.category}-${perm.form}-${perm.subForm}` : `${perm.system}-${perm.category}-${perm.form}`,
      claimValue: perm.permissions.join(', '),
    })));
    return finalPermissions;
  };

  const onSubmit = async (data: RoleFormValues) => {
    try {
      const roleId = id || initialData?.id;
      buildFinalPermissions(); // Build permissions before submission
      
      // Format claims according to the required API structure
      const formattedClaims = claims.map(claim => ({
        id: 0, // Always 0 for new claims as specified
        roleId: roleId || "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Use existing roleId or generate one for new roles
        claimType: claim.claimType,
        claimValue: claim.claimValue
      }));
      
      const formattedData = {
        ...(roleId ? { id: roleId } : { id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" }), // Include id field for both create and update
        name: data.name,
        resourcesKeywords: data.resourcesKeywords || '', // Add resources keywords field
        claims: formattedClaims
      };
      
      await (roleId ? updateRole(roleId, formattedData) : createRole(formattedData));
      toast.success(roleId ? 'Role updated' : 'Role created');
      onClose?.(true);
    } catch (error) {
      toast.error('Error submitting form');
      console.error(error);
    }
  };

  const toggleSystem = (system: 'ZMS' | 'ABL') => {
    setPermissionBuilder(prev => ({
      ...prev,
      selectedSystems: prev.selectedSystems.includes(system) ? prev.selectedSystems.filter(s => s !== system) : [...prev.selectedSystems, system],
    }));
  };

  const toggleCategory = (system: 'ZMS' | 'ABL', category: string) => {
    setPermissionBuilder(prev => {
      const systemCategories = prev.selectedCategories[system] || [];
      return {
        ...prev,
        selectedCategories: {
          ...prev.selectedCategories,
          [system]: systemCategories.includes(category) ? systemCategories.filter(c => c !== category) : [...systemCategories, category],
        },
      };
    });
  };

  const toggleForm = (system: 'ZMS' | 'ABL', category: string, form: string) => {
    const systemCategoryKey = `${system}-${category}`;
    setPermissionBuilder(prev => {
      const categoryForms = prev.selectedForms[systemCategoryKey] || [];
      return {
        ...prev,
        selectedForms: {
          ...prev.selectedForms,
          [systemCategoryKey]: categoryForms.includes(form) ? categoryForms.filter(f => f !== form) : [...categoryForms, form],
        },
      };
    });
  };

  const toggleSubForm = (system: 'ZMS' | 'ABL', category: string, form: string, subForm: string) => {
    const formKey = `${system}-${category}-${form}`;
    setPermissionBuilder(prev => {
      const formSubForms = prev.selectedSubForms[formKey] || [];
      return {
        ...prev,
        selectedSubForms: {
          ...prev.selectedSubForms,
          [formKey]: formSubForms.includes(subForm) ? formSubForms.filter(sf => sf !== subForm) : [...formSubForms, subForm],
        },
      };
    });
  };

  const togglePermissionForForm = (formKey: string, permission: string) => {
    setPermissionBuilder(prev => {
      const formPermissions = prev.currentFormPermissions[formKey] || [];
      return {
        ...prev,
        currentFormPermissions: {
          ...prev.currentFormPermissions,
          [formKey]: formPermissions.includes(permission) ? formPermissions.filter(p => p !== permission) : [...formPermissions, permission],
        },
      };
    });
  };

  const grantFullPermissions = (system: 'ZMS' | 'ABL') => {
    const newPermissionBuilder = { ...permissionBuilder };
    const menuStructure = getMenuStructureForSystem(system);
    newPermissionBuilder.selectedCategories[system] = menuStructure.map((item: MenuItem) => item.category);
    menuStructure.forEach(category => {
      const systemCategoryKey = `${system}-${category.category}`;
      newPermissionBuilder.selectedForms[systemCategoryKey] = category.forms.map((f: any) => f.name);
      category.forms.forEach((form: any) => {
        const formKey = `${system}-${category.category}-${form.name}`;
        newPermissionBuilder.currentFormPermissions[formKey] = [...CLAIM_VALUES];
        if (form.subForms?.length) {
          newPermissionBuilder.selectedSubForms[formKey] = form.subForms.map((sf: any) => sf.name);
          form.subForms.forEach((subForm: any) => {
            newPermissionBuilder.currentFormPermissions[`${formKey}-${subForm.name}`] = [...CLAIM_VALUES];
          });
        }
      });
    });
    setPermissionBuilder(newPermissionBuilder);
    toast.success(`Full permissions granted for ${system}`);
  };

  const grantCategoryPermissions = (system: 'ZMS' | 'ABL', category: string) => {
    const systemCategoryKey = `${system}-${category}`;
    const forms = getFormsForSystemCategory(system, category).map((f: FormItem) => f.id);
    setPermissionBuilder(prev => ({
      ...prev,
      selectedCategories: { ...prev.selectedCategories, [system]: [...(prev.selectedCategories[system] || []), category] },
      selectedForms: { ...prev.selectedForms, [systemCategoryKey]: forms },
      currentFormPermissions: {
        ...prev.currentFormPermissions,
        ...forms.reduce((acc: { [key: string]: string[] }, form: string) => {
          const formKey = `${system}-${category}-${form}`;
          return { ...acc, [formKey]: [...CLAIM_VALUES] };
        }, {}),
      },
    }));
    toast.success(`Permissions granted for ${category}`);
  };

  const renderSystemPermissions = (system: 'ZMS' | 'ABL') => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 flex-1 max-h-[400px] overflow-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSystem(system)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${permissionBuilder.selectedSystems.includes(system) ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            {system}
          </button>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{system === 'ZMS' ? 'Zonal Management' : 'Abu Bakar Logistics'}</h4>
        </div>
        <button
          type="button"
          onClick={() => grantFullPermissions(system)}
          className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 transition-all duration-200"
        >
          Grant All
        </button>
      </div>
      <div className="space-y-2">
        {getCategoriesForSystem(system).map(category => {
          const isCategorySelected = permissionBuilder.selectedCategories[system]?.includes(category);
          return (
            <div
              key={category}
              className={`rounded-md p-2 transition-all duration-200 border transform hover:scale-[1.01] ${isCategorySelected ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
            >
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => toggleCategory(system, category)}
                  className={`text-sm font-semibold ${isCategorySelected ? 'text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {category}
                </button>
                <button
                  type="button"
                  onClick={() => grantCategoryPermissions(system, category)}
                  className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 transition-all duration-200"
                >
                  Grant All
                </button>
              </div>
              {isCategorySelected && (
                <div className="mt-2 space-y-1">
                  {getFormsForSystemCategory(system, category).map(form => {
                    const systemCategoryKey = `${system}-${category}`;
                    const formKey = `${system}-${category}-${form.id}`;
                    const isFormSelected = permissionBuilder.selectedForms[systemCategoryKey]?.includes(form.id);
                    return (
                      <div key={form.id} className="ml-2">
                        <button
                          type="button"
                          onClick={() => toggleForm(system, category, form.id)}
                          className={`text-xs font-medium ${isFormSelected ? 'text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                          {form.name}
                        </button>
                        {isFormSelected && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {CLAIM_VALUES.map(permission => (
                              <button
                                key={permission}
                                type="button"
                                onClick={() => togglePermissionForForm(formKey, permission)}
                                className={`px-2 py-0.5 text-xs rounded-full font-medium transition-all duration-200 ${permissionBuilder.currentFormPermissions[formKey]?.includes(permission) ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-800'}`}
                              >
                                {permission}
                              </button>
                            ))}
                          </div>
                        )}
                        {isFormSelected && getSubFormsForSystemForm(system, category, form.id).map(subForm => {
                          const subFormKey = `${formKey}-${subForm.id}`;
                          const isSubFormSelected = permissionBuilder.selectedSubForms[formKey]?.includes(subForm.id);
                          return (
                            <div key={subForm.id} className="ml-4 mt-1">
                              <button
                                type="button"
                                onClick={() => toggleSubForm(system, category, form.id, subForm.id)}
                                className={`text-xs ${isSubFormSelected ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                              >
                                {subForm.name}
                              </button>
                              {isSubFormSelected && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {CLAIM_VALUES.map(permission => (
                                    <button
                                      key={permission}
                                      type="button"
                                      onClick={() => togglePermissionForForm(subFormKey, permission)}
                                      className={`px-2 py-0.5 text-xs rounded-full font-medium transition-all duration-200 ${permissionBuilder.currentFormPermissions[subFormKey]?.includes(permission) ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-800'}`}
                                    >
                                      {permission}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        {id ? 'Edit Role' : 'Create Role'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name *</label>
          <input
            {...register('name')}
            className={`w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-200 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="Enter role name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resources Keywords</label>
          <input
            {...register('resourcesKeywords')}
            className={`w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-200 ${errors.resourcesKeywords ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder="Enter resources keywords (comma-separated)"
          />
          {errors.resourcesKeywords && <p className="text-red-500 text-xs mt-1">{errors.resourcesKeywords.message}</p>}
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Permission Builder</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {(['ZMS', 'ABL'] as const).map(system => (
              <button
                key={system}
                type="button"
                onClick={() => toggleSystem(system)}
                className={`flex-1 p-3 rounded-md text-center transition-all duration-200 border ${permissionBuilder.selectedSystems.includes(system) ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 border-gray-300 dark:border-gray-600'}`}
              >
                <span className="font-medium text-sm">{system}</span>
                <p className="text-xs opacity-75">{system === 'ZMS' ? '' : ''}</p>
              </button>
            ))}
          </div>
          {permissionBuilder.selectedSystems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {(['ZMS', 'ABL'] as const).map(system => (
                permissionBuilder.selectedSystems.includes(system) && (
                  <div key={system} className="flex-1">
                    {renderSystemPermissions(system)}
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200 text-sm font-medium shadow-sm"
          >
            {id ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;