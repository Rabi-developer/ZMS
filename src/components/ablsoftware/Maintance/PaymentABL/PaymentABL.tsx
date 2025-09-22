'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllCharges } from '@/apis/charges';
import { createPaymentABL, updatePaymentABL } from '@/apis/paymentABL';
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

interface BookingOrder {
  id: string;
  orderNo: string;
  vehicleNo: string;
  orderDate: string;
  vendor: string;
  vendorName: string;
}

interface Charge {
  id: string;
  chargeNo: string;
  chargeDate: string;
  orderNo: string;
  charge: string; // chargeNo for internal reference
  chargeName: string; // Human-readable charge name
  biltyNo: string;
  date: string; // From lines.date
  vehicle: string;
  paidTo: string;
  amount: number;
  balance: number;
  isActive: boolean;
}

interface PaymentABLItem {
  id?: string | null; // Guid? in backend
  vehicleNo: string;
  orderNo: string;
  charges: string; // Stores chargeName for display
  chargeNo: string; // Stores chargeNo for payload (Charges field)
  orderDate: string;
  dueDate: string;
  expenseAmount: number | null;
  balance: number | null;
  paidAmount: number | null;
}

interface PaymentFormProps {
  isEdit?: boolean;
  initialData?: Partial<PaymentFormData> & {
    id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdDateTime?: string;
    createdBy?: string;
    modifiedDateTime?: string;
    modifiedBy?: string;
    status?: string;
  };
}

// Define the schema for payment form validation
const paymentSchema = z.object({
  paymentNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment Date is required'),
  paymentMode: z.string().min(1, 'Payment Mode is required'),
  bankName: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  remarks: z.string().optional(),
  paidTo: z.string().min(1, 'Paid To is required'),
  paidAmount: z.number().min(0, 'Paid Amount must be non-negative').nullable(),
  advanced: z.number().min(0, 'Advanced Amount must be non-negative').nullable(),
  advancedDate: z.string().optional(),
  pdc: z.number().min(0, 'PDC Amount must be non-negative').nullable(),
  pdcDate: z.string().optional(),
  paymentAmount: z.number().min(0, 'Payment Amount must be non-negative').nullable(),
  paymentABLItems: z.array(
    z.object({
      id: z.string().optional().nullable(),
      vehicleNo: z.string().optional(),
      orderNo: z.string().min(1, 'Order No is required').optional(),
      charges: z.string().min(1, 'Charges are required').optional(),
      chargeNo: z.string().optional(),
      orderDate: z.string().optional(),
      dueDate: z.string().optional(),
      expenseAmount: z.number().min(0, 'Expense Amount must be non-negative').nullable(),
      balance: z.number().min(0, 'Balance must be non-negative').nullable(),
      paidAmount: z.number().min(0, 'Paid Amount must be non-negative').nullable(),
    })
  ),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const PaymentForm = ({ isEdit = false, initialData }: PaymentFormProps) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData
      ? {
          paymentNo: initialData.paymentNo || '',
          paymentDate: initialData.paymentDate || '',
          paymentMode: initialData.paymentMode || '',
          bankName: initialData.bankName || '',
          chequeNo: initialData.chequeNo || '',
          chequeDate: initialData.chequeDate || '',
          remarks: initialData.remarks || '',
          paidTo: initialData.paidTo || '',
          paidAmount: initialData.paidAmount ?? null,
          advanced: initialData.advanced ?? null,
          advancedDate: initialData.advancedDate || '',
          pdc: initialData.pdc ?? null,
          pdcDate: initialData.pdcDate || '',
          paymentAmount: initialData.paymentAmount ?? null,
          paymentABLItems: initialData.paymentABLItems?.length
            ? initialData.paymentABLItems.map(row => ({
                id: row.id ?? null,
                vehicleNo: row.vehicleNo || '',
                orderNo: row.orderNo || '',
                charges: row.charges || '',
                chargeNo: row.chargeNo || '',
                orderDate: row.orderDate || '',
                dueDate: row.dueDate || '',
                expenseAmount: row.expenseAmount ?? null,
                balance: row.balance ?? null,
                paidAmount: row.paidAmount ?? null,
              }))
            : [{
                id: null,
                vehicleNo: '',
                orderNo: '',
                charges: '',
                chargeNo: '',
                orderDate: '',
                dueDate: '',
                expenseAmount: null,
                balance: null,
                paidAmount: null,
              }],
        }
      : {
          paymentNo: '',
          paymentDate: '',
          paymentMode: '',
          bankName: '',
          chequeNo: '',
          chequeDate: '',
          remarks: '',
          paidTo: '',
          paidAmount: null,
          advanced: null,
          advancedDate: '',
          pdc: null,
          pdcDate: '',
          paymentAmount: null,
          paymentABLItems: [{
            id: null,
            vehicleNo: '',
            orderNo: '',
            charges: '',
            chargeNo: '',
            orderDate: '',
            dueDate: '',
            expenseAmount: null,
            balance: null,
            paidAmount: null,
          }],
        },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [showOrderPopup, setShowOrderPopup] = useState<number | null>(null);
  const [showChargePopup, setShowChargePopup] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [chargeSearch, setChargeSearch] = useState('');

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

  const paymentABLItems = watch('paymentABLItems');

  // Filter booking orders based on search term
  const filteredBookingOrders = bookingOrders.filter((order) =>
    [
      order.vehicleNo || '',
      order.orderNo || '',
      order.orderDate || '',
      order.vendorName || '',
    ].some((field) => field.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  // Filter and deduplicate charges
  const getFilteredCharges = (index: number | null) => {
    if (index === null) return [];
    const selectedOrderNo = paymentABLItems[index]?.orderNo || '';
    const seenChargeNos = new Set<string>();
    return charges
      .filter((charge) => {
        if (!charge.chargeNo || !charge.isActive) return false;
        if (seenChargeNos.has(charge.chargeNo)) return false;
        seenChargeNos.add(charge.chargeNo);
        return !selectedOrderNo || charge.orderNo === selectedOrderNo;
      })
      .filter((charge) =>
        [
          charge.chargeNo || '',
          charge.chargeName || '',
          charge.orderNo || '',
          charge.chargeDate || '',
          charge.amount?.toString() || '',
          charge.balance?.toString() || '',
        ].some((field) => field.toLowerCase().includes(chargeSearch.toLowerCase()))
      );
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [orderRes, chargeRes] = await Promise.all([
          getAllBookingOrder(),
          getAllCharges(1, 100),
        ]);
        setBookingOrders(
          orderRes.data.map((item: any) => ({
            id: item.id || item.orderNo,
            orderNo: item.orderNo || item.id,
            vehicleNo: item.vehicleNo || 'N/A',
            orderDate: item.orderDate || new Date().toISOString().split('T')[0],
            vendor: item.vendor || 'N/A',
            vendorName: item.vendorName || item.vendor || 'Unknown',
          }))
        );
        setCharges(
          chargeRes.data
            .filter((item: any) => item.lines && item.lines.length > 0)
            .map((item: any) => {
              const line = item.lines[0];
              return {
                id: item.id,
                chargeNo: item.chargeNo || '',
                chargeDate: item.chargeDate || new Date().toISOString().split('T')[0],
                orderNo: item.orderNo || '',
                charge: item.chargeNo || 'N/A',
                chargeName: line.chargeName || 'Unknown Charge',
                biltyNo: line.biltyNo || '',
                date: line.date || item.chargeDate || new Date().toISOString().split('T')[0],
                vehicle: line.vehicle || '',
                paidTo: line.paidTo || '',
                amount: Number(line.amount) || 0,
                balance: Number(line.amount) || 0,
                isActive: item.isActive || false,
              };
            })
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

  // Generate paymentNo for new payment
  useEffect(() => {
    if (!isEdit) {
      const generatePaymentNo = () => {
        const prefix = 'PAY';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };
      setValue('paymentNo', generatePaymentNo());
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        paymentNo: initialData.paymentNo || '',
        paymentDate: initialData.paymentDate || '',
        paymentMode: initialData.paymentMode || '',
        bankName: initialData.bankName || '',
        chequeNo: initialData.chequeNo || '',
        chequeDate: initialData.chequeDate || '',
        remarks: initialData.remarks || '',
        paidTo: initialData.paidTo || '',
        paidAmount: initialData.paidAmount ?? null,
        advanced: initialData.advanced ?? null,
        advancedDate: initialData.advancedDate || '',
        pdc: initialData.pdc ?? null,
        pdcDate: initialData.pdcDate || '',
        paymentAmount: initialData.paymentAmount ?? null,
        paymentABLItems: initialData.paymentABLItems?.length
          ? initialData.paymentABLItems.map(row => ({
              id: row.id ?? null,
              vehicleNo: row.vehicleNo || '',
              orderNo: row.orderNo || '',
              charges: row.charges || '',
              chargeNo: row.chargeNo || '',
              orderDate: row.orderDate || '',
              dueDate: row.dueDate || '',
              expenseAmount: row.expenseAmount ?? null,
              balance: row.balance ?? null,
              paidAmount: row.paidAmount ?? null,
            }))
          : [{
              id: null,
              vehicleNo: '',
              orderNo: '',
              charges: '',
              chargeNo: '',
              orderDate: '',
              dueDate: '',
              expenseAmount: null,
              balance: null,
              paidAmount: null,
            }],
      });
    }
  }, [isEdit, initialData, reset]);

  // Update table calculations
  useEffect(() => {
    const updatedPaymentABLItems = paymentABLItems.map((row) => {
      const balance = (row.expenseAmount ?? 0) - (row.paidAmount ?? 0);
      return { ...row, balance: balance >= 0 ? balance : null };
    });
    setValue('paymentABLItems', updatedPaymentABLItems);

    const totalPaidAmount = updatedPaymentABLItems.reduce((sum, row) => sum + (row.paidAmount ?? 0), 0);
    setValue('paidAmount', totalPaidAmount || null);

    const advanced = parseFloat(watch('advanced')?.toString() || '0') || 0;
    const pdc = parseFloat(watch('pdc')?.toString() || '0') || 0;
    const paymentAmount = totalPaidAmount + advanced + pdc;
    setValue('paymentAmount', paymentAmount || null);
  }, [paymentABLItems, watch, setValue]);

  const selectOrder = (index: number, order: BookingOrder) => {
    setValue(`paymentABLItems.${index}.vehicleNo`, order.vehicleNo, { shouldValidate: true });
    setValue(`paymentABLItems.${index}.orderNo`, order.orderNo, { shouldValidate: true });
    setValue(`paymentABLItems.${index}.orderDate`, order.orderDate, { shouldValidate: true });
    setValue('paidTo', order.vendorName, { shouldValidate: true });
    setShowOrderPopup(null);
    setOrderSearch('');
  };

  const selectCharge = (index: number, charge: Charge) => {
    setValue(`paymentABLItems.${index}.charges`, charge.chargeName, { shouldValidate: true });
    setValue(`paymentABLItems.${index}.chargeNo`, charge.chargeNo, { shouldValidate: true });
    setValue(`paymentABLItems.${index}.orderDate`, charge.chargeDate, { shouldValidate: true });
    setValue(`paymentABLItems.${index}.dueDate`, charge.date, { shouldValidate: true });
    setValue(`paymentABLItems.${index}.expenseAmount`, Number(charge.amount) || null, { shouldValidate: true });
    setValue(`paymentABLItems.${index}.balance`, Number(charge.balance) || null, { shouldValidate: true });
    setShowChargePopup(null);
    setChargeSearch('');
  };

  const addTableRow = () => {
    setValue('paymentABLItems', [
      ...paymentABLItems,
      {
        id: null,
        vehicleNo: '',
        orderNo: '',
        charges: '',
        chargeNo: '',
        orderDate: '',
        dueDate: '',
        expenseAmount: null,
        balance: null,
        paidAmount: null,
      },
    ], { shouldValidate: true });
  };

  const removeTableRow = (index: number) => {
    if (paymentABLItems.length > 1) {
      const newPaymentABLItems = paymentABLItems.filter((_, i) => i !== index);
      setValue('paymentABLItems', newPaymentABLItems, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      const currentDateTime = new Date().toISOString();
      const userId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'; // Replace with actual user ID logic
      const payload = {
        id: isEdit ? initialData?.id || window.location.pathname.split('/').pop() || null : null,
        isActive: true,
        isDeleted: false,
        createdDateTime: isEdit ? initialData?.createdDateTime || currentDateTime : currentDateTime,
        createdBy: isEdit ? initialData?.createdBy || userId : userId,
        modifiedDateTime: currentDateTime,
        modifiedBy: userId,
        creationDate: isEdit ? initialData?.createdDateTime || currentDateTime : currentDateTime,
        updatedBy: userId,
        updationDate: currentDateTime,
        status: initialData?.status || 'Active',
        paymentNo: data.paymentNo || `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
        paymentDate: data.paymentDate,
        paymentMode: data.paymentMode,
        bankName: data.bankName || '',
        chequeNo: data.chequeNo || '',
        chequeDate: data.chequeDate || '',
        remarks: data.remarks || '',
        paidTo: data.paidTo,
        paidAmount: data.paidAmount ?? null,
        advanced: data.advanced ?? null,
        advancedDate: data.advancedDate || '',
        pdc: data.pdc ?? null,
        pdcDate: data.pdcDate || '',
        paymentAmount: data.paymentAmount ?? null,
        paymentABLItem: data.paymentABLItems.map(row => ({
          id: row.id ?? null,
          vehicleNo: row.vehicleNo || '',
          orderNo: row.orderNo || '',
          charges: row.chargeNo || '', // Send chargeNo as Charges
          orderDate: row.orderDate || '',
          dueDate: row.dueDate || '',
          expenseAmount: row.expenseAmount ?? null,
          balance: row.balance ?? null,
          paidAmount: row.paidAmount ?? null,
        })),
      };

      if (isEdit) {
        await updatePaymentABL(payload);
        toast.success('Payment updated successfully');
      } else {
        await createPaymentABL(payload);
        toast.success('Payment created successfully');
      }
      router.push('/paymentABL');
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('An error occurred while saving the payment');
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

        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-md">
                  <FaFileInvoice className="text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{isEdit ? 'Edit Payment' : 'Add New Payment'}</h1>
                  <p className="text-white/80 text-xs">{isEdit ? 'Update payment record' : 'Create a new payment record'}</p>
                </div>
              </div>
              <Link href="/paymentABL">
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
                  label="Payment #"
                  type="text"
                  placeholder={isEdit ? 'Payment No' : 'Auto-generated'}
                  register={register}
                  error={errors.paymentNo?.message}
                  id="paymentNo"
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
                label="Payment Date"
                type="date"
                register={register}
                error={errors.paymentDate?.message}
                id="paymentDate"
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
              <ABLCustomInput
                label="Paid To"
                type="text"
                placeholder="Auto-filled from order"
                register={register}
                error={errors.paidTo?.message}
                id="paidTo"
                disabled
              />
              <ABLCustomInput
                label="Paid Amount"
                type="number"
                placeholder="Auto-calculated"
                register={register}
                error={errors.paidAmount?.message}
                id="paidAmount"
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
              <ABLCustomInput
                label="Advanced"
                type="number"
                placeholder="Enter advanced amount"
                register={register}
                error={errors.advanced?.message}
                id="advanced"
              />
              <ABLCustomInput
                label="Advanced Date"
                type="date"
                placeholder="Select advanced date"
                register={register}
                error={errors.advancedDate?.message}
                id="advancedDate"
              />
              <ABLCustomInput
                label="PDC"
                type="number"
                placeholder="Enter PDC amount"
                register={register}
                error={errors.pdc?.message}
                id="pdc"
              />
              <ABLCustomInput
                label="PDC Date"
                type="date"
                placeholder="Select PDC date"
                register={register}
                error={errors.pdcDate?.message}
                id="pdcDate"
              />
              <ABLCustomInput
                label="Payment Amount"
                type="number"
                placeholder="Auto-calculated"
                register={register}
                error={errors.paymentAmount?.message}
                id="paymentAmount"
                disabled
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-lg" />
                  <h3 className="text-base font-semibold">Payment Details</h3>
                </div>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Vehicle No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Order No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Charges
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[110px]">
                          Order Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[110px]">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Expense Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[130px]">
                          Paid Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[100px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {paymentABLItems.map((row, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <Button
                              type="button"
                              onClick={() => setShowOrderPopup(index)}
                              className="w-full px-3 py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              {row.vehicleNo || 'Select Vehicle'}
                            </Button>
                            {errors.paymentABLItems?.[index]?.orderNo && (
                              <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].orderNo.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.orderNo`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Order No"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <Button
                              type="button"
                              onClick={() => setShowChargePopup(index)}
                              className="w-full px-3 py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              {row.charges || 'Select Charges'}
                            </Button>
                            {errors.paymentABLItems?.[index]?.charges && (
                              <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].charges.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.orderDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.dueDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.expenseAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.balance`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none font-medium"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`paymentABLItems.${index}.paidAmount`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {errors.paymentABLItems?.[index]?.paidAmount && (
                              <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].paidAmount.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              onClick={() => removeTableRow(index)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                              disabled={paymentABLItems.length <= 1}
                            >
                              <FiX />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="text-black">
                        <td colSpan={5} className="px-4 py-3 text-right font-bold text-base">
                          TOTALS:
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {paymentABLItems.reduce((sum, row) => sum + (row.expenseAmount ?? 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {paymentABLItems.reduce((sum, row) => sum + (row.balance ?? 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base">
                          {paymentABLItems.reduce((sum, row) => sum + (row.paidAmount ?? 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    Total Rows: {paymentABLItems.length}
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
                      <span>{isEdit ? 'Update Payment' : 'Create Payment'}</span>
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
            <Link href="/paymentABL" className="text-[#3a614c] hover:text-[#6e997f] text-sm font-medium">
              Back to Payments
            </Link>
          </div>
        </div>

        {/* Booking Order Selection Popup */}
        {showOrderPopup !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-3xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Select Booking Order</h3>
                <Button
                  onClick={() => {
                    setShowOrderPopup(null);
                    setOrderSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-lg" />
                </Button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by Vehicle No, Order No, Date, or Vendor..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {filteredBookingOrders.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-4">No booking orders found</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Vehicle No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Vendor Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {filteredBookingOrders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => selectOrder(showOrderPopup, order)}
                          className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {order.vehicleNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {order.orderNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {order.orderDate}
                          </td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                            {order.vendorName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setShowOrderPopup(null);
                    setOrderSearch('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-md"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Charges Selection Popup */}
        {showChargePopup !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-3xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Select Charges</h3>
                <Button
                  onClick={() => {
                    setShowChargePopup(null);
                    setChargeSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-lg" />
                </Button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by Charge No, Charge Name, Order No, Dates, or Amount..."
                  value={chargeSearch}
                  onChange={(e) => setChargeSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {getFilteredCharges(showChargePopup).length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-4">No saved charges available for this order</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Charge No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Charge Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {getFilteredCharges(showChargePopup).map((charge) => (
                        <tr
                          key={charge.id}
                          onClick={() => selectCharge(showChargePopup, charge)}
                          className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.chargeNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.chargeName}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.orderNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.chargeDate}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.date}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-right text-gray-800 dark:text-gray-200">
                            {Number(charge.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">
                            {Number(charge.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setShowChargePopup(null);
                    setChargeSearch('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-md"
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

export default PaymentForm;