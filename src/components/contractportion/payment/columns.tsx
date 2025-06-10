import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type Payment = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentType: 'Advance' | 'Payment';
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
    accessorKey: 'remarks',
    header: 'Remarks',
  },
  // {
  //   accessorKey: 'name',
  //   header: '',
  // },
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