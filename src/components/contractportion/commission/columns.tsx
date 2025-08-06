import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type CommissionInvoice = {
  id: string;
  commissionInvoiceNumber: string;
  date: string;
  dueDate: string;
  commissionFrom: 'Seller' | 'Buyer' | 'Both';
  seller?: string;
  buyer?: string;
  remarks?: string;
  excludeSRB?: boolean;
  status?: string;
  relatedInvoices?: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    buyer: string;
    quality: string;
    invoiceQty: string;
    rate: string;
    invoiceValue: string;
    commissionPercent: string;
    amount: string;
    srTax: string;
    srTaxAmount: string;
    totalAmount: string;
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
    case 'Completed':
      return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void,
  handleCheckboxChange: (id: string, checked: boolean) => void
): ColumnDef<CommissionInvoice>[] => [
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
    accessorKey: 'commissionInvoiceNumber',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Comm.Invoice#
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Due Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'commissionFrom',
    header: 'Commission From',
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
    accessorKey: 'excludeSRB',
    header: 'Exclude SRB',
    cell: ({ row }) => (row.original.excludeSRB ? 'Yes' : 'No'),
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
      const invoiceId = row.original.id;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(invoiceId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link href={`/commission-invoice/edit/${invoiceId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(invoiceId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

