import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row } from '@tanstack/react-table';
import { MdReceipt } from 'react-icons/md';

export interface Voucher {
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
    case 'Posted':
      return 'bg-green-100 text-green-800';
    case 'Draft':
      return 'bg-yellow-100 text-yellow-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const columns = (handleDeleteOpen: (id: string) => void, handlePdf: (id: string) => void) => [
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
  // {
  //   header: 'Total Debit',
  //   accessorKey: 'totalDebit',
  // },
  // {
  //   header: 'Total Credit',
  //   accessorKey: 'totalCredit',
  // },
  {
    header: '',
    accessorKey: 'name',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Voucher> }) => (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Draft')}`}>
          {row.original.status || 'Draft'}
        </span>
        <select
          className="border border-gray-300 rounded p-1 text-xs"
          defaultValue={row.original.status || 'Prepared'}
          onClick={(e) => e.stopPropagation()}
          onChange={async (e) => {
            const newStatus = e.target.value;
            try {
              const { updateEntryVoucherStatus } = await import('@/apis/entryvoucher');
              await updateEntryVoucherStatus({ id: row.original.id, status: newStatus });
              // Optimistically update cell UI
              row.original.status = newStatus as any;
              (e.target as HTMLSelectElement).blur();
            } catch (err) {
              console.error(err);
              alert('Failed to update status');
            }
          }}
        >
          {['Prepared', 'Checked', 'Approved', 'UnApproved'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<Voucher> }) => (
      <div className="flex space-x-2">
        <Link href={`/vouchers/edit/${row.original.id}`}>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600" title="Edit">
            <Edit size={16} />
          </Button>
        </Link>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
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
          className="bg-red-500 hover:bg-red-600"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteOpen(row.original.id);
          }}
        >
          <Trash size={16} />
        </Button>
      </div>
    ),
  },
];