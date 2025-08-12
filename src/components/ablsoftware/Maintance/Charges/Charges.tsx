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
// import { createCharge, updateCharge } from '@/apis/charge';

// // Schema for form validation (assuming charges can be multiple, but for simplicity, single form with table-like inputs if needed)
// const ChargesSchema = z.object({
//   ChargeNo: z.string().optional(),
//   ChargeDate: z.string().min(1, 'Charge Date is required'),
//   OrderNo: z.string().min(1, 'Order No is required'),
//   UnpaidCharges: z.string().optional(),
//   Payment: z.string().optional(),
//   Charges: z.string().optional(),
//   BiltyNo: z.string().optional(),
//   Date: z.string().optional(),
//   VehicleNo: z.string().optional(),
//   PaidToPerson: z.string().min(1, 'Paid to Person is required'),
//   ContactNo: z.string().optional(),
//   Remarks: z.string().optional(),
//   Amount: z.string().min(1, 'Amount is required'),
//   PaidAmount: z.string().optional(),
//   BankCash: z.string().optional(),
//   ChqNo: z.string().optional(),
//   ChqDate: z.string().optional(),
//   PayNo: z.string().optional(),
//   Total: z.string().optional(),
// });

// type FormData = z.infer<typeof ChargesSchema>;

// interface ChargeData {
//   id?: string;
//   chargeNo?: string;
//   chargeDate?: string;
//   orderNo?: string;
//   unpaidCharges?: string;
//   payment?: string;
//   charges?: string;
//   biltyNo?: string;
//   date?: string;
//   vehicleNo?: string;
//   paidToPerson?: string;
//   contactNo?: string;
//   remarks?: string;
//   amount?: string;
//   paidAmount?: string;
//   bankCash?: string;
//   chqNo?: string;
//   chqDate?: string;
//   payNo?: string;
//   total?: string;
// }

// interface ChargesProps {
//   isEdit?: boolean;
//   initialData?: ChargeData;
// }

// const Charges = ({ isEdit = false, initialData }: ChargesProps) => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [bookingOrders, setBookingOrders] = useState<{ id: string; name: string }[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [chargeFocused, setChargeFocused] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//     setValue,
//     watch,
//   } = useForm<FormData>({
//     resolver: zodResolver(ChargesSchema),
//     defaultValues: {
//       ChargeNo: isEdit && initialData?.chargeNo ? initialData.chargeNo : '',
//       ChargeDate: new Date().toISOString().split('T')[0],
//       OrderNo: searchParams.get('orderNo') || '',
//       UnpaidCharges: '',
//       Payment: '',
//       Charges: '',
//       BiltyNo: '',
//       Date: new Date().toISOString().split('T')[0],
//       VehicleNo: '',
//       PaidToPerson: '',
//       ContactNo: '',
//       Remarks: '',
//       Amount: '',
//       PaidAmount: '',
//       BankCash: '',
//       ChqNo: '',
//       ChqDate: '',
//       PayNo: '',
//       Total: '',
//     },
//   });

//   // Fetch data
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const ordersRes = await getAllBookingOrders();
//         setBookingOrders(ordersRes?.data?.map((item: any) => ({ id: String(item.id), name: item.orderNo })) || []);
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
//       setValue('ChargeNo', initialData.chargeNo || '');
//       setValue('ChargeDate', initialData.chargeDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
//       setValue('OrderNo', initialData.orderNo || '');
//       setValue('UnpaidCharges', initialData.unpaidCharges || '');
//       setValue('Payment', initialData.payment || '');
//       setValue('Charges', initialData.charges || '');
//       setValue('BiltyNo', initialData.biltyNo || '');
//       setValue('Date', initialData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
//       setValue('VehicleNo', initialData.vehicleNo || '');
//       setValue('PaidToPerson', initialData.paidToPerson || '');
//       setValue('ContactNo', initialData.contactNo || '');
//       setValue('Remarks', initialData.remarks || '');
//       setValue('Amount', initialData.amount || '');
//       setValue('PaidAmount', initialData.paidAmount || '');
//       setValue('BankCash', initialData.bankCash || '');
//       setValue('ChqNo', initialData.chqNo || '');
//       setValue('ChqDate', initialData.chqDate || '');
//       setValue('PayNo', initialData.payNo || '');
//       setValue('Total', initialData.total || '');
//     }
//   }, [isEdit, initialData, setValue]);

