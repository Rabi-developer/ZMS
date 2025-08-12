// import { ColumnDef } from '@tanstack/react-table';
// import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// export interface BookingOrder {
//   id: string;
//   orderNo: string;
//   orderDate: string;
//   company: string;
//   branch: string;
//   totalBookValue: string;
//   transporter: string;
//   vendor: string;
//   totalAmountReceived: string;
//   vehicleNo: string;
//   vehicleType: string;
//   totalCharges: string;
//   driverName: string;
//   contactNo: string;
//   munshayana: string;
//   cargoWeight: string;
//   bookedDays: string;
//   detentionDays: string;
//   netProfitLoss: string;
//   fromLocation: string;
//   departureDate: string;
//   via1: string;
//   via2: string;
//   toLocation: string;
//   expectedReachedDate: string;
//   reachedDate: string;
//   vehicleMunshyana: string;
//   remarks: string;
//   contractOwner: string;
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
// ): ColumnDef<BookingOrder>[] => [
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
//     accessorKey: 'orderDate',
//     header: ({ column }) => (
//       <Button
//         variant="ghost"
//         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
//       >
//         Order Date
//         <ArrowUpDown className="ml-2 h-4 w-4" />
//       </Button>
//     ),
//     cell: ({ row }) => <div>{row.original.orderDate || '-'}</div>,
//   },
//   {
//     accessorKey: 'company',
//     header: 'Company',
//     cell: ({ row }) => <div>{row.original.company || '-'}</div>,
//   },
//   {
//     accessorKey: 'branch',
//     header: 'Branch',
//     cell: ({ row }) => <div>{row.original.branch || '-'}</div>,
//   },
//   {
//     accessorKey: 'totalBookValue',
//     header: 'Total Book Value',
//     cell: ({ row }) => <div>{row.original.totalBookValue || '-'}</div>,
//   },
//   {
//     accessorKey: 'transporter',
//     header: 'Transporter',
//     cell: ({ row }) => <div>{row.original.transporter || '-'}</div>,
//   },
//   {
//     accessorKey: 'vendor',
//     header: 'Vendor',
//     cell: ({ row }) => <div>{row.original.vendor || '-'}</div>,
//   },
//   {
//     accessorKey: 'vehicleNo',
//     header: 'Vehicle No',
//     cell: ({ row }) => <div>{row.original.vehicleNo || '-'}</div>,
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
//       const orderId = row.original.id;
//       return (
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => handleViewOpen(orderId)}
//           >
//             <Eye className="h-4 w-4" />
//           </Button>
//           <Link href={`/bookingorder/edit/${orderId}`}>
//             <Button variant="outline" size="sm">
//               <Edit className="h-4 w-4" />
//             </Button>
//           </Link>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => handleDeleteOpen(orderId)}
//           >
//             <Trash className="h-4 w-4" />
//           </Button>
//         </div>
//       );
//     },
//   },
// ];