'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createSaleTexes, updateSaleTexes, getAllSaleTexes } from '@/apis/salestexes';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdAddBusiness, MdDescription } from 'react-icons/md';
import { FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';

// Define the schema for sales tax form validation
const salesTaxSchema = z.object({
  SalesTexNumber: z.string().optional(),
  taxName: z.string().min(1, 'Tax Name is required'),
  taxType: z.enum(['Sale Tax', 'WHT Tax', 'SBR Tax', '%'], { 
    required_error: 'Tax Type is required' 
  }),
  percentage: z.string().optional(),
  receivable: z.object({
    accountId: z.string().min(1, 'Receivable Account ID is required'),
    description: z.string().min(1, 'Receivable Description is required'),
  }),
  payable: z.object({
    accountId: z.string().min(1, 'Payable Account ID is required'),
    description: z.string().min(1, 'Payable Description is required'),
  }),
});

type SalesTaxFormData = z.infer<typeof salesTaxSchema>;

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

type ApiResponse<T> = {
  data: T;
  statusCode: number;
  statusMessage: string;
  misc: {
    totalPages: number;
    total: number;
    pageIndex: number;
    pageSize: number;
    refId: string | null;
    searchQuery: string | null;
  };
};

const SalesTaxesForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SalesTaxFormData>({
    resolver: zodResolver(salesTaxSchema),
    defaultValues: {
      SalesTexNumber: '',
      taxName: '',
      taxType: undefined,
      percentage: '',
      receivable: { accountId: '', description: '' },
      payable: { accountId: '', description: '' },
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liabilityAccounts, setLiabilityAccounts] = useState<Account[]>([]);
  const [revenueAccounts, setRevenueAccounts] = useState<Account[]>([]);
  const [extractedPercentage, setExtractedPercentage] = useState<string>('');
  
  // Watch taxName to extract percentage
  const taxName = watch('taxName');

  // Dropdown options for Tax Type
  const taxTypes = [
    { id: 'Sale Tax', name: 'Sale Tax' },
    { id: 'WHT Tax', name: 'WHT Tax' },
    { id: 'SBR Tax', name: 'SBR Tax' },
  ];

  // Function to extract percentage from tax name
  const extractPercentageFromTaxName = (taxName: string): string => {
    const percentageMatch = taxName.match(/(\d+(?:\.\d+)?)\s*%/);
    return percentageMatch ? percentageMatch[1] : '';
  };

  // Function to flatten account hierarchy for dropdown
  const flattenAccounts = (accounts: Account[]): Account[] => {
    const flattened: Account[] = [];
    const flatten = (accs: Account[], level = 0) => {
      accs.forEach(acc => {
        flattened.push({
          ...acc,
          description: '  '.repeat(level) + acc.description // Add indentation for hierarchy
        });
        if (acc.children && acc.children.length > 0) {
          flatten(acc.children, level + 1);
        }
      });
    };
    flatten(accounts);
    return flattened;
  };

  // Fetch liability accounts
  const fetchLiabilityAccounts = async () => {
    try {
      const response: ApiResponse<Account[]> = await getAllAblLiabilities(1, 100);
      const flatAccounts = flattenAccounts(response.data);
      setLiabilityAccounts(flatAccounts);
    } catch (error) {
      console.error('Error fetching liability accounts:', error);
    }
  };

  // Fetch revenue accounts
  const fetchRevenueAccounts = async () => {
    try {
      const response: ApiResponse<Account[]> = await getAllAblRevenue(1, 100);
      const flatAccounts = flattenAccounts(response.data);
      setRevenueAccounts(flatAccounts);
    } catch (error) {
      console.error('Error fetching revenue accounts:', error);
    }
  };

  // Extract percentage when taxName changes
  useEffect(() => {
    if (taxName) {
      const percentage = extractPercentageFromTaxName(taxName);
      setExtractedPercentage(percentage);
      setValue('percentage', percentage);
    }
  }, [taxName, setValue]);

  // Fetch accounts on component mount
  useEffect(() => {
    fetchLiabilityAccounts();
    fetchRevenueAccounts();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchSalesTax = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getAllSaleTexes(id);
            const salesTax = response.data;
            if (salesTax) {
              setValue('SalesTexNumber', salesTax.id || '');
              setValue('taxName', salesTax.taxName || '');
              setValue('taxType', salesTax.taxType || undefined);
              setValue('percentage', salesTax.percentage || '');
              setValue('receivable.accountId', salesTax.receivable?.accountId || '');
              setValue('receivable.description', salesTax.receivable?.description || '');
              setValue('payable.accountId', salesTax.payable?.accountId || '');
              setValue('payable.description', salesTax.payable?.description || '');
              
              // Set extracted percentage
              const percentage = extractPercentageFromTaxName(salesTax.taxName || '');
              setExtractedPercentage(percentage);
            } else {
              toast.error('Sales Tax not found');
              router.push('/salestexes');
            }
          } catch (error) {
            console.error('Error fetching sales tax:', error);
            toast.error('Failed to load sales tax data');
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchSalesTax();
    }
  }, [isEdit, setValue, router]);

  const onSubmit = async (data: SalesTaxFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateSaleTexes(data.SalesTexNumber!, data);
        toast.success('Sales Tax updated successfully!');
      } else {
        await createSaleTexes(data);
        toast.success('Sales Tax created successfully!');
      }
      router.push('/salestexes');
    } catch (error) {
      console.error('Error saving sales tax:', error);
      toast.error('An error occurred while saving the sales tax');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Loading sales tax data...</span>
              </div>
            </div>
          </div>
        )}

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
                    {isEdit ? 'Edit Sales Tax' : 'Add New Sales Tax'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update sales tax information' : 'Create a new sales tax record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/salestexes">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tax Details */}
              <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MdDescription className="text-[#3a614c] text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Tax Details
                  </h3>
                </div>
                
                <div className="space-y-5">
                  <Controller
                    name="SalesTexNumber"
                    control={control}
                    render={({ field }) => (
                      <ABLCustomInput
                        {...field}
                        label="ID"
                        type="text"
                        placeholder="Auto"
                        register={register}
                        error={errors.SalesTexNumber?.message}
                        id="id"
                        disabled
                      />
                    )}
                  />
                  
                  <ABLCustomInput
                    label="Tax Name"
                    type="text"
                    placeholder="Enter tax name (e.g., WHT 20% ON SRB)"
                    register={register}
                    error={errors.taxName?.message}
                    id="taxName"
                  />
                  
                  {extractedPercentage && (
                    <ABLCustomInput
                      label="Percentage (%)"
                      type="text"
                      placeholder="Auto-extracted percentage"
                      register={register}
                      error={errors.percentage?.message}
                      id="percentage"
                      value={extractedPercentage}
                      disabled
                    />
                  )}
                  
                  <Controller
                    name="taxType"
                    control={control}
                    render={({ field }) => (
                      <AblCustomDropdown
                        label="Tax Type"
                        options={taxTypes}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('taxType', value as 'Sale Tax' | 'WHT Tax' | 'SBR Tax',{ shouldValidate: true })}
                        error={errors.taxType?.message}
                        register={register}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Receivable and Payable Details */}
              <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MdDescription className="text-[#3a614c] text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Receivable & Payable Details
                  </h3>
                </div>
                
                <div className="space-y-5">
                  <Controller
                    name="receivable.accountId"
                    control={control}
                    render={({ field }) => (
                      <AblCustomDropdown
                        label="Receivable Account "
                        options={revenueAccounts.map(acc => ({ id: acc.id, name: `${acc.id} - ${acc.description}` }))}
                        selectedOption={field.value || ''}
                        onChange={(value) => {
                          const selectedAccount = revenueAccounts.find(acc => acc.id === value);
                          if (selectedAccount) {
                            setValue('receivable.accountId', selectedAccount.id, { shouldValidate: true });
                            setValue('receivable.description', selectedAccount.description, { shouldValidate: true });
                          }
                        }}
                        error={errors.receivable?.accountId?.message}
                        register={register}
                      />
                    )}
                  />
                  
                  <ABLCustomInput
                    label=""
                    type="text"
                    placeholder="Auto-filled from selected account"
                    register={register}
                    error={errors.receivable?.description?.message}
                    id="receivable.description"
                    disabled
                  />
                  
                  <Controller
                    name="payable.accountId"
                    control={control}
                    render={({ field }) => (
                      <AblCustomDropdown
                        label="Payable Account"
                        options={liabilityAccounts.map(acc => ({ id: acc.id, name: `${acc.id} - ${acc.description}` }))}
                        selectedOption={field.value || ''}
                        onChange={(value) => {
                          const selectedAccount = liabilityAccounts.find(acc => acc.id === value);
                          if (selectedAccount) {
                            setValue('payable.accountId', selectedAccount.id, { shouldValidate: true });
                            setValue('payable.description', selectedAccount.description, { shouldValidate: true });
                          }
                        }}
                        error={errors.payable?.accountId?.message}
                        register={register}
                      />
                    )}
                  />
                  
                  <ABLCustomInput
                    label=""
                    type="text"
                    placeholder="Auto-filled from selected account"
                    register={register}
                    error={errors.payable?.description?.message}
                    id="payable.description"
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
                      <span>{isEdit ? 'Update Sales Tax' : 'Create Sales Tax'}</span>
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
            <Link href="/salestexes" className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors">
              Back to Sales Taxes List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTaxesForm;