'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAllDispatchNotes } from '@/apis/dispatchnote';
import { useState, useEffect } from 'react';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  seller: string;
  buyer: string;
  status: string;
  invoiceremarks?: string;
  dispatchNoteId: string;
  inspectionNotes?: {
    id: string;
    irnNumber: string;
    irnDate: string;
    status?: string;
    relatedContracts?: {
      id?: string;
      contractNumber?: string;
      quantity?: string;
      dispatchQuantity?: string;
      bGrade?: string;
      sl?: string;
      shrinkage?: string;
      returnFabric?: string;
      aGrade?: string;
      inspectedBy?: string;
    }[];
  }[];
  relatedContracts?: {
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
  }[];
}

interface DispatchNote {
  id: string;
  listid: string;
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Approved Inspection':
      return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]';
    case 'UnApproved Inspection':
      return 'bg-[#5673ba]/10 text-[#5673ba] border-[#5673ba]';
    case 'Active':
      return 'bg-[#869719]/10 text-[#869719] border-[#869719]';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void,
  handleCheckboxChange: (invoiceId: string, checked: boolean) => void
): ColumnDef<Invoice>[] => {
  const [dispatchNotes, setDispatchNotes] = useState<DispatchNote[]>([]);

  useEffect(() => {
    const fetchDispatchNotes = async () => {
      try {
        const response = await getAllDispatchNotes(1, 1000);
        setDispatchNotes(response?.data || []);
      } catch (error) {
        console.error('Failed to fetch dispatch notes:', error);
      }
    };
    fetchDispatchNotes();
  }, []);

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={(e) => {
            table.toggleAllRowsSelected(e.target.checked);
            const rowIds = e.target.checked ? table.getRowModel().rows.map((row) => row.original.id) : [];
            rowIds.forEach((id) => handleCheckboxChange(id, e.target.checked));
          }}
          className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => {
            row.toggleSelected(e.target.checked);
            handleCheckboxChange(row.original.id, e.target.checked);
          }}
          className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
        />
      ),
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
        const latestInspection = row.original.inspectionNotes?.[0];
        return <div>{latestInspection?.irnDate || '-'}</div>;
      },
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
      cell: ({ row }) => <div>{row.original.invoiceNumber || '-'}</div>,
    },
    {
      accessorKey: 'dispatchNoteId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Dispatch Note #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dispatchNote = dispatchNotes.find((dn) => dn.id === row.original.dispatchNoteId);
        return <div>{dispatchNote?.listid || '-'}</div>;
      },
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
      cell: ({ row }) => <div>{row.original.invoiceDate || '-'}</div>,
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
      header: 'Invoice Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
            row.original.status || 'Approved'
          )}`}
        >
          {row.original.status || 'Approved'}
        </span>
      ),
    },
    {
      accessorKey: 'inspectStatus',
      header: 'Inspect Status',
      cell: ({ row }) => {
        const latestInspection = row.original.inspectionNotes?.[0];
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
      accessorKey: 'invoiceremarks',
      header: 'Remarks',
      cell: ({ row }) => <div>{row.original.invoiceremarks || '-'}</div>,
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
            <Link href={`/inspectionnote/create?invoiceId=${encodeURIComponent(invoiceId)}`}>
              <Button variant="outline" size="sm">
                Inspect
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];
};