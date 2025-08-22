// 'use client';
// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { toast } from 'react-toastify';
// import { MdEdit, MdDelete, MdAdd, MdSearch, MdFilterList } from 'react-icons/md';
// import { FaFileExcel, FaCheck } from 'react-icons/fa';
// import Link from 'next/link';
// import { FiPlus } from 'react-icons/fi';
// import * as XLSX from 'xlsx';
// import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
// import { getAllPaymentABL, deletePaymentABL, updatePaymentABLStatus } from '@/apis/paymentABL';
// import { getAllConsignment } from '@/apis/consignment';
// import { getAllBookingOrder } from '@/apis/bookingorder';

// interface PaymentABL {
//   id: string;
//   paymentNo: string;
//   paymentDate: string;
//   orderNo: string;
//   vehicleNo: string;
//   chargeNo: string;
//   expenseAmount: number;
//   paidAmount: number;
//   balance: number;
//   paymentMethod: string;
//   status: string;
// }

// const getStatusBadge = (status: string) => {
//   switch (status) {
//     case 'Pending':
//       return 'bg-red-100 text-red-800';
//     case 'Completed':
//       return 'bg-green-100 text-green-800';
//     case 'Cancelled':
//       return 'bg-gray-100 text-gray-800';
//     default:
//       return 'bg-gray-100 text-gray-800';
//   }
// };

// const PaymentABLList = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [payments, setPayments] = useState<PaymentABL[]>([]);
//   const [filteredPayments, setFilteredPayments] = useState<PaymentABL[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('All');
//   const [pageIndex, setPageIndex] = useState(0);
//   const [pageSize, setPageSize] = useState(10);
//   const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
//   const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
//   const [updating, setUpdating] = useState(false);
//   const [consignments, setConsignments] = useState<any[]>([]);
//   const [bookingStatus, setBookingStatus] = useState<string | null>(null);
//   const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

//   const statusOptions = ['All', 'Pending', 'Completed', 'Cancelled'];
//   const statusOptionsConfig = [
//     { id: 1, name: 'Pending', color: '#ef4444' },
//     { id: 2, name: 'Completed', color: '#22c55e' },
//     { id: 3, name: 'Cancelled', color: '#6b7280' },
//   ];

//   const fetchPayments = async () => {
//     try {
//       setIsLoading(true);
//       const response = await getAllPaymentABL(pageIndex + 1, pageSize);
//       setPayments(response?.data || []);
//     } catch (error) {
//       toast('Failed to fetch payments', { type: 'error' });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPayments();
//   }, [pageIndex, pageSize]);

//   useEffect(() => {
//     let filtered = payments;
//     if (searchTerm) {
//       filtered = filtered.filter((payment) =>
//         Object.values(payment).some((value) =>
//           String(value).toLowerCase().includes(searchTerm.toLowerCase())
//         )
//       );
//     }
//     if (statusFilter !== 'All') {
//       filtered = filtered.filter((payment) => payment.status === statusFilter);
//     }
//     setFilteredPayments(filtered);
//   }, [payments, searchTerm, statusFilter]);

//   useEffect(() => {
//     if (searchParams.get('refresh') === 'true') {
//       fetchPayments();
//       const newUrl = new URL(window.location.href);
//       newUrl.searchParams.delete('refresh');
//       router.replace(newUrl.pathname);
//     }
//   }, [searchParams, router]);

//   const handleViewOpen = async (paymentId: string) => {
//     setSelectedRowId((prev) => (prev === paymentId ? null : paymentId));
//     const payment = payments.find((item) => item.id === paymentId);
//     if (payment?.orderNo) {
//       try {
//         const consResponse = await getAllConsignment(1, 100, { orderNo: payment.orderNo });
//         setConsignments(consResponse?.data || []);
//         const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: payment.orderNo });
//         const booking = bookingResponse?.data.find((b: any) => b.orderNo === payment.orderNo);
//         setBookingStatus(booking?.status || null);
//       } catch (error) {
//         toast('Failed to fetch related data', { type: 'error' });
//       }
//     }
//   };

//   const handleDelete = async (id: string, e: React.MouseEvent) => {
//     e.stopPropagation(); // Prevent row click
//     try {
//       await deletePaymentABL(id);
//       toast('Payment Deleted Successfully', { type: 'success' });
//       fetchPayments();
//     } catch (error) {
//       toast('Failed to delete payment', { type: 'error' });
//     }
//   };

