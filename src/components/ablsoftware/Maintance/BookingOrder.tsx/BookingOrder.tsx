// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { useForm } from 'react-hook-form';
// import { z } from 'zod';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { toast } from 'react-toastify';
// import CustomInput from '@/components/ui/CustomInput';
// import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
// import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
// import { MdOutlineAssignment } from 'react-icons/md';
// import { BiSolidErrorAlt } from 'react-icons/bi';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// // Assume these APIs exist
// import { getAllOrganization } from '@/apis/organization';
// import { getAllBranch } from '@/apis/branchs';
// import { getAllTransporter } from '@/apis/transporter';
// import { getAllVendor } from '@/apis/vendors';
// import { getAllVehicleTypes } from '@/apis/vehicletype';
// import { getAllLocations } from '@/apis/location';
// import { getAllContractOwners } from '@/apis/contractOwner'; // Assume API for contract owners (e.g., employees)
// import { createBookingOrder, updateBookingOrder } from '@/apis/bookingorder';
// import { getAllConsignment } from '@/apis/consignment';

// // Schema for form validation
// const BookingOrderSchema = z.object({
//   OrderNo: z.string().optional(),
//   OrderDate: z.string().min(1, 'Order date is required'),
//   Company: z.string().min(1, 'Company is required'),
//   Branch: z.string().min(1, 'Branch is required'),
//   TotalBookValue: z.string().min(1, 'Total book value is required'),
//   Transporter: z.string().min(1, 'Transporter is required'),
//   Vendor: z.string().min(1, 'Vendor is required'),
//   TotalAmountReceived: z.string().optional(),
//   VehicleNo: z.string().min(1, 'Vehicle No is required'),
//   VehicleType: z.string().min(1, 'Vehicle Type is required'),
//   TotalCharges: z.string().min(1, 'Total Charges is required'),
//   DriverName: z.string().min(1, 'Driver Name is required'),
//   ContactNo: z.string().min(1, 'Contact No is required'),
//   Munshayana: z.string().optional(),
//   CargoWeight: z.string().min(1, 'Cargo Weight is required'),
//   BookedDays: z.string().min(1, 'Booked Days is required'),
//   DetentionDays: z.string().optional(),
//   NetProfitLoss: z.string().optional(),
//   FromLocation: z.string().min(1, 'From Location is required'),
//   DepartureDate: z.string().min(1, 'Departure Date is required'),
//   Via1: z.string().optional(),
//   Via2: z.string().optional(),
//   ToLocation: z.string().min(1, 'To Location is required'),
//   ExpectedReachedDate: z.string().min(1, 'Expected Reached Date is required'),
//   ReachedDate: z.string().optional(),
//   VehicleMunshyana: z.string().optional(),
//   Remarks: z.string().optional(),
//   ContractOwner: z.string().min(1, 'Contract Owner is required'),
// });

// type FormData = z.infer<typeof BookingOrderSchema>;

// interface ExtendedConsignment {
//   id: string;
//   biltyNo: string;
//   receiptNo: string;
//   consignor: string;
//   consignee: string;
//   item: string;
//   qty: string;
//   totalAmount: string;
//   receivedAmount: string;
//   deliveryDate: string;
//   status: string;
// }

// interface BookingOrderData {
//   id?: string;
//   orderNo?: string;
//   orderDate?: string;
//   company?: string;
//   branch?: string;
//   totalBookValue?: string;
//   transporter?: string;
//   vendor?: string;
//   totalAmountReceived?: string;
//   vehicleNo?: string;
//   vehicleType?: string;
//   totalCharges?: string;
//   driverName?: string;
//   contactNo?: string;
//   munshayana?: string;
//   cargoWeight?: string;
//   bookedDays?: string;
//   detentionDays?: string;
//   netProfitLoss?: string;
//   fromLocation?: string;
//   departureDate?: string;
//   via1?: string;
//   via2?: string;
//   toLocation?: string;
//   expectedReachedDate?: string;
//   reachedDate?: string;
//   vehicleMunshyana?: string;
//   remarks?: string;
//   contractOwner?: string;
//   relatedConsignments?: ExtendedConsignment[];
// }

// interface BookingOrderProps {
//   isEdit?: boolean;
//   initialData?: BookingOrderData;
// }

// const BookingOrder = ({ isEdit = false, initialData }: BookingOrderProps) => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
//   const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
//   const [transporters, setTransporters] = useState<{ id: string; name: string }[]>([]);
//   const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
//   const [vehicleTypes, setVehicleTypes] = useState<{ id: string; name: string }[]>([]);
//   const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
//   const [contractOwners, setContractOwners] = useState<{ id: string; name: string }[]>([]);
//   const [filteredConsignments, setFilteredConsignments] = useState<ExtendedConsignment[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [orderFocused, setOrderFocused] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//     setValue,
//     watch,
//   } = useForm<FormData>({
//     resolver: zodResolver(BookingOrderSchema),
//     defaultValues: {
//       OrderNo: isEdit && initialData?.orderNo ? initialData.orderNo : '',
//       OrderDate: new Date().toISOString().split('T')[0],
//       Company: '',
//       Branch: '',
//       TotalBookValue: '',
//       Transporter: '',
//       Vendor: '',
//       TotalAmountReceived: '',
//       VehicleNo: '',
//       VehicleType: '',
//       TotalCharges: '',
//       DriverName: '',
//       ContactNo: '',
//       Munshayana: '',
//       CargoWeight: '',
//       BookedDays: '',
//       DetentionDays: '',
//       NetProfitLoss: '',
//       FromLocation: '',
//       DepartureDate: new Date().toISOString().split('T')[0],
//       Via1: '',
//       Via2: '',
//       ToLocation: '',
//       ExpectedReachedDate: new Date().toISOString().split('T')[0],
//       ReachedDate: '',
//       VehicleMunshyana: '',
//       Remarks: '',
//       ContractOwner: '',
//     },
//   });

//   // Fetch data
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [companiesRes, branchesRes, transportersRes, vendorsRes, vehicleTypesRes, locationsRes, ownersRes] = await Promise.all([
//           getAllOrganization(),
//           getAllBranch(),
//           getAllTransporter(),
//           getAllVendor(),
//           getAllVehicleTypes(),
//           getAllLocation(),
//           getAllContractOwner(),
//         ]);

//         setCompanies(companiesRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setBranches(branchesRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setTransporters(transportersRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setVendors(vendorsRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setVehicleTypes(vehicleTypesRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setLocations(locationsRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setContractOwners(ownersRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//       } catch (error) {
//         toast('Failed to fetch data', { type: 'error' });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Initialize form with initialData when editing
//   useEffect(() => {
//     if (isEdit && initialData) {
//       setValue('OrderNo', initialData.orderNo || '');
//       setValue('OrderDate', initialData.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
//       setValue('Company', companies.find((c) => c.name === initialData.company)?.id || '');
//       setValue('Branch', branches.find((b) => b.name === initialData.branch)?.id || '');
//       setValue('TotalBookValue', initialData.totalBookValue || '');
//       setValue('Transporter', transporters.find((t) => t.name === initialData.transporter)?.id || '');
//       setValue('Vendor', vendors.find((v) => v.name === initialData.vendor)?.id || '');
//       setValue('TotalAmountReceived', initialData.totalAmountReceived || '');
//       setValue('VehicleNo', initialData.vehicleNo || '');
//       setValue('VehicleType', vehicleTypes.find((vt) => vt.name === initialData.vehicleType)?.id || '');
//       setValue('TotalCharges', initialData.totalCharges || '');
//       setValue('DriverName', initialData.driverName || '');
//       setValue('ContactNo', initialData.contactNo || '');
//       setValue('Munshayana', initialData.munshayana || '');
//       setValue('CargoWeight', initialData.cargoWeight || '');
//       setValue('BookedDays', initialData.bookedDays || '');
//       setValue('DetentionDays', initialData.detentionDays || '');
//       setValue('NetProfitLoss', initialData.netProfitLoss || '');
//       setValue('FromLocation', locations.find((l) => l.name === initialData.fromLocation)?.id || '');
//       setValue('DepartureDate', initialData.departureDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
//       setValue('Via1', initialData.via1 || '');
//       setValue('Via2', initialData.via2 || '');
//       setValue('ToLocation', locations.find((l) => l.name === initialData.toLocation)?.id || '');
//       setValue('ExpectedReachedDate', initialData.expectedReachedDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
//       setValue('ReachedDate', initialData.reachedDate?.split('T')[0] || '');
//       setValue('VehicleMunshyana', initialData.vehicleMunshyana || '');
//       setValue('Remarks', initialData.remarks || '');
//       setValue('ContractOwner', contractOwners.find((o) => o.name === initialData.contractOwner)?.id || '');

//       setFilteredConsignments(initialData.relatedConsignments || []);
//     }
//   }, [isEdit, initialData, companies, branches, transporters, vendors, vehicleTypes, locations, contractOwners, setValue]);

//   // Fetch related consignments if editing
//   useEffect(() => {
//     if (isEdit && initialData?.orderNo) {
//       const fetchConsignments = async () => {
//         try {
//           const response = await getAllConsignments(1, 100); // Filter by orderNo if API supports
//           const related = response?.data.filter((c: ExtendedConsignment) => c.orderNo === initialData.orderNo) || [];
//           setFilteredConsignments(related);
//         } catch (error) {
//           toast('Failed to fetch consignments', { type: 'error' });
//         }
//       };
//       fetchConsignments();
//     }
//   }, [isEdit, initialData]);

//   const onSubmit = async (data: FormData) => {
//     try {
//       const payload = {
//         ...(isEdit && initialData?.id ? { id: initialData.id } : {}),
//         orderNo: data.OrderNo,
//         orderDate: data.OrderDate,
//         company: companies.find((c) => c.id === data.Company)?.name || '',
//         branch: branches.find((b) => b.id === data.Branch)?.name || '',
//         totalBookValue: data.TotalBookValue,
//         transporter: transporters.find((t) => t.id === data.Transporter)?.name || '',
//         vendor: vendors.find((v) => v.id === data.Vendor)?.name || '',
//         totalAmountReceived: data.TotalAmountReceived,
//         vehicleNo: data.VehicleNo,
//         vehicleType: vehicleTypes.find((vt) => vt.id === data.VehicleType)?.name || '',
//         totalCharges: data.TotalCharges,
//         driverName: data.DriverName,
//         contactNo: data.ContactNo,
//         munshayana: data.Munshayana,
//         cargoWeight: data.CargoWeight,
//         bookedDays: data.BookedDays,
//         detentionDays: data.DetentionDays,
//         netProfitLoss: data.NetProfitLoss,
//         fromLocation: locations.find((l) => l.id === data.FromLocation)?.name || '',
//         departureDate: data.DepartureDate,
//         via1: data.Via1,
//         via2: data.Via2,
//         toLocation: locations.find((l) => l.id === data.ToLocation)?.name || '',
//         expectedReachedDate: data.ExpectedReachedDate,
//         reachedDate: data.ReachedDate,
//         vehicleMunshyana: data.VehicleMunshyana,
//         remarks: data.Remarks,
//         contractOwner: contractOwners.find((o) => o.id === data.ContractOwner)?.name || '',
//         // relatedConsignments not submitted, as they are linked separately
//       };

//       if (isEdit) {
//         await updateBookingOrder(payload);
//         toast('Booking Order Updated Successfully', { type: 'success' });
//       } else {
//         await createBookingOrder(payload);
//         toast('Booking Order Created Successfully', { type: 'success' });
//       }

//       reset();
//       router.push('/bookingorder');
//     } catch (error) {
//       toast(`Error ${isEdit ? 'updating' : 'creating'} booking order`, { type: 'error' });
//     }
//   };

//   return (
//     <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630] p-4 md:p-6">
//       <div className="w-full bg-[#06b6d4] h-16 md:h-[7vh] rounded dark:bg-[#387fbf] flex items-center">
//         <h1 className="text-lg md:text-[23px] font-mono ml-4 md:ml-10 text-white flex items-center gap-2">
//           <MdOutlineAssignment />
//           {isEdit ? 'UPDATE BOOKING ORDER' : 'ADD BOOKING ORDER'}
//         </h1>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="p-2 md:p-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="relative group" onMouseEnter={() => setOrderFocused(true)} onMouseLeave={() => setOrderFocused(false)}>
//               <CustomInput
//                 type="text"
//                 variant="floating"
//                 borderThickness="2"
//                 label="Order No"
//                 id="OrderNo"
//                 {...register('OrderNo')}
//                 disabled
//                 error={errors.OrderNo?.message}
//                 className="w-full"
//               />
//               {orderFocused && (
//                 <>
//                   <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                     <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
//                   </div>
//                   <div className="absolute bottom-full right-0 h-8 w-max text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
//                     Order No is provided by the system
//                   </div>
//                 </>
//               )}
//             </div>
//             <CustomSingleDatePicker
//               label="Order Date"
//               selectedDate={watch('OrderDate') || ''}
//               onChange={(date: string) => setValue('OrderDate', date, { shouldValidate: true })}
//               error={errors.OrderDate?.message}
//               register={register}
//               name="OrderDate"
//               variant="floating"
//               borderThickness="2"
//             />
//             <CustomInputDropdown
//               label="Company"
//               options={companies}
//               selectedOption={watch('Company') || ''}
//               onChange={(value) => setValue('Company', value, { shouldValidate: true })}
//               error={errors.Company?.message}
//               register={register}
//             />
//             <CustomInputDropdown
//               label="Branch"
//               options={branches}
//               selectedOption={watch('Branch') || ''}
//               onChange={(value) => setValue('Branch', value, { shouldValidate: true })}
//               error={errors.Branch?.message}
//               register={register}
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Total Book Value"
//               id="TotalBookValue"
//               {...register('TotalBookValue')}
//               error={errors.TotalBookValue?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="Transporter"
//               options={transporters}
//               selectedOption={watch('Transporter') || ''}
//               onChange={(value) => setValue('Transporter', value, { shouldValidate: true })}
//               error={errors.Transporter?.message}
//               register={register}
//             />
//             <CustomInputDropdown
//               label="Vendor"
//               options={vendors}
//               selectedOption={watch('Vendor') || ''}
//               onChange={(value) => setValue('Vendor', value, { shouldValidate: true })}
//               error={errors.Vendor?.message}
//               register={register}
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Total Amount Received"
//               id="TotalAmountReceived"
//               {...register('TotalAmountReceived')}
//               error={errors.TotalAmountReceived?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Vehicle No"
//               id="VehicleNo"
//               {...register('VehicleNo')}
//               error={errors.VehicleNo?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="Vehicle Type"
//               options={vehicleTypes}
//               selectedOption={watch('VehicleType') || ''}
//               onChange={(value) => setValue('VehicleType', value, { shouldValidate: true })}
//               error={errors.VehicleType?.message}
//               register={register}
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Total Charges"
//               id="TotalCharges"
//               {...register('TotalCharges')}
//               error={errors.TotalCharges?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Driver Name"
//               id="DriverName"
//               {...register('DriverName')}
//               error={errors.DriverName?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Contact No"
//               id="ContactNo"
//               {...register('ContactNo')}
//               error={errors.ContactNo?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Munshayana"
//               id="Munshayana"
//               {...register('Munshayana')}
//               error={errors.Munshayana?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Cargo Weight"
//               id="CargoWeight"
//               {...register('CargoWeight')}
//               error={errors.CargoWeight?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Booked Days"
//               id="BookedDays"
//               {...register('BookedDays')}
//               error={errors.BookedDays?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Detention Days"
//               id="DetentionDays"
//               {...register('DetentionDays')}
//               error={errors.DetentionDays?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Net Profit / Loss"
//               id="NetProfitLoss"
//               {...register('NetProfitLoss')}
//               error={errors.NetProfitLoss?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="From Location"
//               options={locations}
//               selectedOption={watch('FromLocation') || ''}
//               onChange={(value) => setValue('FromLocation', value, { shouldValidate: true })}
//               error={errors.FromLocation?.message}
//               register={register}
//             />
//             <CustomSingleDatePicker
//               label="Departure Date"
//               selectedDate={watch('DepartureDate') || ''}
//               onChange={(date: string) => setValue('DepartureDate', date, { shouldValidate: true })}
//               error={errors.DepartureDate?.message}
//               register={register}
//               name="DepartureDate"
//               variant="floating"
//               borderThickness="2"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Via1"
//               id="Via1"
//               {...register('Via1')}
//               error={errors.Via1?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Via2"
//               id="Via2"
//               {...register('Via2')}
//               error={errors.Via2?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="To Location"
//               options={locations}
//               selectedOption={watch('ToLocation') || ''}
//               onChange={(value) => setValue('ToLocation', value, { shouldValidate: true })}
//               error={errors.ToLocation?.message}
//               register={register}
//             />
//             <CustomSingleDatePicker
//               label="Expected Reached Date"
//               selectedDate={watch('ExpectedReachedDate') || ''}
//               onChange={(date: string) => setValue('ExpectedReachedDate', date, { shouldValidate: true })}
//               error={errors.ExpectedReachedDate?.message}
//               register={register}
//               name="ExpectedReachedDate"
//               variant="floating"
//               borderThickness="2"
//             />
//             <CustomSingleDatePicker
//               label="Reached Date"
//               selectedDate={watch('ReachedDate') || ''}
//               onChange={(date: string) => setValue('ReachedDate', date, { shouldValidate: true })}
//               error={errors.ReachedDate?.message}
//               register={register}
//               name="ReachedDate"
//               variant="floating"
//               borderThickness="2"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Vehicle Munshyana"
//               id="VehicleMunshyana"
//               {...register('VehicleMunshyana')}
//               error={errors.VehicleMunshyana?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="Contract Owner"
//               options={contractOwners}
//               selectedOption={watch('ContractOwner') || ''}
//               onChange={(value) => setValue('ContractOwner', value, { shouldValidate: true })}
//               error={errors.ContractOwner?.message}
//               register={register}
//             />
//             <div className="col-span-1 md:col-span-3">
//               <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Remarks</h2>
//               <textarea
//                 className="w-full p-2 border-[#06b6d4] border rounded text-sm md:text-base"
//                 rows={4}
//                 {...register('Remarks')}
//                 placeholder="Enter any remarks"
//               />
//               {errors.Remarks && <p className="text-red-500 text-sm">{errors.Remarks.message}</p>}
//             </div>
//           </div>
//         </div>

//         <div className="p-2 md:p-4">
//           <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Related Consignments</h2>
//           <div className="mt-2">
//             <Link href={`/consignment/create?orderNo=${initialData?.orderNo || searchParams.get('orderNo')}`}>
//               <Button className="mb-4 bg-[#06b6d4] hover:bg-[#0891b2] text-white">Add Consignment</Button>
//             </Link>
//             {loading ? (
//               <p className="text-gray-500 text-sm md:text-base">Loading...</p>
//             ) : filteredConsignments.length > 0 ? (
//               <table className="w-full text-left border-collapse text-sm md:text-base">
//                 <thead>
//                   <tr className="bg-[#06b6d4] text-white">
//                     <th className="p-2 md:p-3 font-medium">Bilty No</th>
//                     <th className="p-2 md:p-3 font-medium">Receipt No</th>
//                     <th className="p-2 md:p-3 font-medium">Consignor</th>
//                     <th className="p-2 md:p-3 font-medium">Consignee</th>
//                     <th className="p-2 md:p-3 font-medium">Item</th>
//                     <th className="p-2 md:p-3 font-medium">Qty</th>
//                     <th className="p-2 md:p-3 font-medium">Total Amount</th>
//                     <th className="p-2 md:p-3 font-medium">Recv. Amount</th>
//                     <th className="p-2 md:p-3 font-medium">Del. Date</th>
//                     <th className="p-2 md:p-3 font-medium">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredConsignments.map((consignment) => (
//                     <tr key={consignment.id} className="border-b hover:bg-gray-100">
//                       <td className="p-2 md:p-3">{consignment.biltyNo || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.receiptNo || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.consignor || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.consignee || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.item || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.qty || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.totalAmount || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.receivedAmount || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.deliveryDate || '-'}</td>
//                       <td className="p-2 md:p-3">{consignment.status || '-'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <p className="text-gray-500 text-sm md:text-base">No consignments found.</p>
//             )}
//           </div>
//         </div>

//         <div className="p-2 md:p-4">
//           <Link href={`/charges/create?orderNo=${initialData?.orderNo || searchParams.get('orderNo')}`}>
//             <Button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white">Add Charges</Button>
//           </Link>
//         </div>

//         <div className="w-full h-16 md:h-[8vh] flex flex-col md:flex-row justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7] p-2 md:p-4">
//           <Button type="submit" className="w-full md:w-[160px] bg-[#0e7d90] hover:bg-[#0891b2] text-white">Save</Button>
//           <Link href="/bookingorder">
//             <Button type="button" className="w-full md:w-[160px] bg-black hover:bg-[#b0b0b0] text-white">Cancel</Button>
//           </Link>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default BookingOrder;