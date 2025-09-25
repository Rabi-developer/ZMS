import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';

export interface BillPaymentInvoice {
  id: string;
  invoiceNo: string;
  paymentDate: string;
  totalAmount: string;
  status: string;
  vehicleNo: string;
  orderNo: string;
  amount: string;
  broker: string;
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
  handleCheckboxChange: (billPaymentId: string, checked: boolean) => void,
  selectedBillPaymentIds: string[]
): ColumnDef<BillPaymentInvoice>[] => [
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
        checked={selectedBillPaymentIds.includes(row.original.id)}
        onChange={(e) => {
          e.stopPropagation();
          handleCheckboxChange(row.original.id, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    ),
  },
  {
    header: 'Invoice No',
    accessorKey: 'invoiceNo',
  },
  {
    header: 'Vehicle No',
    accessorKey: 'vehicleNo',
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
    header: 'Broker',
    accessorKey: 'broker',
  },
  {
    header: 'Payment Date',
    accessorKey: 'paymentDate',
  },
  {
    header: 'Total Amount',
    accessorKey: 'totalAmount',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<BillPaymentInvoice> }) => (
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Unpaid')}`}>
        {row.original.status || 'Unpaid'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<BillPaymentInvoice> }) => (
      <div className="flex space-x-2">
        <Link href={`/billpaymentinvoices/edit/${row.original.id}`}>
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