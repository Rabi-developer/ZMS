'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type DispatchNote = {
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
};

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
  {
    accessorKey: 'bilty',
    header: 'Bilty Number',
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
    accessorKey: 'vehicleType',
    header: 'Vehicle Type',
  },
  // {
  //   accessorKey: 'vehicle',
  //   header: 'Vehicle',
  // },
  {
    accessorKey: 'contractNumber',
    header: 'Contract Number',
  },
  {
    accessorKey: 'driverName',
    header: 'Driver Name',
  },
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
          {/* <Link href={`/dispatchnote/edit/${dispatchNoteId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link> */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(dispatchNoteId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];