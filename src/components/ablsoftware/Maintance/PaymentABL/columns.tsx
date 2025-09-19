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

export interface PaymentABL {
  id: string;
  paymentNo: string;
  paymentDate: string;
  paidTo: string;
  paymentMode: string;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  paidAmount: string;
  status: string;
  items?: Array<{
    orderNo: string;
  }>;
}

export const columns = (handleDeleteOpen: (id: string) => void) => [
  {
    header: 'Payment No',
    accessorKey: 'paymentNo',
  },
  {
    header: 'Payment Date',
    accessorKey: 'paymentDate',
  },
  {
    header: 'Paid To',
    accessorKey: 'paidTo',
  },
  {
    header: 'Payment Mode',
    accessorKey: 'paymentMode',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<PaymentABL> }) => (
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Pending')}`}>
        {row.original.status || 'Pending'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<PaymentABL> }) => (
      <div className="flex space-x-2">
        <Link href={`/paymentABL/edit/${row.original.id}`}>
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
