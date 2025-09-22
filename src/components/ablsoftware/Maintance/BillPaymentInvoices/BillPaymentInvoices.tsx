'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createBiltyPaymentInvoice, updateBiltyPaymentInvoice } from '@/apis/biltypaymentnnvoice';
import { getAllMunshyana } from '@/apis/munshyana';
import { getAllBrooker } from '@/apis/brooker';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllCharges } from '@/apis/charges';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdLocalShipping, MdInfo, MdPayment, MdAccountBalance } from 'react-icons/md';
import { FaMoneyBillWave, FaCreditCard, FaReceipt } from 'react-icons/fa';
import Link from 'next/link';
import { FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
  contact?: string;
}

interface BookingOrder {
  id: string;
  vehicleNo: string;
  orderNo: string;
  munshayana: string;
}

interface Charge {
  orderNo: string;
  lines: { amount: number }[];
}

interface BillLine {
  vehicleNo: string;
  orderNo: string;
  amount: number;
  munshayana: string;
  broker: string;
  dueDate: string;
  remarks: string;
}

// Schema for bill payment invoices
const billPaymentSchema = z.object({
  invoiceNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment Date is required'),
  lines: z.array(
    z.object({
      vehicleNo: z.string().min(1, 'Vehicle No is required'),
      orderNo: z.string().min(1, 'Order No is required'),
      amount: z.number().min(0, 'Amount is required'),
      munshayana: z.string().optional(),
      broker: z.string().optional(),
      dueDate: z.string().optional(),
      remarks: z.string().optional(),
    })
  ),
});

type BillPaymentFormData = z.infer<typeof billPaymentSchema>;

interface BillPaymentInvoiceFormProps {
  isEdit?: boolean;
  initialData?: Partial<BillPaymentFormData> & {
    id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdDateTime?: string;
    createdBy?: string;
    modifiedDateTime?: string;
    modifiedBy?: string;
  };
}

