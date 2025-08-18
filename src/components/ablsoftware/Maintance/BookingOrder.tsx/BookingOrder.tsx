'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createBookingOrder, updateBookingOrder, getAllBookingOrder } from '@/apis/bookingorder';
import { getAllTransporter } from '@/apis/transporter';
import { getAllVendor } from '@/apis/vendors';
import { getAllVehicleTypes } from '@/apis/vehicletype';
import { getAllMunshyana } from '@/apis/munshyana';
import { getAllConsignment } from '@/apis/consignment';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdLocalShipping, MdInfo, MdLocationOn, MdPhone } from 'react-icons/md';
import { FaRegBuilding, FaMoneyBillWave, FaIdCard } from 'react-icons/fa';
import { HiDocumentText } from 'react-icons/hi';
import Link from 'next/link';
import { FiSave, FiX, FiUser } from 'react-icons/fi';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
}

interface Consignment {
  biltyNo: string;
  receiptNo: string;
  consignor: string;
  consignee: string;
  item: string;
  qty: number;
  totalAmount: number;
  recvAmount: number;
  delDate: string;
  status: string;
}

// Define the schema for booking order form validation
const bookingOrderSchema = z.object({
  orderNo: z.string().optional(),
  orderDate: z.string().optional(),
  transporter: z.string().optional(),
  vendor: z.string().optional(),
  vehicleNo: z.string().optional(),
  containerNo: z.string().optional(),
  vehicleType: z.string().optional(),
  driverName: z.string().optional(),
  contactNo: z.string().optional(),
  munshayana: z.string().optional(),
  cargoWeight: z.string().optional(),
  bookedDays: z.string().optional(),
  detentionDays: z.string().optional(),
  fromLocation: z.string().optional(),
  departureDate: z.string().optional(),
  via1: z.string().optional(),
  via2: z.string().optional(),
  toLocation: z.string().optional(),
  expectedReachedDate: z.string().optional(),
  reachedDate: z.string().optional(),
  vehicleMunshyana: z.string().optional(),
  remarks: z.string().optional(),
  contractOwner: z.string().optional(),
});

type BookingOrderFormData = z.infer<typeof bookingOrderSchema>;

const BookingOrderForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BookingOrderFormData>({
    resolver: zodResolver(bookingOrderSchema),
    defaultValues: {
      orderNo: '',
      orderDate: '',
      transporter: '',
      vendor: '',
      vehicleNo: '',
      containerNo: '',
      vehicleType: '',
      driverName: '',
      contactNo: '',
      munshayana: '',
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
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [transporters, setTransporters] = useState<DropdownOption[]>([]);
  const [vendors, setVendors] = useState<DropdownOption[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<DropdownOption[]>([]);
  const [munshayanas, setMunshayanas] = useState<DropdownOption[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [locations, setLocations] = useState<DropdownOption[]>([]); // Dummy locations

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, vendRes, vehRes, munRes] = await Promise.all([
          getAllTransporter(),
          getAllVendor(),
          getAllVehicleTypes(),
          getAllMunshyana(),
        ]);
        setTransporters(transRes.data.map((t: any) => ({ id: t.id, name: t.name })));
        setVendors(vendRes.data.map((v: any) => ({ id: v.id, name: v.name })));
        setVehicleTypes(vehRes.data.map((vt: any) => ({ id: vt.id, name: vt.name })));
        setMunshayanas(munRes.data.map((m: any) => ({ id: m.id, name: m.name })));

        // Dummy locations
        const dummyLocations = ['Karachi', 'Lahore', 'Islamabad'].map(loc => ({ id: loc, name: loc }));
        setLocations(dummyLocations);

        // Fetch consignments (filter by order if possible; assume all for now)
        const consRes = await getAllConsignment(1, 10, { orderNo: '' });
        setConsignments(consRes.data); // Filter by orderNo if API supports
      } catch (error) {
        toast.error('Failed to load dropdown data');
      }
    };
    fetchData();

    if (isEdit) {
      const fetchBookingOrder = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getAllBookingOrder(); // Assume API returns all, then find
            const booking = response.data.find((b: any) => b.id === id);
            if (booking) {
              Object.keys(booking).forEach((key) => {
                setValue(key as keyof BookingOrderFormData, booking[key]);
              });
            } else {
              toast.error('Booking Order not found');
              router.push('/bookingorders');
            }
          } catch (error) {
            toast.error('Failed to load booking order data');
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchBookingOrder();
    }
  }, [isEdit, setValue, router]);

  const onSubmit = async (data: BookingOrderFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateBookingOrder(data.orderNo!, data);
        toast.success('Booking Order updated successfully!');
      } else {
        await createBookingOrder(data);
        toast.success('Booking Order created successfully!');
      }
      router.push('/bookingorders');
    } catch (error) {
      toast.error('An error occurred while saving the booking order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to update status
  const updateStatus = (index: number, newStatus: string) => {
    // Implement API call to update status
    // For now, update local state
    const updatedConsignments = [...consignments];
    updatedConsignments[index].status = newStatus;
    setConsignments(updatedConsignments);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
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
                <Link href="/bookingorders">
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

          <div className="flex border-b border-gray-200 dark:border-gray-700 px-8 bg-gray-50 dark:bg-gray-850">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'basic'
                  ? 'border-[#3a614c] text-[#3a614c] dark:text-[#3a614c] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              <FiUser className={activeTab === 'basic' ? 'text-[#3a614c]' : 'text-gray-400'} />
              Basic Information
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'additional'
                  ? 'border-[#3a614c] text-[#3a614c] dark:text-[#3a614c] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('additional')}
            >
              <HiDocumentText className={activeTab === 'additional' ? 'text-[#3a614c]' : 'text-gray-400'} />
              Additional Details
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <FaIdCard className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Order Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="Order No"
                      type="text"
                      placeholder="Auto"
                      register={register}
                      error={errors.orderNo?.message}
                      id="orderNo"
                      disabled
                    />
                    <ABLCustomInput
                      label="Order Date"
                      type="date"
                      placeholder="Enter order date"
                      register={register}
                      error={errors.orderDate?.message}
                      id="orderDate"
                    />
                    <Controller
                      name="transporter"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Transporter"
                          options={transporters}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('transporter', value)}
                          error={errors.transporter?.message}
                        />
                      )}
                    />
                    <Controller
                      name="vendor"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Vendor"
                          options={vendors}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('vendor', value)}
                          error={errors.vendor?.message}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <MdLocalShipping className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Vehicle Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="Vehicle No"
                      type="text"
                      placeholder="Enter vehicle no"
                      register={register}
                      error={errors.vehicleNo?.message}
                      id="vehicleNo"
                    />
                    <ABLCustomInput
                      label="Container No"
                      type="text"
                      placeholder="Enter container no"
                      register={register}
                      error={errors.containerNo?.message}
                      id="containerNo"
                    />
                    <Controller
                      name="vehicleType"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Vehicle Type"
                          options={vehicleTypes}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('vehicleType', value)}
                          error={errors.vehicleType?.message}
                        />
                      )}
                    />
                    <ABLCustomInput
                      label="Driver Name"
                      type="text"
                      placeholder="Enter driver name"
                      register={register}
                      error={errors.driverName?.message}
                      id="driverName"
                    />
                  </div>
                </div>
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <MdPhone className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Contact & Cargo
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="Contact No"
                      type="tel"
                      placeholder="Enter contact no"
                      register={register}
                      error={errors.contactNo?.message}
                      id="contactNo"
                    />
                    <Controller
                      name="munshayana"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Munshayana"
                          options={munshayanas}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('munshayana', value)}
                          error={errors.munshayana?.message}
                        />
                      )}
                    />
                    <ABLCustomInput
                      label="Cargo Weight"
                      type="text"
                      placeholder="Enter cargo weight"
                      register={register}
                      error={errors.cargoWeight?.message}
                      id="cargoWeight"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'additional' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <MdLocationOn className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Location Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <Controller
                      name="fromLocation"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="From Location"
                          options={locations}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('fromLocation', value)}
                          error={errors.fromLocation?.message}
                        />
                      )}
                    />
                    <ABLCustomInput
                      label="Departure Date"
                      type="date"
                      placeholder="Enter departure date"
                      register={register}
                      error={errors.departureDate?.message}
                      id="departureDate"
                    />
                    <Controller
                      name="via1"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Via 1"
                          options={locations}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('via1', value)}
                          error={errors.via1?.message}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <MdLocationOn className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Route Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <Controller
                      name="via2"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Via 2"
                          options={locations}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('via2', value)}
                          error={errors.via2?.message}
                        />
                      )}
                    />
                    <Controller
                      name="toLocation"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="To Location"
                          options={locations}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('toLocation', value)}
                          error={errors.toLocation?.message}
                        />
                      )}
                    />
                    <ABLCustomInput
                      label="Expected Reached Date"
                      type="date"
                      placeholder="Enter expected reached date"
                      register={register}
                      error={errors.expectedReachedDate?.message}
                      id="expectedReachedDate"
                    />
                  </div>
                </div>
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <FaRegBuilding className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Other Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="Reached Date"
                      type="date"
                      placeholder="Enter reached date"
                      register={register}
                      error={errors.reachedDate?.message}
                      id="reachedDate"
                    />
                    <ABLCustomInput
                      label="Vehicle Munshyana"
                      type="text"
                      placeholder="Enter vehicle munshyana"
                      register={register}
                      error={errors.vehicleMunshyana?.message}
                      id="vehicleMunshyana"
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
                      <span>{isEdit ? 'Update Booking Order' : 'Create Booking Order'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>

        {/* Consignment Table */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Consignments</h2>
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
              {consignments.map((cons, index) => (
                <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-6 py-4">{cons.biltyNo}</td>
                  <td className="px-6 py-4">{cons.receiptNo}</td>
                  <td className="px-6 py-4">{cons.consignor}</td>
                  <td className="px-6 py-4">{cons.consignee}</td>
                  <td className="px-6 py-4">{cons.item}</td>
                  <td className="px-6 py-4">{cons.qty}</td>
                  <td className="px-6 py-4">{cons.totalAmount}</td>
                  <td className="px-6 py-4">{cons.recvAmount}</td>
                  <td className="px-6 py-4">{cons.delDate}</td>
                  <td className="px-6 py-4">
                    <AblCustomDropdown
                      label="Status"
                      options={['Prepared', 'Unload', 'Bilty Received', 'Bilty Submit', 'Payment Received'].map(s => ({ id: s, name: s }))}
                      selectedOption={cons.status}
                      onChange={(value) => updateStatus(index, value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-4 mt-4">
            <Button onClick={() => router.push(`/consignment/create?fromBooking=true`)}>Add Consignment</Button>
            <Button onClick={() => router.push(`/charges/create?fromBooking=true`)}>Add Charges</Button>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MdInfo className="text-[#3a614c]" />
              <span className="text-sm">Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link href="/bookingorders" className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors">
              Back to Booking Orders List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingOrderForm;