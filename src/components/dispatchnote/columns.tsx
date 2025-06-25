'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type DispatchNote = {
  id: string;
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
  // {
  //   accessorKey: 'listid',
  //   header: ({ column }) => (
  //     <Button
  //       variant="ghost"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
  //     >
  //       ID
  //       <ArrowUpDown className="ml-2 h-4 w-4" />
  //     </Button>
  //   ),
  // },
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
    accessorKey: 'remarks',
    header: 'Vechile#',
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
        </div>
      );
    },
  },
];