const BillPaymentInvoiceForm = ({ isEdit = false, initialData }: BillPaymentInvoiceFormProps) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<BillPaymentFormData>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: initialData
      ? {
          invoiceNo: initialData.invoiceNo || '',
          paymentDate: initialData.paymentDate || '',
          lines: initialData.lines || [{ vehicleNo: '', orderNo: '', amount: 0, munshayana: '', broker: '', dueDate: '', remarks: '' }],
        }
      : {
          invoiceNo: '',
          paymentDate: '',
          lines: [{ vehicleNo: '', orderNo: '', amount: 0, munshayana: '', broker: '', dueDate: '', remarks: '' }],
        },
  });

  const [idFocused, setIdFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [munshyanas, setMunshyanas] = useState<DropdownOption[]>([]);
  const [businessAssociates, setBusinessAssociates] = useState<DropdownOption[]>([]);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [chargesMap, setChargesMap] = useState<Record<string, number>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const lines = watch('lines');

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [munRes, baRes, bookRes, chargesRes] = await Promise.all([
          getAllMunshyana(),
          getAllBrooker(),
          getAllBookingOrder(),
          getAllCharges(),
        ]);
        setMunshyanas(munRes.data.map((m: any) => ({ id: m.id, name: m.name })));
        setBusinessAssociates(baRes.data.map((ba: any) => ({ id: ba.id, name: ba.name })));
        setBookingOrders(
          bookRes.data.map((b: any) => ({
            id: b.id,
            vehicleNo: b.vehicleNo || '',
            orderNo: b.orderNo || b.id || '',
            munshayana: b.munshayana || '',
          }))
        );

        // Compute charges sum per orderNo
        const chargesSum: Record<string, number> = {};
        chargesRes.data.forEach((charge: Charge) => {
          if (charge.orderNo) {
            const sum = charge.lines.reduce((acc, line) => acc + (line.amount || 0), 0);
            chargesSum[charge.orderNo] = (chargesSum[charge.orderNo] || 0) + sum;
          }
        });
        setChargesMap(chargesSum);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  // Generate invoiceNo for new bill payment
  useEffect(() => {
    if (!isEdit) {
      const generatedInvoiceNo = `INV${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setValue('invoiceNo', generatedInvoiceNo);
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        invoiceNo: initialData.invoiceNo || '',
        paymentDate: initialData.paymentDate || '',
        lines: initialData.lines?.length
          ? initialData.lines.map(line => ({
              vehicleNo: line.vehicleNo || '',
              orderNo: line.orderNo || '',
              amount: line.amount || 0,
              munshayana: line.munshayana || '',
              broker: line.broker || '',
              dueDate: line.dueDate || '',
              remarks: line.remarks || '',
            }))
          : [{ vehicleNo: '', orderNo: '', amount: 0, munshayana: '', broker: '', dueDate: '', remarks: '' }],
      });
    }
  }, [isEdit, initialData, reset]);

  const selectVehicle = (order: BookingOrder, index: number) => {
    setValue(`lines.${index}.vehicleNo`, order.vehicleNo, { shouldValidate: true });
    setValue(`lines.${index}.orderNo`, order.orderNo, { shouldValidate: true });
    setValue(`lines.${index}.amount`, chargesMap[order.orderNo] || 0, { shouldValidate: true });
    setValue(`lines.${index}.munshayana`, order.munshayana, { shouldValidate: true });
    setShowPopup(false);
  };

  const addLine = () => {
    setValue('lines', [...lines, { vehicleNo: '', orderNo: '', amount: 0, munshayana: '', broker: '', dueDate: '', remarks: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setValue('lines', newLines);
    }
  };

  const onSubmit = async (data: BillPaymentFormData) => {
    setIsSubmitting(true);
    try {
       const payload = {
        id: isEdit
          ? window.location.pathname.split('/').pop() || ''
          : `INV${Date.now()}${Math.floor(Math.random() * 1000)}`,
        isActive: true,
        isDeleted: false,
        invoiceNo: data.invoiceNo || `INV${Date.now()}${Math.floor(Math.random() * 1000)}`,
        paymentDate: data.paymentDate,
        lines: data.lines.map(line => ({
          vehicleNo: line.vehicleNo || '',
          orderNo: line.orderNo || '',
          amount: line.amount || 0,
          munshayana: line.munshayana || '',
          broker: line.broker || '',
          dueDate: line.dueDate || '',
          remarks: line.remarks || '',
        })),
      };

      if (isEdit) {
        await updateBiltyPaymentInvoice(payload);
        toast.success('Bill Payment Invoice updated successfully!');
      } else {
        await createBiltyPaymentInvoice(payload);
        toast.success('Bill Payment Invoice created successfully!');
      }
      router.push('/billpaymentinvoices');
    } catch (error) {
      console.error('Error saving bill payment invoice:', error);
      toast.error('An error occurred while saving the bill payment invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMunshayanaName = (id: string) => munshyanas.find(m => m.id === id)?.name || id;

  const totalAmount = lines.reduce((sum, line) => sum + (line.amount || 0), 0);

  return (
          <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="h-full w-full flex flex-col">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <FaMoneyBillWave className="text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {isEdit ? 'Edit Bill Payment Invoice' : 'Add New Bill Payment Invoice'}
                  </h1>
                  <p className="text-white/90 text-xs">
                    {isEdit ? 'Update bill payment invoice information' : 'Create a new bill payment invoice record'}
                  </p>
                </div>
              </div>
              <Link href="/billpaymentinvoices">
                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm px-3 py-1.5 shadow-lg hover:shadow-xl text-sm"
                >
                  <FiX className="mr-1" /> Cancel
                </Button>
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <FaReceipt className="text-gray-600 text-lg" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Basic Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <ABLCustomInput
                    label="Invoice No"
                    type="text"
                    placeholder={isEdit ? 'Invoice No' : 'Auto-generated'}
                    register={register}
                    error={errors.invoiceNo?.message}
                    id="invoiceNo"
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
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MdLocalShipping className="text-gray-600 text-lg" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Invoice Lines</h3>
                  </div>
                  <Button
                    type="button"
                    onClick={addLine}
                    className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-2 py-1 rounded-md"
                  >
                    <FiPlus className="mr-1" /> Add Line
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Vehicle No</th>
                        <th className="px-3 py-2 text-left font-medium">Order No</th>
                        <th className="px-3 py-2 text-left font-medium">Amount</th>
                        <th className="px-3 py-2 text-left font-medium">Munshayana</th>
                        <th className="px-3 py-2 text-left font-medium">Brokers</th>
                        <th className="px-3 py-2 text-left font-medium">Due Date</th>
                        <th className="px-3 py-2 text-left font-medium">Remarks</th>
                        <th className="px-3 py-2 text-left font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {lines.map((_, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              <Button
                                type="button"
                                onClick={() => {
                                  setShowPopup(true);
                                  setSelectedLineIndex(index);
                                }}
                                className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-2 py-1 w-full rounded-md"
                              >
                                Select
                              </Button>
                              <input
                                {...register(`lines.${index}.vehicleNo`)}
                                disabled
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                              />
                              {errors.lines?.[index]?.vehicleNo && (
                                <p className="text-red-500 text-xs mt-1">{errors.lines[index].vehicleNo.message}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              {...register(`lines.${index}.orderNo`)}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                            />
                            {errors.lines?.[index]?.orderNo && (
                              <p className="text-red-500 text-xs mt-1">{errors.lines[index].orderNo.message}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              {...register(`lines.${index}.amount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                            />
                            {errors.lines?.[index]?.amount && (
                              <p className="text-red-500 text-xs mt-1">{errors.lines[index].amount.message}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              {...register(`lines.${index}.munshayana`)}
                              disabled
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                              value={getMunshayanaName(lines[index].munshayana ?? '')}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Controller
                              name={`lines.${index}.broker`}
                              control={control}
                              render={({ field }) => (
                                <AblCustomDropdown
                                  label=""
                                  options={businessAssociates}
                                  selectedOption={field.value || ''}
                                  onChange={(value) => setValue(`lines.${index}.broker`, value, { shouldValidate: true })}
                                  error={errors.lines?.[index]?.broker?.message}
                                />
                              )}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              {...register(`lines.${index}.dueDate`)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                            />
                            {errors.lines?.[index]?.dueDate && (
                              <p className="text-red-500 text-xs mt-1">{errors.lines[index].dueDate.message}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              {...register(`lines.${index}.remarks`)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                            />
                            {errors.lines?.[index]?.remarks && (
                              <p className="text-red-500 text-xs mt-1">{errors.lines[index].remarks.message}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                              disabled={lines.length <= 1}
                            >
                              <FiTrash2 />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <tr>
                        <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200" colSpan={2}>
                          Total Amount:
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900 dark:text-gray-100">{totalAmount.toFixed(2)}</td>
                        <td className="px-3 py-2" colSpan={5}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {showPopup && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-lg w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Vehicle</h3>
                    <Button
                      onClick={() => setShowPopup(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                      variant="ghost"
                    >
                      <FiX className="text-xl" />
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {bookingOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => selectVehicle(order, selectedLineIndex)}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors shadow-sm"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <MdLocalShipping className="text-[#3a614c] text-lg" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">Vehicle No: {order.vehicleNo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaReceipt className="text-[#3a614c] text-lg" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Order No: {order.orderNo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-[#3a614c] text-lg" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Amount: {chargesMap[order.orderNo] || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MdPayment className="text-[#3a614c] text-lg" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Munshayana: {getMunshayanaName(order.munshayana)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => setShowPopup(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#3a614c]/30 font-medium text-sm"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="text-lg" />
                      <span>{isEdit ? 'Update Bill Payment Invoice' : 'Create Bill Payment Invoice'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BillPaymentInvoiceForm;
