import { Edit, Trash } from 'lucide-react';
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
  receiptAmount: string;
  totalAmount: string;
  status: string;
  orderNo?: string;
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
    // cell: ({ row }: { row: Row<Receipt> }) => (
    //   <span>{row.index + 1}</span>
    // ),
  },
  {
    header: 'Receipt Date',
    accessorKey: 'receiptDate',
  },
  {
    header: 'Party',
    accessorKey: 'party',
  },
  {
    header: 'Payment Mode',
    accessorKey: 'paymentMode',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Receipt> }) => (
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Pending')}`}>
        {row.original.status || 'Pending'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<Receipt> }) => {
      const isApproved = String(row.original.status || '').toLowerCase() === 'approved';
      return (
      <div className="flex space-x-2">
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
