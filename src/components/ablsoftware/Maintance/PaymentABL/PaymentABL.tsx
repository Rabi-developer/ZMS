'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createPaymentABL, updatePaymentABL, getAllPaymentABL } from '@/apis/paymentABL';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllCharges } from '@/apis/charges';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdPayment, MdInfo, MdLocalShipping, MdAccountBalance } from 'react-icons/md';
import { FaMoneyBillWave, FaCreditCard, FaReceipt } from 'react-icons/fa';
import Link from 'next/link';
import { FiSave, FiX, FiUser } from 'react-icons/fi';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
  orderNo?: string;
  vehicleNo?: string;
  amount?: number;
}

interface BookingOrder {
  id: string;
  orderNo: string;
  vehicleNo: string;
  transporter: string;
  vendor: string;
}

interface Charge {
  id: string;
  orderNo: string;
  chargeNo: string;
  amount: number;
  balance: number;
}

// Define the schema for payment ABL form validation
const paymentABLSchema = z.object({
  paymentNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment Date is required'),
  orderNo: z.string().min(1, 'Order No is required'),
  vehicleNo: z.string().optional(),
  chargeNo: z.string().min(1, 'Charge is required'),
  expenseAmount: z.number().min(0, 'Expense Amount must be positive'),
  balance: z.number().optional(),
  paidAmount: z.number().min(0, 'Paid Amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment Method is required'),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  bankName: z.string().optional(),
  remarks: z.string().optional(),
});

type PaymentABLFormData = z.infer<typeof paymentABLSchema>;

const PaymentABLForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentABLFormData>({
    resolver: zodResolver(paymentABLSchema),
    defaultValues: {
      paymentNo: '',
      paymentDate: '',
      orderNo: '',
      vehicleNo: '',
      chargeNo: '',
      expenseAmount: 0,
      balance: 0,
      paidAmount: 0,
      paymentMethod: '',
      chequeNo: '',
      chequeDate: '',
      bankName: '',
      remarks: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [filteredCharges, setFilteredCharges] = useState<Charge[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<BookingOrder | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

  const watchedOrderNo = watch('orderNo');
  const watchedChargeNo = watch('chargeNo');
  const watchedExpenseAmount = watch('expenseAmount');
  const watchedPaidAmount = watch('paidAmount');

  const paymentMethods: DropdownOption[] = [
    { id: 'Cash', name: 'Cash' },
    { id: 'Bank', name: 'Bank Transfer' },
    { id: 'Cheque', name: 'Cheque' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, chargesRes] = await Promise.all([
          getAllBookingOrder(),
          getAllCharges(),
        ]);
        setBookingOrders(bookingRes.data);
        setCharges(chargesRes.data);
      } catch (error) {
        toast.error('Failed to load dropdown data');
      }
    };
    fetchData();

    if (isEdit) {
      const fetchPaymentABL = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getAllPaymentABL();
            const payment = response.data.find((p: any) => p.id === id);
            if (payment) {
              Object.keys(payment).forEach((key) => {
                setValue(key as keyof PaymentABLFormData, payment[key]);
              });
            } else {
              toast.error('Payment record not found');
              router.push('/paymentabl');
            }
          } catch (error) {
            toast.error('Failed to load payment data');
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchPaymentABL();
    }
  }, [isEdit, setValue, router]);

  // Filter charges based on selected order
  useEffect(() => {
    if (watchedOrderNo) {
      const filtered = charges.filter(charge => charge.orderNo === watchedOrderNo);
      setFilteredCharges(filtered);
      
      // Find selected order
      const order = bookingOrders.find(bo => bo.orderNo === watchedOrderNo);
      setSelectedOrder(order || null);
      if (order) {
        setValue('vehicleNo', order.vehicleNo);
      }
    } else {
      setFilteredCharges([]);
      setSelectedOrder(null);
      setValue('vehicleNo', '');
    }
  }, [watchedOrderNo, charges, bookingOrders, setValue]);

  // Auto-fill expense amount and balance when charge is selected
  useEffect(() => {
    if (watchedChargeNo) {
      const charge = filteredCharges.find(c => c.chargeNo === watchedChargeNo);
      setSelectedCharge(charge || null);
      if (charge) {
        setValue('expenseAmount', charge.amount);
        setValue('balance', charge.balance);
      }
    } else {
      setSelectedCharge(null);
      setValue('expenseAmount', 0);
      setValue('balance', 0);
    }
  }, [watchedChargeNo, filteredCharges, setValue]);

  // Calculate balance when paid amount changes
  useEffect(() => {
    const balance = watchedExpenseAmount - watchedPaidAmount;
    setValue('balance', balance);
  }, [watchedExpenseAmount, watchedPaidAmount, setValue]);

  const onSubmit = async (data: PaymentABLFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updatePaymentABL(data);
        toast.success('Payment updated successfully!');
      } else {
        await createPaymentABL(data);
        toast.success('Payment created successfully!');
      }
      router.push('/paymentabl');
    } catch (error) {
      toast.error('An error occurred while saving the payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Loading payment data...</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdPayment className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Payment' : 'Add New Payment'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update payment information' : 'Create a new payment record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/paymentabl">
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

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <FaReceipt className="text-[#3a614c] text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Payment Details
                  </h3>
                </div>
                <div className="space-y-5">
                  <ABLCustomInput
                    label="Payment No"
                    type="text"
                    placeholder="Auto"
                    register={register}
                    error={errors.paymentNo?.message}
                    id="paymentNo"
                    disabled
                  />
                  <ABLCustomInput
                    label="Payment Date"
                    type="date"
                    placeholder="Enter payment date"
                    register={register}
                    error={errors.paymentDate?.message}
                    id="paymentDate"
                  />
                  <Controller
                    name="orderNo"
                    control={control}
                    render={({ field }) => (
                      <AblCustomDropdown
                        label="Select Vehicle (Order No)"
                        options={bookingOrders.map(bo => ({ 
                          id: bo.orderNo, 
                          name: `${bo.orderNo} - ${bo.vehicleNo}` 
                        }))}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('orderNo', value)}
                        error={errors.orderNo?.message}
                      />
                    )}
                  />
                  <ABLCustomInput
                    label="Vehicle No"
                    type="text"
                    placeholder="Auto-filled"
                    register={register}
                    error={errors.vehicleNo?.message}
                    id="vehicleNo"
                    disabled
                  />
                </div>
              </div>

              <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MdLocalShipping className="text-[#3a614c] text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Charge Details
                  </h3>
                </div>
                <div className="space-y-5">
                  <Controller
                    name="chargeNo"
                    control={control}
                    render={({ field }) => (
                      <AblCustomDropdown
                        label="Select Charges"
                        options={filteredCharges.map(charge => ({ 
                          id: charge.chargeNo, 
                          name: `${charge.chargeNo} - $${charge.amount}` 
                        }))}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('chargeNo', value)}
                        error={errors.chargeNo?.message}
                        disabled={!watchedOrderNo}
                      />
                    )}
                  />
                  <ABLCustomInput
                    label="Expense Amount"
                    type="number"
                    placeholder="Auto-filled"
                    register={register}
                    error={errors.expenseAmount?.message}
                    id="expenseAmount"
                    disabled
                  />
                  <ABLCustomInput
                    label="Balance"
                    type="number"
                    placeholder="Auto-calculated"
                    register={register}
                    error={errors.balance?.message}
                    id="balance"
                    disabled
                  />
                </div>
              </div>

              <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MdAccountBalance className="text-[#3a614c] text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Payment Information
                  </h3>
                </div>
                <div className="space-y-5">
                  <ABLCustomInput
                    label="Paid Amount"
                    type="number"
                    placeholder="Enter paid amount"
                    register={register}
                    error={errors.paidAmount?.message}
                    id="paidAmount"
                  />
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <AblCustomDropdown
                        label="Payment Method"
                        options={paymentMethods}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('paymentMethod', value)}
                        error={errors.paymentMethod?.message}
                      />
                    )}
                  />
                  {watch('paymentMethod') === 'Cheque' && (
                    <>
                      <ABLCustomInput
                        label="Cheque No"
                        type="text"
                        placeholder="Enter cheque number"
                        register={register}
                        error={errors.chequeNo?.message}
                        id="chequeNo"
                      />
                      <ABLCustomInput
                        label="Cheque Date"
                        type="date"
                        placeholder="Enter cheque date"
                        register={register}
                        error={errors.chequeDate?.message}
                        id="chequeDate"
                      />
                    </>
                  )}
                  {(watch('paymentMethod') === 'Bank' || watch('paymentMethod') === 'Cheque') && (
                    <ABLCustomInput
                      label="Bank Name"
                      type="text"
                      placeholder="Enter bank name"
                      register={register}
                      error={errors.bankName?.message}
                      id="bankName"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <FiUser className="text-[#3a614c] text-xl" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Additional Information
                </h3>
              </div>
              <ABLCustomInput
                label="Remarks"
                type="text"
                placeholder="Enter any remarks"
                register={register}
                error={errors.remarks?.message}
                id="remarks"
              />
            </div>

            {/* Summary Section */}
            {selectedOrder && selectedCharge && (
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Selected Vehicle</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedOrder.vehicleNo}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Charge Amount</p>
                    <p className="text-lg font-semibold text-green-600">${selectedCharge.amount}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Remaining Balance</p>
                    <p className={`text-lg font-semibold ${watch('balance') > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.abs(watch('balance') || 0)} {(watch('balance') || 0) > 0 ? '(Due)' : '(Paid)'}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                      <span>{isEdit ? 'Update Payment' : 'Create Payment'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MdInfo className="text-[#3a614c]" />
              <span className="text-sm">Select a vehicle first to see available charges</span>
            </div>
            <Link href="/paymentabl" className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors">
              Back to Payment List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentABLForm;