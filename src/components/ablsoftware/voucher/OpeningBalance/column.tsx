// import { ColumnDef } from '@tanstack/react-table';
// import { Button } from '@/components/ui/button';
// import { Edit, Trash2 } from 'lucide-react';
// import Link from 'next/link';

// export interface OpeningBalanceEntry {
//   id: string;
//   description: string;
//   entryDate: string;       // or use the date from first entry
//   totalDebit: number;
//   totalCredit: number;
//   status?: string;
//   createdAt?: string;
// }

// export const columns: ColumnDef<OpeningBalanceEntry>[] = [
//   {
//     accessorKey: 'description',
//     header: 'Description',
//   },
//   {
//     accessorKey: 'entryDate',
//     header: 'Date',
//     cell: ({ row }) => row.original.entryDate || '-',
//   },
//   {
//     accessorKey: 'totalDebit',
//     header: 'Total Debit',
//     cell: ({ row }) => row.original.totalDebit?.toLocaleString() || '0.00',
//   },
//   {
//     accessorKey: 'totalCredit',
//     header: 'Total Credit',
//     cell: ({ row }) => row.original.totalCredit?.toLocaleString() || '0.00',
//   },
//   {
//     accessorKey: 'status',
//     header: 'Status',
//     cell: ({ row }) => (
//       <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
//         {row.original.status || 'Recorded'}
//       </span>
//     ),
//   },
//   {
//     id: 'actions',
//     header: 'Actions',
//     cell: ({ row }) => (
//       <div className="flex gap-2">
//         <Link href={`/opening-balance/edit/${row.original.id}`}>
//           <Button variant="outline" size="sm">
//             <Edit size={16} />
//           </Button>
//         </Link>
//         <Button
//           variant="outline"
//           size="sm"
//           className="text-red-600 hover:text-red-700"
//           onClick={() => {
//             // handle delete modal
//             // e.g. openDeleteModal(row.original.id)
//           }}
//         >
//           <Trash2 size={16} />
//         </Button>
//       </div>
//     ),
//   },
// ];