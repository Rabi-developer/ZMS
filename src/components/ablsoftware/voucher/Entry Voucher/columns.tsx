import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row, ColumnDef } from '@tanstack/react-table';
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
  switch (status) {
    case 'Prepared':
      return 'bg-yellow-100 text-yellow-800';
    case 'Checked':
      return 'bg-blue-100 text-blue-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const columns = (
handleDeleteOpen: (id: string) => void, handlePdf: (id: string) => void, selectedVoucherIds: string[], onCheckboxChange: (id: string, checked: boolean) => void, p0: (id: string) => void): ColumnDef<Voucher>[] => [
  // Checkbox Column - Same as ConsignmentList
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
      />
    ),
    cell: ({ row }: { row: Row<Voucher> }) => (
      <input
        type="checkbox"
        checked={selectedVoucherIds.includes(row.original.id)}
        onChange={(e) => onCheckboxChange(row.original.id, e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
      />
    ),
  },

  {
    header: 'Voucher No',
    accessorKey: 'voucherNo',
  },
  {
    header: 'Voucher Date',
    accessorKey: 'voucherDate',
  },
  {
    header: 'Reference No',
    accessorKey: 'referenceNo',
  },
  {
    header: 'Payment Mode',
    accessorKey: 'paymentMode',
  },
  {
    header: 'Paid To',
    accessorKey: 'paidTo',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Voucher> }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
          row.original.status || 'Prepared'
        )}`}
      >
        {row.original.status || 'Prepared'}
      </span>
    ),
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }: { row: Row<Voucher> }) => {
      const isApproved = String(row.original.status || '').toLowerCase() === 'approved';
      return (
      <div className="flex items-center gap-2">
        {isApproved ? (
          <Button size="sm" variant="outline" className="text-gray-500 cursor-not-allowed" disabled title="Approved records can't be edited">
            <Edit size={16} />
          </Button>
        ) : (
          <Link href={`/entryvoucher/edit/${row.original.id}`}>
            <Button size="sm" variant="outline" className="hover:bg-yellow-50">
              <Edit size={16} />
            </Button>
          </Link>
        )}

        <Button
          size="sm"
          variant="outline"
          className="hover:bg-blue-50 text-blue-600"
          title="Download PDF"
          onClick={(e) => {
            e.stopPropagation();
            handlePdf(row.original.id);
          }}
        >
          <MdReceipt size={16} />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="hover:bg-red-50 text-red-600"
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
