// import { ColumnDef } from '@tanstack/react-table';
// import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// export interface Consignment {
//   id: string;
//   receiptNo: string;
//   orderNo: string;
//   biltyNo: string;
//   date: string;
//   consignmentNo: string;
//   consignor: string;
//   consignmentDate: string;
//   consignee: string;
//   receiverName: string;
//   receiverContactNo: string;
//   shippingLine: string;
//   containerNo: string;
//   port: string;
//   destination: string;
//   items: string;
//   itemDesc: string;
//   qty: string;
//   weight: string;
//   totalQty: string;
//   freight: string;
//   srbTax: string;
//   srbAmount: string;
//   deliveryCharges: string;
//   insuranceCharges: string;
//   tollTax: string;
//   otherCharges: string;
//   totalAmount: string;
//   receivedAmount: string;
//   incomeTaxDed: string;
//   incomeTaxAmount: string;
//   deliveryDate: string;
//   freightFrom: string;
//   remarks: string;
//   status: string;
// }

// export const getStatusStyles = (status: string) => {
//   switch (status) {
//     case 'Pending':
//       return 'bg-yellow-100 text-yellow-800 border-yellow-300';
//     case 'In Transit':
//       return 'bg-blue-100 text-blue-800 border-blue-300';
//     case 'Delivered':
//       return 'bg-green-100 text-green-800 border-green-300';
//     default:
//       return 'bg-gray-100 text-gray-800 border-gray-300';
//   }
// };

// export const columns = (
//   handleDeleteOpen: (id: string) => void,
//   handleViewOpen: (id: string) => void
// ): ColumnDef<Consignment>[] => [
//   {
//     accessorKey: 'receiptNo',
//     header: ({ column }) => (
//       <Button
//         variant="ghost"
//         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
//       >
//         Receipt No
//         <ArrowUpDown className="ml-2 h-4 w-4" />
//       </Button>
//     ),
//     cell: ({ row }) => <div>{row.original.receiptNo || '-'}</div>,
//   },
//   {
//     accessorKey: 'orderNo',
//     header: ({ column }) => (
//       <Button
//         variant="ghost"
//         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
//       >
//         Order No
//         <ArrowUpDown className="ml-2 h-4 w-4" />
//       </Button>
//     ),
//     cell: ({ row }) => <div>{row.original.orderNo || '-'}</div>,
//   },
//   {
//     accessorKey: 'biltyNo',
//     header: 'Bilty No',
//     cell: ({ row }) => <div>{row.original.biltyNo || '-'}</div>,
//   },
//   {
//     accessorKey: 'date',
//     header: 'Date',
//     cell: ({ row }) => <div>{row.original.date || '-'}</div>,
//   },
//   {
//     accessorKey: 'consignor',
//     header: 'Consignor',
//     cell: ({ row }) => <div>{row.original.consignor || '-'}</div>,
//   },
//   {
//     accessorKey: 'consignee',
//     header: 'Consignee',
//     cell: ({ row }) => <div>{row.original.consignee || '-'}</div>,
//   },
//   {
//     accessorKey: 'totalAmount',
//     header: 'Total Amount',
//     cell: ({ row }) => <div>{row.original.totalAmount || '-'}</div>,
//   },
//   {
//     accessorKey: 'status',
//     header: 'Status',
//     cell: ({ row }) => (
//       <span
//         className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
//           row.original.status || 'Pending'
//         )}`}
//       >
//         {row.original.status || 'Pending'}
//       </span>
//     ),
//   },
//   {
//     header: 'Actions',
//     id: 'actions',
//     cell: ({ row }) => {
//       const consignmentId = row.original.id;
//       return (
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => handleViewOpen(consignmentId)}
//           >
//             <Eye className="h-4 w-4" />
//           </Button>
//           <Link href={`/consignment/edit/${consignmentId}`}>
//             <Button variant="outline" size="sm">
//               <Edit className="h-4 w-4" />
//             </Button>
//           </Link>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => handleDeleteOpen(consignmentId)}
//           >
//             <Trash className="h-4 w-4" />
//           </Button>
//         </div>
//       );
//     },
//   },
// ];