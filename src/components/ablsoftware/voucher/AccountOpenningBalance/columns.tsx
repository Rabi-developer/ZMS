// columns.tsx
import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';

export interface AccountOpeningBalance {
  id: string;
  openingNo?: string;
  openingDate?: string;
  // per-entry fields (assuming flattened or first entry shown – adjust if needed)
  accountId: string;
  debit: number;
  credit: number;
  narration?: string;
  status?: string;
}

export const getStatusStyles = (status: string = 'Prepared') => {
  switch (status.toLowerCase()) {
    case 'prepared':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'checked':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  accountIndex: Record<string, any>
): ColumnDef<AccountOpeningBalance>[] => [
  {
    header: 'Opening No',
    accessorKey: 'openingNo',
    cell: ({ row }) => row.original.openingNo || '-',
  },
  {
    header: 'Date',
    accessorKey: 'openingDate',
    cell: ({ row }) => row.original.openingDate || '-',
  },
  {
    header: 'Account',
    accessorKey: 'accountId',
    cell: ({ row }) =>
      accountIndex[row.original.accountId]?.description || row.original.accountId || '-',
  },
  {
    header: 'Debit',
    accessorKey: 'debit',
    cell: ({ row }) =>
      row.original.debit ? row.original.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
  },
  {
    header: 'Credit',
    accessorKey: 'credit',
    cell: ({ row }) =>
      row.original.credit ? row.original.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
  },
  {
    header: 'Narration',
    accessorKey: 'narration',
    cell: ({ row }) => row.original.narration || '-',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.original.status || 'Prepared';
      return (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const isApproved = (row.original.status || '').toLowerCase() === 'approved';

      return (
        <div className="flex items-center gap-2">
          {isApproved ? (
            <Button
              size="sm"
              variant="outline"
              className="text-gray-400 cursor-not-allowed"
              disabled
              title="Approved records cannot be edited"
            >
              <Edit size={16} />
            </Button>
          ) : (
            <Link href={`/AccountOpeningBalance/edit/${row.original.id}`}>
              <Button size="sm" variant="outline" className="hover:bg-amber-50">
                <Edit size={16} />
              </Button>
            </Link>
          )}

          <Button
            size="sm"
            variant="outline"
            className="hover:bg-red-50 text-red-600 border-red-200"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteOpen(row.original.id);
            }}
          >
            <Trash size={16} />
          </Button>
        </div>
      );
    },
  },
];