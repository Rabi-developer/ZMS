'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLNewCustomInput from '@/components/ui/ABLNewCustomInput';
import AblNewCustomDrpdown from '@/components/ui/AblNewCustomDrpdown';
import { createBookingOrder, updateBookingOrder, getAllBookingOrder } from '@/apis/bookingorder';
import { getAllTransporter } from '@/apis/transporter';
import { getAllVendor } from '@/apis/vendors';
import { getAllMunshyana } from '@/apis/munshyana';
import { getAllConsignment } from '@/apis/consignment';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdLocalShipping, MdInfo, MdLocationOn, MdPhone } from 'react-icons/md';
import { FaRegBuilding, FaIdCard } from 'react-icons/fa';
import { HiDocumentText } from 'react-icons/hi';
import Link from 'next/link';
import { FiSave, FiX, FiUser } from 'react-icons/fi';

// Extend ABLNewCustomInputProps to include onFocus and onBlur
interface ABLNewCustomInputProps {
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

interface Consignment {
  id?: string; // Add id field for consignments
  biltyNo: string;
  receiptNo: string;
  consignor: string;
  consignee: string;
  item: string;
  qty: number | null | undefined; // Allow null/undefined
  totalAmount: number | null | undefined; // Allow null/undefined
  recvAmount: number | null | undefined; // Allow null/undefined
  delDate: string;
  status: string;
}

// Define the schema for booking order form validation
const bookingOrderSchema = z.object({
  id: z.string().optional(),
  OrderNo: z.string().optional(),
  orderDate: z.string().optional().nullable(),
  transporter: z.string().min(1, 'Transporter is required').nullable(),
  vendor: z.string().optional().nullable(),
  vehicleNo:z.string().min(1, 'Vehicle NO is required').nullable(),
  containerNo: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
  contactNo: z.string().optional().nullable(),
  munshayana: z.string().optional().nullable(),
  cargoWeight: z.string().optional().nullable(),
  bookedDays: z.string().optional().nullable(),
  detentionDays: z.string().optional().nullable(),
  fromLocation: z.string().min(1, 'From Location is required').nullable(),
  departureDate: z.string().optional().nullable(),
  via1: z.string().optional().nullable(),
  via2: z.string().optional().nullable(),
  toLocation: z.string().optional().nullable(),
  expectedReachedDate: z.string().optional().nullable(),
  reachedDate: z.string().optional().nullable(),
  vehicleMunshyana: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  contractOwner: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  creationDate: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
  updationDate: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  selectedConsignments: z.array(z.string()).optional().nullable(),
});

type BookingOrderFormData = z.infer<typeof bookingOrderSchema>;

interface BookingOrderFormProps {
  isEdit?: boolean;
  initialData?: any; // shape from backend
}

const BookingOrderForm = ({ isEdit = false, initialData }: BookingOrderFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNoParam = searchParams.get('orderNo') || '';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<BookingOrderFormData>({
    resolver: zodResolver(bookingOrderSchema),
    defaultValues: {
      id: '',
      OrderNo: '',
      orderDate: '',
      transporter: '',
      vendor: '',
      vehicleNo: '',
      containerNo: '',
      vehicleType: '',
      driverName: '',
      contactNo: '',
      cargoWeight: '',
      bookedDays: '',
      detentionDays: '',
      fromLocation: '',
      departureDate: '',
      via1: '',
      via2: '',
      toLocation: '',
      expectedReachedDate: '',
      reachedDate: '',
      vehicleMunshyana: '',
      remarks: '',
      contractOwner: '',
      createdBy: '',
      creationDate: '',
      updatedBy: '',
      updationDate: '',
      status: '',
      selectedConsignments: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Keep internal id separate from display OrderNo (which may be auto generated or different)
  const [bookingId, setBookingId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [transporters, setTransporters] = useState<DropdownOption[]>([]);
  const [vendors, setVendors] = useState<DropdownOption[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<DropdownOption[]>([]);
  const [munshayanas, setMunshayanas] = useState<DropdownOption[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [selectedConsignments, setSelectedConsignments] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedConsignments, setTempSelectedConsignments] = useState<string[]>([]);
  const [locations, setLocations] = useState<DropdownOption[]>([]);
  const [idFocused, setIdFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Backward compatibility: map legacy numeric values to human-readable text
  const vehicleTypeMap: Record<string, string> = {
    '1': 'Truck',
    '2': 'Van',
    '3': 'Container',
    '4': 'Trailer',
    '5': 'Pickup',
  };
  const locationMap: Record<string, string> = {
    '1': 'Karachi',
    '2': 'Lahore',
    '3': 'Faisalabad',
    '4': 'Rawalpindi',
    '5': 'Multan',
    '6': 'Hyderabad',
    '7': 'Quetta',
    '8': 'Peshawar',
    '9': 'Islamabad',
    '10': 'Sialkot',
    '11': 'Gujranwala',
    '12': 'Sargodha',
  };
  const mapVehicleTypeIdToName = (v?: string) => (v && vehicleTypeMap[v] ? vehicleTypeMap[v] : v || '');
  const mapLocationIdToName = (v?: string) => (v && locationMap[v] ? locationMap[v] : v || '');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [transRes, vendRes, munRes, consRes] = await Promise.all([
          getAllTransporter(),
          getAllVendor(),
          getAllMunshyana(),
          getAllConsignment(1, 100, {}),
        ]);

        const transportersData = transRes.data.map((t: any) => ({ id: t.id, name: t.name })) || [];
        const vendorsData = vendRes.data.map((v: any) => ({ id: v.id, name: v.name })) || [];
        const munshayanasData = munRes.data.map((m: any) => ({ id: m.id, name: m.chargesDesc })) || [];
        const consignmentsData = consRes.data || [];
        const uniqueGeneral = Array.from(new Map(consignmentsData.map((c: any) => [c.biltyNo, c])).values()) as Consignment[];

        const vehicleTypesData = [
          { id: 'Truck', name: 'Truck' },
          { id: 'Van', name: 'Van' },
          { id: 'Container', name: 'Container' },
          { id: 'Trailer', name: 'Trailer' },
          { id: 'Pickup', name: 'Pickup' },
        ];

        const locationsData = [
          { id: 'Karachi', name: 'Karachi' },
          { id: 'Lahore', name: 'Lahore' },
          { id: 'Faisalabad', name: 'Faisalabad' },
          { id: 'Rawalpindi', name: 'Rawalpindi' },
          { id: 'Multan', name: 'Multan' },
          { id: 'Hyderabad', name: 'Hyderabad' },
          { id: 'Quetta', name: 'Quetta' },
          { id: 'Peshawar', name: 'Peshawar' },
          { id: 'Islamabad', name: 'Islamabad' },
          { id: 'Sialkot', name: 'Sialkot' },
          { id: 'Gujranwala', name: 'Gujranwala' },
          { id: 'Sargodha', name: 'Sargodha' },
        ];

        setTransporters(transportersData);
        setVendors(vendorsData);
        setVehicleTypes(vehicleTypesData);
        setMunshayanas(munshayanasData);
        setLocations(locationsData);
        setConsignments(uniqueGeneral);

        // If initialData provided (edit page), hydrate directly without re-searching all booking orders list
        if (isEdit && initialData) {
          // Handle both direct data and wrapped data structure
          const booking = initialData.data ? initialData.data : initialData;
          setBookingId(booking.id || '');
          setValue('id', booking.id || '');
          setValue('OrderNo', booking.orderNo || booking.id || '');
          setValue('orderDate', booking.orderDate || '');
          setValue('transporter', booking.transporter || '');
          setValue('vendor', booking.vendor || '');
          setValue('vehicleNo', booking.vehicleNo || '');
          setValue('containerNo', booking.containerNo || '');
          setValue('vehicleType', mapVehicleTypeIdToName(booking.vehicleType) || booking.vehicleType || '');
          setValue('driverName', booking.driverName || '');
          setValue('contactNo', booking.contactNo || '');
          setValue('munshayana', booking.munshayana || '');
          setValue('cargoWeight', booking.cargoWeight || '');
          setValue('bookedDays', booking.bookedDays || '');
          setValue('detentionDays', booking.detentionDays || '');
          setValue('fromLocation', mapLocationIdToName(booking.fromLocation) || booking.fromLocation || '');
          setValue('departureDate', booking.departureDate || '');
          setValue('via1', mapLocationIdToName(booking.via1) || booking.via1 || '');
          setValue('via2', mapLocationIdToName(booking.via2) || booking.via2 || '');
          setValue('toLocation', mapLocationIdToName(booking.toLocation) || booking.toLocation || '');
          setValue('expectedReachedDate', booking.expectedReachedDate || '');
          setValue('reachedDate', booking.reachedDate || '');
          setValue('vehicleMunshyana', booking.vehicleMunshyana || '');
          setValue('remarks', booking.remarks || '');
          setValue('contractOwner', booking.contractOwner || '');
          setValue('status', booking.status || '');
          
          // Handle consignments from the booking data
          if (booking.consignments && Array.isArray(booking.consignments)) {
            const bookingConsignments = booking.consignments as Consignment[];
            const allConsignments = [...uniqueGeneral, ...bookingConsignments];
            const uniqueConsignments = Array.from(new Map(allConsignments.map((c: any) => [c.biltyNo, c])).values()) as Consignment[];
            setConsignments(uniqueConsignments);
            const selectedBiltyNos = bookingConsignments.map((c: any) => c.biltyNo);
            setSelectedConsignments(selectedBiltyNos);
            setValue('selectedConsignments', selectedBiltyNos);
            setTempSelectedConsignments(selectedBiltyNos);
          } else {
            // fetch consignments belonging to this order if not included in response
            try {
              const consForBooking = await getAllConsignment(1, 100, { orderNo: booking.orderNo || booking.id });
              const bookingConsignments = consForBooking.data || [];
              const allConsignments = [...uniqueGeneral, ...bookingConsignments];
              const uniqueConsignments = Array.from(new Map(allConsignments.map((c: any) => [c.biltyNo, c])).values()) as Consignment[];
              setConsignments(uniqueConsignments);
              const selectedBiltyNos = bookingConsignments.map((c: any) => c.biltyNo);
              setSelectedConsignments(selectedBiltyNos);
              setValue('selectedConsignments', selectedBiltyNos);
              setTempSelectedConsignments(selectedBiltyNos);
            } catch (e) {
              console.warn('Failed to fetch consignments for booking', e);
            }
          }
        } else if (isEdit) {
          const id = window.location.pathname.split('/').pop();
          if (id) {
            try {
              const response = await getAllBookingOrder();
              const booking = response.data.find((b: any) => b.id === id);
              if (booking) {
                setBookingId(booking.id || '');
                setValue('id', booking.id || '');
                setValue('OrderNo', booking.orderNo || booking.id || '');
                setValue('orderDate', booking.orderDate || '');
                setValue('transporter', booking.transporter || '');
                setValue('vendor', booking.vendor || '');
                setValue('vehicleNo', booking.vehicleNo || '');
                setValue('containerNo', booking.containerNo || '');
                setValue('vehicleType', mapVehicleTypeIdToName(booking.vehicleType) || booking.vehicleType || '');
                setValue('driverName', booking.driverName || '');
                setValue('contactNo', booking.contactNo || '');
                setValue('munshayana', booking.munshayana || '');
                setValue('cargoWeight', booking.cargoWeight || '');
                setValue('bookedDays', booking.bookedDays || '');
                setValue('detentionDays', booking.detentionDays || '');
                setValue('fromLocation', mapLocationIdToName(booking.fromLocation) || booking.fromLocation || '');
                setValue('departureDate', booking.departureDate || '');
                setValue('via1', mapLocationIdToName(booking.via1) || booking.via1 || '');
                setValue('via2', mapLocationIdToName(booking.via2) || booking.via2 || '');
                setValue('toLocation', mapLocationIdToName(booking.toLocation) || booking.toLocation || '');
                setValue('expectedReachedDate', booking.expectedReachedDate || '');
                setValue('reachedDate', booking.reachedDate || '');
                setValue('vehicleMunshyana', booking.vehicleMunshyana || '');
                setValue('remarks', booking.remarks || '');
                setValue('contractOwner', booking.contractOwner || '');
                setValue('status', booking.status || '');

                const consRes = await getAllConsignment(1, 100, { orderNo: booking.orderNo || id });
                const bookingConsignments = consRes.data || [];
                const allConsignments = [...uniqueGeneral, ...bookingConsignments];
                const uniqueConsignments = Array.from(new Map(allConsignments.map((c: any) => [c.biltyNo, c])).values()) as Consignment[];
                setConsignments(uniqueConsignments);
                const selectedBiltyNos = bookingConsignments.map((c: Consignment) => c.biltyNo);
                setSelectedConsignments(selectedBiltyNos);
                setValue('selectedConsignments', selectedBiltyNos);
                setTempSelectedConsignments(selectedBiltyNos);
              } else {
                toast.error('Booking Order not found');
                router.push('/bookingorder');
              }
            } catch (error) {
              toast.error('Failed to load booking order data');
              console.error('Error fetching booking order:', error);
            }
          }
        } else if (orderNoParam) {
          try {
            const response = await getAllBookingOrder();
            const booking = response.data.find((b: any) => (b.orderNo || b.id) === orderNoParam || b.id === orderNoParam);
            if (booking) {
              setBookingId(booking.id || '');
              setValue('id', booking.id || '');
              setValue('OrderNo', booking.orderNo || booking.id || '');
              setValue('orderDate', booking.orderDate || '');
              setValue('transporter', booking.transporter || '');
              setValue('vendor', booking.vendor || '');
              setValue('vehicleNo', booking.vehicleNo || '');
              setValue('containerNo', booking.containerNo || '');
              setValue('vehicleType', mapVehicleTypeIdToName(booking.vehicleType) || booking.vehicleType || '');
              setValue('driverName', booking.driverName || '');
              setValue('contactNo', booking.contactNo || '');
              setValue('munshayana', booking.munshayana || '');
              setValue('cargoWeight', booking.cargoWeight || '');
              setValue('bookedDays', booking.bookedDays || '');
              setValue('detentionDays', booking.detentionDays || '');
              setValue('fromLocation', mapLocationIdToName(booking.fromLocation) || booking.fromLocation || '');
              setValue('departureDate', booking.departureDate || '');
              setValue('via1', mapLocationIdToName(booking.via1) || booking.via1 || '');
              setValue('via2', mapLocationIdToName(booking.via2) || booking.via2 || '');
              setValue('toLocation', mapLocationIdToName(booking.toLocation) || booking.toLocation || '');
              setValue('expectedReachedDate', booking.expectedReachedDate || '');
              setValue('reachedDate', booking.reachedDate || '');
              setValue('vehicleMunshyana', booking.vehicleMunshyana || '');
              setValue('remarks', booking.remarks || '');
              setValue('contractOwner', booking.contractOwner || '');
              setValue('status', booking.status || '');

              const consRes2 = await getAllConsignment(1, 100, { orderNo: booking.orderNo || orderNoParam });
              const bookingConsignments2 = consRes2.data || [];
              const allConsignments = [...uniqueGeneral, ...bookingConsignments2];
              const uniqueConsignments = Array.from(new Map(allConsignments.map((c: any) => [c.biltyNo, c])).values());
              setConsignments(uniqueConsignments);
              const selectedBiltyNos2 = bookingConsignments2.map((c: Consignment) => c.biltyNo);
              setSelectedConsignments(selectedBiltyNos2);
              setValue('selectedConsignments', selectedBiltyNos2);
              setTempSelectedConsignments(selectedBiltyNos2);
            }
          } catch (error) {
            console.error('Error preloading booking order by orderNo:', error);
          }
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isEdit, setValue, router, initialData]);

  const handleConsignmentSelection = (biltyNo: string, checked: boolean) => {
    setTempSelectedConsignments((prev) => {
      if (checked) {
        return [...new Set([...prev, biltyNo])]; // Ensure no duplicates in selection
      } else {
        return prev.filter((id) => id !== biltyNo);
      }
    });
  };

  const handleSaveConsignments = () => {
    setSelectedConsignments(tempSelectedConsignments);
    setValue('selectedConsignments', tempSelectedConsignments, { shouldValidate: true });
    setIsModalOpen(false);
  };

  // Build payload and save booking order without redirect
  const saveBookingOnly = async (data: BookingOrderFormData) => {
    // Map selectedConsignments (biltyNo array) to consignment objects with proper structure
    const bookingOrderId = isEdit ? (bookingId || data.id || "3fa85f64-5717-4562-b3fc-2c963f66afa6") : undefined;
    const consignmentObjects = consignments
      .filter(cons => selectedConsignments.includes(cons.biltyNo))
      .map(cons => {
        const base = {
          biltyNo: cons.biltyNo || "string",
          receiptNo: cons.receiptNo || "string",
          consignor: cons.consignor || "string",
          consignee: cons.consignee || "string",
          item: cons.item || "string",
          qty: cons.qty || 0,
          totalAmount: cons.totalAmount || 0,
          recvAmount: cons.recvAmount || 0,
          delDate: cons.delDate || "string",
          status: cons.status || "string"
        };
        // Only send IDs when updating
        if (isEdit) {
          return {
            ...base,
            id: cons.id || "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            bookingOrderId: bookingOrderId,
          };
        }
        return base;
      });

    // Create the payload matching the API schema
    const payload = {
      // Only send booking order ID when updating
      ...(isEdit ? { id: bookingOrderId } : {}),
      orderNo: data.OrderNo || "string",
      orderDate: data.orderDate || "string",
      transporter: data.transporter || "string",
      vendor: data.vendor || "string",
      vehicleNo: data.vehicleNo || "string",
      containerNo: data.containerNo || "string",
      vehicleType: data.vehicleType || "string",
      driverName: data.driverName || "string",
      contactNo: data.contactNo || "string",
      munshayana: data.munshayana || "string",
      cargoWeight: data.cargoWeight || "string",
      bookedDays: data.bookedDays || "string",
      detentionDays: data.detentionDays || "string",
      fromLocation: data.fromLocation || "string",
      departureDate: data.departureDate || "string",
      via1: data.via1 || "string",
      via2: data.via2 || "string",
      toLocation: data.toLocation || "string",
      expectedReachedDate: data.expectedReachedDate || "string",
      reachedDate: data.reachedDate || "string",
      vehicleMunshyana: data.vehicleMunshyana || "string",
      remarks: data.remarks || "string",
      contractOwner: data.contractOwner || "string",
      status: data.status || "string",
      consignments: consignmentObjects,
    };

    if (isEdit) {
      const idToUse = bookingId || data.id || '';
      if (!idToUse) {
        toast.error('Cannot update: missing booking id');
        throw new Error('Missing booking id');
      }
      console.log('[BookingOrderForm] Submitting update', { idToUse, payload });
      await updateBookingOrder(idToUse, payload);
      console.log('[BookingOrderForm] Update success');
      toast.success('Booking Order updated successfully!');
      return { id: idToUse, orderNo: data.OrderNo };
    } else {
      console.log('[BookingOrderForm] Submitting create', payload);
      await createBookingOrder(payload);
      console.log('[BookingOrderForm] Create success');
      toast.success('Booking Order created successfully!');
      return { id: payload.id, orderNo: data.OrderNo };
    }
  };

  const onSubmit = async (data: BookingOrderFormData) => {
    setIsSubmitting(true);
    try {
      const saved = await saveBookingOnly(data);
      // Always set the latest order number after save
      if (saved?.orderNo) {
        setValue('OrderNo', saved.orderNo);
      }
      router.push('/bookingorder');
    } catch (error) {
      toast.error('An error occurred while saving the booking order');
      console.error('Error saving booking order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = (biltyNo: string, newStatus: string) => {
    setConsignments((prev) =>
      prev.map((c) => (c.biltyNo === biltyNo ? { ...c, status: newStatus } : c))
    );
  };

  // Filter consignments based on search term with null checks
  const filteredConsignments = consignments.filter((cons) =>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="h-full w-full flex flex-col">
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Loading booking order data...</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdLocalShipping className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Booking Order' : 'Add New Booking Order'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update booking order information' : 'Create a new booking order record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/bookingorder">
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

          {/* Tabs removed to show all sections on a single page */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-8 bg-gray-50 dark:bg-gray-850 py-3">
            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <FiUser className="text-[#3a614c]" />
              <span>All Details</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {/* Show all sections on one page, compact layout */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="col-span-1 ">
               
                <div className=" grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                 {/* 1 */}
                  <Controller
                    name="OrderNo"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <ABLNewCustomInput
                          {...field}
                          label="Order No"
                          type="text"
                          placeholder="Auto"
                          register={register}
                          error={errors.OrderNo?.message}
                          id="orderNo"
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
                    )}
                  />

                  <Controller
                    name="transporter"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label="Transporter"
                        options={transporters}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('transporter', value, { shouldValidate: true })}
                        error={errors.transporter?.message}
                      />
                    )}
                  />
                  
                  <ABLNewCustomInput
                    label="Vehicle No"
                    type="text"
                    placeholder="Enter vehicle no"
                    register={register}
                    error={errors.vehicleNo?.message}
                    id="vehicleNo"
                  />
                   <ABLNewCustomInput
                    label="Driver Name"
                    type="text"
                    placeholder="Enter driver name"
                    register={register}
                    error={errors.driverName?.message}
                    id="driverName"
                  />

                    

                </div>
              </div>
                  
            


              <div className="col-span-1 shadow-sm">
               
                <div className="  grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  
                 {/* 2 */}
                 <ABLNewCustomInput
                    label="Order Date"
                    type="date"
                    placeholder="Enter order date"
                    register={register}
                    error={errors.orderDate?.message}
                    id="orderDate"
                  />

                  <Controller
                    name="vendor"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label="Vendor"
                        options={vendors}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('vendor', value, { shouldValidate: true })}
                        error={errors.vendor?.message}
                      />
                    )}
                  />
                     <Controller
                    name="vehicleType"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label="Vehicle Type"
                        options={vehicleTypes}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('vehicleType', value, { shouldValidate: true })}
                        error={errors.vehicleType?.message}
                      />
                    )}
                  />

