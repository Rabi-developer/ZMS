'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { getAllPartys } from '@/apis/party';
import { getAllSaleTexes } from '@/apis/salestexes';
import { getAllConsignment, updateConsignment } from '@/apis/consignment';
import { createReceipt, updateReceipt } from '@/apis/receipt';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdInfo } from 'react-icons/md';
import { FaFileInvoice, FaMoneyBillWave } from 'react-icons/fa';
import { FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
}

interface Consignment {
  id: string;
  biltyNo: string;
  vehicleNo: string;
  biltyDate: string;
  biltyAmount: number;
  srbAmount: number;
  totalAmount: number;
}

interface TableRow {
  biltyNo: string;
  consignmentId?: string;
  vehicleNo: string;
  biltyDate: string;
  biltyAmount: number;
  srbAmount: number;
  totalAmount: number;
  balance: number;
  receiptAmount: number;
}

// Define the schema for receipt form validation
const receiptSchema = z.object({
  receiptNo: z.string().optional(),
  receiptDate: z.string().min(1, 'Receipt Date is required'),
  paymentMode: z.string().min(1, 'Payment Mode is required'),
  bankName: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  party: z.string().min(1, 'Party is required'),
  receiptAmount: z.number().min(0, 'Receipt Amount must be non-negative').optional(),
  remarks: z.string().optional(),
  tableData: z.array(
    z.object({
      biltyNo: z.string().min(1, 'Bilty No is required'),
      consignmentId: z.string().optional(),
      vehicleNo: z.string().optional(),
      biltyDate: z.string().optional(),
      biltyAmount: z.number().min(0, 'Bilty Amount must be non-negative').optional(),
      srbAmount: z.number().min(0, 'SRB Amount must be non-negative').optional(),
      totalAmount: z.number().min(0, 'Total Amount must be non-negative').optional(),
      balance: z.number().min(0, 'Balance must be non-negative').optional(),
      receiptAmount: z.number().min(0, 'Receipt Amount must be non-negative').optional(),
    })
  ),
  salesTaxOption: z.string().optional(),
  salesTaxRate: z.string().optional(),
  whtOnSbr: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface ReceiptFormProps {
  isEdit?: boolean;
  initialData?: Partial<ReceiptFormData> & {
    id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdDateTime?: string;
    createdBy?: string;
    modifiedDateTime?: string;
    modifiedBy?: string;
  };
}

const ReceiptForm = ({ isEdit = false, initialData }: ReceiptFormProps) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: initialData
      ? {
          receiptNo: initialData.receiptNo || '',
          receiptDate: initialData.receiptDate || '',
          paymentMode: initialData.paymentMode || '',
          bankName: initialData.bankName || '',
          chequeNo: initialData.chequeNo || '',
          chequeDate: initialData.chequeDate || '',
          party: initialData.party || '',
          receiptAmount: initialData.receiptAmount || 0,
          remarks: initialData.remarks || '',
          tableData: initialData.tableData?.length
            ? initialData.tableData
            : [{ biltyNo: '', consignmentId: '', vehicleNo: '', biltyDate: '', biltyAmount: 0, srbAmount: 0, totalAmount: 0, balance: 0, receiptAmount: 0 }],
          salesTaxOption: initialData.salesTaxOption || 'without',
          salesTaxRate: initialData.salesTaxRate || '',
          whtOnSbr: initialData.whtOnSbr || '',
        }
      : {
          receiptNo: '',
          receiptDate: '',
          paymentMode: '',
          bankName: '',
          chequeNo: '',
          chequeDate: '',
          party: '',
          receiptAmount: 0,
          remarks: '',
          tableData: [{ biltyNo: '', consignmentId: '', vehicleNo: '', biltyDate: '', biltyAmount: 0, srbAmount: 0, totalAmount: 0, balance: 0, receiptAmount: 0 }],
          salesTaxOption: 'without',
          salesTaxRate: '',
          whtOnSbr: '',
        },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [parties, setParties] = useState<DropdownOption[]>([]);
  const [saleTaxes, setSaleTaxes] = useState<DropdownOption[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [showConsignmentPopup, setShowConsignmentPopup] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const paymentModes: DropdownOption[] = [
    { id: 'Cash', name: 'Cash' },
    { id: 'Cheque', name: 'Cheque' },
    { id: 'Bank Transfer', name: 'Bank Transfer' },
  ];
  const bankNames: DropdownOption[] = [
    { id: 'HBL', name: 'Habib Bank Limited (HBL)' },
    { id: 'MCB', name: 'MCB Bank Limited' },
    { id: 'UBL', name: 'United Bank Limited (UBL)' },
    { id: 'ABL', name: 'Allied Bank Limited (ABL)' },
    { id: 'NBP', name: 'National Bank of Pakistan (NBP)' },
    { id: 'Meezan', name: 'Meezan Bank' },
    { id: 'BankAlfalah', name: 'Bank Alfalah' },
    { id: 'Askari', name: 'Askari Bank' },
    { id: 'Faysal', name: 'Faysal Bank' },
    { id: 'BankAlHabib', name: 'Bank Al Habib' },
    { id: 'Soneri', name: 'Soneri Bank' },
    { id: 'Samba', name: 'Samba Bank' },
    { id: 'JS', name: 'JS Bank' },
    { id: 'Silk', name: 'Silk Bank' },
    { id: 'Summit', name: 'Summit Bank' },
    { id: 'StandardChartered', name: 'Standard Chartered Bank' },
    { id: 'BankIslami', name: 'BankIslami Pakistan' },
    { id: 'DubaiIslamic', name: 'Dubai Islamic Bank Pakistan' },
    { id: 'AlBaraka', name: 'Al Baraka Bank' },
    { id: 'ZaraiTaraqiati', name: 'Zarai Taraqiati Bank Limited (ZTBL)' },
    { id: 'SindhBank', name: 'Sindh Bank' },
    { id: 'BankOfPunjab', name: 'The Bank of Punjab' },
    { id: 'FirstWomenBank', name: 'First Women Bank' },
    { id: 'BankOfKhyber', name: 'The Bank of Khyber' },
    { id: 'BankOfAzadKashmir', name: 'Bank of Azad Kashmir' },
    { id: 'IndustrialDevelopment', name: 'Industrial Development Bank of Pakistan' },
    { id: 'Other', name: 'Other' },
  ];
  const salesTaxOptions: DropdownOption[] = [
    { id: 'with', name: 'With Sales Tax' },
    { id: 'without', name: 'Without Sales Tax' },
  ];

  const tableData = watch('tableData');
  const salesTaxOption = watch('salesTaxOption');
  const salesTaxRate = watch('salesTaxRate');
  const whtOnSbr = watch('whtOnSbr');

  // Filter consignments based on search query
  const filteredConsignments = consignments.filter((consignment) =>
    `${consignment.biltyNo} ${consignment.id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [partyRes, saleTaxRes, consignmentRes] = await Promise.all([
          getAllPartys(1, 1000),
          getAllSaleTexes(1, 1000),
          getAllConsignment(1, 1000),
        ]);
        setParties(partyRes.data.map((p: any) => ({ id: p.id, name: p.name })));
        setSaleTaxes(saleTaxRes.data.map((t: any) => ({ id: t.id, name: t.taxName })));
        setConsignments(
          consignmentRes.data.map((item: any) => ({
            id: item.id,
            biltyNo: item.biltyNo || item.bilty || item.id,
            vehicleNo: item.vehicleNo || item.orderNo || 'Unknown',
            biltyDate: item.biltyDate || item.consignmentDate || new Date().toISOString().split('T')[0],
            biltyAmount: item.totalAmount || 0, // Map to totalAmount from ConsignmentForm
            srbAmount: item.sprAmount || 0, // Map to sprAmount from ConsignmentForm
            totalAmount: item.totalAmount || 0,
          }))   
        );
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Generate receiptNo for new receipt
  useEffect(() => {
    if (!isEdit) {
      const generateReceiptNo = () => {
        const prefix = 'REC';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };
      setValue('receiptNo', generateReceiptNo());
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        receiptNo: initialData.receiptNo || '',
        receiptDate: initialData.receiptDate || '',
        paymentMode: initialData.paymentMode || '',
        bankName: initialData.bankName || '',
        chequeNo: initialData.chequeNo || '',
        chequeDate: initialData.chequeDate || '',
        party: initialData.party || '',
        receiptAmount: initialData.receiptAmount || 0,
        remarks: initialData.remarks || '',
        tableData: initialData.tableData?.length
          ? initialData.tableData.map(row => ({
              biltyNo: row.biltyNo || '',
              consignmentId: row.consignmentId || '',
              vehicleNo: row.vehicleNo || '',
              biltyDate: row.biltyDate || '',
              biltyAmount: row.biltyAmount || 0,
              srbAmount: row.srbAmount || 0,
              totalAmount: row.totalAmount || 0,
              balance: row.balance || 0,
              receiptAmount: row.receiptAmount || 0,
            }))
          : [{ biltyNo: '', consignmentId: '', vehicleNo: '', biltyDate: '', biltyAmount: 0, srbAmount: 0, totalAmount: 0, balance: 0, receiptAmount: 0 }],
        salesTaxOption: initialData.salesTaxOption || 'without',
        salesTaxRate: initialData.salesTaxRate || '',
        whtOnSbr: initialData.whtOnSbr || '',
      });
    }
  }, [isEdit, initialData, reset]);

  // Update table calculations
  useEffect(() => {
    const updatedTableData = tableData.map((row) => {
      const totalAmount = (row.biltyAmount || 0) + (row.srbAmount || 0);
      const balance = totalAmount - (row.receiptAmount || 0);
      return { ...row, totalAmount, balance };
    });
    setValue('tableData', updatedTableData);

    const totalReceiptAmount = updatedTableData.reduce((sum, row) => sum + (row.receiptAmount || 0), 0);
    setValue('receiptAmount', totalReceiptAmount);
  }, [tableData, setValue]);

  const selectConsignment = (index: number, consignment: Consignment) => {
    setValue(`tableData.${index}.biltyNo`, consignment.biltyNo, { shouldValidate: true });
    setValue(`tableData.${index}.consignmentId`, consignment.id, { shouldValidate: true });
    setValue(`tableData.${index}.vehicleNo`, consignment.vehicleNo, { shouldValidate: true });
    setValue(`tableData.${index}.biltyDate`, consignment.biltyDate, { shouldValidate: true });
    setValue(`tableData.${index}.biltyAmount`, consignment.totalAmount, { shouldValidate: true }); // Use totalAmount
    setValue(`tableData.${index}.srbAmount`, consignment.srbAmount, { shouldValidate: true }); // Use sprAmount
    setShowConsignmentPopup(null);
    setSearchQuery('');
  };

  const addTableRow = () => {
    setValue('tableData', [
      ...tableData,
      { biltyNo: '', consignmentId: '', vehicleNo: '', biltyDate: '', biltyAmount: 0, srbAmount: 0, totalAmount: 0, balance: 0, receiptAmount: 0 },
    ]);
  };

  const removeTableRow = (index: number) => {
    if (tableData.length > 1) {
      const newTableData = tableData.filter((_, i) => i !== index);
      setValue('tableData', newTableData);
    }
  };

  const onSubmit = async (data: ReceiptFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        id: isEdit
          ? initialData?.id || window.location.pathname.split('/').pop() || ''
          : null,
        isActive: true,
        isDeleted: false,
        receiptNo: data.receiptNo || `REC${Date.now()}${Math.floor(Math.random() * 1000)}`,
        receiptDate: data.receiptDate,
        paymentMode: data.paymentMode,
        bankName: data.bankName || '',
        chequeNo: data.chequeNo || '',
        chequeDate: data.chequeDate || '',
        party: data.party,
        receiptAmount: data.receiptAmount || 0,
        remarks: data.remarks || '',
        tableData: data.tableData.map(row => ({
          biltyNo: row.biltyNo || '',
          consignmentId: row.consignmentId || '',
          vehicleNo: row.vehicleNo || '',
          biltyDate: row.biltyDate || '',
          biltyAmount: row.biltyAmount || 0,
          srbAmount: row.srbAmount || 0,
          totalAmount: row.totalAmount || 0,
          balance: row.balance || 0,
          receiptAmount: row.receiptAmount || 0,
        })),
        salesTaxOption: data.salesTaxOption || 'without',
        salesTaxRate: data.salesTaxRate || '',
        whtOnSbr: data.whtOnSbr || '',
      };

      // Save receipt
      if (isEdit) {
        await updateReceipt(payload);
        toast.success('Updated successfully');
      } else {
        await createReceipt(payload);
        toast.success('Receipt created successfully');
      }

      // Update consignment receivedAmount
      const updates = data.tableData
        .filter(row => row.consignmentId && (row.receiptAmount ?? 0) > 0)
        .map(async row => {
          try {
            await updateConsignment({
              id: row.consignmentId,
              receivedAmount: row.receiptAmount ?? 0,
            });
          } catch (error) {
            console.error(`Failed to update consignment ${row.consignmentId}:`, error);
          }
        });
      await Promise.all(updates);

      router.push('/receipt');
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast.error('An error occurred while saving the receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-2 md:p-4">
      <div className="h-full w-full flex flex-col">
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

        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-md">
                  <FaFileInvoice className="text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{isEdit ? 'Edit Receipt' : 'Add New Receipt'}</h1>
                  <p className="text-white/80 text-xs">{isEdit ? 'Update receipt record' : 'Create a new receipt record'}</p>
                </div>
              </div>
              <Link href="/receipt">
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
              <div className="relative">
                <ABLCustomInput
                  label="Receipt #"
                  type="text"
                  placeholder={isEdit ? 'Receipt No' : 'Auto-generated'}
                  register={register}
                  error={errors.receiptNo?.message}
                  id="receiptNo"
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
              <ABLCustomInput
                label="Receipt Date"
                type="date"
                register={register}
                error={errors.receiptDate?.message}
                id="receiptDate"
              />
              <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <AblCustomDropdown
                    label="Payment Mode"
                    options={paymentModes}
                    selectedOption={field.value || ''}
                    onChange={field.onChange}
                    error={errors.paymentMode?.message}
                  />
                )}
              />
              <Controller
                name="bankName"
                control={control}
                render={({ field }) => (
                  <AblCustomDropdown
                    label="Bank Name"
                    options={bankNames}
                    selectedOption={field.value || ''}
                    onChange={field.onChange}
                    error={errors.bankName?.message}
                  />
                )}
              />
              <ABLCustomInput
                label="Cheque #"
                type="text"
                placeholder="Enter cheque number"
                register={register}
                error={errors.chequeNo?.message}
                id="chequeNo"
              />
              <ABLCustomInput
                label="Cheque Date"
                type="date"
                register={register}
                error={errors.chequeDate?.message}
                id="chequeDate"
              />
              <Controller
                name="party"
                control={control}
                render={({ field }) => (
                  <AblCustomDropdown
                    label="Party"
                    options={parties}
                    selectedOption={field.value || ''}
                    onChange={field.onChange}
                    error={errors.party?.message}
                  />
                )}
              />
              <ABLCustomInput
                label="Receipt Amount"
                type="number"
                placeholder="Auto-calculated"
                register={register}
                error={errors.receiptAmount?.message}
                id="receiptAmount"
                disabled
              />
              <ABLCustomInput
                label="Remarks"
                type="text"
                placeholder="Enter remarks"
                register={register}
                error={errors.remarks?.message}
                id="remarks"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-lg" />
                  <h3 className="text-base font-semibold">Consignment Details</h3>
                </div>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Bilty #
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Vehicle No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[110px]">
                          Bilty Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Bilty Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          SRB Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[130px]">
                          Receipt Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[100px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {tableData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <Button
                              type="button"
                              onClick={() => setShowConsignmentPopup(index)}
                              className="w-full px-3 py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              {row.biltyNo || 'Select Bilty'}
                            </Button>
                            {errors.tableData?.[index]?.biltyNo && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].biltyNo.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.vehicleNo`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Vehicle No"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.biltyDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.biltyAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.srbAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.totalAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none font-medium"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.balance`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none font-medium"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`tableData.${index}.receiptAmount`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.receiptAmount ?? 0}
                            />
                            {errors.tableData?.[index]?.receiptAmount && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].receiptAmount.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              onClick={() => removeTableRow(index)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                              disabled={tableData.length <= 1}
                            >
                              <FiX />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="text-black">
                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-base">
                          TOTALS:
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {tableData.reduce((sum, row) => sum + (row.biltyAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {tableData.reduce((sum, row) => sum + (row.srbAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {tableData.reduce((sum, row) => sum + (row.totalAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {tableData.reduce((sum, row) => sum + (row.balance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base">
                          {tableData.reduce((sum, row) => sum + (row.receiptAmount ?? 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Button
                    type="button"
                    onClick={addTableRow}
                    className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    + Add New Row
                  </Button>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Rows: {tableData.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="px-4 py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-lg" />
                  <h3 className="text-base font-semibold">Tax & Calculations</h3>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Tax Configuration
                    </h4>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Controller
                        name="salesTaxOption"
                        control={control}
                        render={({ field }) => (
                          <AblCustomDropdown
                            label="Sales Tax Option"
                            options={salesTaxOptions}
                            selectedOption={field.value || ''}
                            onChange={field.onChange}
                            error={errors.salesTaxOption?.message}
                          />
                        )}
                      />
                    </div>

                    {salesTaxOption === 'with' && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <Controller
                          name="salesTaxRate"
                          control={control}
                          render={({ field }) => (
                            <AblCustomDropdown
                              label="Sales Tax Rate"
                              options={saleTaxes}
                              selectedOption={field.value || ''}
                              onChange={field.onChange}
                              error={errors.salesTaxRate?.message}
                            />
                          )}
                        />
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Controller
                        name="whtOnSbr"
                        control={control}
                        render={({ field }) => (
                          <AblCustomDropdown
                            label="WHT on SBR Amount"
                            options={saleTaxes}
                            selectedOption={field.value || ''}
                            onChange={field.onChange}
                            error={errors.whtOnSbr?.message}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Amount Summary
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="font-medium text-sm text-blue-700 dark:text-blue-300">Receipt Amount Total</span>
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                          {tableData.reduce((sum, row) => sum + (row.receiptAmount ?? 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <span className="font-medium text-sm text-purple-700 dark:text-purple-300">Total SBR Amount</span>
                        <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
                          {tableData.reduce((sum, row) => sum + (row.srbAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <span className="font-medium text-sm text-green-700 dark:text-green-300">Subtotal Amount</span>
                        <span className="text-sm font-bold text-green-800 dark:text-green-200">
                          {tableData.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white p-4 rounded-lg shadow-md">
                        <span className="font-semibold text-sm">Total After Sales Tax</span>
                        <span className="text-lg font-bold">
                          {(() => {
                            const totalAmount = tableData.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0);
                            if (salesTaxOption === 'with' && salesTaxRate) {
                              const taxPercent = parseFloat(salesTaxRate.match(/\d+/)?.[0] || '0') / 100;
                              return (totalAmount * (1 + taxPercent)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            }
                            return totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                        <span className="font-medium text-sm text-orange-700 dark:text-orange-300">WHT Deduction Amount</span>
                        <span className="text-sm font-bold text-orange-800 dark:text-orange-200">
                          {(() => {
                            const totalSbrAmount = tableData.reduce((sum, row) => sum + (row.srbAmount || 0), 0);
                            if (whtOnSbr) {
                              const whtPercent = parseFloat(whtOnSbr.match(/\d+/)?.[0] || '0') / 100;
                              return (totalSbrAmount * whtPercent).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            }
                            return '0.00';
                          })()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-500">
                        <span className="font-bold text-base text-gray-800 dark:text-gray-200">Final Cheque Amount</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {(() => {
                            const totalAmount = tableData.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0);
                            let finalAmount = totalAmount;
                            if (salesTaxOption === 'with' && salesTaxRate) {
                              const taxPercent = parseFloat(salesTaxRate.match(/\d+/)?.[0] || '0') / 100;
                              finalAmount = totalAmount * (1 + taxPercent);
                            }
                            if (whtOnSbr) {
                              const totalSbrAmount = tableData.reduce((sum, row) => sum + (row.srbAmount || 0), 0);
                              const whtPercent = parseFloat(whtOnSbr.match(/\d+/)?.[0] || '0') / 100;
                              finalAmount -= totalSbrAmount * whtPercent;
                            }
                            return finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                      <span>{isEdit ? 'Update Receipt' : 'Create Receipt'}</span>
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
            <Link href="/receipt" className="text-[#3a614c] hover:text-[#6e997f] text-sm font-medium">
              Back to Receipts
            </Link>
          </div>
        </div>

        {showConsignmentPopup !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl max-w-4xl w-full mx-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Select Consignment</h3>
                <Button
                  onClick={() => {
                    setShowConsignmentPopup(null);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-base" />
                </Button>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Bilty No or ID..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredConsignments.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No consignments found</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Bilty #
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Vehicle No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[110px]">
                          Bilty Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Bilty Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[120px]">
                          SRB Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {filteredConsignments.map((consignment) => (
                        <tr
                          key={consignment.id}
                          onClick={() => selectConsignment(showConsignmentPopup, consignment)}
                          className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {consignment.biltyNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                            {consignment.id}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                            {consignment.vehicleNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                            {consignment.biltyDate}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-right text-gray-600 dark:text-gray-400">
                            {consignment.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {consignment.srbAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => {
                    setShowConsignmentPopup(null);
                    setSearchQuery('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-1 px-3 rounded-md"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptForm;