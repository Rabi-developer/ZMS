'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import { createCharges, updateCharges } from '@/apis/charges';
import { getAllMunshyana } from '@/apis/munshyana';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBusinessAssociate } from '@/apis/businessassociate';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllPaymentABL } from '@/apis/paymentABL';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdLocalShipping, MdInfo, MdPayment } from 'react-icons/md';
import { FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
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
  orderNo: string;
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
  orderNo: string;
  vehicleNo: string;
}

interface PaymentABL {
  id: string;
  paymentNo: string;
  paymentDate: string;
  paymentMode: string;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  paidAmount: number | null;
  paymentABLItem?: Array<{
    charges: string;
    orderNo: string;
    vehicleNo: string;
  }>;
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
    id: z.string().optional().nullable(),
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
    orderNo: z.string().optional().nullable(),
    vehicleNo: z.string().optional().nullable(),
  })),
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
  const bookingOrderId = searchParams.get('bookingOrderId') || '';
  const orderNoParam = searchParams.get('orderNo') || '';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ChargesFormData>({
    resolver: zodResolver(chargesSchema),
    defaultValues: initialData
      ? {
          chargeNo: initialData.chargeNo != null ? String(initialData.chargeNo) : '',
          chargeDate: initialData.chargeDate || new Date().toISOString().split('T')[0],
          orderNo: initialData.orderNo || '',
          createdBy: initialData.createdBy || '',
          creationDate: initialData.creationDate || '',
          updatedBy: initialData.updatedBy || '',
          updationDate: initialData.updationDate || '',
          status: initialData.status || '',
          lines: Array.isArray(initialData.lines)
            ? initialData.lines.map((ln: any) => {
                console.log('Loading line into form:', ln);
                return {
                  ...ln,
                  id: ln?.id || null, // Explicitly preserve line ID (must come AFTER spread)
                };
              })
            : [{ id: null, charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }],
          payments: Array.isArray(initialData.payments)
            ? initialData.payments
            : [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '', orderNo: '', vehicleNo: '' }],
        }
      : {
          chargeNo: '',
          chargeDate: new Date().toISOString().split('T')[0],
          orderNo: '',
          createdBy: '',
          creationDate: '',
          updatedBy: '',
          updationDate: '',
          status: '',
          lines: [{ id: null, charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }],
          payments: [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '', orderNo: '', vehicleNo: '' }],
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
  const [orderSearch, setOrderSearch] = useState('');
  const [biltySearch, setBiltySearch] = useState('');
  const initKeyRef = useRef<string>('');

  const lines = watch('lines');
  const payments = watch('payments');

  // Filtered consignments and booking orders for popups
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

  const bankCashOptions: DropdownOption[] = [
    { id: 'Bank', name: 'Bank' },
    { id: 'Cash', name: 'Cash' },
    { id: 'Cheque', name: 'Cheque' },
  ];

  // Fetch data including PaymentABL and Consignments
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Charges component - URL params:', {
          fromBooking,
          bookingOrderId,
          orderNoParam
        });
        const [munRes, consRes, baRes, bookRes, paymentRes] = await Promise.all([
          getAllMunshyana(1, 1000),
          getAllConsignment(1, 1000),
          getAllBusinessAssociate(1, 1000),
          getAllBookingOrder(1, 1000),
          getAllPaymentABL(1, 1000),
        ]);

        setMunshyanas(munRes.data.map((m: any) => ({ id: m.id, name: m.chargesDesc })));
        setConsignments(consRes.data);
        setBusinessAssociates(baRes.data.map((ba: any) => ({ id: ba.id, name: ba.name, contact: ba.contact })));
        setBookingOrders(
          bookRes.data.map((b: any) => ({
            id: b.id,
            orderNo: String(b.orderNo ?? ''),
            vehicleNo: String(b.vehicleNo ?? ''),
            cargoWeight: String(b.cargoWeight ?? ''),
            orderDate: String(b.orderDate ?? ''),
            vendor: String(b.vendor ?? ''),
            vendorName: b.vendorName || String(b.vendor ?? '') || 'Unknown',
          }))
        );

        // If in edit mode or chargeNo exists, filter PaymentABL records
        if ((isEdit || fromBooking) && initialData?.chargeNo) {
          const relatedPayments = paymentRes.data.filter((payment: PaymentABL) =>
            payment.paymentABLItem?.some((item) => item.charges === initialData.chargeNo)
          );

          const mappedPayments = relatedPayments.map((payment: PaymentABL) => ({
            paidAmount: payment.paidAmount || 0,
            bankCash: payment.paymentMode || '',
            chqNo: payment.chequeNo || '',
            chqDate: payment.chequeDate || '',
            payNo: payment.paymentNo || '',
            orderNo: payment.paymentABLItem?.map((item) => item.orderNo).join(', ') || '',
            vehicleNo: payment.paymentABLItem?.map((item) => item.vehicleNo).join(', ') || '',
          }));

          setValue(
            'payments',
            mappedPayments.length > 0
              ? mappedPayments
              : [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '', orderNo: '', vehicleNo: '' }],
            { shouldValidate: true }
          );
        }

        // Handle auto-selection when coming from booking order
        if (fromBooking && bookingOrderId) {
          console.log('Setting up charges from booking order. BookingOrderId:', bookingOrderId);
          
          // Find the booking order by ID
          const selectedBookingOrder = bookRes.data.find((b: any) => String(b.id).trim() === String(bookingOrderId).trim());
          
          if (selectedBookingOrder) {
            const orderNoStr = String(selectedBookingOrder.orderNo || selectedBookingOrder.OrderNo || '');
            console.log('Found booking order:', selectedBookingOrder, 'OrderNo:', orderNoStr);
            setValue('orderNo', orderNoStr, { shouldValidate: true });
            
            try {
              const consRes = await getAllConsignment(1, 10, { orderNo: orderNoStr });
              setConsignments([...consRes.data]);
            } catch (e) {
              console.warn('Failed to fetch consignments for booking', e);
            }
          } else {
            console.warn('BookingOrder not found for id:', bookingOrderId, 'Available orders:', bookRes.data.map((x: any) => ({ id: x.id, orderNo: x.orderNo })));
          }
        } else if (fromBooking && orderNoParam) {
          // Fallback to using orderNo parameter if provided
          setValue('orderNo', String(orderNoParam), { shouldValidate: true });
          try {
            const consRes = await getAllConsignment(1, 10, { orderNo: String(orderNoParam) });
            setConsignments([...consRes.data]);
          } catch (e) {
            console.warn('Failed to fetch consignments for booking', e);
          }
        }

        if (isEdit && initialData) {
          const initKey = String((initialData as any)?.id ?? initialData.chargeNo ?? '');
          if (!initKeyRef.current || initKeyRef.current !== initKey) {
            initKeyRef.current = initKey;
            reset({
              chargeNo: initialData.chargeNo != null ? String(initialData.chargeNo) : '',
              chargeDate: initialData.chargeDate || new Date().toISOString().split('T')[0],
              orderNo: initialData.orderNo || '',
              createdBy: initialData.createdBy || '',
              creationDate: initialData.creationDate || '',
              updatedBy: initialData.updatedBy || '',
              updationDate: initialData.updationDate || '',
              status: initialData.status || '',
              lines: Array.isArray(initialData.lines)
                ? initialData.lines.map((ln: any) => {
                    console.log('Resetting line in form:', ln);
                    return {
                      ...ln,
                      id: ln?.id || null, // Explicitly preserve line ID (must come AFTER spread)
                      biltyNo: ln?.biltyNo != null ? String(ln.biltyNo) : '',
                      vehicle: ln?.vehicle != null ? String(ln.vehicle) : '',
                      charge: ln?.charge != null ? String(ln.charge) : '',
                    };
                  })
                : [{ id: null, charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }],
              payments: Array.isArray(initialData.payments)
                ? initialData.payments
                : [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '', orderNo: '', vehicleNo: '' }],
            });
          }
          try {
            const consRes = await getAllConsignment(1, 10, { chargeNo: initialData.chargeNo });
            setConsignments([...consRes.data]);
          } catch (e) {
            console.warn('Failed to fetch related consignments', e);
          }
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [isEdit, setValue, fromBooking, bookingOrderId, orderNoParam, initialData]);

  const selectBilty = (cons: Consignment, index: number) => {
    setValue(`lines.${index}.biltyNo`, String(cons.biltyNo));
    setShowBiltyPopup(false);
  };

  const selectOrder = (order: BookingOrder) => {
    setValue('orderNo', String(order.orderNo));
    setShowOrderPopup(false);
  };

  const getSelectedOrderDetails = () => {
    const orderNo = watch('orderNo');
    if (!orderNo) return null;
    return bookingOrders.find((order) => order.orderNo === orderNo);
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
      { id: null, charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setValue('lines', newLines);
    }
  };

  const totalCharges = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
  const balance = totalCharges - totalPayments;
  const maxRows = Math.max(lines.length, payments.length);

  const isFieldDisabled = (field?: string): boolean => {
  if (isViewMode) return true;
  if (fromBooking) {
    const allowed = ['charge', 'amount'];
    return !allowed.includes(field || '');
  }  return false;
};
  const isViewMode = searchParams.get('mode') === 'view';

  return (
    <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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

          {isViewMode && (
        <div className="m-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">View Only Mode</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              This Charges record is read-only. No changes can be made.
            </p>
          </div>
        </div>
      )}

          <form onSubmit={handleSubmit(async (data) => {
            console.log('Form data on submit:', data);
            console.log('Lines data:', data.lines);
            data.lines.forEach((line, idx) => {
              console.log(`Line ${idx} ID:`, line.id, 'Type:', typeof line.id);
            });
            setIsSubmitting(true);
            try {
              const payload: any = {
                chargeDate: String(data.chargeDate || ''),
                orderNo: String(data.orderNo || orderNoParam || ''),
                creationDate: String(data.creationDate || ''),
                updationDate: String(data.updationDate || ''),
                status: String(data.status || ''),
                lines: (data.lines || []).map((line, idx) => {
                  console.log(`Mapping line ${idx}:`, line);
                  const mappedLine = {
                    id: line.id || null, // Preserve line ID for updates
                    charge: line.charge != null ? String(line.charge) : '',
                    biltyNo: line.biltyNo != null ? String(line.biltyNo) : '',
                    date: String(line.date || ''),
                    vehicle: line.vehicle != null ? String(line.vehicle) : '',
                    paidTo: line.paidTo != null ? String(line.paidTo) : '',
                    contact: line.contact != null ? String(line.contact) : '',
                    remarks: line.remarks != null ? String(line.remarks) : '',
                    amount: Number(line.amount || 0),
                  };
                  console.log(`Mapped line ${idx}:`, mappedLine);
                  return mappedLine;
                }),
                payments: (data.payments || []).map((payment) => ({
                  paidAmount: Number(payment.paidAmount || 0),
                  bankCash: payment.bankCash != null ? String(payment.bankCash) : '',
                  chqNo: payment.chqNo != null ? String(payment.chqNo) : '',
                  chqDate: payment.chqDate != null ? String(payment.chqDate) : '',
                  payNo: payment.payNo != null ? String(payment.payNo) : '',
                  orderNo: payment.orderNo != null ? String(payment.orderNo) : '',
                  vehicleNo: payment.vehicleNo != null ? String(payment.vehicleNo) : '',
                })),
              };
              const newId = window.location.pathname.split('/').pop();
              if (isEdit && data.chargeNo) {
                payload.chargeNo = String(data.chargeNo);
                payload.id =  newId;
              }
              
              let id = data.chargeNo || '';
              if (isEdit) {
                await updateCharges(id, payload);
                toast.success('Charges updated successfully!');
              } else {
                await createCharges(payload);
                toast.success('Charges created successfully!');
              }
              if (fromBooking && bookingOrderId) {
                setTimeout(() => {
                  router.push(`/bookingorder/edit/${bookingOrderId}`);
                }, 800);
              } else if (fromBooking && orderNoParam) {
                setTimeout(() => {
                  router.push(`/bookingorder/create?orderNo=${encodeURIComponent(String(orderNoParam))}`);
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
          })} className="flex-1 p-4 overflow-hidden flex flex-col">
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
                  error={errors.chargeNo?.message}
                  id="chargeNo"
                  disabled
                />
                <ABLCustomInput
                  label="Charge Date"
                  type="date"
                  register={register}
                  error={errors.chargeDate?.message}
                  id="chargeDate"
                  disabled={isFieldDisabled('chargeDate') }
                />
                <div>
                  <Button
                    type="button"
                    onClick={() => setShowOrderPopup(true)}
                    className="mb-3 w-full bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs"
                    disabled={isViewMode || fromBooking }
                  >
                    {fromBooking ? 'Order Auto-Selected' : 'Select Order No'}
                  </Button>
                  <ABLCustomInput
                    label="Order No"
                    type="text"
                    register={register}
                    error={errors.orderNo?.message}
                    id="orderNo"
                    disabled
                  />
                  {getSelectedOrderDetails() && (
                    <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-600">
                      <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">Selected Order Details</h4>
                      <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
                        <tbody>
                          <tr className="border-b dark:border-gray-700">
                            <td className="py-1 px-2 font-medium text-gray-900 dark:text-white">Order No</td>
                            <td className="py-1 px-2">{getSelectedOrderDetails()?.orderNo}</td>
                          </tr>
                          <tr className="border-b dark:border-gray-700">
                            <td className="py-1 px-2 font-medium text-gray-900 dark:text-white">Vehicle No</td>
                            <td className="py-1 px-2">{getSelectedOrderDetails()?.vehicleNo}</td>
                          </tr>
                          <tr className="border-b dark:border-gray-700">
                            <td className="py-1 px-2 font-medium text-gray-900 dark:text-white">Cargo Weight</td>
                            <td className="py-1 px-2">{getSelectedOrderDetails()?.cargoWeight}</td>
                          </tr>
                          <tr className="border-b dark:border-gray-700">
                            <td className="py-1 px-2 font-medium text-gray-900 dark:text-white">Order Date</td>
                            <td className="py-1 px-2">{getSelectedOrderDetails()?.orderDate}</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2 font-medium text-gray-900 dark:text-white">Vendor</td>
                            <td className="py-1 px-2">{getSelectedOrderDetails()?.vendorName}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
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
                  <Button
                    type="button"
                    onClick={addLine}
                    className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-2 py-1 rounded-md"
                    disabled={isViewMode || fromBooking }
                  >
                    <FiPlus className="mr-1" /> Add Line
                  </Button>
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
                          colSpan={7}
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
                        {/* <th className="px-3 py-2 text-left font-medium border-l-2 border-gray-300 dark:border-gray-600">
                          Paid Amount
                        </th>
                        <th className="px-3 py-2 text-left font-medium">Bank/Cash</th>
                        <th className="px-3 py-2 text-left font-medium">Chq No</th>
                        <th className="px-3 py-2 text-left font-medium">Chq Date</th> */}
                        <th className="px-3 py-2 text-left font-medium">Pay. No</th>
                        <th className="px-3 py-2 text-left font-medium">Order No</th>
                        {/* <th className="px-3 py-2 text-left font-medium">Vehicle No</th>
                        <th className="px-3 py-2 text-left font-medium">Action</th> */}
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
                              {/* Hidden field to preserve line ID */}
                              {hasLine && (
                                <Controller
                                  name={`lines.${index}.id`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      type="hidden"
                                      {...field}
                                      value={field.value ?? ''}
                                    />
                                  )}
                                />
                              )}
                              {hasLine ? (
                                <Controller
                                  name={`lines.${index}.charge`}
                                  control={control}
                                  render={({ field }) => (
                                    <select
                                      {...field}
                                      disabled={isFieldDisabled('charge')}
                                      className="w-auto px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c]"
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
                            {/* <td className="px-3 py-2 border-l-2 border-gray-300 dark:border-gray-600">
                              {hasPayment ? (
                                <input
                                  type="number"
                                  {...register(`payments.${index}.paidAmount`, { valueAsNumber: true })}
                                  disabled={true}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td> */}
                            {/* <td className="px-3 py-2">
                              {hasPayment ? (
                                <Controller
                                  name={`payments.${index}.bankCash`}
                                  control={control}
                                  render={({ field }) => (
                                    <select
                                      {...field}
                                      disabled={true}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
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
                            </td> */}
                            {/* <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  {...register(`payments.${index}.chqNo`)}
                                  disabled={true}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td> */}
                            {/* <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  type="date"
                                  {...register(`payments.${index}.chqDate`)}
                                  disabled={true}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td> */}
                            <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  {...register(`payments.${index}.payNo`)}
                                  disabled={true}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  {...register(`payments.${index}.orderNo`)}
                                  disabled={true}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td>
                            {/* <td className="px-3 py-2">
                              {hasPayment ? (
                                <input
                                  {...register(`payments.${index}.vehicleNo`)}
                                  disabled={true}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs">—</div>
                              )}
                            </td> */}
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
                          {totalCharges.toFixed(2)}
                        </td>
                        <td
                          className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200 border-l-2 border-gray-300 dark:border-gray-600"
                          colSpan={6}
                        >
                          Total Payments:
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900 dark:text-gray-100">
                          {totalPayments.toFixed(2)}
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
                          {balance.toFixed(2)}
                        </td>
                        <td className="px-3 py-2" colSpan={8}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 gap-4">
          {isViewMode ? (
        <Button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
        >
          <FiX className="text-base" />
          Back
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg flex items-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Saving...</span>
        </>
          ) : (
        <>
          <FiSave className="text-base" />
          <span>{isEdit ? 'Update Charges' : 'Create Charges'}</span>
        </>
          )}
        </Button>
        )}
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
                          <td className="px-3 py-2">{order.orderNo}</td>
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
      </div>
    </div>
  );
};

export default ChargesForm;
