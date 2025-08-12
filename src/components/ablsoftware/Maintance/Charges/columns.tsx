// import { ColumnDef } from '@tanstack/react-table';
// import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// export interface Charge {
//   id: string;
//   chargeNo: string;
//   chargeDate: string;
//   orderNo: string;
//   unpaidCharges: string;
//   payment: string;
//   charges: string;
//   biltyNo: string;
//   date: string;
//   vehicleNo: string;
//   paidToPerson: string;
//   contactNo: string;
//   remarks: string;
//   amount: string;
//   paidAmount: string;
//   bankCash: string;
//   chqNo: string;
//   chqDate: string;
//   payNo: string;
//   total: string;
//   status: string;
// }

// export const getStatusStyles = (status: string) => {
//   switch (status) {
//     case 'Unpaid':
//       return 'bg-red-100 text-red-800 border-red-300';
//     case 'Paid':
//       return 'bg-green-100 text-green-800 border-green-300';
//     default:
//       return 'bg-gray-100 text-gray-800 border-gray-300';
//   }
// };

// export const columns = (
//   handleDeleteOpen: (id: string) => void,
//   handleViewOpen: (id: string) => void
// ): ColumnDef<Charge>[] => [
//   {
//     accessorKey: 'chargeNo',
//     header: ({ column }) => (
//       <Button
//         variant="ghost"
//         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
//       >
//         Charge No
//         <ArrowUpDown className="ml-2 h-4 w-4" />
//       </Button>
//     ),
//     cell: ({ row }) => <div>{row.original.chargeNo || '-'}</div>,
//   },
//   {
//     accessorKey: 'chargeDate',
//     header: ({ column }) => (
//       <Button
//         variant="ghost"
//         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
//       >
//         Charge Date
//         <ArrowUpDown className="ml-2 h-4 w-4" />
//       </Button>
//     ),
//     cell: ({ row }) => <div>{row.original.chargeDate || '-'}</div>,
//   },
//   {
//     accessorKey: 'orderNo',
//     header: 'Order No',
//     cell: ({ row }) => <div>{row.original.orderNo || '-'}</div>,
//   },
//   {
//     accessorKey: 'paidToPerson',
//     header: 'Paid to Person',
//     cell: ({ row }) => <div>{row.original.paidToPerson || '-'}</div>,
//   },
//   {
//     accessorKey: 'amount',
//     header: 'Amount',
//     cell: ({ row }) => <div>{row.original.amount || '-'}</div>,
//   },
//   {
//     accessorKey: 'paidAmount',
//     header: 'Paid Amount',
//     cell: ({ row }) => <div>{row.original.paidAmount || '-'}</div>,
//   },
//   {
//     accessorKey: 'total',
//     header: 'Total',
//     cell: ({ row }) => <div>{row.original.total || '-'}</div>,
//   },
//   {
//     accessorKey: 'status',
//     header: 'Status',
//     cell: ({ row }) => (
//       <span
//         className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
//           row.original.status || 'Unpaid'
//         )}`}
//       >
//         {row.original.status || 'Unpaid'}
//       </span>
//     ),
//   },
//   {
//     header: 'Actions',
//     id: 'actions',
//     cell: ({ row }) => {
//       const chargeId = row.original.id;
//       return (
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => handleViewOpen(chargeId)}
//           >
//             <Eye className="h-4 w-4" />
//           </Button>
//           <Link href={`/charges/edit/${chargeId}`}>
//             <Button variant="outline" size="sm">
//               <Edit className="h-4 w-4" />
//             </Button>
//           </Link>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => handleDeleteOpen(chargeId)}
//           >
//             <Trash className="h-4 w-4" />
//           </Button>
//         </div>
//       );
//     },
//   },
// ];