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
import { useRouter, useSearchParams } from 'next/navigation';
import { MdLocalShipping, MdInfo, MdSearch } from 'react-icons/md';
import { FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import Link from 'next/link';
import { FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
  mobile?: string;
}

interface BookingOrder {
  id: string;
  vehicleNo: string;
  orderNo: string;
  munshayana: string;
}

interface ChargeLine {
  amount: number;
}

interface Charge {
  orderNo: string | number;
  lines: ChargeLine[];
}

// Zod Schema
const billPaymentSchema = z.object({
  receiptNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment Date is required'),
  lines: z.array(
    z.discriminatedUnion('isAdditionalLine', [
      z.object({
        id: z.string().optional(),
        isAdditionalLine: z.literal(false),
        vehicleNo: z.string().min(1, 'Vehicle No is required'),
        orderNo: z.string().min(1, 'Order No is required'),
        amount: z.number().min(0, 'Amount is required'),
        munshayana: z.number().min(0).optional(),
        broker: z.string().optional(),
        dueDate: z.string().optional(),
        remarks: z.string().optional(),
      }),
      z.object({
        id: z.string().optional(),
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
  initialData?: Partial<BillPaymentFormData> & { id?: string };
}

const BillPaymentInvoiceForm = ({ isEdit = false, initialData }: BillPaymentInvoiceFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isViewMode = searchParams?.get('mode') === 'view';

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
    defaultValues: {
      receiptNo: '',
      paymentDate: '',
      lines: [{ isAdditionalLine: false, vehicleNo: '', orderNo: '', amount: 0, munshayana: 0 }],
    },
  });

  const [idFocused, setIdFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [munshyanas, setMunshyanas] = useState<DropdownOption[]>([]);
  const [businessAssociates, setBusinessAssociates] = useState<DropdownOption[]>([]);
  const [validBookingOrders, setValidBookingOrders] = useState<BookingOrder[]>([]);
  const [orderToFirstAmountMap, setOrderToFirstAmountMap] = useState<Record<string, number>>({});

  const [showPopup, setShowPopup] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const lines = watch('lines');
  const [selectedBrokerDetails, setSelectedBrokerDetails] = useState<DropdownOption | null>(null);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [munRes, baRes, bookRes, chargesRes] = await Promise.all([
          getAllMunshyana(1, 10000),
          getAllBrooker(1, 10000),
          getAllBookingOrder(1, 10000),
          getAllCharges(1, 10000),
        ]);

        setMunshyanas(munRes.data?.map((m: any) => ({ id: m.id, name: m.chargesDesc || m.name })) || []);
        setBusinessAssociates(
          baRes.data?.map((ba: any) => ({
            id: ba.id,
            name: ba.name,
            mobile: ba.mobile || ba.contact || '',
          })) || []
        );

        const bookingOrders: BookingOrder[] = (bookRes.data || []).map((b: any) => ({
          id: b.id,
          vehicleNo: String(b.vehicleNo ?? ''),
          orderNo: String(b.orderNo ?? b.id ?? ''),
          munshayana: String(b.munshayana ?? ''),
        }));

        const amountMap: Record<string, number> = {};
        const validOrderNos = new Set<string>();

        (chargesRes.data || []).forEach((charge: any) => {
          const orderNo = String(charge.orderNo ?? '');
          if (charge.lines && charge.lines.length > 0) {
            const firstAmount = Number(charge.lines[0].amount ?? 0);
            amountMap[orderNo] = firstAmount;
            validOrderNos.add(orderNo);
          }
        });

        setOrderToFirstAmountMap(amountMap);

        const filtered = bookingOrders.filter((order) => validOrderNos.has(order.orderNo));
        setValidBookingOrders(filtered);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load required data');
      }
    };

    fetchData();
  }, []);

  // Auto-generate invoice number
  useEffect(() => {
    if (!isEdit) {
      const generated = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setValue('receiptNo', generated);
    }
  }, [isEdit, setValue]);

  // Edit mode: populate form
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        receiptNo: String(initialData.receiptNo || ''),
        paymentDate: initialData.paymentDate || '',
        lines: initialData.lines?.length
          ? initialData.lines.map((line: any) =>
              line.isAdditionalLine
                ? { 
                    id: line.id,
                    isAdditionalLine: true, 
                    nameCharges: line.nameCharges || '', 
                    amountCharges: line.amountCharges || 0 
                  }
                : {
                    id: line.id,
                    isAdditionalLine: false,
                    vehicleNo: line.vehicleNo || '',
                    orderNo: line.orderNo || '',
                    amount: Number(line.amount || 0),
                    munshayana: Number(line.munshayana || 0),
                    broker: line.broker || '',
                    dueDate: line.dueDate || '',
                    remarks: line.remarks || '',
                  }
            )
          : [{ isAdditionalLine: false, vehicleNo: '', orderNo: '', amount: 0, munshayana: 0 }],
      });
    }
  }, [isEdit, initialData, reset]);

  // Update broker details
  useEffect(() => {
    const brokerId = (lines.find((line) => !line.isAdditionalLine) as any)?.broker;
    const broker = businessAssociates.find((b) => b.id === brokerId);
    setSelectedBrokerDetails(broker || null);
  }, [lines, businessAssociates]);

  const selectVehicle = (order: BookingOrder, index: number) => {
    if (isViewMode) return;
    const amount = orderToFirstAmountMap[order.orderNo] || 0;

    setValue(`lines.${index}.vehicleNo`, order.vehicleNo);
    setValue(`lines.${index}.orderNo`, order.orderNo);
    setValue(`lines.${index}.amount`, amount);
    setValue(`lines.${index}.munshayana`, 0);
    setValue(`lines.${index}.isAdditionalLine`, false);

    setShowPopup(false);
    setSearchQuery('');
  };

  const addLine = () => {
    if (isViewMode) return;
    setValue('lines', [
      ...lines,
      { isAdditionalLine: true, nameCharges: '', amountCharges: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (isViewMode) return;
    if (lines.length > 1) {
      setValue('lines', lines.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data: BillPaymentFormData) => {
    if (isViewMode) return;
    setIsSubmitting(true);
    try {
      const payload = {
        id: isEdit ? window.location.pathname.split('/').pop() : undefined,
        receiptNo: String(data.receiptNo),
        paymentDate: data.paymentDate,
        lines: data.lines.map((line: any) =>
          line.isAdditionalLine
            ? { 
                id: line.id,
                isAdditionalLine: true, 
                nameCharges: line.nameCharges, 
                amountCharges: line.amountCharges 
              }
            : {
                id: line.id,
                isAdditionalLine: false,
                vehicleNo: line.vehicleNo,
                orderNo: line.orderNo,
                amount: line.amount,
                munshayana: line.munshayana ?? 0,
                broker: line.broker,
                dueDate: line.dueDate,
                remarks: line.remarks,
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
      console.error(error);
      toast.error('Failed to save invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMunshayanaName = (id: string) => {
    return munshyanas.find((m) => m.id === id)?.name || id;
  };

  const filteredBookingOrders = validBookingOrders.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      order.vehicleNo.toLowerCase().includes(q) ||
      order.orderNo.toLowerCase().includes(q) ||
      getMunshayanaName(order.munshayana).toLowerCase().includes(q)
    );
  });

  // Calculations
  const mainLine = lines.find((l: any) => !l.isAdditionalLine) as any;
  const totalAmount = mainLine?.amount || 0;
  const totalAdditional = lines.reduce((sum, l: any) => sum + (l.isAdditionalLine ? l.amountCharges || 0 : 0), 0);
  const munshayanaDeduction = lines.reduce((sum, l: any) => sum + (!l.isAdditionalLine ? l.munshayana || 0 : 0), 0);
  const finalTotal = totalAmount + totalAdditional - munshayanaDeduction;
  const hasAdditionalLines = lines.some((l: any) => l.isAdditionalLine);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border">
         {!isViewMode && (
        <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <FaMoneyBillWave className="text-3xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEdit ? 'Edit' : 'Create'} Bill Payment Invoice
                </h1>
                <p className="opacity-90">Manage transporter payments</p>
              </div>
            </div>
            <Link href="/billpaymentinvoices">
              <Button className="bg-white/20 hover:bg-white/30">
                <FiX className="mr-2" /> Cancel
              </Button>
            </Link>
          </div>
        </div>
         )}

        {/* View Mode Banner */}
        {isViewMode && (
          <div className="m-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
            <MdInfo className="text-xl text-amber-700 dark:text-amber-300" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">View Only Mode</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                This bill payment invoice is read-only. No changes can be made.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaReceipt /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <ABLCustomInput
                  label="Receipt No"
                  type="text"
                  register={register}
                  error={errors.receiptNo?.message}
                  id="receiptNo"
                  disabled
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                />
                {idFocused && (
                  <div className="absolute -top-7 left-0 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded">
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
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MdLocalShipping /> Invoice Lines
              </h3>
              {!isViewMode && (
                <Button 
                  type="button" 
                  onClick={addLine} 
                  className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white"
                >
                  <FiPlus className="mr-2" /> Add Line
                </Button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Vehicle No</th>
                    <th className="px-4 py-3 text-left">Order No</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    {hasAdditionalLines && <th className="px-4 py-3 text-left">Name Charges</th>}
                    {hasAdditionalLines && <th className="px-4 py-3 text-left">Amount Charges</th>}
                    <th className="px-4 py-3 text-left">Munshayana</th>
                    <th className="px-4 py-3 text-left">Broker</th>
                    <th className="px-4 py-3 text-left">Due Date</th>
                    <th className="px-4 py-3 text-left">Remarks</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {lines.map((line: any, index) => (
                    <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        {!line.isAdditionalLine && (
                          <>
                            {!isViewMode ? (
                              <Button
                                type="button"
                                onClick={() => {
                                  setSelectedLineIndex(index);
                                  setShowPopup(true);
                                }}
                                className="mb-2 w-full text-xs bg-[#3a614c] hover:bg-[#3a614c]/90"
                              >
                                Select Vehicle
                              </Button>
                            ) : (
                            <input
                              {...register(`lines.${index}.vehicleNo`)}
                              disabled
                              className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-800"
                            />
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!line.isAdditionalLine && (
                          <input
                            {...register(`lines.${index}.orderNo`)}
                            disabled
                            className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-800"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!line.isAdditionalLine && (
                          <input
                            type="number"
                            {...register(`lines.${index}.amount`, { valueAsNumber: true })}
                            disabled
                            className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-800"
                          />
                        )}
                      </td>
                      {hasAdditionalLines && (
                        <>
                          <td className="px-4 py-3">
                            {line.isAdditionalLine && (
                              <input
                                {...register(`lines.${index}.nameCharges`)}
                                className="w-full border rounded px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="Charge name"
                                disabled={isViewMode}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {line.isAdditionalLine && (
                              <input
                                type="number"
                                {...register(`lines.${index}.amountCharges`, { valueAsNumber: true })}
                                className="w-full border rounded px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={isViewMode}
                              />
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        {!line.isAdditionalLine && (
                          <input
                            type="number"
                            {...register(`lines.${index}.munshayana`, { valueAsNumber: true })}
                            className="w-full border rounded px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isViewMode}
                          />
                        )}
                      </td>
                      <td className="w-full px-4 py-3">
                        {!line.isAdditionalLine && (
                          <Controller
                            name={`lines.${index}.broker`}
                            control={control}
                            render={({ field }) => (
                              <AblCustomDropdown
                                options={businessAssociates}
                                selectedOption={field.value || ''}
                                onChange={field.onChange}
                                label=""
                                disabled={isViewMode}
                              />
                            )}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!line.isAdditionalLine && (
                          <input
                            type="date"
                            {...register(`lines.${index}.dueDate`)}
                            className="w-full border rounded px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isViewMode}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!line.isAdditionalLine && (
                          <input
                            {...register(`lines.${index}.remarks`)}
                            className="w-full border rounded px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Remarks"
                            disabled={isViewMode}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isViewMode && lines.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2"
                          >
                            <FiTrash2 />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-200 dark:bg-gray-800 font-bold">
                  <tr>
                    <td colSpan={2} className="px-4 py-3">Total Amount</td>
                    <td className="px-4 py-3">{totalAmount.toLocaleString()}</td>
                    {hasAdditionalLines && <td colSpan={2} className="px-4 py-3 text-right">{totalAdditional.toLocaleString()}</td>}
                    <td colSpan={6}></td>
                  </tr>
                  {munshayanaDeduction > 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-red-600">Munshayana Deduction</td>
                      <td className="px-4 py-3 text-red-600">-{munshayanaDeduction.toLocaleString()}</td>
                      <td colSpan={6}></td>
                    </tr>
                  )}
                  <tr className="text-lg">
                    <td colSpan={2} className="px-4 py-3">Final Total</td>
                    <td colSpan={hasAdditionalLines ? 3 : 1} className="px-4 py-3 text-green-600">
                      {finalTotal.toLocaleString()}
                    </td>
                    <td colSpan={5}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Broker Info */}
          {selectedBrokerDetails?.mobile && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MdInfo /> Selected Broker Details
              </h4>
              <p className="text-sm">Mobile: {selectedBrokerDetails.mobile}</p>
            </div>
          )}

          {/* Submit / Back area */}
          <div className="flex justify-end gap-4">
            {isViewMode ? (
              <Button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                <FiX className="mr-2" /> Back to List
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    {isEdit ? 'Update Invoice' : 'Create Invoice'}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Vehicle Selection Popup - only show when not in view mode */}
      {!isViewMode && showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Select Vehicle (Only Orders with Charges)</h3>
              <Button onClick={() => { setShowPopup(false); setSearchQuery(''); }} variant="ghost">
                <FiX className="text-2xl" />
              </Button>
            </div>

            <div className="p-6">
              <div className="relative mb-6">
                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Vehicle No, Order No, or Munshayana..."
                  className="w-full pl-12 pr-6 py-4 border-2 rounded-xl text-lg"
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredBookingOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-xl">No orders with charges found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Vehicle No</th>
                        <th className="px-6 py-4 text-left font-semibold">Order No</th>
                        <th className="px-6 py-4 text-left font-semibold">Amount (First Line)</th>
                        <th className="px-6 py-4 text-left font-semibold">Munshayana</th>
                        <th className="px-6 py-4 text-left font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredBookingOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">{order.vehicleNo || '—'}</td>
                          <td className="px-6 py-4 font-medium">{order.orderNo}</td>
                          <td className="px-6 py-4 font-bold text-green-600">
                            {orderToFirstAmountMap[order.orderNo]?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4">{getMunshayanaName(order.munshayana)}</td>
                          <td className="px-6 py-4">
                            <Button
                              onClick={() => selectVehicle(order, selectedLineIndex || 0)}
                              className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white px-6 py-3"
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillPaymentInvoiceForm;