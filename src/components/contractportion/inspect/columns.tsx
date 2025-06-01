import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface InspectionNote {
  id: string;
  irnNumber: string;
  irnDate?: string;
  seller?: string;
  buyer?: string;
  invoiceNumber?: string;
  remarks?: string;
  status?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    quantity?: string;
    dispatchQty?: string;
    bGrade?: string;
    sl?: string;
    aGrade?: string;
    inspectedBy?: string;
  }[];
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]';
    case 'InspectionApproved':
      return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void,
  handleCheckboxChange: (id: string, checked: boolean) => void
): ColumnDef<InspectionNote>[] => [
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
    accessorKey: 'invoiceNumber',
    header: 'Invoice Number',
    cell: ({ row }) => <div>{row.original.invoiceNumber || '-'}</div>,
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
    accessorKey: 'name',
    header: '',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const inspectionNoteId = row.original.id;
      const invoiceNumber = row.original.invoiceNumber;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(inspectionNoteId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link href={`/inspectionnote/edit/${inspectionNoteId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(inspectionNoteId)}
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