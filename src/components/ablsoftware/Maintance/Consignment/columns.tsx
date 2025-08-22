import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row } from '@tanstack/react-table';

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

export interface Consignment {
  id: string;
  receiptNo: string;
  orderNo: string;
  biltyNo: string;
  date: string;
  consignmentNo: string;
  consignor: string;
  consignmentDate: string;
  consignee: string;
  receiverName: string;
  receiverContactNo: string;
  shippingLine: string;
  containerNo: string;
  port: string;
  destination: string;
  items: string | { desc: string; qty: number; qtyUnit: string }[];
  itemDesc: string;
  qty: string;
  weight: string;
  totalQty: string;
  freight: string;
  srbTax: string;
  srbAmount: string;
  deliveryCharges: string;
  insuranceCharges: string;
  tollTax: string;
  otherCharges: string;
  totalAmount: string;
  receivedAmount: string;
  incomeTaxDed: string;
  incomeTaxAmount: string;
  deliveryDate: string;
  freightFrom: string;
  remarks: string;
  status: string;
}

export const columns = (handleDeleteOpen: (id: string) => void) => [
  {
    header: 'Receipt No',
    accessorKey: 'receiptNo',
  },
  {
    header: 'Order No',
    accessorKey: 'orderNo',
  },
  {
    header: 'Bilty No',
    accessorKey: 'biltyNo',
  },
  {
    header: 'Consignor',
    accessorKey: 'consignor',
  },
  {
    header: 'Consignee',
    accessorKey: 'consignee',
  },
  {
    header: '',
    accessorKey: 'name',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Consignment> }) => (
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Pending')}`}>
        {row.original.status || 'Pending'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<Consignment> }) => (
      <div className="flex space-x-2">
        <Link href={`/consignment/edit/${row.original.id}`}>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
            <Edit size={16} />
          </Button>
        </Link>
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
    ),
  },
];