//   const onSubmit = async (data: FormData) => {
//     try {
//       const payload = {
//         ...(isEdit && initialData?.id ? { id: initialData.id } : {}),
//         chargeNo: data.ChargeNo,
//         chargeDate: data.ChargeDate,
//         orderNo: data.OrderNo,
//         unpaidCharges: data.UnpaidCharges,
//         payment: data.Payment,
//         charges: data.Charges,
//         biltyNo: data.BiltyNo,
//         date: data.Date,
//         vehicleNo: data.VehicleNo,
//         paidToPerson: data.PaidToPerson,
//         contactNo: data.ContactNo,
//         remarks: data.Remarks,
//         amount: data.Amount,
//         paidAmount: data.PaidAmount,
//         bankCash: data.BankCash,
//         chqNo: data.ChqNo,
//         chqDate: data.ChqDate,
//         payNo: data.PayNo,
//         total: data.Total,
//       };

//       if (isEdit) {
//         await updateCharge(payload);
//         toast('Charge Updated Successfully', { type: 'success' });
//       } else {
//         await createCharge(payload);
//         toast('Charge Created Successfully', { type: 'success' });
//       }

//       reset();
//       router.push('/charges');
//     } catch (error) {
//       toast(`Error ${isEdit ? 'updating' : 'creating'} charge`, { type: 'error' });
//     }
//   };

//   return (
//     <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630] p-4 md:p-6">
//       <div className="w-full bg-[#06b6d4] h-16 md:h-[7vh] rounded dark:bg-[#387fbf] flex items-center">
//         <h1 className="text-lg md:text-[23px] font-mono ml-4 md:ml-10 text-white flex items-center gap-2">
//           <MdOutlineAssignment />
//           {isEdit ? 'UPDATE CHARGES' : 'ADD CHARGES'}
//         </h1>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="p-2 md:p-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="relative group" onMouseEnter={() => setChargeFocused(true)} onMouseLeave={() => setChargeFocused(false)}>
//               <CustomInput
//                 type="text"
//                 variant="floating"
//                 borderThickness="2"
//                 label="Charge No"
//                 id="ChargeNo"
//                 {...register('ChargeNo')}
//                 disabled
//                 error={errors.ChargeNo?.message}
//                 className="w-full"
//               />
//               {chargeFocused && (
//                 <>
//                   <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                     <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
//                   </div>
//                   <div className="absolute bottom-full right-0 h-8 w-max text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
//                     Charge No is provided by the system
//                   </div>
//                 </>
//               )}
//             </div>
//             <CustomSingleDatePicker
//               label="Charge Date"
//               selectedDate={watch('ChargeDate') || ''}
//               onChange={(date: string) => setValue('ChargeDate', date, { shouldValidate: true })}
//               error={errors.ChargeDate?.message}
//               register={register}
//               name="ChargeDate"
//               variant="floating"
//               borderThickness="2"
//             />
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
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Unpaid Charges"
//               id="UnpaidCharges"
//               {...register('UnpaidCharges')}
//               error={errors.UnpaidCharges?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Payment"
//               id="Payment"
//               {...register('Payment')}
//               error={errors.Payment?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Charges"
//               id="Charges"
//               {...register('Charges')}
//               error={errors.Charges?.message}
//               className="w-full"
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
//               label="Vehicle#"
//               id="VehicleNo"
//               {...register('VehicleNo')}
//               error={errors.VehicleNo?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Paid to Person"
//               id="PaidToPerson"
//               {...register('PaidToPerson')}
//               error={errors.PaidToPerson?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Contact#"
//               id="ContactNo"
//               {...register('ContactNo')}
//               error={errors.ContactNo?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Remarks"
//               id="Remarks"
//               {...register('Remarks')}
//               error={errors.Remarks?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Amount"
//               id="Amount"
//               {...register('Amount')}
//               error={errors.Amount?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Paid Amount"
//               id="PaidAmount"
//               {...register('PaidAmount')}
//               error={errors.PaidAmount?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Bank/Cash"
//               id="BankCash"
//               {...register('BankCash')}
//               error={errors.BankCash?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Chq No"
//               id="ChqNo"
//               {...register('ChqNo')}
//               error={errors.ChqNo?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Chq Date Pay. No"
//               id="ChqDate"
//               {...register('ChqDate')}
//               error={errors.ChqDate?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="text"
//               variant="floating"
//               borderThickness="2"
//               label="Pay No"
//               id="PayNo"
//               {...register('PayNo')}
//               error={errors.PayNo?.message}
//               className="w-full"
//             />
//             <CustomInput
//               type="number"
//               variant="floating"
//               borderThickness="2"
//               label="Total"
//               id="Total"
//               {...register('Total')}
//               error={errors.Total?.message}
//               className="w-full"
//             />
//           </div>
//         </div>

//         <div className="w-full h-16 md:h-[8vh] flex flex-col md:flex-row justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7] p-2 md:p-4">
//           <Button type="submit" className="w-full md:w-[160px] bg-[#0e7d90] hover:bg-[#0891b2] text-white">Save</Button>
//           <Link href="/charges">
//             <Button type="button" className="w-full md:w-[160px] bg-black hover:bg-[#b0b0b0] text-white">Cancel</Button>
//           </Link>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Charges;