'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdInfo } from 'react-icons/md';
import { FaFileInvoice } from 'react-icons/fa';
import { FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { getAllEquality } from '@/apis/equality';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllAblRevenue } from '@/apis/ablRevenue';


// Assuming similar structure for all account types
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

interface DropdownOption {
  value: string;
  label: string;
}

// Zod schema for voucher form validation
const voucherSchema = z.object({
  voucherNo: z.string().optional(),
  voucherDate: z.string().min(1, 'Voucher Date is required'),
  referenceNo: z.string().optional(),
  chequeNo: z.string().optional(),
  depositSlipNo: z.string().optional(),
  paidTo: z.string().min(1, 'Paid To account is required'),
  debit: z.number().min(0, 'Debit must be non-negative').optional(),
  credit: z.number().min(0, 'Credit must be non-negative').optional(),
  narration: z.string().optional(),
  description: z.string().optional(),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

const EntryVoucherForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      voucherNo: '',
      voucherDate: new Date().toISOString().split('T')[0],
      referenceNo: '',
      chequeNo: '',
      depositSlipNo: '',
      paidTo: '',
      debit: 0,
      credit: 0,
      narration: '',
      description: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountOptions, setAccountOptions] = useState<{
    assets: DropdownOption[];
    revenues: DropdownOption[];
    liabilities: DropdownOption[];
    expenses: DropdownOption[];
    equities: DropdownOption[];
  }>({
    assets: [],
    revenues: [],
    liabilities: [],
    expenses: [],
    equities: [],
  });

  // Build hierarchy function (copied from provided code)
  const buildHierarchy = (accounts: Account[]): Account[] => {
    const map: Record<string, Account> = {};
    accounts.forEach((account) => {
      map[account.id] = { ...account, children: [] };
    });

    const rootAccounts: Account[] = [];
    accounts.forEach((account) => {
      if (account.parentAccountId === null) {
        rootAccounts.push(map[account.id]);
      } else {
        const parent = map[account.parentAccountId];
        if (parent) {
          parent.children.push(map[account.id]);
        }
      }
    });

    return rootAccounts;
  };

  // Flatten hierarchy with indentation
  const flattenAccounts = (accounts: Account[], level = 0): DropdownOption[] => {
    let options: DropdownOption[] = [];
    accounts.forEach((acc) => {
      options.push({ value: acc.id, label: '  '.repeat(level) + acc.description });
      if (acc.children && acc.children.length > 0) {
        options = options.concat(flattenAccounts(acc.children, level + 1));
      }
    });
    return options;
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const [assetsRes, revenuesRes, liabilitiesRes, expensesRes, equitiesRes] = await Promise.all([
          getAllAblAssests(1, 10000), // Fetch all with large page size
          getAllAblRevenue(1, 10000),
          getAllAblLiabilities(1, 10000),
          getAllAblExpense(1, 10000),
          getAllEquality(1, 10000),
        ]);

        const assetsHier = buildHierarchy(assetsRes.data);
        const revenuesHier = buildHierarchy(revenuesRes.data);
        const liabilitiesHier = buildHierarchy(liabilitiesRes.data);
        const expensesHier = buildHierarchy(expensesRes.data);
        const equitiesHier = buildHierarchy(equitiesRes.data);

        setAccountOptions({
          assets: flattenAccounts(assetsHier),
          revenues: flattenAccounts(revenuesHier),
          liabilities: flattenAccounts(liabilitiesHier),
          expenses: flattenAccounts(expensesHier),
          equities: flattenAccounts(equitiesHier),
        });
      } catch (error) {
        toast.error('Failed to load chart of accounts');
        console.error('Error fetching accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();

    if (!isEdit) {
      // Generate auto voucher number
      const generateVoucherNo = () => {
        const prefix = 'VOU';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };
      setValue('voucherNo', generateVoucherNo());
    }
  }, [setValue, isEdit]);

  useEffect(() => {
    if (isEdit) {
      // Fetch existing voucher data (placeholder, implement based on actual API)
      const fetchVoucher = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            // Assuming getSingleVoucher API exists
            // const response = await getSingleVoucher(id);
            // const voucher = response.data;
            // setValue('voucherNo', voucher.voucherNo || '');
            // ... set other values
          } catch (error) {
            toast.error('Failed to load voucher data');
            console.error('Error fetching voucher:', error);
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchVoucher();
    }
  }, [isEdit, setValue]);

  const onSubmit = async (data: VoucherFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        // await updateVoucher(data);
        toast.success('Voucher updated successfully');
      } else {
        // await createVoucher(data);
        toast.success('Voucher created successfully');
      }
      router.push('/vouchers'); // Assuming a list page
    } catch (error) {
      toast.error('An error occurred while saving the voucher');
      console.error('Error saving voucher:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Loading...</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-md">
                  <FaFileInvoice className="text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{isEdit ? 'Edit Voucher' : 'Add New Voucher'}</h1>
                  <p className="text-white/80 text-xs">{isEdit ? 'Update voucher record' : 'Create a new voucher record'}</p>
                </div>
              </div>
              <Link href="/vouchers">
                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200 border border-white/20 px-3 py-1 text-sm"
                >
                  <FiX className="mr-1" /> Cancel
                </Button>
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <ABLCustomInput
                label="Voucher #"
                type="text"
                placeholder="Auto-generated"
                register={register}
                error={errors.voucherNo?.message}
                id="voucherNo"
                disabled
              />
              <ABLCustomInput
                label="Voucher Date"
                type="date"
                register={register}
                error={errors.voucherDate?.message}
                id="voucherDate"
              />
              <ABLCustomInput
                label="Reference No"
                type="text"
                placeholder="Enter reference number"
                register={register}
                error={errors.referenceNo?.message}
                id="referenceNo"
              />
              <ABLCustomInput
                label="Cheque No"
                type="text"
                placeholder="Enter cheque number"
                register={register}
                error={errors.chequeNo?.message}
                id="chequeNo"
              />
              <ABLCustomInput
                label="Deposit Slip No"
                type="text"
                placeholder="Enter deposit slip number"
                register={register}
                error={errors.depositSlipNo?.message}
                id="depositSlipNo"
              />
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid To</label>
                <select
                  {...register('paidTo')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value="">Select Account</option>
                  {accountOptions.assets.length > 0 && (
                    <optgroup label="Assets">
                      {accountOptions.assets.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {accountOptions.revenues.length > 0 && (
                    <optgroup label="Revenues">
                      {accountOptions.revenues.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {accountOptions.liabilities.length > 0 && (
                    <optgroup label="Liabilities">
                      {accountOptions.liabilities.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {accountOptions.expenses.length > 0 && (
                    <optgroup label="Expenses">
                      {accountOptions.expenses.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {accountOptions.equities.length > 0 && (
                    <optgroup label="Equities">
                      {accountOptions.equities.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {errors.paidTo && <p className="text-red-500 text-xs mt-1">{errors.paidTo.message}</p>}
              </div>
              <ABLCustomInput
                label="Debit"
                type="number"
                placeholder="Enter debit amount"
                register={register}
                error={errors.debit?.message}
                id="debit"
              />
              <ABLCustomInput
                label="Credit"
                type="number"
                placeholder="Enter credit amount"
                register={register}
                error={errors.credit?.message}
                id="credit"
              />
              <ABLCustomInput
                label="Narration"
                type="text"
                placeholder="Enter narration"
                register={register}
                error={errors.narration?.message}
                id="narration"
              />
              <ABLCustomInput
                label="Description"
                type="text"
                placeholder="Enter description"
                register={register}
                error={errors.description?.message}
                id="description"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="text-sm" />
                      <span>{isEdit ? 'Update Voucher' : 'Create Voucher'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-4 bg-white dark:bg-gray-800 rounded-md shadow-md p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
              <MdInfo className="text-[#3a614c]" />
              <span>Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link href="/vouchers" className="text-[#3a614c] hover:text-[#6e997f] text-sm font-medium">
              Back to Vouchers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryVoucherForm;