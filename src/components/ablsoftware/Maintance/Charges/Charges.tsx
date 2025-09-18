'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createCharges, updateCharges, getAllCharges } from '@/apis/charges';
import { getAllMunshyana } from '@/apis/munshyana';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBusinessAssociate } from '@/apis/businessassociate';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface Consignment {
  id: string;
  biltyNo: string;
  receiptNo: string;
  consignor: string;
  consignee: string;
  item: string;
  qty: number | null | undefined;
  totalAmount: number | null | undefined;
  recvAmount: number | null | undefined;
  delDate: string;
  status: string;
}

interface BookingOrder {
  id: string;
  vehicleNo: string;
  cargoWeight: string;
  orderDate: string;
  vendor: string;
  vendorName: string;
}

interface ChargeLine {
  charge: string;
  biltyNo: string;
  date: string;
  vehicle: string;
  paidTo: string;
  contact: string;
  remarks: string;
  amount: number;
}

interface Payment {
  paidAmount: number;
  bankCash: string;
  chqNo: string;
  chqDate: string;
  payNo: string;
}

// Schema for charges
const chargesSchema = z.object({
  chargeNo: z.string().optional().nullable(),
  chargeDate: z.string().optional().nullable(),
  orderNo: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  creationDate: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
  updationDate: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  lines: z.array(z.object({
    charge: z.string().optional(),
    biltyNo: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    vehicle: z.string().optional().nullable(),
    paidTo: z.string().optional(),
    contact: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    amount: z.number().optional().nullable(),
  })),
  payments: z.array(z.object({
    paidAmount: z.number().optional().nullable(),
    bankCash: z.string().optional(),
    chqNo: z.string().optional().nullable(),
    chqDate: z.string().optional().nullable(),
    payNo: z.string().optional().nullable(),
  })),
  selectedConsignments: z.array(z.string()).optional().nullable(),
});

type ChargesFormData = z.infer<typeof chargesSchema>;

interface ChargesFormProps {
  isEdit?: boolean;
  initialData?: Partial<ChargesFormData>;
}

const ChargesForm = ({ isEdit = false, initialData }: ChargesFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromBooking = searchParams.get('fromBooking') === 'true';
  const orderNoParam = searchParams.get('orderNo') || '';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<ChargesFormData>({
    resolver: zodResolver(chargesSchema),
    defaultValues: initialData
      ? {
          chargeNo: initialData.chargeNo || '',
          chargeDate: initialData.chargeDate || new Date().toISOString().split('T')[0],
          orderNo: initialData.orderNo || (fromBooking ? orderNoParam : ''),
          createdBy: initialData.createdBy || '',
          creationDate: initialData.creationDate || '',
          updatedBy: initialData.updatedBy || '',
          updationDate: initialData.updationDate || '',
          status: initialData.status || '',
          lines: Array.isArray(initialData.lines) ? initialData.lines : [{ charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }],
          payments: Array.isArray(initialData.payments) ? initialData.payments : [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '' }],
          selectedConsignments: Array.isArray(initialData.selectedConsignments) ? initialData.selectedConsignments : [],
        }
      : {
          chargeNo: '',
          chargeDate: new Date().toISOString().split('T')[0],
          orderNo: fromBooking ? orderNoParam : '',
          createdBy: '',
          creationDate: '',
          updatedBy: '',
          updationDate: '',
          status: '',
          lines: [{ charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }],
          payments: [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '' }],
          selectedConsignments: [],
        },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [munshyanas, setMunshyanas] = useState<DropdownOption[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [businessAssociates, setBusinessAssociates] = useState<DropdownOption[]>([]);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [showBiltyPopup, setShowBiltyPopup] = useState(false);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedConsignments, setTempSelectedConsignments] = useState<string[]>([]);
  // Remove local selectedConsignments state, use react-hook-form only
  const [searchTerm, setSearchTerm] = useState('');
  const lines = watch('lines');
  const payments = watch('payments');

  // Local search states for popups
  const [orderSearch, setOrderSearch] = useState('');
  const [biltySearch, setBiltySearch] = useState('');

  // Filtered lists based on search
  const filteredConsignments = consignments.filter((c) => {
    const q = biltySearch.toLowerCase();
    return !q || `${c.biltyNo || ''} ${c.id || ''}`.toLowerCase().includes(q);
  });

  const filteredBookingOrders = bookingOrders.filter((o) => {
    const q = orderSearch.toLowerCase();
    return (
      !q ||
      `${o.id || ''} ${o.vehicleNo || ''} ${o.cargoWeight || ''} ${o.orderDate || ''} ${o.vendor || ''} ${o.vendorName || ''}`
        .toLowerCase()
        .includes(q)
    );
  });

  const filteredConsignmentsForModal = consignments.filter((cons) =>
    [
      cons.biltyNo || '',
      cons.receiptNo || '',
      cons.consignor || '',
      cons.consignee || '',
      cons.item || '',
      cons.qty != null ? cons.qty.toString() : '',
      cons.totalAmount != null ? cons.totalAmount.toString() : '',
      cons.recvAmount != null ? cons.recvAmount.toString() : '',
      cons.delDate || '',
      cons.status || '',
    ].some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const bankCashOptions: DropdownOption[] = [
    { id: 'Bank', name: 'Bank' },
    { id: 'Cash', name: 'Cash' },
    { id: 'Cheque', name: 'Cheque' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [munRes, consRes, baRes, bookRes] = await Promise.all([
          getAllMunshyana(),
          getAllConsignment(1, 100),
          getAllBusinessAssociate(),
          getAllBookingOrder(),
        ]);
        setMunshyanas(munRes.data.map((m: any) => ({ id: m.id, name: m.chargesDesc })));
        setConsignments(consRes.data);
        setBusinessAssociates(baRes.data.map((ba: any) => ({ id: ba.id, name: ba.name, contact: ba.contact })));
        setBookingOrders(
          bookRes.data.map((b: any) => ({
            id: b.id,
            vehicleNo: b.vehicleNo || '',
            cargoWeight: b.cargoWeight || '',
            orderDate: b.orderDate || '',
            vendor: b.vendor || '',
            vendorName: b.vendorName || b.vendor || 'Unknown',
          }))
        );

        // If opened from Booking Order with orderNo, prefill it
        if (fromBooking && orderNoParam) {
          setValue('orderNo', orderNoParam);
          try {
            const consRes = await getAllConsignment(1, 10, { orderNo: orderNoParam });
            const bookingConsignments = consRes.data || [];
            setConsignments([...consRes.data, ...bookingConsignments]);
            const selectedBiltyNos = bookingConsignments.map((c: Consignment) => c.biltyNo);
            setValue('selectedConsignments', selectedBiltyNos);
            setTempSelectedConsignments(selectedBiltyNos);
          } catch (e) {
            console.warn('Failed to fetch consignments for booking', e);
          }
        }

        if (isEdit && initialData) {
          setValue('ChargeNo', initialData.ChargeNo || '');
          setValue('chargeDate', initialData.chargeDate || '');
          setValue('orderNo', initialData.orderNo || '');
          setValue('lines', Array.isArray(initialData.lines) ? initialData.lines : [{ charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }]);
          setValue('payments', Array.isArray(initialData.payments) ? initialData.payments : [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '' }]);
          setValue('selectedConsignments', Array.isArray(initialData.selectedConsignments) ? initialData.selectedConsignments : []);
          setTempSelectedConsignments(Array.isArray(initialData.selectedConsignments) ? initialData.selectedConsignments : []);
          // Fetch consignments associated with this charge
          try {
            const consRes = await getAllConsignment(1, 10, { chargeNo: initialData.ChargeNo });
            const relatedConsignments = consRes.data || [];
            setConsignments([...consRes.data, ...relatedConsignments]);
            const selectedBiltyNos = relatedConsignments.map((c: Consignment) => c.biltyNo);
            setValue('selectedConsignments', selectedBiltyNos);
            setTempSelectedConsignments(selectedBiltyNos);
          } catch (e) {
            console.warn('Failed to fetch related consignments', e);
          }
        }
      } catch (error) {
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, [isEdit, setValue, fromBooking, orderNoParam]);

  const selectBilty = (cons: Consignment, index: number) => {
    setValue(`lines.${index}.biltyNo`, cons.biltyNo);
    setShowBiltyPopup(false);
  };

  const selectOrder = (order: BookingOrder) => {
    setValue('orderNo', order.id);
    setShowOrderPopup(false);
  };

  const handlePaidToChange = (value: string, index: number) => {
    setValue(`lines.${index}.paidTo`, value);
    const associate = businessAssociates.find((ba) => ba.id === value);
    if (associate) {
      setValue(`lines.${index}.contact`, associate.contact || '');
    } else {
      setValue(`lines.${index}.contact`, '');
    }
  };

  const addLine = () => {
    setValue('lines', [
      ...lines,
      { charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setValue('lines', newLines);
    }
  };

  const addPayment = () => {
    setValue('payments', [
      ...payments,
      { paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '' },
    ]);
  };

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      const newPayments = payments.filter((_, i) => i !== index);
      setValue('payments', newPayments);
    }
  };

  const handleConsignmentSelection = (biltyNo: string, checked: boolean) => {
    setTempSelectedConsignments((prev) => {
      if (checked) {
        return [...prev, biltyNo];
      } else {
        return prev.filter((id) => id !== biltyNo);
      }
    });
  };

  const handleSaveConsignments = () => {
  setValue('selectedConsignments', tempSelectedConsignments, { shouldValidate: true });
  setIsModalOpen(false);
  };

  const updateStatus = (index: number, newStatus: string) => {
    const updatedConsignments = [...consignments];
    updatedConsignments[index].status = newStatus;
    setConsignments(updatedConsignments); 
  };

  const onSubmit = async (data: ChargesFormData) => {
    setIsSubmitting(true);
    try {
      // Build payload to match API spec
      const payload = {
        chargeNo: data.chargeNo || '',
        chargeDate: data.chargeDate || '',
        orderNo: data.orderNo || '',
        createdBy: data.createdBy || '',
        creationDate: data.creationDate || '',
        updatedBy: data.updatedBy || '',
        updationDate: data.updationDate || '',
        status: data.status || '',
        lines: (data.lines || []).map((line) => ({
          charge: line.charge || '',
          biltyNo: line.biltyNo || '',
          date: line.date || '',
          vehicle: line.vehicle || '',
          paidTo: line.paidTo || '',
          contact: line.contact || '',
          remarks: line.remarks || '',
          amount: line.amount || 0,
        })),
        payments: (data.payments || []).map((payment) => ({
          paidAmount: payment.paidAmount || 0,
          bankCash: payment.bankCash || '',
          chqNo: payment.chqNo || '',
          chqDate: payment.chqDate || '',
          payNo: payment.payNo || '',
        })),
        selectedConsignments: data.selectedConsignments || [],
      };
      let id = data.chargeNo || '';
      if (isEdit) {
        await updateCharges(id, payload);
        toast.success('Charges updated successfully!');
      } else {
        await createCharges(payload);
        toast.success('Charges created successfully!');
      }
      if (fromBooking) {
        setTimeout(() => {
          router.push(`/bookingorder/create?orderNo=${encodeURIComponent(orderNoParam)}`);
        }, 800);
      } else {
        router.push('/charges');
      }
    } catch (error) {
      toast.error('An error occurred while saving the charges');
      console.error('Error saving charges:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFieldDisabled = (field: string) => {
    if (!fromBooking) return false;
    return !['charge', 'amount'].includes(field);
  };

  const totalCharges = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
  const balance = totalCharges - totalPayments;
  const maxRows = Math.max(lines.length, payments.length);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
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
                    {isEdit ? 'Edit Charges' : 'Add New Charges'}
                  </h1>
                  <p className="text-white/90 text-xs">
                    {isEdit ? 'Update charges information' : 'Create a new charges record'}
                  </p>
                </div>
              </div>
              <Link href="/charges">
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
            {fromBooking && (
              <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <MdInfo className="text-lg" />
                  <span className="font-medium text-sm">Restricted Mode</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  You can only edit Charges and Amount fields when creating from booking order.
                </p>
              </div>
            )}

            <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <FaReceipt className="text-gray-600 text-lg" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Basic Information</h3>
                {fromBooking && (
                  <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Restricted</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <ABLCustomInput
                  label="Charge No"
                  type="text"
                  placeholder="Auto"
                  register={register}
                  error={errors.ChargeNo?.message}
                  id="chargeNo"
                  disabled
                />
                <ABLCustomInput
                  label="Charge Date"
                  type="date"
                  register={register}
                  error={errors.chargeDate?.message}
                  id="chargeDate"
                  disabled={isFieldDisabled('chargeDate')}
                />
                <div>
                  <Button
                    type="button"
                    onClick={() => setShowOrderPopup(true)}
                    className="mb-3 w-full bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs"
                    disabled={isFieldDisabled('orderNo')}
                  >
                    Select Order No
                  </Button>
                  <ABLCustomInput
                    label="Order No"
                    type="text"
                    register={register}
                    error={errors.orderNo?.message}
                    id="orderNo"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Combined Charges + Payments Table */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MdLocalShipping className="text-gray-600 text-lg" />
                    <MdPayment className="text-gray-600 text-lg" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Charges & Payments</h3>
                    {fromBooking && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Charges & Amount Editable
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={addLine}
                      className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-2 py-1 rounded-md"
                    >
                      <FiPlus className="mr-1" /> Add Line
                    </Button>
                    <Button
                      type="button"
                      onClick={addPayment}
                      className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-2 py-1 rounded-md"
                    >
                      <FiPlus className="mr-1" /> Add Payment
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        <th className="px-3 py-2 text-left font-semibold" colSpan={8}>
                          Charges Details
                        </th>
                        <th
                          className="px-3 py-2 text-left font-semibold border-l-2 border-gray-300 dark:border-gray-600"
                          colSpan={5}
                        >
                          Payment Information
                        </th>
                        <th className="px-3 py-2 text-left font-semibold" colSpan={1}>
                          Actions
                        </th>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0">
                        {/* Charges Columns */}
                        <th className="px-3 py-2 text-left font-medium">Charges</th>
                        <th className="px-3 py-2 text-left font-medium">Bilty No</th>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-left font-medium">Vehicle#</th>
                        <th className="px-3 py-2 text-left font-medium">Paid to</th>
                        <th className="px-3 py-2 text-left font-medium">Contact#</th>
                        <th className="px-3 py-2 text-left font-medium">Remarks</th>
                        <th className="px-3 py-2 text-left font-medium">Amount</th>
                        {/* Payment Columns */}
                        <th className="px-3 py-2 text-left font-medium border-l-2 border-gray-300 dark:border-gray-600">
                          Paid Amount
                        </th>
                        <th className="px-3 py-2 text-left font-medium">Bank/Cash</th>
                        <th className="px-3 py-2 text-left font-medium">Chq No</th>
                        <th className="px-3 py-2 text-left font-medium">Chq Date</th>
                        <th className="px-3 py-2 text-left font-medium">Pay. No</th>
                        {/* Actions */}
                        <th className="px-3 py-2 text-left font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Array.from({ length: maxRows }).map((_, index) => {
                        const hasLine = index < lines.length;
                        const hasPayment = index < payments.length;
                        return (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {/* Charges Cells */}
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <Controller
                                  name={`lines.${index}.charge`}
                                  control={control}
                                  render={({ field }) => (
                                    <select
                                      {...field}
                                      disabled={isFieldDisabled('charge')}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c]"
                                    >
                                      <option value="">Select</option>
                                      {munshyanas.map((mun) => (
                                        <option key={mun.id} value={mun.id}>
                                          {mun.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <div className="space-y-1">
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      setShowBiltyPopup(true);
                                      setSelectedLineIndex(index);
                                    }}
                                    className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-2 py-1 w-full rounded-md"
                                    disabled={isFieldDisabled('biltyNo')}
                                  >
                                    Select
                                  </Button>
                                  <input
                                    {...register(`lines.${index}.biltyNo`)}
                                    disabled
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                  />
                                </div>
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <input
                                  type="date"
                                  {...register(`lines.${index}.date`)}
                                  disabled={isFieldDisabled('date')}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <input
                                  {...register(`lines.${index}.vehicle`)}
                                  disabled={isFieldDisabled('vehicle')}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <Controller
                                  name={`lines.${index}.paidTo`}
                                  control={control}
                                  render={({ field }) => (
                                    <select
                                      {...field}
                                      onChange={(e) => handlePaidToChange(e.target.value, index)}
                                      disabled={isFieldDisabled('paidTo')}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c]"
                                    >
                                      <option value="">Select</option>
                                      {businessAssociates.map((ba) => (
                                        <option key={ba.id} value={ba.id}>
                                          {ba.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <input
                                  {...register(`lines.${index}.contact`)}
                                  disabled
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <input
                                  {...register(`lines.${index}.remarks`)}
                                  disabled={isFieldDisabled('remarks')}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasLine ? (
                                <input
                                  type="number"
                                  {...register(`lines.${index}.amount`, { valueAsNumber: true })}
                                  disabled={isFieldDisabled('amount')}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>

                            {/* Payment Cells */}
                            <td className="px-3 py-2 border-l-2 border-gray-300 dark:border-gray-600">
                              {hasPayment ? (
                                <input
                                  type="number"
                                  {...register(`payments.${index}.paidAmount`, { valueAsNumber: true })}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasPayment ? (
                                <Controller
                                  name={`payments.${index}.bankCash`}
                                  control={control}
                                  render={({ field }) => (
                                    <select
                                      {...field}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c]"
                                    >
                                      <option value="">Select</option>
                                      {bankCashOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  {...register(`payments.${index}.chqNo`)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  type="date"
                                  {...register(`payments.${index}.chqDate`)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  {...register(`payments.${index}.payNo`)}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {hasLine && (
                                  <Button
                                    type="button"
                                    onClick={() => removeLine(index)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                                    disabled={lines.length <= 1}
                                  >
                                    <FiTrash2 />
                                  </Button>
                                )}
                                {hasPayment && (
                                  <Button
                                    type="button"
                                    onClick={() => removePayment(index)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                                    disabled={payments.length <= 1}
                                  >
                                    <FiTrash2 />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <tr>
                        <td
                          className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200"
                          colSpan={7}
                        >
                          Total Charges:
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900 dark:text-gray-100">
                          ${totalCharges.toFixed(2)}
                        </td>
                        <td
                          className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200 border-l-2 border-gray-300 dark:border-gray-600"
                          colSpan={4}
                        >
                          Total Payments:
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900 dark:text-gray-100">
                          ${totalPayments.toFixed(2)}
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                      <tr>
                        <td
                          className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200"
                          colSpan={7}
                        >
                          Balance:
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900 dark:text-gray-100">
                          ${balance.toFixed(2)}
                        </td>
                        <td className="px-3 py-2" colSpan={6}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Consignments Table */}
          

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
                      <span>{isEdit ? 'Update Charges' : 'Create Charges'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>

        {showBiltyPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Bilty</h3>
                <Button
                  onClick={() => setShowBiltyPopup(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  variant="ghost"
                >
                  <FiX className="text-xl" />
                </Button>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={biltySearch}
                  onChange={(e) => setBiltySearch(e.target.value)}
                  placeholder="Search by Bilty No or ID..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm"
                />
              </div>

              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      <th className="px-3 py-2 text-left font-medium">Bilty No</th>
                      <th className="px-3 py-2 text-left font-medium">ID</th>
                      <th className="px-3 py-2 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredConsignments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                          No results
                        </td>
                      </tr>
                    ) : (
                      filteredConsignments.map((cons) => (
                        <tr key={cons.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-2">{cons.biltyNo}</td>
                          <td className="px-3 py-2">{cons.id}</td>
                          <td className="px-3 py-2">
                            <Button
                              type="button"
                              onClick={() => selectBilty(cons, selectedLineIndex)}
                              className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-3 py-1 rounded-md"
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setShowBiltyPopup(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showOrderPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-3xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Booking Order</h3>
                <Button
                  onClick={() => setShowOrderPopup(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  variant="ghost"
                >
                  <FiX className="text-xl" />
                </Button>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by Order No, Vehicle No, Vendor, Date..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm"
                />
              </div>

              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      <th className="px-3 py-2 text-left font-medium">Order No</th>
                      <th className="px-3 py-2 text-left font-medium">Vehicle No</th>
                      <th className="px-3 py-2 text-left font-medium">Cargo Weight</th>
                      <th className="px-3 py-2 text-left font-medium">Order Date</th>
                      <th className="px-3 py-2 text-left font-medium">Vendor</th>
                      <th className="px-3 py-2 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredBookingOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                          No results
                        </td>
                      </tr>
                    ) : (
                      filteredBookingOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-2">{order.id}</td>
                          <td className="px-3 py-2">{order.vehicleNo}</td>
                          <td className="px-3 py-2">{order.cargoWeight}</td>
                          <td className="px-3 py-2">{order.orderDate}</td>
                          <td className="px-3 py-2">{order.vendorName}</td>
                          <td className="px-3 py-2">
                            <Button
                              type="button"
                              onClick={() => selectOrder(order)}
                              className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-3 py-1 rounded-md"
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setShowOrderPopup(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Select Consignments
              </h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search consignments..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3a614c]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={
                          tempSelectedConsignments.length === filteredConsignmentsForModal.length &&
                          filteredConsignmentsForModal.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSelectedConsignments(filteredConsignmentsForModal.map((c) => c.biltyNo));
                          } else {
                            setTempSelectedConsignments([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3">Bilty No</th>
                    <th className="px-6 py-3">Receipt No</th>
                    <th className="px-6 py-3">Consignor</th>
                    <th className="px-6 py-3">Consignee</th>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3">Qty</th>
                    <th className="px-6 py-3">Total Amount</th>
                    <th className="px-6 py-3">Recv. Amount</th>
                    <th className="px-6 py-3">Del Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsignmentsForModal.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center">
                        No consignments found
                      </td>
                    </tr>
                  ) : (
                    filteredConsignmentsForModal.map((cons, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={tempSelectedConsignments.includes(cons.biltyNo)}
                            onChange={(e) => handleConsignmentSelection(cons.biltyNo, e.target.checked)}
                          />
                        </td>
                        <td className="px-6 py-4">{cons.biltyNo}</td>
                        <td className="px-6 py-4">{cons.receiptNo}</td>
                        <td className="px-6 py-4">{cons.consignor}</td>
                        <td className="px-6 py-4">{cons.consignee}</td>
                        <td className="px-6 py-4">{cons.item}</td>
                        <td className="px-6 py-4">{cons.qty ?? 'N/A'}</td>
                        <td className="px-6 py-4">{cons.totalAmount ?? 'N/A'}</td>
                        <td className="px-6 py-4">{cons.recvAmount ?? 'N/A'}</td>
                        <td className="px-6 py-4">{cons.delDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex justify-end gap-4 mt-4">
                <Button
                  variant="secondary"
                    onClick={() => {
                      setTempSelectedConsignments(watch('selectedConsignments') || []);
                      setSearchTerm('');
                      setIsModalOpen(false);
                    }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveConsignments}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargesForm;
