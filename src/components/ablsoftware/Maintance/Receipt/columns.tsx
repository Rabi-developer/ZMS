import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row } from '@tanstack/react-table';

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-red-100 text-red-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

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
  totalAmount: string;
  status: string;
  orderNo?: string;
}

export const columns = (handleDeleteOpen: (id: string) => void) => [
  {
    header: 'Receipt No',
    accessorKey: 'receiptNo',
  },
  {
    header: 'Receipt Date',
    accessorKey: 'receiptDate',
  },
  {
    header: 'Party',
    accessorKey: 'party',
  },
  {
    header: 'Payment Mode',
    accessorKey: 'paymentMode',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Receipt> }) => (
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Pending')}`}>
        {row.original.status || 'Pending'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<Receipt> }) => (
      <div className="flex space-x-2">
        <Link href={`/receipt/edit/${row.original.id}`}>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
            <Edit size={16} />
          </Button>
        </Link>
        <Button
          size="sm"
          className="bg-red-500 hover:bg-red-600"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteOpen(row.original.id);
          }}
        >
          <Trash size={16} />
        </Button>
      </div>
    ),
  },
];