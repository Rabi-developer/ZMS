'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  seller: string;
  buyer: string;
  status: string;
  remarks?: string;
  inspectionNotes?: { 
    id: string;
    irnNumber: string;
    irnDate: string;
  }[];
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    quantity?: string;
    dispatchQty?: string;
    invoiceQty?: string;
    invoiceRate?: string;
    gst?: string;
    gstPercentage?: string;
    gstValue?: string;
    invoiceValueWithGst?: string;
    whtPercentage?: string;
    whtValue?: string;
    totalInvoiceValue?: string;
  }[];
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Approved':
    case 'Inspected':
      return 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]';
    case 'UnApproved':
      return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]';
    case 'Canceled':
      return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]';
    case 'Closed':
      return 'bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const columns = (
handleDeleteOpen: (id: string) => void, handleViewOpen: (id: string) => void, handleCheckboxChange: (invoiceId: string, checked: boolean) => void): ColumnDef<Invoice>[] => [
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
        onChange={e => {
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
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Invoice Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
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
    accessorKey: 'irnNumber',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        IRN Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const latestInspection = row.original.inspectionNotes?.[0];
      return <div>{latestInspection?.irnNumber || '-'}</div>;
    },
  },
  {
    accessorKey: 'irnDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        IRN Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const latestInspection = row.original.inspectionNotes?.[0]; // Display the first (latest) inspection note
      return <div>{latestInspection?.irnDate || '-'}</div>;
    },
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
    cell: ({ row }) => <div>{row.original.remarks || '-'}</div>,
  },
  {
    accessorKey: 'inspectStatus',
    header: 'Inspect Status',
    cell: ({ row }) => {
      // Try to get status from inspectionNotes[0], fallback to '-'
      const latestInspection = row.original.inspectionNotes?.[0] as { status?: string } | undefined;
      return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
            latestInspection?.status || 'Pending'
          )}`}
        >
          {latestInspection?.status || 'Pending'}
        </span>
      );
    },
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
      const invoiceNumber = row.original.invoiceNumber;
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
          <Link href={`/inspectionnote/create?invoiceNumber=${encodeURIComponent(invoiceNumber || '')}`}>
            <Button variant="outline" size="sm">
              Inspect
            </Button>
          </Link>
        </div>
      );
    },
  },
];