import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type Payment = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentType: 'Advance' | 'Payment' | 'Income Tax';
  mode: string;
  bankName: string;
  chequeNo?: string;
  chequeDate?: string;
  seller: string;
  buyer: string;
  paidAmount: string;
  incomeTaxAmount?: string;
  advanceReceived?: string;
  remarks?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  status?: string;
  relatedInvoices?: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    seller: string;
    buyer: string;
    totalAmount: string;
    receivedAmount: string;
    balance: string;
  }[];
};

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]';
    case 'Approved':
      return 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]';
    case 'Canceled':
      return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void,
  handleCheckboxChange: (id: string, checked: boolean) => void
): ColumnDef<Payment>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => {
          row.getToggleSelectedHandler()(e);
          handleCheckboxChange(row.original.id, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
      />
    ),
  },
  {
    accessorKey: 'paymentNumber',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Payment#
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'paymentDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Payment Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'paymentType',
    header: 'Payment Type',
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
  },
  {
    accessorKey: 'bankName',
    header: 'Bank Name',
  },
  {
    accessorKey: 'chequeNo',
    header: 'Cheque No',
  },
  {
    accessorKey: 'chequeDate',
    header: 'Cheque Date',
  },
  {
    accessorKey: 'seller',
    header: 'Seller',
  },
  {
    accessorKey: 'buyer',
    header: 'Buyer',
  },
  {
    accessorKey: 'paidAmount',
    header: 'Paid Amount',
  },
  {
    accessorKey: 'incomeTaxAmount',
    header: 'Income Tax Amount',
  },
  {
    accessorKey: 'advanceReceived',
    header: 'Advance Received',
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
    accessorKey: 'remarks',
    header: 'Remarks',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const paymentId = row.original.id;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(paymentId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link href={`/payment/edit/${paymentId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(paymentId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];