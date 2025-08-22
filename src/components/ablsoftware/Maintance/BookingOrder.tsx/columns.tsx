import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row } from '@tanstack/react-table'; // Import Row type

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'In Transit':
      return 'bg-blue-100 text-blue-800';
    case 'Delivered':
      return 'bg-green-100 text-green-800';
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
}

export const columns = (handleDeleteOpen: (id: string) => void) => [
  {
    header: 'Order No',
    accessorKey: 'orderNo',
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
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Pending')}`}>
        {row.original.status || 'Pending'}
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