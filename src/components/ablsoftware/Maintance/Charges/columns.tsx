import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';

export interface Charge {
  files: any;
  id: string;
  chargeNo: string;
  chargeDate: string;
  orderNo: string | null;
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

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleCheckboxChange: (chargeId: string, checked: boolean) => void,
  selectedChargeIds: string[]
): ColumnDef<Charge>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedChargeIds.includes(row.original.id)}
        onChange={(e) => {
          e.stopPropagation();
          handleCheckboxChange(row.original.id, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    ),
  },
  {
    header: 'Charge No',
    accessorKey: 'chargeNo',
    cell: ({ row }: { row: Row<Charge> }) => (
      <span>{row.index + 1}</span>
    ),
    
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
    header: 'Amount',
    accessorKey: 'amount',
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
    header: '',
    accessorKey: 'name',
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