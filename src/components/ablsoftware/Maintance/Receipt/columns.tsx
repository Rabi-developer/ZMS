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
  items?: Array<{
    biltyNo: string;
    vehicleNo: string;
    balance: number;
    receiptAmount: number;
  }>;
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
    filterFn: 'includesString',
  },
  {
    header: 'Receipt Date',
    accessorKey: 'receiptDate',
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  {
    header: 'Bilty No',
    accessorKey: 'biltyNo',
    cell: ({ row }: { row: Row<Receipt> }) => {
      const biltyNos = row.original.items?.map(item => item.biltyNo).filter(Boolean) || [];
      const displayCount = 2;
      const remaining = biltyNos.length - displayCount;
      
      if (biltyNos.length === 0) {
        return <span className="text-sm font-medium text-gray-700 dark:text-gray-300">-</span>;
      }
      
      const displayItems = biltyNos.slice(0, displayCount).join(', ');
      
      return (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {displayItems}
          {remaining > 0 && (
            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              ... +{remaining} more
            </span>
          )}
        </span>
      );
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      // Search through ALL bilty numbers, not just visible ones
      const biltyNos = row.original.items?.map(item => item.biltyNo).filter(Boolean) || [];
      const searchTerm = filterValue.toLowerCase();
      return biltyNos.some(bilty => bilty.toLowerCase().includes(searchTerm));
    },
  },
  {
    header: 'Vehicle No',
    accessorKey: 'vehicleNo',
    cell: ({ row }: { row: Row<Receipt> }) => {
      const vehicleNos = row.original.items?.map(item => item.vehicleNo).filter(Boolean) || [];
      const displayCount = 2;
      const remaining = vehicleNos.length - displayCount;
      
      if (vehicleNos.length === 0) {
        return <span className="text-sm text-gray-600 dark:text-gray-400">-</span>;
      }
      
      const displayItems = vehicleNos.slice(0, displayCount).join(', ');
      
      return (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {displayItems}
          {remaining > 0 && (
            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              ... +{remaining} more
            </span>
          )}
        </span>
      );
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      // Search through ALL vehicle numbers, not just visible ones
      const vehicleNos = row.original.items?.map(item => item.vehicleNo).filter(Boolean) || [];
      const searchTerm = filterValue.toLowerCase();
      return vehicleNos.some(vehicle => vehicle.toLowerCase().includes(searchTerm));
    },
  },
  {
    header: 'Bank Name',
    accessorKey: 'bankName',
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  {
    header: 'Party',
    accessorKey: 'party',
    enableColumnFilter: true,
    filterFn: 'includesString',
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
    filterFn: 'includesString',
  },
  {
    header: 'Balance',
    accessorKey: 'balance',
    cell: ({ row }: { row: Row<Receipt> }) => {
      const totalBalance = row.original.items?.reduce((sum, item) => sum + (item.balance || 0), 0) || 0;
      return (
        <span className={`font-medium ${totalBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
          {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    },
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  // {
  //   header: 'Payment Mode',
  //   accessorKey: 'paymentMode',
  //   enableColumnFilter: true,
  //   filterFn: 'includesString',
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
    filterFn: 'includesString',
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
    filterFn: 'includesString',
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