//   const handleCheckboxChange = (paymentId: string, checked: boolean) => {
//     if (checked) {
//       setSelectedPaymentIds((prev) => [...prev, paymentId]);
//     } else {
//       setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
//     }

//     setTimeout(() => {
//       const selected = payments.filter((p) => selectedPaymentIds.includes(p.id));
//       const statuses = selected.map((p) => p.status).filter((status, index, self) => self.indexOf(status) === index);
//       setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
//     }, 100);
//   };

//   const handleBulkStatusUpdate = async (newStatus: string) => {
//     if (selectedPaymentIds.length === 0) {
//       toast('Please select at least one payment', { type: 'warning' });
//       return;
//     }
//     try {
//       setUpdating(true);
//       const updatePromises = selectedPaymentIds.map((id) =>
//         updatePaymentABLStatus({ id, status: newStatus })
//       );
//       await Promise.all(updatePromises);
//       setSelectedBulkStatus(newStatus);
//       setSelectedPaymentIds([]);
//       setStatusFilter(newStatus);
//       setPageIndex(0);
//       toast('Payment Status Updated Successfully', { type: 'success' });
//       await fetchPayments();
//     } catch (error) {
//       toast('Failed to update status', { type: 'error' });
//     } finally {
//       setUpdating(false);
//     }
//   };

//   const exportToExcel = () => {
//     let dataToExport = selectedPaymentIds.length > 0
//       ? filteredPayments.filter((p) => selectedPaymentIds.includes(p.id))
//       : filteredPayments;

//     if (dataToExport.length === 0) {
//       toast('No payments to export', { type: 'warning' });
//       return;
//     }

