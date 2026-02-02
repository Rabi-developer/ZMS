import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row, ColumnDef } from '@tanstack/react-table';

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Prepared':
      return 'bg-yellow-100 text-yellow-800';
    case 'Canceled':
      return 'bg-red-100 text-red-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    case 'UnApproved':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export interface Consignment {
  files: any;
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

export const columns = (
  handleDeleteOpen: (id: string) => void,
  onRowSelect: (id: string, checked: boolean) => void,
  selectedConsignmentIds: string[]
): ColumnDef<Consignment>[] => [
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
    cell: ({ row }: { row: Row<Consignment> }) => (
      <input
        type="checkbox"
        checked={selectedConsignmentIds.includes(row.original.id)}
        onChange={(e) => onRowSelect(row.original.id, e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        className="cursor-pointer"
      />
    ),
  },
  {
    header: 'Receipt No',
    accessorKey: 'receiptNo',
    // cell: ({ row }: { row: Row<Consignment> }) => (
    //   <span>{row.index + 1}</span>
    // ),
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
    header: 'Vehicle No',
    accessorKey: 'vehicleNo',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<Consignment> }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
          row.original.status || 'Pending'
        )}`}
      >
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