import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';

export interface PaymentABL {
  files: any;
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
  // Some APIs send 'PaymentABLItem', others send 'paymentABLItem'. Support both.
  PaymentABLItem?: Array<{
    orderNo: string;
    vehicleNo: string;
  }>;
  paymentABLItem?: Array<{
    orderNo: string;
    vehicleNo: string;
}>;
}

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

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleCheckboxChange: (paymentId: string, checked: boolean) => void,
  selectedPaymentIds: string[]
): ColumnDef<PaymentABL>[] => [
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
        checked={selectedPaymentIds.includes(row.original.id)}
        onChange={(e) => {
          e.stopPropagation();
          handleCheckboxChange(row.original.id, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    ),
  },
  {
    header: 'Payment No',
    accessorKey: 'paymentNo',
    cell: ({ row }: { row: Row<PaymentABL> }) => (
      <span>{row.index + 1}</span>
    ),
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
    header: 'Order No',
    cell: ({ row }: { row: Row<PaymentABL> }) => {
      const items = row.original.PaymentABLItem ?? row.original.paymentABLItem ?? [];
      const orderNos = Array.isArray(items) ? items.map((item: any) => item.orderNo).filter(Boolean) : [];
      return <span>{orderNos.join(', ')}</span>;
    },
  },
  {
    header: 'Vehicle No',
    cell: ({ row }: { row: Row<PaymentABL> }) => {
      const items = row.original.PaymentABLItem ?? row.original.paymentABLItem ?? [];
      const vehicleNos = Array.isArray(items) ? items.map((item: any) => item.vehicleNo).filter(Boolean) : [];
      return <span>{vehicleNos.join(', ')}</span>;
    },
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
