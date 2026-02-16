import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row, ColumnDef } from '@tanstack/react-table';

export interface OpeningBalance {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  vehicleNo: string;
  vehicleDate: string;
  narration: string;
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
  handleDeleteOpen: (id: string) => void,
  accountIndex: Record<string, any>
): ColumnDef<OpeningBalance>[] => [
  {
    header: 'openingNo',
    accessorKey: 'openingNo',
    cell: ({ row }) => accountIndex[row.original.accountId]?.description || row.original.accountId || '-',
  },
  {
    header: 'openingDate',
    accessorKey: 'openingNo',
  },
  


  {
    header: 'Vehicle No',
    accessorKey: 'VehicleNo',
  },
  {
    header: 'Vehicle Date',
    accessorKey: 'vehicleDate',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
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
    cell: ({ row }) => {
      const isApproved = String(row.original.status || '').toLowerCase() === 'approved';
      return (
        <div className="flex items-center gap-2">
          {isApproved ? (
            <Button size="sm" variant="outline" className="text-gray-500 cursor-not-allowed" disabled title="Approved records can't be edited">
              <Edit size={16} />
            </Button>
          ) : (
            <Link href={`/openingbalance/edit/${row.original.id}`}>
              <Button size="sm" variant="outline" className="hover:bg-yellow-50">
                <Edit size={16} />
              </Button>
            </Link>
          )}

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
