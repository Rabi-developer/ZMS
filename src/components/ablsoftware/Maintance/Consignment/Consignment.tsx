'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import ABLNewCustomInput from '@/components/ui/ABLNewCustomInput';
import AblNewCustomDrpdown from '@/components/ui/AblNewCustomDrpdown';
import { createConsignment, updateConsignment, getSingleConsignment } from '@/apis/consignment';
import { getAllPartys } from '@/apis/party';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllUnitOfMeasures } from '@/apis/unitofmeasure';
import { getAllSaleTexes } from '@/apis/salestexes';
import { getAllTransporter } from '@/apis/transporter';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdLocalShipping, MdInfo } from 'react-icons/md';
import Link from 'next/link';
import { FiSave, FiX } from 'react-icons/fi';

// Extend ABLNewCustomInputProps to include onFocus and onBlur
interface ABLNewCustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  type: string;
  placeholder: string;
  register: any;
  error?: string;
  id: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  [key: string]: any;
}

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
}

interface BookingOrder {
  id: string;
  orderNo: string;
  vehicleNo: string;
  cargoWeight: string;
  orderDate: string;
  vendor: string;
}

interface Item {
  desc: string;
  qty: number;
  rate: number;
  qtyUnit: string;
  weight: number;
  weightUnit: string;
}

// Define the schema for consignment form validation
const consignmentSchema = z.object({
  consignmentMode: z.string().optional(),
  receiptNo: z.string().optional(),
  orderNo: z.string().optional(),
  biltyNo: z.string().optional(),
  date: z.string().optional(),
  consignmentNo: z.string().optional(),
  consignor: z.string().optional(),
  consignmentDate: z.string().optional(),
  consignee: z.string().optional(),
  receiverName: z.string().optional(),
  receiverContactNo: z.string().optional(),
  shippingLine: z.string().optional(),
  containerNo: z.string().optional(),
  port: z.string().optional(),
  destination: z.string().optional(),
  freightFrom: z.string().optional(),
  items: z.array(
    z.object({
      desc: z.string().optional(),
      qty: z.number().optional(),
      rate: z.number().optional(),
      qtyUnit: z.string().optional(),
      weight: z.number().optional(),
      weightUnit: z.string().optional(),
    })
  ),
  totalQty: z.number().optional(),
  freight: z.string().optional(),
  sbrTax: z.string().optional(),
  sprAmount: z.number().optional(),
  deliveryCharges: z.string().optional(),
  insuranceCharges: z.string().optional(),
  tollTax: z.string().optional(),
  otherCharges: z.string().optional(),
  totalAmount: z.number().optional(),
  receivedAmount: z.number().optional(),
  incomeTaxDed: z.number().optional(),
  incomeTaxAmount: z.number().optional(),
  deliveryDate: z.string().optional(),
  remarks: z.string().optional(),
  creditAllowed: z.string().optional(),
});

type ConsignmentFormData = z.infer<typeof consignmentSchema>;

