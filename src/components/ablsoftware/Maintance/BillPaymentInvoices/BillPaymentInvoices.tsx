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
import { MdLocalShipping, MdInfo, MdPayment, MdSearch } from 'react-icons/md';
import { FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import Link from 'next/link';
import { FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
  contact?: string;
  cnic?: string;
  accountName?: string;
  mobile?: string;
}

interface BookingOrder {
  id: string;
  vehicleNo: string;
  orderNo: string;
  munshayana: string;
}

interface ChargeLine {
  vehicle: string;
  amount: number;
}

interface Charge {
  orderNo: string;
  lines: ChargeLine[];
}

// Schema for bill payment invoices
const billPaymentSchema = z.object({
  invoiceNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment Date is required'),
  lines: z.array(
    z.discriminatedUnion('isAdditionalLine', [
      z.object({
        isAdditionalLine: z.literal(false),
        vehicleNo: z.string().min(1, 'Vehicle No is required'),
        orderNo: z.string().min(1, 'Order No is required'),
        amount: z.number().min(0, 'Amount is required'),
        munshayana: z.number().min(0, 'Munshayana must be non-negative').optional(),
        broker: z.string().optional(),
        dueDate: z.string().optional(),
        remarks: z.string().optional(),
      }),
      z.object({
        isAdditionalLine: z.literal(true),
        nameCharges: z.string().min(1, 'Name Charges is required'),
        amountCharges: z.number().min(0, 'Amount Charges must be non-negative'),
      }),
    ])
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
          lines: initialData.lines?.length
            ? initialData.lines.map(line =>
                line.isAdditionalLine
                  ? {
                      isAdditionalLine: true,
                      nameCharges: line.nameCharges || '',
                      amountCharges: line.amountCharges || 0,
                    }
                  : {
                      isAdditionalLine: false,
                      vehicleNo: line.vehicleNo || '',
                      orderNo: line.orderNo || '',
                      amount: line.amount || 0,
                      munshayana: line.munshayana ? Number(line.munshayana) : 0,
                      broker: line.broker || '',
                      dueDate: line.dueDate || '',
                      remarks: line.remarks || '',
                    }
              )
            : [
                {
                  isAdditionalLine: false,
                  vehicleNo: '',
                  orderNo: '',
                  amount: 0,
                  munshayana: 0,
                  broker: '',
                  dueDate: '',
                  remarks: '',
                },
              ],
        }
      : {
          invoiceNo: '',
          paymentDate: '',
          lines: [
            {
              isAdditionalLine: false,
              vehicleNo: '',
              orderNo: '',
              amount: 0,
              munshayana: 0,
              broker: '',
              dueDate: '',
              remarks: '',
            },
          ],
        },
  });

  const [idFocused, setIdFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [munshyanas, setMunshyanas] = useState<DropdownOption[]>([]);
  const [businessAssociates, setBusinessAssociates] = useState<DropdownOption[]>([]);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [chargesMap, setChargesMap] = useState<Record<string, number>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const lines = watch('lines');
  const [selectedBrokerDetails, setSelectedBrokerDetails] = useState<DropdownOption | null>(null);

  // Fetch dropdown data and build chargesMap by vehicleNo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [munRes, baRes, bookRes, chargesRes] = await Promise.all([
          getAllMunshyana(1, 10000),
          getAllBrooker(1, 10000),
          getAllBookingOrder(1, 10000),
          getAllCharges(1, 10000),
        ]);
        setMunshyanas(munRes.data.map((m: any) => ({ id: m.id, name: m.name })));
        setBusinessAssociates(
          baRes.data.map((ba: any) => ({
            id: ba.id,
            name: ba.name,
            cnic: ba.cnic,
            accountName: ba.accountName,
            mobile: ba.mobile,
          }))
        );
        setBookingOrders(
          bookRes.data.map((b: any) => ({
            id: b.id,
            vehicleNo: b.vehicleNo || '',
            orderNo: b.orderNo || b.id || '',
            munshayana: b.munshayana || '',
          }))
        );

        // Build chargesMap with vehicleNo as key
        const chargesSum: Record<string, number> = {};
        chargesRes.data.forEach((charge: Charge) => {
          charge.lines.forEach((line: ChargeLine) => {
            if (line.vehicle) {
              chargesSum[line.vehicle] = line.amount || 0; // Use individual amount per vehicle
            }
          });
        });
        console.log('chargesMap:', chargesSum); // Debug log
        setChargesMap(chargesSum);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  // Update selected broker details
  useEffect(() => {
    const selectedBrokerId = lines.find(line => !line.isAdditionalLine && line.broker)?.broker;
    const broker = businessAssociates.find(ba => ba.id === selectedBrokerId);
    setSelectedBrokerDetails(broker || null);
  }, [lines, businessAssociates]);

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
          ? initialData.lines.map(line =>
              line.isAdditionalLine
                ? {
                    isAdditionalLine: true,
                    nameCharges: line.nameCharges || '',
                    amountCharges: line.amountCharges || 0,
                  }
                : {
                    isAdditionalLine: false,
                    vehicleNo: line.vehicleNo || '',
                    orderNo: line.orderNo || '',
                    amount: line.amount || 0,
                    munshayana: line.munshayana ? Number(line.munshayana) : 0,
                    broker: line.broker || '',
                    dueDate: line.dueDate || '',
                    remarks: line.remarks || '',
                  }
            )
          : [
              {
                isAdditionalLine: false,
                vehicleNo: '',
                orderNo: '',
                amount: 0,
                munshayana: 0,
                broker: '',
                dueDate: '',
                remarks: '',
              },
            ],
      });
    }
  }, [isEdit, initialData, reset]);

  const selectVehicle = (order: BookingOrder, index: number) => {
    setValue(`lines.${index}.vehicleNo`, order.vehicleNo, { shouldValidate: true });
    setValue(`lines.${index}.orderNo`, order.orderNo, { shouldValidate: true });
    setValue(`lines.${index}.amount`, chargesMap[order.vehicleNo] || 0, { shouldValidate: true });
    setValue(`lines.${index}.munshayana`, 0, { shouldValidate: true });
    setValue(`lines.${index}.isAdditionalLine`, false, { shouldValidate: true });
    setSelectedLineIndex(index);
    setShowPopup(false);
    setSearchQuery('');
    console.log('Updated lines:', watch('lines')); // Debug log
  };

  const addLine = () => {
    setValue('lines', [
      ...lines,
      {
        isAdditionalLine: true,
        nameCharges: '',
        amountCharges: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setValue('lines', newLines);
      if (selectedLineIndex === index) {
        setSelectedLineIndex(null);
      } else if (selectedLineIndex !== null && index < selectedLineIndex) {
        setSelectedLineIndex(selectedLineIndex - 1);
      }
    }
  };

  const onSubmit = async (data: BillPaymentFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        id: isEdit ? window.location.pathname.split('/').pop() || '' : null,
        isActive: true,
        isDeleted: false,
        invoiceNo: data.invoiceNo || `INV${Date.now()}${Math.floor(Math.random() * 1000)}`,
        paymentDate: data.paymentDate,
        lines: data.lines.map(line =>
          line.isAdditionalLine
            ? {
                isAdditionalLine: true,
                nameCharges: line.nameCharges,
                amountCharges: line.amountCharges,
              }
            : {
                isAdditionalLine: false,
                vehicleNo: line.vehicleNo,
                orderNo: line.orderNo,
                amount: line.amount,
                munshayana: line.munshayana || undefined,
                broker: line.broker || '',
                dueDate: line.dueDate || '',
                remarks: line.remarks || '',
              }
        ),
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

  const filteredBookingOrders = bookingOrders.filter(
    order =>
      order.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getMunshayanaName(order.munshayana).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Total Amount is the amount of the first non-additional line
  const firstNonAdditionalLine = lines.find(line => !line.isAdditionalLine);
  const totalAmount = firstNonAdditionalLine ? firstNonAdditionalLine.amount || 0 : 0;
  const totalAmountCharges = lines.reduce((sum, line) => sum + (line.isAdditionalLine ? line.amountCharges || 0 : 0), 0);
  const combinedTotal = totalAmount + totalAmountCharges;
  const munshayanaDeduction = lines.reduce((sum, line) => sum + (line.isAdditionalLine ? 0 : line.munshayana || 0), 0);
  const finalTotal = combinedTotal - munshayanaDeduction;
  const hasAdditionalLines = lines.some(line => line.isAdditionalLine);

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="h-full w-full flex flex-col">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FaMoneyBillWave className="text-xl" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">
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
                  className="bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm px-4 py-2 shadow-lg hover:shadow-xl text-sm font-medium"
                >
                  <FiX className="mr-2" /> Cancel
                </Button>
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <FaReceipt className="text-gray-600 text-base" />
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
                    <MdLocalShipping className="text-gray-600 text-base" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Invoice Lines</h3>
                  </div>
                  <Button
                    type="button"
                    onClick={addLine}
                    className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-3 py-1.5 rounded-md shadow-sm hover:shadow-md"
                  >
                    <FiPlus className="mr-1" /> Add Line
                  </Button>
                </div>

                <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0">
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Vehicle No</th>
                        <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Order No</th>
                        <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Amount</th>
                        {hasAdditionalLines && (
                          <>
                            <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Name Charges</th>
                            <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Amount Charges</th>
                          </>
                        )}
                        <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Munshayana</th>
                        <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Broker</th>
                        <th className="px-2 py-2 text-left font-semibold min-w-[80px]">Due Date</th>
                        <th className="px-2 py-2 text-left font-semibold min-w-[100px]">Remarks</th>
                        <th className="px-2 py-2 text-left font-semibold min-w-[60px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {lines.map((line, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-2 py-2">
                            {!line.isAdditionalLine && (
                              <div className="space-y-1">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setShowPopup(true);
                                    setSelectedLineIndex(index);
                                  }}
                                  className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-2 py-1 w-full rounded-md shadow-sm"
                                >
                                  Select
                                </Button>
                                <input
                                  {...register(`lines.${index}.vehicleNo`)}
                                  disabled
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                />
                                {!line.isAdditionalLine && errors.lines?.[index] && 'vehicleNo' in errors.lines[index] && (
                                  <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).vehicleNo?.message}</p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {!line.isAdditionalLine && (
                              <>
                                <input
                                  {...register(`lines.${index}.orderNo`)}
                                  disabled
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                />
                                {!line.isAdditionalLine && errors.lines?.[index] && 'orderNo' in errors.lines[index] && (
                                  <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).orderNo?.message}</p>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {!line.isAdditionalLine && (
                              <>
                                <input
                                  type="number"
                                  {...register(`lines.${index}.amount`, { valueAsNumber: true })}
                                  disabled
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                />
                                {!line.isAdditionalLine && errors.lines?.[index] && 'amount' in errors.lines[index] && (
                                  <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).amount?.message}</p>
                                )}
                              </>
                            )}
                          </td>
                          {hasAdditionalLines && (
                            <>
                              <td className="px-2 py-2">
                                {line.isAdditionalLine && (
                                  <>
                                    <input
                                      {...register(`lines.${index}.nameCharges`)}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-900 dark:text-white"
                                      placeholder="Charge name"
                                    />
                                    {line.isAdditionalLine && errors.lines?.[index] && 'nameCharges' in errors.lines[index] && (
                                      <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).nameCharges?.message}</p>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                {line.isAdditionalLine && (
                                  <>
                                    <input
                                      type="number"
                                      {...register(`lines.${index}.amountCharges`, { valueAsNumber: true })}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-900 dark:text-white"
                                      placeholder="Amount"
                                    />
                                    {line.isAdditionalLine && errors.lines?.[index] && 'amountCharges' in errors.lines[index] && (
                                      <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).amountCharges?.message}</p>
                                    )}
                                  </>
                                )}
                              </td>
                            </>
                          )}
                          <td className="px-2 py-2">
                            {!line.isAdditionalLine && (
                              <>
                                <input
                                  type="number"
                                  {...register(`lines.${index}.munshayana`, { valueAsNumber: true })}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-900 dark:text-white"
                                  placeholder="Deduction"
                                />
                                {!line.isAdditionalLine && errors.lines?.[index] && 'munshayana' in errors.lines[index] && (
                                  <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).munshayana?.message}</p>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {!line.isAdditionalLine && (
                              <Controller
                                name={`lines.${index}.broker`}
                                control={control}
                                render={({ field }) => (
                                  <AblCustomDropdown
                                    label=""
                                    options={businessAssociates}
                                    selectedOption={field.value || ''}
                                    onChange={(value) => {
                                      setValue(`lines.${index}.broker`, value, { shouldValidate: true });
                                      const broker = businessAssociates.find(ba => ba.id === value);
                                      setSelectedBrokerDetails(broker || null);
                                    }}
                                    error={!line.isAdditionalLine && errors.lines?.[index] && 'broker' in errors.lines[index] ? (errors.lines[index] as any).broker?.message : undefined}
                                  />
                                )}
                              />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {!line.isAdditionalLine && (
                              <>
                                <input
                                  type="date"
                                  {...register(`lines.${index}.dueDate`)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-900 dark:text-white"
                                />
                                {!line.isAdditionalLine && errors.lines?.[index] && 'dueDate' in errors.lines[index] && (
                                  <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).dueDate?.message}</p>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {!line.isAdditionalLine && (
                              <>
                                <input
                                  {...register(`lines.${index}.remarks`)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-900 dark:text-white"
                                  placeholder="Remarks"
                                />
                                {!line.isAdditionalLine && errors.lines?.[index] && 'remarks' in errors.lines[index] && (
                                  <p className="text-red-500 text-xs mt-1">{(errors.lines[index] as any).remarks?.message}</p>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md shadow-sm"
                              disabled={lines.length <= 1}
                            >
                              <FiTrash2 />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                      <tr>
                        <td className="px-2 py-2 font-semibold" colSpan={2}>
                          Total Amount
                        </td>
                        <td className="px-2 py-2 font-bold">{totalAmount.toFixed(2)}</td>
                        {hasAdditionalLines && (
                          <>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                          </>
                        )}
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                      </tr>
                      {hasAdditionalLines && (
                        <tr>
                          <td className="px-2 py-2 font-semibold" colSpan={2}>
                            Total Amount Charges
                          </td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2 font-bold">{totalAmountCharges.toFixed(2)}</td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-2 py-2 font-semibold" colSpan={2}>
                          Combined Total
                        </td>
                        <td className="px-2 py-2 font-bold" colSpan={hasAdditionalLines ? 3 : 1}>
                          {combinedTotal.toFixed(2)}
                        </td>
                        {hasAdditionalLines && (
                          <>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                          </>
                        )}
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                      </tr>
                      {munshayanaDeduction > 0 && (
                        <tr>
                          <td className="px-2 py-2 font-semibold" colSpan={2}>
                            Munshayana Deduction
                          </td>
                          <td className="px-2 py-2 font-bold" colSpan={hasAdditionalLines ? 3 : 1}>
                            {munshayanaDeduction.toFixed(2)}
                          </td>
                          {hasAdditionalLines && (
                            <>
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2"></td>
                            </>
                          )}
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2"></td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-2 py-2 font-semibold" colSpan={2}>
                          Final Total
                        </td>
                        <td
                          className="px-2 py-2 font-bold text-green-600 dark:text-green-400"
                          colSpan={hasAdditionalLines ? 3 : 1}
                        >
                          {finalTotal.toFixed(2)}
                        </td>
                        {hasAdditionalLines && (
                          <>
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2"></td>
                          </>
                        )}
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedBrokerDetails && selectedBrokerDetails.mobile && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <MdInfo className="text-gray-600 text-base" />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Broker Details</h3>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Mobile</label>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{selectedBrokerDetails.mobile}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showPopup && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-2xl max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Select Vehicle</h3>
                    <Button
                      onClick={() => {
                        setShowPopup(false);
                        setSearchQuery('');
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                      variant="ghost"
                    >
                      <FiX className="text-lg" />
                    </Button>
                  </div>
                  <div className="mb-3">
                    <div className="relative">
                      <MdSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Vehicle No, Order No, or Munshayana"
                        className="w-full pl-8 pr-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredBookingOrders.length > 0 ? (
                      filteredBookingOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => selectVehicle(order, selectedLineIndex || 0)}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors shadow-sm"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                              <MdLocalShipping className="text-[#3a614c] text-base" />
                              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                Vehicle No: {order.vehicleNo}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaReceipt className="text-[#3a614c] text-base" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">Order No: {order.orderNo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaMoneyBillWave className="text-[#3a614c] text-base" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Amount: {chargesMap[order.vehicleNo] || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MdPayment className="text-[#3a614c] text-base" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Munshayana: {getMunshayanaName(order.munshayana)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">No results found</p>
                    )}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      onClick={() => {
                        setShowPopup(false);
                        setSearchQuery('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-md px-3 py-1 text-xs"
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
                className="px-4 py-2 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#3a614c]/30 font-medium text-sm"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="text-base" />
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