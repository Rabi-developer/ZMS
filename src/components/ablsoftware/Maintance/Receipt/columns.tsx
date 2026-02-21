import { Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';

export interface Receipt {
  files: any;
  id: string;
  receiptNo: string;
  receiptDate: string;
  party: string;
  paymentMode: string;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  receiptAmount: string | number;
  totalAmount: string;
  status: string;
  orderNo?: string;
  remarks?: string;
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-red-100 text-red-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleCheckboxChange: (receiptId: string, checked: boolean) => void,
  selectedReceiptIds: string[]
): ColumnDef<Receipt>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedReceiptIds.includes(row.original.id)}
        onChange={(e) => {
          e.stopPropagation();
          handleCheckboxChange(row.original.id, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    ),
  },
  {
    header: 'Receipt No',
    accessorKey: 'receiptNo',
    enableColumnFilter: true,
  },
  {
    header: 'Receipt Date',
    accessorKey: 'receiptDate',
    enableColumnFilter: true,
  },
  {
    header: 'Bank Name',
    accessorKey: 'bankName',
    enableColumnFilter: true,
  },
  {
    header: 'Party',
    accessorKey: 'party',
    enableColumnFilter: true,
  },
  {
    header: 'Receipt Amount',
    accessorKey: 'receiptAmount',
    cell: ({ row }: { row: Row<Receipt> }) => {
      const amount = Number(row.original.receiptAmount) || 0;
      return (
        <span className="font-medium">
          {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    },
    enableColumnFilter: true,
  },
  {
    header: 'Payment Mode',
    accessorKey: 'paymentMode',
    enableColumnFilter: true,
  },
  // {
  //   header: 'Cheque No',
  //   accessorKey: 'chequeNo',
  //   enableColumnFilter: true,
  // },
  {
    header: 'Remarks',
    accessorKey: 'remarks',
    cell: ({ row }: { row: Row<Receipt> }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.remarks || '-'}
      </span>
    ),
    enableColumnFilter: true,
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Receipt> }) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(row.original.status || 'Pending')}`}>
        {row.original.status || 'Pending'}
      </span>
    ),
    enableColumnFilter: true,
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<Receipt> }) => {
      const isApproved = String(row.original.status || '').toLowerCase() === 'approved';
      return (
      <div className="flex space-x-2">
        <Link href={`/receipt/edit/${row.original.id}?mode=view`}>
          <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
            title="View Details"
          >
            <Eye size={16} />
          </Button>
        </Link>
        {isApproved ? (
          <Button size="sm" className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled title="Approved records can't be edited">
            <Edit size={16} />
          </Button>
        ) : (
          <Link href={`/receipt/edit/${row.original.id}`}>
            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
              <Edit size={16} />
            </Button>
          </Link>
        )}
        <Button
          size="sm"
          className="bg-red-500 hover:bg-red-600"
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
