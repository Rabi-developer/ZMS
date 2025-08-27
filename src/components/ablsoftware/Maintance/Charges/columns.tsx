import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row } from '@tanstack/react-table';

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Unpaid':
      return 'bg-red-100 text-red-800';
    case 'Paid':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export interface Charge {
  id: string;
  chargeNo: string;
  chargeDate: string;
  orderNo: string;
  unpaidCharges: string;
  payment: string;
  charges: string;
  biltyNo: string;
  date: string;
  vehicleNo: string;
  paidToPerson: string;
  contactNo: string;
  remarks: string;
  amount: string;
  paidAmount: string;
  bankCash: string;
  chqNo: string;
  chqDate: string;
  payNo: string;
  total: string;
  status: string;
}

export const columns = (handleDeleteOpen: (id: string) => void) => [
  {
    header: 'Charge No',
    accessorKey: 'chargeNo',
  },
  {
    header: 'Charge Date',
    accessorKey: 'chargeDate',
  },
  {
    header: 'Order No',
    accessorKey: 'orderNo',
  },
  {
    header: 'Unpaid Charges',
    accessorKey: 'unpaidCharges',
  },
  {
    header: 'Payment',
    accessorKey: 'payment',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Charge> }) => (
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Unpaid')}`}>
        {row.original.status || 'Unpaid'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<Charge> }) => (
      <div className="flex space-x-2">
        <Link href={`/charges/edit/${row.original.id}`}>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600" onClick={(e) => e.stopPropagation()}>
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