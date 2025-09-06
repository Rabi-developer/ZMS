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
import { createPaymentABL, getSinglePaymentABL, updatePaymentABL } from '@/apis/paymentABL';
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
  vehicleNo: string;
  orderDate: string;
  vendor: string;
  vendorName: string;
}

interface Charge {
  id: string;
  charge: string;
  orderDate: string;
  dueDate: string;
  amount: number;
  balance: number;
}

interface TableRow {
  vehicleNo: string;
  orderNo: string;
  charges: string;
  orderDate: string;
  dueDate: string;
  expenseAmount: number;
  balance: number;
  paidAmount: number;
}

const paymentSchema = z.object({
  paymentNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment Date is required'),
  paymentMode: z.string().min(1, 'Payment Mode is required'),
  bankName: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  remarks: z.string().optional(),
  paidTo: z.string().min(1, 'Paid To is required'),
  paidAmount: z.number().optional(),
  advanced: z.number().optional(),
  advancedDate: z.string().optional(),
  pdc: z.number().optional(),
  pdcDate: z.string().optional(),
  paymentAmount: z.number().optional(),
  tableData: z.array(
    z.object({
      vehicleNo: z.string().optional(),
      orderNo: z.string().optional(),
      charges: z.string().optional(),
      orderDate: z.string().optional(),
      dueDate: z.string().optional(),
      expenseAmount: z.number().optional(),
      balance: z.number().optional(),
      paidAmount: z.number().optional(),
    })
  ),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const PaymentForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentNo: '',
      paymentDate: '',
      paymentMode: '',
      bankName: '',
      chequeNo: '',
      chequeDate: '',
      remarks: '',
      paidTo: '',
      paidAmount: 0,
      advanced: 0,
      advancedDate: '',
      pdc: 0,
      pdcDate: '',
      paymentAmount: 0,
      tableData: [{ vehicleNo: '', orderNo: '', charges: '', orderDate: '', dueDate: '', expenseAmount: 0, balance: 0, paidAmount: 0 }],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [showOrderPopup, setShowOrderPopup] = useState<number | null>(null);
  const [showChargePopup, setShowChargePopup] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const tableData = watch('tableData');

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
            vehicleNo: item.vehicleNo || 'N/A',
            orderDate: item.orderDate || new Date().toISOString().split('T')[0],
            vendor: item.vendor || 'N/A',
            vendorName: item.vendorName || item.vendor || 'Unknown',
          }))
        );
        setCharges(
          chargeRes.data.map((item: any) => ({
            id: item.id,
            charge: item.charge || 'N/A',
            orderDate: item.orderDate || new Date().toISOString().split('T')[0],
            dueDate: item.dueDate || new Date().toISOString().split('T')[0],
            amount: item.amount || 0,
            balance: item.balance || item.amount || 0,
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

    if (!isEdit) {
      const generatePaymentNo = () => {
        const prefix = 'PAY';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };
      setValue('paymentNo', generatePaymentNo());
    }
  }, [setValue, isEdit]);

  useEffect(() => {
    if (isEdit) {
      const fetchPayment = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getSinglePaymentABL(id);
            const payment = response.data;
            if (payment) {
              setValue('paymentNo', payment.paymentNo || '');
              setValue('paymentDate', payment.paymentDate || '');
              setValue('paymentMode', payment.paymentMode || '');
              setValue('bankName', payment.bankName || '');
              setValue('chequeNo', payment.chequeNo || '');
              setValue('chequeDate', payment.chequeDate || '');
              setValue('remarks', payment.remarks || '');
              setValue('paidTo', payment.paidTo || '');
              setValue('paidAmount', payment.paidAmount || 0);
              setValue('advanced', payment.advanced || 0);
              setValue('advancedDate', payment.advancedDate || '');
              setValue('pdc', payment.pdc || 0);
              setValue('pdcDate', payment.pdcDate || '');
              setValue('paymentAmount', payment.paymentAmount || 0);
              setValue('tableData', payment.tableData || [{ vehicleNo: '', orderNo: '', charges: '', orderDate: '', dueDate: '', expenseAmount: 0, balance: 0, paidAmount: 0 }]);
            } else {
              toast.error('Payment not found');
              router.push('/paymentABL');
            }
          } catch (error) {
            toast.error('Failed to load payment data');
            console.error('Error fetching payment:', error);
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchPayment();
    }
  }, [isEdit, setValue, router]);

  useEffect(() => {
    const totalPaidAmount = tableData.reduce((sum, row) => sum + (row.paidAmount || 0), 0);
    setValue('paidAmount', totalPaidAmount);
  }, [tableData, setValue]);

  useEffect(() => {
    const advanced = parseFloat(watch('advanced')?.toString() || '0') || 0;
    const pdc = parseFloat(watch('pdc')?.toString() || '0') || 0;
    const paymentAmount = advanced + pdc;
    setValue('paymentAmount', paymentAmount, { shouldValidate: true });
  }, [watch('advanced'), watch('pdc'), setValue]);

  const selectOrder = (index: number, order: BookingOrder) => {
    setValue(`tableData.${index}.vehicleNo`, order.vehicleNo);
    setValue(`tableData.${index}.orderNo`, order.id);
    setValue(`tableData.${index}.orderDate`, order.orderDate);
    setValue('paidTo', order.vendorName);
    setShowOrderPopup(null);
  };

  const selectCharge = (index: number, charge: Charge) => {
    setValue(`tableData.${index}.charges`, charge.charge);
    setValue(`tableData.${index}.orderDate`, charge.orderDate);
    setValue(`tableData.${index}.dueDate`, charge.dueDate);
    setValue(`tableData.${index}.expenseAmount`, charge.amount);
    setValue(`tableData.${index}.balance`, charge.balance);
    setShowChargePopup(null);
  };

  const addTableRow = () => {
    setValue('tableData', [
      ...tableData,
      { vehicleNo: '', orderNo: '', charges: '', orderDate: '', dueDate: '', expenseAmount: 0, balance: 0, paidAmount: 0 },
    ]);
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updatePaymentABL(data);
        toast.success('Updated successfully');
      } else {
        await createPaymentABL(data);
        toast.success('Created successfully');
      }
      router.push('/paymentABL');
    } catch (error) {
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
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
              <ABLCustomInput
                label="Payment #"
                type="text"
                placeholder="Auto-generated"
                register={register}
                error={errors.paymentNo?.message}
                id="paymentNo"
                disabled
              />
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
                placeholder="Enter paid to"
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
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {tableData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <Button
                              type="button"
                              onClick={() => setShowOrderPopup(index)}
                              className="w-full px-3 py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              {row.vehicleNo || 'Select Vehicle'}
                            </Button>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.orderNo`)}
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
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.orderDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.dueDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`tableData.${index}.expenseAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
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
                              {...register(`tableData.${index}.paidAmount`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                            />
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
                          {tableData.reduce((sum, row) => sum + (row.expenseAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {tableData.reduce((sum, row) => sum + (row.balance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base">
                          {tableData.reduce((sum, row) => sum + (row.paidAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Select Booking Order</h3>
                <Button
                  onClick={() => setShowOrderPopup(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-base" />
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {bookingOrders.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-4">No booking orders available</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Vehicle No
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order No
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Vendor Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {bookingOrders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => selectOrder(showOrderPopup, order)}
                          className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {order.vehicleNo}
                          </td>
                          <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {order.id}
                          </td>
                          <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {order.orderDate}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {order.vendorName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => setShowOrderPopup(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-1 px-3 rounded-md"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Select Charges</h3>
                <Button
                  onClick={() => setShowChargePopup(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-base" />
                </Button>
              </div>
              <input
                type="text"
                placeholder="Search charges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] dark:bg-gray-700 dark:text-white"
              />
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {charges.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-4">No charges available</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Charge
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Due Date
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {charges
                        .filter((charge) =>
                          charge.charge.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          charge.orderDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          charge.dueDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          charge.amount.toString().includes(searchTerm) ||
                          charge.balance.toString().includes(searchTerm)
                        )
                        .map((charge) => (
                          <tr
                            key={charge.id}
                            onClick={() => selectCharge(showChargePopup, charge)}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                              {charge.charge}
                            </td>
                            <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                              {charge.orderDate}
                            </td>
                            <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                              {charge.dueDate}
                            </td>
                            <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 text-right text-gray-800 dark:text-gray-200">
                              {charge.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-800 dark:text-gray-200">
                              {charge.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => setShowChargePopup(null)}
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

export default PaymentForm;