                    <ABLNewCustomInput
                    label="Container No"
                    type="text"
                    placeholder="Enter container no"
                    register={register}
                    error={errors.containerNo?.message}
                    id="containerNo"
                  />
                   
                </div>
              </div>
              
            </div>
 
            <div className="col-span-1  dark:border-gray-700 ">
                
                <div className=" gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                   <ABLNewCustomInput
                    label="Cargo Weight"
                    type="text"
                    placeholder="Enter cargo weight"
                    register={register}
                    error={errors.cargoWeight?.message}
                    id="cargoWeight"
                  />
                  <ABLNewCustomInput
                    label="Booked Days"
                    type="text"
                    placeholder="Enter booked days"
                    register={register}
                    error={errors.bookedDays?.message}
                    id="bookedDays"
                  />
                  <ABLNewCustomInput
                    label="Detention Days"
                    type="text"
                    placeholder="Enter detention days"
                    register={register}
                    error={errors.detentionDays?.message}
                    id="detentionDays"
                  />
                 
                </div>
              </div>
                          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="col-span-1 ">
                
                <div className=" grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                 {/* 1 */}
                 <Controller
                    name="fromLocation"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label="From Location"
                        options={locations}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('fromLocation', value, { shouldValidate: true })}
                        error={errors.fromLocation?.message}
                      />
                    )}
                  />
                   
                   <Controller
                    name="via1"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label=" Via  1"
                        options={locations}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('via1', value, { shouldValidate: true })}
                        error={errors.via1?.message}
                      />
                    )}
                  />

                  <ABLNewCustomInput
                    label="Departure Date"
                    type="date"
                    placeholder="Enter departure date"
                    register={register}
                    error={errors.departureDate?.message}
                    id="departureDate"
                  />

                   <ABLNewCustomInput
                    label="Reached Date"
                    type="date"
                    placeholder="Enter reached date"
                    register={register}
                    error={errors.reachedDate?.message}
                    id="reachedDate"
                  />

                   <ABLNewCustomInput
                    label="Contact No"
                    type="tel"
                    placeholder="Enter contact no"
                    register={register}
                    error={errors.contactNo?.message}
                    id="contactNo"
                  />

                    

                </div>
              </div>
                  
            


              <div className="col-span-1 ">
                
                <div className="  grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                  
                 {/* 2 */}
                 <Controller
                    name="toLocation"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label="To Location"
                        options={locations}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('toLocation', value, { shouldValidate: true })}
                        error={errors.toLocation?.message}
                      />
                    )}
                  />
                  
                  <Controller
                    name="via2"
                    control={control}
                    render={({ field }) => (
                      <AblNewCustomDrpdown
                        label="Via 2     "
                        options={locations}
                        selectedOption={field.value || ''}
                        onChange={(value) => setValue('via2', value, { shouldValidate: true })}
                        error={errors.via2?.message}
                      />
                    )}
                  />
 
                <ABLNewCustomInput
                    label="E.Reached Date"
                    type="date"
                    placeholder="Enter expected reached date"
                    register={register}
                    error={errors.expectedReachedDate?.message}
                    id="expectedReachedDate"
                  />

                   <ABLNewCustomInput
                    label="V.Munshyana"
                    type="text"
                    placeholder="Enter vehicle munshyana"
                    register={register}
                    error={errors.vehicleMunshyana?.message}
                    id="vehicleMunshyana"
                  />

                   <ABLNewCustomInput
                    label="Contract Owner"
                    type="text"
                    placeholder="Enter contract owner"
                    register={register}
                    error={errors.contractOwner?.message}
                    id="contractOwner"
                  />
                   
                </div>
              </div>
              
            </div>

               <div className="col-span-1  dark:border-gray-700 ">
                
                <div className=" gap-2 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                   
                   <ABLNewCustomInput
                    label="Remarks"
                    type="text"
                    placeholder="Enter remarks"
                    register={register}
                    error={errors.remarks?.message}
                    id="remarks"
                  />
                 
                 
                </div>
              </div>

             

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow"
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
                      <span>{isEdit ? 'Update Booking Order' : 'Create Booking Order'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Consignments</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setTempSelectedConsignments(selectedConsignments);
                  setIsModalOpen(true);
                }}
              >
                Select Consignments
              </Button>
              <Button
                onClick={async () => {
                  const values = getValues();
                  // Validate required fields
                  if (!values.transporter || !values.vehicleNo || !values.fromLocation) {
                    toast.error('Please fill all transporter ,vehicleNo, fromLocation  before proceeding to consignment.');
                    return;
                  }
                  try {
                    setIsSubmitting(true);
                    const saved = await saveBookingOnly(values);
                    const orderNo = saved?.orderNo || values.OrderNo || '';
                    router.push(`/consignment/create?fromBooking=true&orderNo=${encodeURIComponent(orderNo)}`);
                  } catch (e) {
                    toast.error('Failed to save booking before navigating');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                Add Consignment
              </Button>
              <Button
                onClick={async () => {
                  const values = getValues();
                  // Validate required fields
                  if (!values.transporter || !values.vehicleNo || !values.fromLocation) {
                    toast.error('Please fill all required fields before proceeding to charges.');
                    return;
                  }
                  try {
                    setIsSubmitting(true);
                    const saved = await saveBookingOnly(values);
                    const orderNo = saved?.orderNo || values.OrderNo || '';
                    router.push(`/charges/create?fromBooking=true&orderNo=${encodeURIComponent(orderNo)}`);
                  } catch (e) {
                    toast.error('Failed to save booking before navigating');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                Add Charges
              </Button>
              <Button
                onClick={() => {
                  const orderNo = getValues('OrderNo') || '';
                  router.push(`/receipt/create?fromBooking=true&orderNo=${encodeURIComponent(orderNo)}`);
                }}
              >
                Receipt
              </Button>
              <Button
                onClick={() => {
                  const orderNo = getValues('OrderNo') || '';
                  router.push(`/paymentABL/create?fromBooking=true&orderNo=${encodeURIComponent(orderNo)}`);
                }}
              >
                Payment
              </Button>
            </div>
          </div>
          {/* Scrollable table wrapper for 4+ rows with sticky header */}
          <div className="relative rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="max-h-[240px] overflow-y-auto">
              <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
                <thead className="sticky top-0 z-10 text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3">Bilty No</th>
                    <th className="px-6 py-3">Receipt No</th>
                    <th className="px-6 py-3">Consignor</th>
                    <th className="px-6 py-3">Consignee</th>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3">Qty</th>
                    <th className="px-6 py-3">Total Amount</th>
                    <th className="px-6 py-3">Recv. Amount</th>
                    <th className="px-6 py-3">Del Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedConsignments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center">
                        No consignments selected
                      </td>
                    </tr>
                  ) : (
                    consignments
                      .filter((cons) => selectedConsignments.includes(cons.biltyNo))
                      .map((cons) => (
                        <tr key={cons.biltyNo} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                          <td className="px-6 py-3">{cons.biltyNo}</td>
                          <td className="px-6 py-3">{cons.receiptNo}</td>
                          <td className="px-6 py-3">{cons.consignor}</td>
                          <td className="px-6 py-3">{cons.consignee}</td>
                          <td className="px-6 py-3">{cons.item}</td>
                          <td className="px-6 py-3">{cons.qty ?? 'N/A'}</td>
                          <td className="px-6 py-3">{cons.totalAmount ?? 'N/A'}</td>
                          <td className="px-6 py-3">{cons.recvAmount ?? 'N/A'}</td>
                          <td className="px-6 py-3">{cons.delDate}</td>
                          <td className="px-6 py-3">
                            <AblNewCustomDrpdown
                              label="Status"
                              options={['Prepared', 'Unload', 'Bilty Received', 'Bilty Submit', 'Payment Received'].map((s) => ({
                                id: s,
                                name: s,
                              }))}
                              selectedOption={cons.status}
                              onChange={(value) => updateStatus(cons.biltyNo, value)}
                            />
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

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
                        checked={tempSelectedConsignments.length === filteredConsignments.length && filteredConsignments.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSelectedConsignments(filteredConsignments.map((c) => c.biltyNo));
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
                  {filteredConsignments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center">
                        No consignments found
                      </td>
                    </tr>
                  ) : (
                    filteredConsignments.map((cons) => (
                      <tr key={cons.biltyNo} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
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
                    setTempSelectedConsignments(selectedConsignments);
                    setSearchTerm('');
                    setIsModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveConsignments}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MdInfo className="text-[#3a614c]" />
              <span className="text-sm">Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link
              href="/bookingorder"
              className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors"
            >
              Back to Booking Orders List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingOrderForm;