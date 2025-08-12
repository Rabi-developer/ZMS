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
// import { getAllBookingOrders } from '@/apis/bookingOrder';
// import { getAllConsignors } from '@/apis/consignor';
// import { getAllConsignees } from '@/apis/consignee';
// import { getAllShippingLines } from '@/apis/shippingLine';
// import { getAllPorts } from '@/apis/port';
// import { getAllDestinations } from '@/apis/destination';
// import { createConsignment, updateConsignment } from '@/apis/consignment';

// // Schema for form validation
// const ConsignmentSchema = z.object({
//   ReceiptNo: z.string().optional(),
//   OrderNo: z.string().min(1, 'Order No is required'),
//   BiltyNo: z.string().min(1, 'Bilty No is required'),
//   Date: z.string().min(1, 'Date is required'),
//   ConsignmentNo: z.string().min(1, 'Consignment No is required'),
//   Consignor: z.string().min(1, 'Consignor is required'),
//   ConsignmentDate: z.string().min(1, 'Consignment Date is required'),
//   Consignee: z.string().min(1, 'Consignee is required'),
//   ReceiverName: z.string().min(1, 'Receiver Name is required'),
//   ReceiverContactNo: z.string().min(1, 'Receiver Contact No is required'),
//   ShippingLine: z.string().optional(),
//   ContainerNo: z.string().optional(),
//   Port: z.string().optional(),
//   Destination: z.string().min(1, 'Destination is required'),
//   Items: z.string().min(1, 'Items is required'),
//   ItemDesc: z.string().optional(),
//   Qty: z.string().min(1, 'Qty is required'),
//   Weight: z.string().min(1, 'Weight is required'),
//   TotalQty: z.string().min(1, 'Total Qty is required'),
//   Freight: z.string().min(1, 'Freight is required'),
//   SRBTax: z.string().optional(),
//   SRBAmount: z.string().optional(),
//   DeliveryCharges: z.string().optional(),
//   InsuranceCharges: z.string().optional(),
//   TollTax: z.string().optional(),
//   OtherCharges: z.string().optional(),
//   TotalAmount: z.string().min(1, 'Total Amount is required'),
//   ReceivedAmount: z.string().optional(),
//   IncomeTaxDed: z.string().optional(),
//   IncomeTaxAmount: z.string().optional(),
//   DeliveryDate: z.string().optional(),
//   FreightFrom: z.string().optional(),
//   Remarks: z.string().optional(),
// });

// type FormData = z.infer<typeof ConsignmentSchema>;

// interface ConsignmentData {
//   id?: string;
//   receiptNo?: string;
//   orderNo?: string;
//   biltyNo?: string;
//   date?: string;
//   consignmentNo?: string;
//   consignor?: string;
//   consignmentDate?: string;
//   consignee?: string;
//   receiverName?: string;
//   receiverContactNo?: string;
//   shippingLine?: string;
//   containerNo?: string;
//   port?: string;
//   destination?: string;
//   items?: string;
//   itemDesc?: string;
//   qty?: string;
//   weight?: string;
//   totalQty?: string;
//   freight?: string;
//   srbTax?: string;
//   srbAmount?: string;
//   deliveryCharges?: string;
//   insuranceCharges?: string;
//   tollTax?: string;
//   otherCharges?: string;
//   totalAmount?: string;
//   receivedAmount?: string;
//   incomeTaxDed?: string;
//   incomeTaxAmount?: string;
//   deliveryDate?: string;
//   freightFrom?: string;
//   remarks?: string;
// }

// interface ConsignmentProps {
//   isEdit?: boolean;
//   initialData?: ConsignmentData;
// }

// const Consignment = ({ isEdit = false, initialData }: ConsignmentProps) => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [bookingOrders, setBookingOrders] = useState<{ id: string; name: string }[]>([]);
//   const [consignors, setConsignors] = useState<{ id: string; name: string }[]>([]);
//   const [consignees, setConsignees] = useState<{ id: string; name: string }[]>([]);
//   const [shippingLines, setShippingLines] = useState<{ id: string; name: string }[]>([]);
//   const [ports, setPorts] = useState<{ id: string; name: string }[]>([]);
//   const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [receiptFocused, setReceiptFocused] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//     setValue,
//     watch,
//   } = useForm<FormData>({
//     resolver: zodResolver(ConsignmentSchema),
//     defaultValues: {
//       ReceiptNo: isEdit && initialData?.receiptNo ? initialData.receiptNo : '',
//       OrderNo: searchParams.get('orderNo') || '',
//       BiltyNo: '',
//       Date: new Date().toISOString().split('T')[0],
//       ConsignmentNo: '',
//       Consignor: '',
//       ConsignmentDate: new Date().toISOString().split('T')[0],
//       Consignee: '',
//       ReceiverName: '',
//       ReceiverContactNo: '',
//       ShippingLine: '',
//       ContainerNo: '',
//       Port: '',
//       Destination: '',
//       Items: '',
//       ItemDesc: '',
//       Qty: '',
//       Weight: '',
//       TotalQty: '',
//       Freight: '',
//       SRBTax: '',
//       SRBAmount: '',
//       DeliveryCharges: '',
//       InsuranceCharges: '',
//       TollTax: '',
//       OtherCharges: '',
//       TotalAmount: '',
//       ReceivedAmount: '',
//       IncomeTaxDed: '',
//       IncomeTaxAmount: '',
//       DeliveryDate: '',
//       FreightFrom: '',
//       Remarks: '',
//     },
//   });

//   // Fetch data
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [ordersRes, consignorsRes, consigneesRes, linesRes, portsRes, destRes] = await Promise.all([
//           getAllBookingOrders(),
//           getAllConsignors(),
//           getAllConsignees(),
//           getAllShippingLines(),
//           getAllPorts(),
//           getAllDestinations(),
//         ]);

//         setBookingOrders(ordersRes?.data?.map((item: any) => ({ id: String(item.id), name: item.orderNo })) || []);
//         setConsignors(consignorsRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setConsignees(consigneesRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setShippingLines(linesRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setPorts(portsRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
//         setDestinations(destRes?.data?.map((item: any) => ({ id: String(item.id), name: item.name })) || []);
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
//       setValue('ReceiptNo', initialData.receiptNo || '');
//       setValue('OrderNo', initialData.orderNo || '');
//       setValue('BiltyNo', initialData.biltyNo || '');
//       setValue('Date', initialData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
//       setValue('ConsignmentNo', initialData.consignmentNo || '');
//       setValue('Consignor', consignors.find((c) => c.name === initialData.consignor)?.id || '');
//       setValue('ConsignmentDate', initialData.consignmentDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
//       setValue('Consignee', consignees.find((c) => c.name === initialData.consignee)?.id || '');
//       setValue('ReceiverName', initialData.receiverName || '');
//       setValue('ReceiverContactNo', initialData.receiverContactNo || '');
//       setValue('ShippingLine', shippingLines.find((sl) => sl.name === initialData.shippingLine)?.id || '');
//       setValue('ContainerNo', initialData.containerNo || '');
//       setValue('Port', ports.find((p) => p.name === initialData.port)?.id || '');
//       setValue('Destination', destinations.find((d) => d.name === initialData.destination)?.id || '');
//       setValue('Items', initialData.items || '');
//       setValue('ItemDesc', initialData.itemDesc || '');
//       setValue('Qty', initialData.qty || '');
//       setValue('Weight', initialData.weight || '');
//       setValue('TotalQty', initialData.totalQty || '');
//       setValue('Freight', initialData.freight || '');
//       setValue('SRBTax', initialData.srbTax || '');
//       setValue('SRBAmount', initialData.srbAmount || '');
//       setValue('DeliveryCharges', initialData.deliveryCharges || '');
//       setValue('InsuranceCharges', initialData.insuranceCharges || '');
//       setValue('TollTax', initialData.tollTax || '');
//       setValue('OtherCharges', initialData.otherCharges || '');
//       setValue('TotalAmount', initialData.totalAmount || '');
//       setValue('ReceivedAmount', initialData.receivedAmount || '');
//       setValue('IncomeTaxDed', initialData.incomeTaxDed || '');
//       setValue('IncomeTaxAmount', initialData.incomeTaxAmount || '');
//       setValue('DeliveryDate', initialData.deliveryDate?.split('T')[0] || '');
//       setValue('FreightFrom', initialData.freightFrom || '');
//       setValue('Remarks', initialData.remarks || '');
//     }
//   }, [isEdit, initialData, consignors, consignees, shippingLines, ports, destinations, setValue]);

//   const onSubmit = async (data: FormData) => {
//     try {
//       const payload = {
//         ...(isEdit && initialData?.id ? { id: initialData.id } : {}),
//         receiptNo: data.ReceiptNo,
//         orderNo: data.OrderNo,
//         biltyNo: data.BiltyNo,
//         date: data.Date,
//         consignmentNo: data.ConsignmentNo,
//         consignor: consignors.find((c) => c.id === data.Consignor)?.name || '',
//         consignmentDate: data.ConsignmentDate,
//         consignee: consignees.find((c) => c.id === data.Consignee)?.name || '',
//         receiverName: data.ReceiverName,
//         receiverContactNo: data.ReceiverContactNo,
//         shippingLine: shippingLines.find((sl) => sl.id === data.ShippingLine)?.name || '',
//         containerNo: data.ContainerNo,
//         port: ports.find((p) => p.id === data.Port)?.name || '',
//         destination: destinations.find((d) => d.id === data.Destination)?.name || '',
//         items: data.Items,
//         itemDesc: data.ItemDesc,
//         qty: data.Qty,
//         weight: data.Weight,
//         totalQty: data.TotalQty,
//         freight: data.Freight,
//         srbTax: data.SRBTax,
//         srbAmount: data.SRBAmount,
//         deliveryCharges: data.DeliveryCharges,
//         insuranceCharges: data.InsuranceCharges,
//         tollTax: data.TollTax,
//         otherCharges: data.OtherCharges,
//         totalAmount: data.TotalAmount,
//         receivedAmount: data.ReceivedAmount,
//         incomeTaxDed: data.IncomeTaxDed,
//         incomeTaxAmount: data.IncomeTaxAmount,
//         deliveryDate: data.DeliveryDate,
//         freightFrom: data.FreightFrom,
//         remarks: data.Remarks,
//       };

//       if (isEdit) {
//         await updateConsignment(payload);
//         toast('Consignment Updated Successfully', { type: 'success' });
//       } else {
//         await createConsignment(payload);
//         toast('Consignment Created Successfully', { type: 'success' });
//       }

//       reset();
//       router.push('/consignment');
//     } catch (error) {
//       toast(`Error ${isEdit ? 'updating' : 'creating'} consignment`, { type: 'error' });
//     }
//   };

//   return (
//     <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630] p-4 md:p-6">
//       <div className="w-full bg-[#06b6d4] h-16 md:h-[7vh] rounded dark:bg-[#387fbf] flex items-center">
//         <h1 className="text-lg md:text-[23px] font-mono ml-4 md:ml-10 text-white flex items-center gap-2">
//           <MdOutlineAssignment />
//           {isEdit ? 'UPDATE CONSIGNMENT' : 'ADD CONSIGNMENT'}
//         </h1>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="p-2 md:p-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="relative group" onMouseEnter={() => setReceiptFocused(true)} onMouseLeave={() => setReceiptFocused(false)}>
//               <CustomInput
//                 type="text"
//                 variant="floating"
//                 borderThickness="2"
//                 label="Receipt No"
//                 id="ReceiptNo"
//                 {...register('ReceiptNo')}
//                 disabled
//                 error={errors.ReceiptNo?.message}
//                 className="w-full"
//               />
//               {receiptFocused && (
//                 <>
//                   <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                     <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
//                   </div>
//                   <div className="absolute bottom-full right-0 h-8 w-max text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
//                     Receipt No is provided by the system
//                   </div>
//                 </>
//               )}
//             </div>
//             <CustomInputDropdown
//               label="Order No"
//               options={bookingOrders}
//               selectedOption={watch('OrderNo') || ''}
//               onChange={(value) => setValue('OrderNo', value, { shouldValidate: true })}
//               error={errors.OrderNo?.message}
//               register={register}
//               disabled={!!searchParams.get('orderNo')}
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Bilty No"
//               id="BiltyNo"
//               {...register('BiltyNo')}
//               error={errors.BiltyNo?.message}
//               className="w-full"
//             />
//             <CustomSingleDatePicker
//               label="Date"
//               selectedDate={watch('Date') || ''}
//               onChange={(date: string) => setValue('Date', date, { shouldValidate: true })}
//               error={errors.Date?.message}
//               register={register}
//               name="Date"
//               variant="floating"
//               borderThickness="2"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Consignment No"
//               id="ConsignmentNo"
//               {...register('ConsignmentNo')}
//               error={errors.ConsignmentNo?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="Consignor"
//               options={consignors}
//               selectedOption={watch('Consignor') || ''}
//               onChange={(value) => setValue('Consignor', value, { shouldValidate: true })}
//               error={errors.Consignor?.message}
//               register={register}
//             />
//             <CustomSingleDatePicker
//               label="Consignment Date"
//               selectedDate={watch('ConsignmentDate') || ''}
//               onChange={(date: string) => setValue('ConsignmentDate', date, { shouldValidate: true })}
//               error={errors.ConsignmentDate?.message}
//               register={register}
//               name="ConsignmentDate"
//               variant="floating"
//               borderThickness="2"
//             />
//             <CustomInputDropdown
//               label="Consignee"
//               options={consignees}
//               selectedOption={watch('Consignee') || ''}
//               onChange={(value) => setValue('Consignee', value, { shouldValidate: true })}
//               error={errors.Consignee?.message}
//               register={register}
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Receiver Name"
//               id="ReceiverName"
//               {...register('ReceiverName')}
//               error={errors.ReceiverName?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Receiver Contact No"
//               id="ReceiverContactNo"
//               {...register('ReceiverContactNo')}
//               error={errors.ReceiverContactNo?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="Shipping Line"
//               options={shippingLines}
//               selectedOption={watch('ShippingLine') || ''}
//               onChange={(value) => setValue('ShippingLine', value, { shouldValidate: true })}
//               error={errors.ShippingLine?.message}
//               register={register}
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Container No"
//               id="ContainerNo"
//               {...register('ContainerNo')}
//               error={errors.ContainerNo?.message}
//               className="w-full"
//             />
//             <CustomInputDropdown
//               label="Port"
//               options={ports}
//               selectedOption={watch('Port') || ''}
//               onChange={(value) => setValue('Port', value, { shouldValidate: true })}
//               error={errors.Port?.message}
//               register={register}
//             />
//             <CustomInputDropdown
//               label="Destination"
//               options={destinations}
//               selectedOption={watch('Destination') || ''}
//               onChange={(value) => setValue('Destination', value, { shouldValidate: true })}
//               error={errors.Destination?.message}
//               register={register}
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Items"
//               id="Items"
//               {...register('Items')}
//               error={errors.Items?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Item Desc"
//               id="ItemDesc"
//               {...register('ItemDesc')}
//               error={errors.ItemDesc?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Qty"
//               id="Qty"
//               {...register('Qty')}
//               error={errors.Qty?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Weight"
//               id="Weight"
//               {...register('Weight')}
//               error={errors.Weight?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Total Qty"
//               id="TotalQty"
//               {...register('TotalQty')}
//               error={errors.TotalQty?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Freight"
//               id="Freight"
//               {...register('Freight')}
//               error={errors.Freight?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="SRB Tax"
//               id="SRBTax"
//               {...register('SRBTax')}
//               error={errors.SRBTax?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="SRB Amount"
//               id="SRBAmount"
//               {...register('SRBAmount')}
//               error={errors.SRBAmount?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Delivery Charges"
//               id="DeliveryCharges"
//               {...register('DeliveryCharges')}
//               error={errors.DeliveryCharges?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Insurance Charges"
//               id="InsuranceCharges"
//               {...register('InsuranceCharges')}
//               error={errors.InsuranceCharges?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Toll Tax"
//               id="TollTax"
//               {...register('TollTax')}
//               error={errors.TollTax?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Other Charges"
//               id="OtherCharges"
//               {...register('OtherCharges')}
//               error={errors.OtherCharges?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Total Amount"
//               id="TotalAmount"
//               {...register('TotalAmount')}
//               error={errors.TotalAmount?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Received Amount"
//               id="ReceivedAmount"
//               {...register('ReceivedAmount')}
//               error={errors.ReceivedAmount?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Income Tax Ded."
//               id="IncomeTaxDed"
//               {...register('IncomeTaxDed')}
//               error={errors.IncomeTaxDed?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Income Tax Amount"
//               id="IncomeTaxAmount"
//               {...register('IncomeTaxAmount')}
//               error={errors.IncomeTaxAmount?.message}
//               className="w-full"
//             />
//             <CustomSingleDatePicker
//               label="Delivery Date"
//               selectedDate={watch('DeliveryDate') || ''}
//               onChange={(date: string) => setValue('DeliveryDate', date, { shouldValidate: true })}
//               error={errors.DeliveryDate?.message}
//               register={register}
//               name="DeliveryDate"
//               variant="floating"
//               borderThickness="2"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Freight From"
//               id="FreightFrom"
//               {...register('FreightFrom')}
//               error={errors.FreightFrom?.message}
//               className="w-full"
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

//         <div className="w-full h-16 md:h-[8vh] flex flex-col md:flex-row justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7] p-2 md:p-4">
//           <Button type="submit" className="w-full md:w-[160px] bg-[#0e7d90] hover:bg-[#0891b2] text-white">Save</Button>
//           <Link href="/consignment">
//             <Button type="button" className="w-full md:w-[160px] bg-black hover:bg-[#b0b0b0] text-white">Cancel</Button>
//           </Link>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Consignment;