const ConsignmentForm = ({ isEdit = false }: { isEdit?: boolean }) => {
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
    reset,
  } = useForm<ConsignmentFormData>({
    resolver: zodResolver(consignmentSchema),
    defaultValues: {
      consignmentMode: '',
      receiptNo: '',
      orderNo: '',
      biltyNo: '',
      date: '',
      consignmentNo: '',
      consignor: '',
      consignmentDate: new Date().toISOString().split('T')[0],
      consignee: '',
      receiverName: '',
      receiverContactNo: '',
      shippingLine: '',
      containerNo: '',
      port: '',
      destination: '',
      freightFrom: '',
      items: Array(3).fill({ desc: '', qty: 0, rate: 0, qtyUnit: '', weight: 0, weightUnit: '' }),
      totalQty: 0,
      freight: '',
      sbrTax: '',
      sprAmount: 0,
      deliveryCharges: '',
      insuranceCharges: '',
      tollTax: '',
      otherCharges: '',
      totalAmount: 0,
      receivedAmount: 0,
      incomeTaxDed: 0,
      incomeTaxAmount: 0,
      deliveryDate: '',
      remarks: '',
      creditAllowed: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [parties, setParties] = useState<DropdownOption[]>([]);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shippingLines, setShippingLines] = useState<DropdownOption[]>([]);
  const [units, setUnits] = useState<DropdownOption[]>([]);
  const [sbrTaxes, setSbrTaxes] = useState<DropdownOption[]>([]);
  const [consignmentModes, setConsignmentModes] = useState<DropdownOption[]>([]);
  const [receiptNoFocused, setReceiptNoFocused] = useState(false);
  const freightFromOptions: DropdownOption[] = [
    { id: 'Consignor', name: 'Consignor' },
    { id: 'Consignee', name: 'Consignee' },
  ];
  const items = watch('items');
  const freight = watch('freight');
  const sbrTax = watch('sbrTax');
  const deliveryCharges = watch('deliveryCharges');
  const insuranceCharges = watch('insuranceCharges');
  const tollTax = watch('tollTax');
  const otherCharges = watch('otherCharges');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partRes, bookRes, unitRes, taxRes, transporterRes] = await Promise.all([
          getAllPartys(1, 1000),
          getAllBookingOrder(),
          getAllUnitOfMeasures(1, 1000),
          getAllSaleTexes(1, 1000),
          getAllTransporter(),
        ]);
        setParties(partRes.data.map((p: any) => ({ id: p.id, name: p.name })));
        setBookingOrders(
          bookRes.data.map((b: any) => ({
            id: b.id,
            orderNo: b.orderNo,
            vehicleNo: b.vehicleNo || '',
            cargoWeight: b.cargoWeight || '',
            orderDate: b.orderDate || '',
            vendor: b.vendor || '',
          }))
        );
        setUnits([
          { id: 'Meter', name: 'Meter' },
          { id: 'Yard', name: 'Yard' },
          { id: 'Kg', name: 'Kg' },
          { id: 'Bags', name: 'Bags' },
          { id: 'Cartin', name: 'Cartin' },
        ]);
        setSbrTaxes(taxRes.data.map((t: any) => ({ id: t.id, name: t.taxName || t.name })));
        setShippingLines(transporterRes.data.map((t: any) => ({ id: t.id, name: t.name })));

        setConsignmentModes([
          { id: 'Road', name: 'Road Transport' },
          { id: 'Sea', name: 'Sea Transport' },
          { id: 'Air', name: 'Air Transport' },
          { id: 'Rail', name: 'Rail Transport' },
        ]);

        // If opened from Booking Order with orderNo, prefill it
        if (fromBooking) {
          const orderNoParam = searchParams.get('orderNo') || '';
          if (orderNoParam) setValue('orderNo', orderNoParam);
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching dropdown data:', error);
      }
    };
    fetchData();

    if (isEdit) {
      const fetchConsignment = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getSingleConsignment(id);
            const consignment = response.data || {};
            const keys: (keyof ConsignmentFormData)[] = [
              'consignmentMode',
              'receiptNo',
              'orderNo',
              'biltyNo',
              'date',
              'consignmentNo',
              'consignor',
              'consignmentDate',
              'consignee',
              'receiverName',
              'receiverContactNo',
              'shippingLine',
              'containerNo',
              'port',
              'destination',
              'freightFrom',
              'items',
              'totalQty',
              'freight',
              'sbrTax',
              'sprAmount',
              'deliveryCharges',
              'insuranceCharges',
              'tollTax',
              'otherCharges',
              'totalAmount',
              'receivedAmount',
              'incomeTaxDed',
              'incomeTaxAmount',
              'deliveryDate',
              'remarks',
              'creditAllowed',
            ];
            keys.forEach((key) => {
              if (consignment[key] !== undefined) {
                setValue(key as keyof ConsignmentFormData, consignment[key]);
              }
            });
          } catch (error) {
            toast.error('Failed to load consignment data');
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      };
      fetchConsignment();
    } else {
      // Do not auto-generate receiptNo on frontend; backend will assign it
      setValue('receiptNo', '');
    }
  }, [isEdit, setValue]);

  useEffect(() => {
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    setValue('totalQty', totalQty, { shouldValidate: true });

    let taxPercent = 0;
    if (sbrTax) {
      const match = sbrTax.match(/\d+(?:\.\d+)?/);
      if (match) {
        taxPercent = parseFloat(match[0]) / 100;
      }
    }
    const freightNum = parseFloat(String(freight ?? '0'));
    const spr = isNaN(freightNum) ? 0 : (sbrTax && taxPercent > 0 ? freightNum * taxPercent : freightNum);
    setValue('sprAmount', spr, { shouldValidate: true });

    const total = (
      parseFloat(String(deliveryCharges ?? '0')) +
      parseFloat(String(insuranceCharges ?? '0')) +
      parseFloat(String(tollTax ?? '0')) +
      parseFloat(String(otherCharges ?? '0'))
    );
    setValue('totalAmount', isNaN(total) ? 0 : total, { shouldValidate: true });

    setValue('receivedAmount', 0, { shouldValidate: true });
    setValue('incomeTaxDed', 0, { shouldValidate: true });
    setValue('incomeTaxAmount', 0, { shouldValidate: true });
  }, [items, freight, sbrTax, deliveryCharges, insuranceCharges, tollTax, otherCharges, setValue]);

  const selectOrder = (order: BookingOrder) => {
    setValue('orderNo', order.orderNo, { shouldValidate: true });
    setShowOrderPopup(false);
  };

  const getSelectedOrderDetails = () => {
    const orderNo = watch('orderNo');
    if (!orderNo) return null;
    return bookingOrders.find(order => order.orderNo === orderNo);
  };

  const [submitMode, setSubmitMode] = useState<'back' | 'addAnother' | 'list'>('back');

  const onSubmit = async (data: ConsignmentFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        orderNo: data.orderNo || orderNoParam || '',
        items: data.items,
      };
      if (isEdit) {
        const newid = window.location.pathname.split('/').pop();
        await updateConsignment({ ...payload, id: newid });
        toast.success('Consignment updated successfully!');
      } else {
        await createConsignment(payload);
        toast.success('Consignment created successfully!');
      }

      if (fromBooking) {
        if (!orderNoParam) {
          toast.error('No order number provided for redirection');
          router.push('/bookingorder/create');
          return;
        }

        if (submitMode === 'addAnother') {
          // Reset and stay on this page to add another consignment for same order
          reset({
            ...consignmentSchema.parse({}),
            receiptNo: '',
            orderNo: orderNoParam,
            consignmentDate: new Date().toISOString().split('T')[0],
            items: Array(3).fill({ desc: '', qty: 0, rate: 0, qtyUnit: '', weight: 0, weightUnit: '' }),
          });
          return;
        }

        // Default: go back to booking order page
        setTimeout(() => {
          router.push(`/bookingorder/create?orderNo=${encodeURIComponent(orderNoParam)}`);
        }, 600);
      } else {
        // Non-booking flow
        if (submitMode === 'list') {
          router.push('/consignment');
        }
      }
    } catch (error) {
      toast.error('An error occurred while saving the consignment');
      console.error('Error saving consignment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFieldDisabled = () => {
    return false; // All fields are editable
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-2 md:p-4">
      <div className="w-full">
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Loading consignment data...</span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdLocalShipping className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Consignment' : 'Add New Consignment'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update consignment information' : 'Create a new consignment record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/consignment">
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
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="col-span-1">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  <Controller
                    name="receiptNo"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <ABLNewCustomInput
                          {...field}
                          label="Receipt No"
                          type="text"
                          placeholder="Auto Generated"
                          register={register}
                          error={errors.receiptNo?.message}
                          id="receiptNo"
                          disabled
                          onFocus={() => setReceiptNoFocused(true)}
                          onBlur={() => setReceiptNoFocused(false)}
                        />
                        {receiptNoFocused && (
                          <div className="absolute -top-8 left-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-lg z-10">
                            Auto-generated
                          </div>
                        )}
                      </div>
                    )}
                  />
                  <div className="gap-2 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
                    <ABLNewCustomInput
                      label="Bilty No"
                      type="text"
                      placeholder="Enter bilty number"
                      register={register}
                      error={errors.biltyNo?.message}
                      id="biltyNo"
                    />
                    <ABLNewCustomInput
                      label="Date"
                      type="date"
                      placeholder="Select date"
                      register={register}
                      error={errors.date?.message}
                      id="date"
                    />
                    <Controller
                      name="consignor"
                      control={control}
                      render={({ field }) => (
                        <AblNewCustomDrpdown
                          label="Consignor"
                          options={parties}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('consignor', value, { shouldValidate: true })}
                          error={errors.consignor?.message}
                        />
                      )}
                    />
                    <Controller
                      name="consignee"
                      control={control}
                      render={({ field }) => (
                        <AblNewCustomDrpdown
                          label="Consignee"
                          options={parties}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('consignee', value, { shouldValidate: true })}
                          error={errors.consignee?.message}
                        />
                      )}
                    />
                    <Controller
                      name="freightFrom"
                      control={control}
                      render={({ field }) => (
                        <AblNewCustomDrpdown
                          label="Freight From"
                          options={freightFromOptions}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('freightFrom', value, { shouldValidate: true })}
                          error={errors.freightFrom?.message}
                        />
                      )}
                    />
                    <ABLNewCustomInput
                      label="Credit Allowed"
                      type="text"
                      placeholder="Enter credit amount"
                      register={register}
                      error={errors.creditAllowed?.message}
                      id="creditAllowed"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-1 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  <div>
                    <Button
                      type="button"
                      onClick={() => setShowOrderPopup(true)}
                      className="mb-3 w-full bg-[#3a614c] hover:bg-[#3a614c]/90 text-white"
                    >
                      Select Order No
                    </Button>
                    <ABLNewCustomInput
                      label="Order No"
                      type="text"
                      placeholder="Select from orders"
                      register={register}
                      error={errors.orderNo?.message}
                      id="orderNo"
                      disabled
                    />
                    {getSelectedOrderDetails() && (
                      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Selected Order Details</h4>
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                          <tbody>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">Order No</td>
                              <td className="py-2 px-3">{getSelectedOrderDetails()?.orderNo}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">Vehicle No</td>
                              <td className="py-2 px-3">{getSelectedOrderDetails()?.vehicleNo}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">Cargo Weight</td>
                              <td className="py-2 px-3">{getSelectedOrderDetails()?.cargoWeight}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">Order Date</td>
                              <td className="py-2 px-3">{getSelectedOrderDetails()?.orderDate}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">Vendor</td>
                              <td className="py-2 px-3">{getSelectedOrderDetails()?.vendor}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <ABLNewCustomInput
                    label="Con.No"
                    type="text"
                    placeholder="Enter consignment number"
                    register={register}
                    error={errors.consignmentNo?.message}
                    id="consignmentNo"
                  />
                  <ABLNewCustomInput
                    label="Cons.Date"
                    type="date"
                    placeholder="Select consignment date"
                    register={register}
                    error={errors.consignmentDate?.message}
                    id="consignmentDate"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="col-span-1">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  <ABLNewCustomInput
                    label="Receive.N"
                    type="text"
                    placeholder="Enter receiver name"
                    register={register}
                    error={errors.receiverName?.message}
                    id="receiverName"
                  />
                  <ABLNewCustomInput
                    label="Container No"
                    type="text"
                    placeholder="Enter container number"
                    register={register}
                    error={errors.containerNo?.message}
                    id="containerNo"
                  />
                </div>
              </div>

              <div className="col-span-1 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  <ABLNewCustomInput
                    label="Receiver C.No"
                    type="text"
                    placeholder="Enter contact number"
                    register={register}
                    error={errors.receiverContactNo?.message}
                    id="receiverContactNo"
                  />
                  <Controller
                    name="consignmentMode"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label="Cons.Mode"
                        options={consignmentModes}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('consignmentMode', value, { shouldValidate: true })}
                        error={errors.consignmentMode?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Controller
                name="shippingLine"
                control={control}
                render={({ field }) => (
                  <AblNewCustomDrpdown
                    label="Shipping Line"
                    options={shippingLines}
                    selectedOption={field.value || ''}
                    onChange={(value) => setValue('shippingLine', value, { shouldValidate: true })}
                    error={errors.shippingLine?.message}
                  />
                )}
              />
              <ABLNewCustomInput
                label="Port"
                type="text"
                placeholder="Enter port"
                register={register}
                error={errors.port?.message}
                id="port"
              />
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <AblNewCustomDrpdown
                    label="Destination"
                    options={parties}
                    selectedOption={field.value || ''}
                    onChange={(value) => setValue('destination', value, { shouldValidate: true })}
                    error={errors.destination?.message}
                  />
                )}
              />
            </div>

            <div className="col-span-1 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex gap-2 ml-10 p-3">
                <MdInfo className="text-[#3a614c] text-xl" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Items Details</h3>
              </div>

              <div className="p-3">
                <div className="overflow-x-auto">
                  <table className="w-full md:w-4/5 sm:w-3/4 text-sm mx-auto">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide border-r border-gray-300 dark:border-gray-600">
                          #
                        </th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide border-r border-gray-300 dark:border-gray-600">
                          Item Description
                        </th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide border-r border-gray-300 dark:border-gray-600">
                          Qty
                        </th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide border-r border-gray-300 dark:border-gray-600">
                          Rate
                        </th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide border-r border-gray-300 dark:border-gray-600">
                          Unit
                        </th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide border-r border-gray-300 dark:border-gray-600">
                          Weight
                        </th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">
                          W.Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {items.map((_, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-center w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                            <input
                              {...register(`items.${index}.desc`)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                              placeholder="Item description"
                            />
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                            <input
                              {...register(`items.${index}.qty`, { valueAsNumber: true })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all text-center"
                              placeholder="0"
                              min="0"
                            />
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                            <input
                              step="0.01"
                              {...register(`items.${index}.rate`, { valueAsNumber: true })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all text-center"
                              placeholder="0.00"
                              min="0"
                            />
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                            <Controller
                              name={`items.${index}.qtyUnit`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                >
                                  <option value="">Unit</option>
                                  {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                      {unit.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                            <input
                              step="0.01"
                              {...register(`items.${index}.weight`, { valueAsNumber: true })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all text-center"
                              placeholder="0.0"
                              min="0"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Controller
                              name={`items.${index}.weightUnit`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                >
                                  <option value="">Unit</option>
                                  {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                      {unit.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full"></div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300"></span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Qty:</label>
                        <input
                          {...register('totalQty')}
                          disabled
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-gray-100 dark:bg-gray-700 text-center font-semibold"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ABLNewCustomInput
                  label="Freight"
                  type="text"
                  placeholder="Enter freight"
                  register={register}
                  error={errors.freight?.message}
                  id="freight"
                />
                <Controller
                  name="sbrTax"
                  control={control}
                  render={({ field }) => (
                    <AblNewCustomDrpdown
                      label="SBR Tax"
                      options={sbrTaxes}
                      selectedOption={field.value || ''}
                      onChange={(value) => setValue('sbrTax', value, { shouldValidate: true })}
                      error={errors.sbrTax?.message}
                    />
                  )}
                />
                <ABLNewCustomInput
                  label="SPR Amount"
                  type="text"
                  placeholder="Auto-calculated"
                  register={register}
                  error={errors.sprAmount?.message}
                  id="sprAmount"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="col-span-1">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  <ABLNewCustomInput
                    label="Delivery.C"
                    type="text"
                    placeholder="Enter delivery charges"
                    register={register}
                    error={errors.deliveryCharges?.message}
                    id="deliveryCharges"
                  />
                  <ABLNewCustomInput
                    label="Toll Tax"
                    type="text"
                    placeholder="Enter toll tax"
                    register={register}
                    error={errors.tollTax?.message}
                    id="tollTax"
                  />
                  <ABLNewCustomInput
                    label="Total Amount"
                    type="text"
                    placeholder="Auto-calculated"
                    register={register}
                    error={errors.totalAmount?.message}
                    id="totalAmount"
                    disabled
                  />
                </div>
              </div>

              <div className="col-span-1 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  <ABLNewCustomInput
                    label="Insurance.C"
                    type="text"
                    placeholder="Enter insurance charges"
                    register={register}
                    error={errors.insuranceCharges?.message}
                    id="insuranceCharges"
                  />
                  <ABLNewCustomInput
                    label="Other Charges"
                    type="text"
                    placeholder="Enter other charges"
                    register={register}
                    error={errors.otherCharges?.message}
                    id="otherCharges"
                  />
                  <ABLNewCustomInput
                    label="Delivery Date"
                    type="date"
                    placeholder="Select delivery date"
                    register={register}
                    error={errors.deliveryDate?.message}
                    id="deliveryDate"
                  />
                </div>
              </div>
            </div>

            <div className="gap-2 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
              <ABLNewCustomInput
                label="Remarks"
                type="text"
                placeholder="Enter remarks"
                register={register}
                error={errors.remarks?.message}
                id="remarks"
              />
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ABLCustomInput
                  label="Received Amount"
                  type="text"
                  placeholder="Auto-calculated"
                  register={register}
                  error={errors.receivedAmount?.message}
                  id="receivedAmount"
                  disabled
                />
                <ABLCustomInput
                  label="Income Tax Ded."
                  type="text"
                  placeholder="Auto-calculated"
                  register={register}
                  error={errors.incomeTaxDed?.message}
                  id="incomeTaxDed"
                  disabled
                />
                <ABLCustomInput
                  label="Income Tax Amount"
                  type="text"
                  placeholder="Auto-calculated"
                  register={register}
                  error={errors.incomeTaxAmount?.message}
                  id="incomeTaxAmount"
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700 mt-8">
              {fromBooking ? (
                <>
                  <Button
                    type="submit"
                    onClick={() => setSubmitMode('back')}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#3a614c]/30 font-medium text-sm"
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
                          <span>Save & Back</span>
                        </>
                      )}
                    </div>
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => setSubmitMode('addAnother')}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#3a614c]/30 font-medium text-sm"
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
                          <span>Save & Add Another</span>
                        </>
                      )}
                    </div>
                  </Button>
                </>
              ) : (
                <Button
                  type="submit"
                  onClick={() => setSubmitMode('list')}
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
                        <span>{isEdit ? 'Update Consignment' : 'Create Consignment'}</span>
                      </>
                    )}
                  </div>
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MdInfo className="text-[#3a614c]" />
              <span className="text-sm">Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link
              href="/bookingorder/create"
              className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors"
            >
              Back to Booking Order
            </Link>
          </div>
        </div>

        {showOrderPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Select Booking Order</h3>
                <Button
                  onClick={() => setShowOrderPopup(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-xl" />
                </Button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by Order No, Vehicle No, or Vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3a614c] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="overflow-y-auto max-h-96 border border-gray-200 dark:border-gray-600 rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-600">Order No</th>
                      <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-600">Vehicle No</th>
                      <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-600">Cargo Weight</th>
                      <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-600">Order Date</th>
                      <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-600">Vendor</th>
                      <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingOrders
                      .filter((order) =>
                        order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.vendor.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((order) => (
                        <tr
                          key={order.id}
                          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {order.orderNo}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {order.vehicleNo}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {order.cargoWeight}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {order.orderDate}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {order.vendor}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              onClick={() => selectOrder(order)}
                              className="bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs px-3 py-1"
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowOrderPopup(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
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

export default ConsignmentForm;