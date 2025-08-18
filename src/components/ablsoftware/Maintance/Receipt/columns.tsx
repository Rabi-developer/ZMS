import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface Receipt {
  id: string;
  receiptNo: string;
  receiptDate: string;
  party: string;
  paymentMode: string;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  receiptAmount: string;
  remarks: string;
  totalAmount: string;
  status: string;
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void
): ColumnDef<Receipt>[] => [
  {
    accessorKey: 'receiptNo',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Receipt No
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.original.receiptNo || '-'}</div>,
  },
  {
    accessorKey: 'receiptDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Receipt Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.original.receiptDate || '-'}</div>,
  },
  {
    accessorKey: 'party',
    header: 'Party',
    cell: ({ row }) => <div>{row.original.party || '-'}</div>,
  },
  {
    accessorKey: 'paymentMode',
    header: 'Payment Mode',
    cell: ({ row }) => <div>{row.original.paymentMode || '-'}</div>,
  },
  {
    accessorKey: 'receiptAmount',
    header: 'Receipt Amount',
    cell: ({ row }) => <div>{row.original.receiptAmount || '-'}</div>,
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total Amount',
    cell: ({ row }) => <div>{row.original.totalAmount || '-'}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
          row.original.status || 'Pending'
        )}`}
      >
        {row.original.status || 'Pending'}
      </span>
    ),
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const receiptId = row.original.id;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(receiptId)}
          >
            <Eye className=" h-4 w-4" />
          </Button>
          <Link href={`/receipts/edit/${receiptId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(receiptId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];