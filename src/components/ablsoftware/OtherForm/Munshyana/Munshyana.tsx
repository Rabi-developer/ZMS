'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createMunshyana, updateMunshyana } from '@/apis/munshyana';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdAddBusiness, MdDescription } from 'react-icons/md';
import { FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';

// Define the schema for munshyana form validation
const munshyanaSchema = z.object({
  MunshyanaNumber: z.string().optional(),
  chargesDesc: z.string().min(1, 'Charges Description is required'),
  chargesType: z.enum(['Payable', 'Receivable'], { 
    required_error: 'Charges Type is required' 
  }),
  accountId: z.string().min(1, 'Account is required'),
  description: z.string().min(1, 'Description is required'),
});

type MunshyanaFormData = z.infer<typeof munshyanaSchema>;

type Account = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
  dueDate: string;
  fixedAmount: string;
  paid: string;
};

interface MunshyanaFormProps {
  isEdit?: boolean;
  initialData?: Partial<MunshyanaFormData> & {
    id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdDateTime?: string;
    createdBy?: string;
    modifiedDateTime?: string;
    modifiedBy?: string;
  };
}

const MunshyanaForm = ({ isEdit = false, initialData }: MunshyanaFormProps) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MunshyanaFormData>({
    resolver: zodResolver(munshyanaSchema),
    defaultValues: initialData
      ? {
          MunshyanaNumber: initialData.MunshyanaNumber || '',
          chargesDesc: initialData.chargesDesc || '',
          chargesType: initialData.chargesType || undefined,
          accountId: initialData.accountId || '',
          description: initialData.description || '',
        }
      : {
          MunshyanaNumber: '',
          chargesDesc: '',
          chargesType: undefined,
          accountId: '',
          description: '',
        },
  });

  const [idFocused, setIdFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Watch the chargesType field to trigger account fetching
  const selectedChargesType = watch('chargesType');

  // Dropdown options for Charges Type
  const chargesTypes = [
    { id: 'Payable', name: 'Payable' },
    { id: 'Receivable', name: 'Receivable' },
  ];

  // Function to fetch accounts based on charges type
  const fetchAccounts = async (chargesType: 'Payable' | 'Receivable') => {
    try {
      setLoadingAccounts(true);
      let response;
      if (chargesType === 'Payable') {
        response = await getAllAblLiabilities(1, 100);
      } else {
        response = await getAllAblRevenue(1, 100);
      }
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Generate MunshyanaNumber for new munshyana
  useEffect(() => {
    if (!isEdit) {
      const generatedMunshyanaNumber = `M${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setValue('MunshyanaNumber', generatedMunshyanaNumber);
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        MunshyanaNumber: initialData.MunshyanaNumber || '',
        chargesDesc: initialData.chargesDesc || '',
        chargesType: initialData.chargesType || undefined,
        accountId: initialData.accountId || '',
        description: initialData.description || '',
      });
      // Fetch accounts for the selected charges type
      if (initialData.chargesType) {
        fetchAccounts(initialData.chargesType);
      }
    }
  }, [isEdit, initialData, reset]);

  // Effect to fetch accounts when charges type changes
  useEffect(() => {
    if (selectedChargesType && (!isEdit || (isEdit && initialData?.chargesType !== selectedChargesType))) {
      fetchAccounts(selectedChargesType);
      setValue('accountId', '');
      setValue('description', '');
    }
  }, [selectedChargesType, setValue, isEdit, initialData]);

  // Create dropdown options from accounts
  const accountOptions = accounts.map(account => ({
    id: account.listid, // Use listid as the identifier (e.g., "1.1")
    name: `${account.listid} - ${account.description}`,
  }));

  // Handle account selection
  const handleAccountSelection = (accountListId: string) => {
    const selectedAccount = accounts.find(account => account.listid === accountListId);
    if (selectedAccount) {
      setValue('accountId', selectedAccount.listid, { shouldValidate: true }); // Store listid instead of id
      setValue('description', selectedAccount.description, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: MunshyanaFormData) => {
    setIsSubmitting(true);
    try {
      let payload = {};
      if (isEdit) {
        payload = {
          id: initialData?.id || initialData?.MunshyanaNumber || window.location.pathname.split('/').pop() || '',
          isActive: true,
          isDeleted: false,
          munshyanaNumber: data.MunshyanaNumber || '',
          chargesDesc: data.chargesDesc || '',
          chargesType: data.chargesType,
          accountId: data.accountId || '',
          description: data.description || '',
        };
        await updateMunshyana(payload);
        toast.success('Munshyana updated successfully!');
      } else {
        payload = {
          isActive: true,
          isDeleted: false,
          munshyanaNumber: data.MunshyanaNumber || `M${Date.now()}${Math.floor(Math.random() * 1000)}`,
          chargesDesc: data.chargesDesc || '',
          chargesType: data.chargesType,
          accountId: data.accountId || '',
          description: data.description || '',
        };
        await createMunshyana(payload);
        toast.success('Munshyana created successfully!');
      }
      router.push('/munshyana');
    } catch (error) {
      console.error('Error saving munshyana:', error);
      toast.error('An error occurred while saving the munshyana');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Main Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdAddBusiness className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Charges' : 'Add New Charges'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update munshyana information' : 'Create a new munshyana record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/munshyana">
                  <Button
                    type="button"
                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm px-4 py-2 shadow-lg hover:shadow-xl"
                  >
                    <FiX className="mr-2" /> Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MdDescription className="text-[#3a614c] text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Charges Details
                  </h3>
                </div>
                <div className="space-y-5">
                  <Controller
                    name="MunshyanaNumber"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <ABLCustomInput
                          {...field}
                          label="ID"
                          type="text"
                          placeholder={isEdit ? 'Munshyana Number' : 'Auto-generated'}
                          register={register}
                          error={errors.MunshyanaNumber?.message}
                          id="MunshyanaNumber"
                          disabled
                          onFocus={() => setIdFocused(true)}
                          onBlur={() => setIdFocused(false)}
                        />
                        {idFocused && (
                          <div className="absolute -top-8 left-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-lg z-10">
                            Auto-generated
                          </div>
                        )}
                      </div>
                    )}
                  />
                  <ABLCustomInput
                    label="Charges Description"
                    type="text"
                    placeholder="Enter charges description"
                    register={register}
                    error={errors.chargesDesc?.message}
                    id="chargesDesc"
                  />
                  <Controller
                    name="chargesType"
                    control={control}
                    render={({ field }) => (
                      <AblCustomDropdown
                        label="Charges Type"
                        options={chargesTypes}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('chargesType', value as 'Payable' | 'Receivable', { shouldValidate: true })}
                        error={errors.chargesType?.message}
                        register={register}
                      />
                    )}
                  />
                  {selectedChargesType && (
                    <div className="space-y-2">
                      {loadingAccounts && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-4 h-4 border-2 border-[#3a614c] border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading {selectedChargesType.toLowerCase()} accounts...</span>
                        </div>
                      )}
                      <Controller
                        name="accountId"
                        control={control}
                        render={({ field }) => (
                          <AblCustomDropdown
                            label="Account ID"
                            options={accountOptions}
                            selectedOption={field.value || ''}
                            onChange={(val) => {
                              field.onChange(val);
                              handleAccountSelection(val);
                            }}
                            error={errors.accountId?.message}
                            register={register}
                            disabled={loadingAccounts}
                          />
                        )}
                      />
                      {!loadingAccounts && accountOptions.length === 0 && selectedChargesType && (
                        <p className="text-sm text-gray-500">
                          No {selectedChargesType.toLowerCase()} accounts found.
                        </p>
                      )}
                    </div>
                  )}
                  {!selectedChargesType && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Please select a Charges Type first to see available accounts.
                      </p>
                    </div>
                  )}
                  <ABLCustomInput
                    label="Description"
                    type="text"
                    placeholder="Description will be auto-filled"
                    register={register}
                    error={errors.description?.message}
                    id="description"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700 mt-8">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#3a614c]/30 font-medium text-sm"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="text-lg" />
                      <span>{isEdit ? 'Update Charges' : 'Create Charges'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>

        {/* Form Navigation Card */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MdDescription className="text-[#3a614c]" />
              <span className="text-sm">Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link
              href="/munshyana"
              className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors"
            >
              Back to Charges List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MunshyanaForm;