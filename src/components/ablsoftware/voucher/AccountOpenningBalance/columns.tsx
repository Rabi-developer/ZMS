// columns.tsx
import { Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';

export interface AccountOpeningBalance {
  id: string;
  accountOpeningNo?: number;
  accountOpeningDate?: string;
  accountOpeningBalanceEntrys?: Array<{
    id: string;
    account: string | { id?: string; description?: string; name?: string };
    debit: number;
    credit: number;
    narration?: string;
  }>;
  status?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
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

const formatPrimaryWithMore = (items: string[]) => {
  if (!items.length) return '-';
  if (items.length === 1) return items[0];
  return `${items[0]} +${items.length - 1} more`;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  accountIndex: Record<string, any>,
  handleCheckboxChange: (id: string, checked: boolean) => void,
  selectedIds: string[]
): ColumnDef<AccountOpeningBalance>[] => [
  {
    id: 'select',
    header: ({ table }) => {
      const rowIds = table.getRowModel().rows.map((r) => r.original.id);
      const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
      return (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => {
            e.stopPropagation();
            rowIds.forEach((id) => handleCheckboxChange(id, e.target.checked));
          }}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      );
    },
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedIds.includes(row.original.id)}
        onChange={(e) => {
          e.stopPropagation();
          handleCheckboxChange(row.original.id, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    ),
  },
  {
    header: 'Opening No',
    accessorKey: 'accountOpeningNo',
    cell: ({ row }) => row.original.accountOpeningNo || '-',
  },
  {
    header: 'Date',
    accessorKey: 'accountOpeningDate',
    cell: ({ row }) => {
      const date = row.original.accountOpeningDate;
      if (!date) return '-';
      try {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return date;
      }
    },
  },
  {
    header: 'Accounts',
    accessorKey: 'accountOpeningBalanceEntrys',
    cell: ({ row }) => {
      const entries = row.original.accountOpeningBalanceEntrys || [];
      if (entries.length === 0) return '-';

      const getAccountLabel = (account: any): string => {
        if (!account) return '-';
        if (typeof account === 'string') {
          return accountIndex[account]?.description || account;
        }
        const id = account.id || account.accountId || '';
        if (id && accountIndex[id]?.description) return accountIndex[id].description;
        return account.description || account.name || id || '-';
      };

      const accountNames = entries
        .map((entry) => getAccountLabel(entry.account))
        .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates

      return formatPrimaryWithMore(accountNames);
    },
  },
  {
    header: 'Total Debit',
    id: 'totalDebit',
    cell: ({ row }) => {
      const total = row.original.accountOpeningBalanceEntrys?.reduce(
        (sum, entry) => sum + (entry.debit || 0),
        0
      ) || 0;
      return total.toLocaleString('en-US', { minimumFractionDigits: 2 });
    },
  },
  {
    header: 'Total Credit',
    id: 'totalCredit',
    cell: ({ row }) => {
      const total = row.original.accountOpeningBalanceEntrys?.reduce(
        (sum, entry) => sum + (entry.credit || 0),
        0
      ) || 0;
      return total.toLocaleString('en-US', { minimumFractionDigits: 2 });
    },
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
          <Link href={`/AccountOpeningBalance/edit/${row.original.id}?mode=view`}>
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-blue-50 text-blue-600 border-blue-200"
              title="View Details"
            >
              <Eye size={16} />
            </Button>
          </Link>
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
