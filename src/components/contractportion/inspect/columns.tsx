'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface DispatchNote {
  id: string;
  status: string;
  listid: string;
  date: string;
  bilty: string;
  seller: string;
  buyer: string;
  vehicleType?: string;
  vehicle?: string;
  contractNumber: string;
  remarks?: string;
  driverName: string;
  driverNumber?: string;
  transporter?: string;
  destination?: string;
  createdBy?: string | null;
  creationDate?: string;
  updatedBy?: string | null;
  updationDate?: string;
  inspectionNotes?: {
    id: string;
    irnNumber: string;
    irnDate: string;
    status?: string;
  }[];
  relatedContracts?: {
    id: string;
    contractNumber: string;
    seller: string;
    buyer: string;
    fabricDetails: string;
    rate: string;
    contractQuantity?: string | null;
    date: string;
    quantity: string;
    totalAmount: string;
    dispatchQuantity?: string | null;
    totalDispatchQuantity: string;
    balanceQuantity: string;
    contractType: string;
    base: string;
    buyerRefer?: string;
    widthOrColor?: string;
    rowId?: string | null;
  }[];
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
  handleCheckboxChange: (dispatchNoteId: string, checked: boolean) => void
): ColumnDef<DispatchNote>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={(e) => {
          table.toggleAllRowsSelected(e.target.checked);
          const rowIds = e.target.checked ? table.getRowModel().rows.map((row) => row.original.id) : [];
          handleCheckboxChange('all', e.target.checked);
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
    accessorKey: 'listid',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Dispatch Note ID
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
        Dispatch Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  // {
  //   accessorKey: 'bilty',
  //   header: 'Bilty Number',
  //   cell: ({ row }) => <div>{row.original.bilty || '-'}</div>,
  // },
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
    header: 'Dispatch Status',
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
  // {
  //   accessorKey: 'vehicleType',
  //   header: 'Vehicle Type',
  //   cell: ({ row }) => <div>{row.original.vehicleType || '-'}</div>,
  // },
  // {
  //   accessorKey: 'driverName',
  //   header: 'Driver Name',
  //   cell: ({ row }) => <div>{row.original.driverName || '-'}</div>,
  // },
  // {
  //   accessorKey: 'remarks',
  //   header: 'Remarks',
  //   cell: ({ row }) => <div>{row.original.remarks || '-'}</div>,
  // },
  {
    accessorKey: 'name',
    header: '',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const dispatchNoteId = row.original.id;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(dispatchNoteId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link href={`/dispatchnote/edit/${dispatchNoteId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(dispatchNoteId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
          <Link href={`/inspectionnote/create?dispatchNoteId=${encodeURIComponent(dispatchNoteId)}`}>
            <Button variant="outline" size="sm">
              Inspect
            </Button>
          </Link>
        </div>
      );
    },
  },
];