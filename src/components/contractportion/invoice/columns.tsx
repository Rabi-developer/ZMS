import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate?: string;
  seller?: string;
  buyer?: string;
  invoiceremarks?: string;
  status?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  relatedContracts?: {
    fabricValue: string;
    id?: string;
    contractNumber?: string;
    fabricDetails?: string;
    dispatchQty?: string;
    invoiceQty?: string;
    invoiceRate?: string;
    invoiceValue?: string;
    gst?: string;
    gstPercentage?: string;
    gstValue?: string;
    invoiceValueWithGst?: string;
    whtPercentage?: string;
    whtValue?: string;
    totalInvoiceValue?: string;
    warpCount?: string;
    warpYarnType?: string;
    weftCount?: string;
    weftYarnType?: string;
    noOfEnds?: string;
    noOfPicks?: string;
    weaves?: string;
    width?: string;
    final?: string;
    selvedge?: string;
  }[];
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Prepared':
      return 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]';
    case 'Approved':
      return 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]';
    case 'Canceled':
      return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]';
    case 'Closed':
      return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]';
    case 'UnApproved':
      return 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void,
  handleCheckboxChange: (id: string, checked: boolean) => void
): ColumnDef<Invoice>[] => [
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
    accessorKey: 'invoiceNumber',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Invoice Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'invoiceDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted?.() === 'asc')}
      >
        Invoice Date
        <ArrowUpDown className="ml-2 h-4 w-4"/>
      </Button>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => <div>{row.original.dueDate || '-'}</div>,
  },
  {
    accessorKey: 'seller',
    header: 'Seller',
    cell: ({ row }) => <div>{row.original.seller || '-'}</div>,
  },
  {
    accessorKey: 'buyer',
    header: 'Buyer',
    cell: ({ row }) => <div>{row.original.buyer || '-'}</div>,
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
    accessorKey: 'invoiceremarks',
    header: 'Remarks',
    cell: ({ row }) => <div>{row.original.invoiceremarks || '-'}</div>,
  },
  {
        accessorKey: 'name',
        header: '',
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
          <Link href={`/invoice/edit/${invoiceId}`}>
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