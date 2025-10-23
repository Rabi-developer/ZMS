"use client";
import React from 'react';
import { getAllRoles, deleteRole } from '@/apis/roles';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import RoleForm from './RoleForm';

export interface Role {
  id: string;
  name: string;
  description?: string;
  resourcesKeywords?: string;
  claims: {
    id: number;
    roleId: string;
    claimType: string;
    claimValue: string; // Comma-separated string
  }[];
}

interface FormattedRole {
  id?: string;
  name: string;
  description?: string;
  resourcesKeywords?: string;
  claims?: {
    claimType: string;
    claimValue: string; // Comma-separated string
  }[];
}

const RoleList = () => {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0); 
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<FormattedRole | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await getAllRoles(pageIndex + 1, pageSize);
      
      if (Array.isArray(response)) {
        setRoles(response);
      } else {
        console.error('Unexpected response format:', response);
        setRoles([]);
        toast.error('Unexpected data format received');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRoles();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteRole(deleteId);
      setOpen(false);
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete Role:', error);
      toast.error('Failed to delete role');
    }
  };

  const handleEdit = (role: Role) => {
    const formattedRole: FormattedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      resourcesKeywords: role.resourcesKeywords,
      claims: role.claims.map(claim => ({
        claimType: claim.claimType,
        claimValue: claim.claimValue
      }))
    };
    setEditingRole(formattedRole);
    setShowForm(true);
  };

  const handleFormClose = (refresh = false) => {
    setShowForm(false);
    setEditingRole(null);
    if (refresh) {
      fetchRoles();
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleId(selectedRoleId === roleId ? null : roleId);
  };

  return (
    <div className="container mx-auto py-6">
      {showForm ? (
        <RoleForm 
          id={editingRole?.id} 
          initialData={editingRole || undefined} 
          onClose={handleFormClose} 
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage application roles and permissions</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] hover:from-[#1a5f3a]/90 hover:to-[#2a7f4a]/90 text-white rounded-xl transition-all duration-300 shadow-lg"
            >
              Create New Role
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-[#d4a017] overflow-hidden">
            <div className="p-6 border-b-2 border-[#d4a017] bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a]">
              <h2 className="text-xl font-semibold text-white">Roles List</h2>
              <p className="text-white mt-1">
                {loading ? 'Loading roles...' : `Showing ${roles.length} role${roles.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {loading ? (
              <div className="p-3 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : roles.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                No roles found. <Button variant="link" onClick={() => setShowForm(true)}>Create one now</Button>
              </div>
            ) : (
              <div className="divide-y divide-[#d4a017]">
                {roles.map((role) => (
                  <div key={role.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div 
                      className="flex justify-between items-start cursor-pointer"
                      onClick={() => toggleRoleSelection(role.id)}
                    >
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{role.name}</h3>
                        {role.resourcesKeywords && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <span className="font-medium">Keywords:</span> {role.resourcesKeywords}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="px-2 py-1 bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] text-white text-xs rounded">
                            {role.claims.length} permission{role.claims.length !== 1 ? 's' : ''}
                          </span>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(role);
                          }}
                          className="border-[#1a5f3a] text-[#1a5f3a] hover:bg-[#1a5f3a] hover:text-white transition-all duration-300"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(true);
                            setDeleteId(role.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 transition-all duration-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {selectedRoleId === role.id && (
                      <div className="mt-4 pl-4 border-l-4 border-[#d4a017]">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Permissions:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {role.claims.map((claim, index) => (
                            <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 border border-[#d4a017]/30">
                              <div className="font-medium text-gray-800 dark:text-gray-200">{claim.claimType}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {claim.claimValue.split(',').map((val, i) => (
                                  <span 
                                    key={i} 
                                    className="inline-block bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] text-white text-xs px-2 py-1 rounded mr-1 mb-1"
                                  >
                                    {val.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t-2 border-[#d4a017] flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {pageIndex + 1}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                  className="border-[#1a5f3a] text-[#1a5f3a] hover:bg-[#1a5f3a] hover:text-white transition-all duration-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPageIndex(pageIndex + 1)}
                  disabled={roles.length < pageSize}
                  className="border-[#1a5f3a] text-[#1a5f3a] hover:bg-[#1a5f3a] hover:text-white transition-all duration-300"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-3 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Role</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this role? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleList;