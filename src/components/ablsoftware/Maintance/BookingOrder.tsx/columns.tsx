import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row, ColumnDef } from '@tanstack/react-table'; // Import Row and ColumnDef types

// Updated getStatusStyles to match BookingOrderList statuses
export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Prepared':
      return 'bg-blue-100 text-blue-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Canceled':
      return 'bg-red-100 text-red-800';
    case 'UnApproved':
      return 'bg-yellow-100 text-yellow-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export interface BookingOrder {
  id: string;
  orderNo: string;
  orderDate: string;
  company: string;
  branch: string;
  status: string;
  remarks: string;
  vehicleNo: string;
  vendor: string;
  transporter: string;
  fromLocation: string;
  toLocation: string;
  files?: string; // Comma-separated Cloudinary URLs
}

// Add onRowSelect to handle checkbox changes
export const columns = (
  handleDeleteOpen: (id: string) => void,
  onRowSelect: (id: string, checked: boolean) => void,
  selectedOrderIds: string[]
): ColumnDef<BookingOrder>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="cursor-pointer"
      />
    ),
    cell: ({ row }: { row: Row<BookingOrder> }) => (
      <input
        type="checkbox"
        checked={selectedOrderIds.includes(row.original.id)}
        onChange={(e) => onRowSelect(row.original.id, e.target.checked)}
        onClick={(e) => e.stopPropagation()} // Prevent row click when checking
        className="cursor-pointer"
      />
    ),
  },
  {
    header: 'Order No',
    accessorKey: 'orderNo',
    // cell: ({ row }: { row: Row<BookingOrder> }) => (
    //   <span>{row.index + 1}</span>
    // ),
  },
  {
    header: 'Order Date',
    accessorKey: 'orderDate',
  },
  {
    header: 'Vehicle No',
    accessorKey: 'vehicleNo',
  },
  {
    header: 'Vendor',
    accessorKey: 'vendor',
  },
  {
    header: 'Transporter',
    accessorKey: 'transporter',
  },
  {
    header: 'From',
    accessorKey: 'fromLocation',
  },
  {
    header: 'To',
    accessorKey: 'toLocation',
  },
  {
    header: '',
    accessorKey: 'name',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<BookingOrder> }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
          row.original.status || 'Prepared'
        )}`}
      >
        {row.original.status || 'Prepared'}
      </span>
    ),
  },
  {
    header: 'Remarks',
    accessorKey: 'remarks',
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<BookingOrder> }) => (
      <div className="flex space-x-2">
        <Link href={`/bookingorder/edit/${row.original.id}`}>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
            <Edit size={16} />
          </Button>
        </Link>
        <Button
          size="sm"
          className="bg-red-500 hover:bg-red-600"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleDeleteOpen(row.original.id);
          }}
        >
          <Trash size={16} />
        </Button>
      </div>
    ),
  },
];