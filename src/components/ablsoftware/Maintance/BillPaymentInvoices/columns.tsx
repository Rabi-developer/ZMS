import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Row } from '@tanstack/react-table';

// Interface for the API response (based on provided data)
interface ApiBiltyPaymentInvoice {
  id: string;
  invoiceNo: string;
  paymentDate: string;
  createdBy: string | null;
  creationDate: string | null;
  updatedBy: string | null;
  updationDate: string | null;
  status: string | null;
  lines: Array<{
    id: string;
    vehicleNo: string;
    orderNo: string;
    amount: number;
    munshayana: string;
    broker: string;
    dueDate: string;
    remarks: string;
  }>;
  isActive: boolean;
  isDeleted: boolean;
  createdDateTime: string;
  modifiedDateTime: string | null;
  modifiedBy: string | null;
}

export interface BillPaymentInvoice {
  id: string;
  invoiceNo: string;
  paymentDate: string;
  totalAmount: string;
  status: string;
  vehicleNo: string;
  orderNo: string;
  amount: string;
  broker: string;
}

export const transformBiltyPaymentInvoice = (apiData: ApiBiltyPaymentInvoice[]): BillPaymentInvoice[] => {
  return apiData.map((item) => {
    const firstLine = item.lines[0] || {};
    return {
      id: item.id,
      invoiceNo: item.invoiceNo,
      paymentDate: item.paymentDate,
      totalAmount: firstLine.amount?.toString() || '0', 
      status: item.status || 'Unpaid',
      vehicleNo: firstLine.vehicleNo || '',
      orderNo: firstLine.orderNo || '',
      amount: firstLine.amount?.toString() || '0',
      broker: firstLine.broker || '',
    };
  });
};

// Status styles
export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Unpaid':
      return 'bg-red-100 text-red-800';
    case 'Paid':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const columns = (handleDeleteOpen: (id: string) => void) => [
  {
    header: 'Invoice No',
    accessorKey: 'invoiceNo',
  },
  {
    header: 'Vehicle No',
    accessorKey: 'vehicleNo',
  },
  {
    header: 'Order No',
    accessorKey: 'orderNo',
  },
  {
    header: 'Amount',
    accessorKey: 'amount',
  },
  {
    header: 'Broker',
    accessorKey: 'broker',
  },
  {
    header: 'Payment Date',
    accessorKey: 'paymentDate',
  },
  {
    header: 'Total Amount',
    accessorKey: 'totalAmount',
  },
  {
    header: 'Munshayana',
    accessorKey: 'munshayana',
  },
  {
    header: '',
    accessorKey: 'name',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }: { row: Row<BillPaymentInvoice> }) => (
      <span className={`px-2 py-1 rounded-full ${getStatusStyles(row.original.status || 'Unpaid')}`}>
        {row.original.status || 'Unpaid'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }: { row: Row<BillPaymentInvoice> }) => (
      <div className="flex space-x-2">
        <Link href={`/billpaymentinvoices/edit/${row.original.id}`}>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600" onClick={(e) => e.stopPropagation()}>
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