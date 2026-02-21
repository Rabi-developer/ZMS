import { Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { MdReceipt } from 'react-icons/md';

export interface Voucher {
  files: any;
  id: string;
  voucherNo: string;
  voucherDate: string;
  referenceNo: string;
  paymentMode: string;
  paidTo: string;
  totalDebit: string;
  totalCredit: string;
  status: string;
}

export const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase() || 'prepared') {
    case 'prepared':
      return 'bg-yellow-100 text-yellow-800';
    case 'checked':
      return 'bg-blue-100 text-blue-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handlePdf: (id: string) => void,
  selectedVoucherIds: string[],
  onCheckboxChange: (id: string, checked: boolean) => void
): ColumnDef<Voucher>[] => [
  // Checkbox Column
  {
    id: 'select',
    header: ({ table }) => {
      const rowIds = table.getRowModel().rows.map((r) => r.original.id);
      const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedVoucherIds.includes(id));

      const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const checked = e.target.checked;

        rowIds.forEach((id) => {
          const isCurrentlySelected = selectedVoucherIds.includes(id);
          if (checked && !isCurrentlySelected) {
            onCheckboxChange(id, true);
          } else if (!checked && isCurrentlySelected) {
            onCheckboxChange(id, false);
          }
        });
      };

      return (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={handleToggleAll}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      );
    },
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedVoucherIds.includes(row.original.id)}
        onChange={(e) => {
          e.stopPropagation();
          onCheckboxChange(row.original.id, e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
      />
    ),
  },

  // Voucher No
  {
    header: 'Voucher No',
    accessorKey: 'voucherNo',
    enableColumnFilter: true,
  },

  // Voucher Date
  {
    header: 'Voucher Date',
    accessorKey: 'voucherDate',
    enableColumnFilter: true,
  },

  // Reference No
  {
    header: 'Reference No',
    accessorKey: 'referenceNo',
    enableColumnFilter: true,
  },

  // Payment Mode
  {
    header: 'Payment Mode',
    accessorKey: 'paymentMode',
    enableColumnFilter: true,
  },

  // Paid To
  {
    header: 'Paid To',
    accessorKey: 'paidTo',
    enableColumnFilter: true,
  },

  // Total Debit
  {
    header: 'Total Debit',
    accessorKey: 'totalDebit',
    cell: ({ row }) => {
      const value = row.original.totalDebit || '0';
      return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    enableColumnFilter: true,
  },

  // Total Credit
  {
    header: 'Total Credit',
    accessorKey: 'totalCredit',
    cell: ({ row }) => {
      const value = row.original.totalCredit || '0';
      return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    enableColumnFilter: true,
  },

  // Status
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
    enableColumnFilter: true,
  },

  // Actions Column (now includes View button)
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const isApproved = String(row.original.status || '').toLowerCase() === 'approved';

      return (
        <div className="flex items-center gap-2">
          {/* View Button - always available */}
          <Link href={`/entryvoucher/edit/${row.original.id}?mode=view`}>
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-blue-50 text-blue-600 border-blue-200"
              title="View Details"
            >
              <Eye size={16} />
            </Button>
          </Link>

          {/* Edit Button - disabled if approved */}
          {isApproved ? (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="text-gray-400 cursor-not-allowed"
              title="Approved records cannot be edited"
            >
              <Edit size={16} />
            </Button>
          ) : (
            <Link href={`/entryvoucher/edit/${row.original.id}`}>
              <Button size="sm" variant="outline" className="hover:bg-yellow-50">
                <Edit size={16} />
              </Button>
            </Link>
          )}

          {/* PDF / Receipt Button */}
          <Button
            size="sm"
            variant="outline"
            className="hover:bg-blue-50 text-blue-600 border-blue-200"
            title="Download PDF"
            onClick={(e) => {
              e.stopPropagation();
              handlePdf(row.original.id);
            }}
          >
            <MdReceipt size={16} />
          </Button>

          {/* Delete Button */}
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