//     const formattedData = dataToExport.map((p) => ({
//       'Payment No': p.paymentNo || '-',
//       'Payment Date': p.paymentDate || '-',
//       'Order No': p.orderNo || '-',
//       'Vehicle No': p.vehicleNo || '-',
//       'Charge No': p.chargeNo || '-',
//       'Expense Amount': p.expenseAmount || '-',
//       'Paid Amount': p.paidAmount || '-',
//       'Balance': p.balance || '-',
//       'Payment Method': p.paymentMethod || '-',
//       'Status': p.status || 'Pending',
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(formattedData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
//     XLSX.writeFile(workbook, 'Payments.xlsx');
//   };

//   return (
//     <div className="container bg-white rounded-md p-6 h-[110vh]">
//       <div className="mb-4 flex items-center justify-between">
//         <div className="flex items-center gap-4 flex-wrap">
//           <div className="relative">
//             <Input
//               type="text"
//               placeholder="Search payments..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 pr-4 py-2 w-64 border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
//             />
//             <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//           </div>
//           <div className="flex items-center">
//             <label className="text-sm font-medium text-gray-700 mr-2">Filter by Status:</label>
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
//             >
//               {statusOptions.map((status) => (
//                 <option key={status} value={status}>
//                   {status}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <button
//             onClick={fetchPayments}
//             className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
//           >
//             Refresh Data
//           </button>
//         </div>
//         <div className="flex items-center gap-4">
//           <Link href="/paymentABL/create">
//             <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
//               <FiPlus size={18} className="mr-2" />
//               Add Payment
//             </Button>
//           </Link>
//           <button
//             onClick={exportToExcel}
//             className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-200"
//           >
//             <FaFileExcel size={18} />
//             Download Excel
//           </button>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full text-left border-collapse text-sm md:text-base">
//           <thead>
//             <tr className="bg-[#06b6d4] text-white">
//               <th className="p-3">
//                 <input
//                   type="checkbox"
//                   onChange={(e) => {
//                     if (e.target.checked) {
//                       setSelectedPaymentIds(filteredPayments.map((p) => p.id));
//                     } else {
//                       setSelectedPaymentIds([]);
//                     }
//                   }}
//                   checked={selectedPaymentIds.length === filteredPayments.length && filteredPayments.length > 0}
//                 />
//               </th>
//               <th className="p-3">Payment No</th>
//               <th className="p-3">Payment Date</th>
//               <th className="p-3">Order No</th>
//               <th className="p-3">Vehicle No</th>
//               <th className="p-3">Charge No</th>
//               <th className="p-3">Expense Amount</th>
//               <th className="p-3">Paid Amount</th>
//               <th className="p-3">Balance</th>
//               <th className="p-3">Payment Method</th>
//               <th className="p-3">Status</th>
//               <th className="p-3">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {isLoading ? (
//               <tr>
//                 <td colSpan={12} className="p-3 text-center text-gray-500">
//                   Loading payments...
//                 </td>
//               </tr>
//             ) : filteredPayments.length === 0 ? (
//               <tr>
//                 <td colSpan={12} className="p-3 text-center text-gray-500">
//                   No payments found
//                 </td>
//               </tr>
//             ) : (
//               filteredPayments.map((payment) => (
//                 <tr
//                   key={payment.id}
//                   onClick={() => handleViewOpen(payment.id)}
//                   className="border-b hover:bg-gray-50 cursor-pointer"
//                 >
//                   <td className="p-3">
//                     <input
//                       type="checkbox"
//                       checked={selectedPaymentIds.includes(payment.id)}
//                       onChange={(e) => handleCheckboxChange(payment.id, e.target.checked)}
//                       onClick={(e) => e.stopPropagation()}
//                     />
//                   </td>
//                   <td className="p-3">{payment.paymentNo || '-'}</td>
//                   <td className="p-3">{payment.paymentDate || '-'}</td>
//                   <td className="p-3">{payment.orderNo || '-'}</td>
//                   <td className="p-3">{payment.vehicleNo || '-'}</td>
//                   <td className="p-3">{payment.chargeNo || '-'}</td>
//                   <td className="p-3">{payment.expenseAmount || '-'}</td>
//                   <td className="p-3">{payment.paidAmount || '-'}</td>
//                   <td className="p-3">{payment.balance || '-'}</td>
//                   <td className="p-3">{payment.paymentMethod || '-'}</td>
//                   <td className="p-3">
//                     <span className={`px-2 py-1 rounded-full ${getStatusBadge(payment.status || 'Pending')}`}>
//                       {payment.status || 'Pending'}
//                     </span>
//                   </td>
//                   <td className="p-3">
//                     <div className="flex space-x-2">
//                       <Link href={`/paymentABL/edit/${payment.id}`}>
//                         <Button
//                           size="sm"
//                           className="bg-yellow-500 hover:bg-yellow-600"
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           <MdEdit size={16} />
//                         </Button>
//                       </Link>
//                       <Button
//                         size="sm"
//                         className="bg-red-500 hover:bg-red-600"
//                         onClick={(e) => handleDelete(payment.id, e)}
//                       >
//                         <MdDelete size={16} />
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {selectedRowId && (
//         <div className="mt-4">
//           <h3 className="text-lg font-semibold text-[#06b6d4]">Order Progress</h3>
//           <OrderProgress
//             orderNo={payments.find((p) => p.id === selectedRowId)?.orderNo}
//             bookingStatus={bookingStatus}
//             consignments={consignments}
//           />
//         </div>
//       )}

//       <div className="mt-4 space-y-2 h-[18vh]">
//         <div className="flex flex-wrap p-3 gap-3">
//           {statusOptionsConfig.map((option) => {
//             const isSelected = selectedBulkStatus === option.name;
//             return (
//               <button
//                 key={option.id}
//                 onClick={() => handleBulkStatusUpdate(option.name)}
//                 disabled={updating}
//                 className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
//                   ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
//                   ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
//               >
//                 <span className="text-sm font-semibold text-center">{option.name}</span>
//                 {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       <div className="mt-4 flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <select
//             value={pageSize}
//             onChange={(e) => {
//               setPageSize(Number(e.target.value));
//               setPageIndex(0);
//             }}
//             className="border border-gray-300 rounded-md p-2"
//           >
//             {[10, 20, 30, 40, 50].map((size) => (
//               <option key={size} value={size}>
//                 {size} per page
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button
//             disabled={pageIndex === 0}
//             onClick={() => setPageIndex((prev) => prev - 1)}
//             className="bg-cyan-600 hover:bg-cyan-700 text-white"
//           >
//             Previous
//           </Button>
//           <span>
//             Page {pageIndex + 1} of {Math.ceil(payments.length / pageSize) || 1}
//           </span>
//           <Button
//             disabled={filteredPayments.length < pageSize}
//             onClick={() => setPageIndex((prev) => prev + 1)}
//             className="bg-cyan-600 hover:bg-cyan-700 text-white"
//           >
//             Next
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentABLList;