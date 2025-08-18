'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import { FaMoneyBillWave } from 'react-icons/fa';

export interface PaymentABL {
  id: string;
  paymentNo: string;
  paymentDate: string;
  orderNo: string;
  vehicleNo: string;
  chargeNo: string;
  expenseAmount: number;
  paidAmount: number;
  balance: number;
  paymentMethod: string;
  status: string;
  remarks?: string;
}

export const columns: ColumnDef<PaymentABL>[] = [
  {
    accessorKey: 'paymentNo',
    header: 'Payment No',
    cell: ({ row }) => (
      <div className="flex items-center">
        <FaMoneyBillWave className="text-[#3a614c] mr-2" />
        <span className="font-medium">{row.getValue('paymentNo')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'paymentDate',
    header: 'Payment Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('paymentDate'));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: 'orderNo',
    header: 'Order No',
  },
  {
    accessorKey: 'vehicleNo',
    header: 'Vehicle No',
  },
  {
    accessorKey: 'chargeNo',
    header: 'Charge No',
  },
  {
    accessorKey: 'expenseAmount',
    header: 'Expense Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('expenseAmount'));
      return <span className="font-medium text-green-600">${amount.toFixed(2)}</span>;
    },
  },
  {
    accessorKey: 'paidAmount',
    header: 'Paid Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('paidAmount'));
      return <span className="font-medium text-blue-600">${amount.toFixed(2)}</span>;
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ row }) => {
      const balance = parseFloat(row.getValue('balance'));
      return (
        <span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ${Math.abs(balance).toFixed(2)} {balance > 0 ? '(Due)' : '(Paid)'}
        </span>
      );
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Payment Method',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const statusClasses = {
        'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Completed': 'bg-green-100 text-green-800 border-green-200',
        'Cancelled': 'bg-red-100 text-red-800 border-red-200',
      };
      const className = statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 border-gray-200';
      
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${className}`}>
          {status}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const payment = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
            onClick={() => window.location.href = `/paymentABL/${payment.id}`}
          >
            <MdVisibility className="mr-1" /> View
          </Button>
          <Button
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 text-xs"
            onClick={() => window.location.href = `/paymentABL/edit/${payment.id}`}
          >
            <MdEdit className="mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this payment?')) {
                // Handle delete
                console.log('Delete payment:', payment.id);
              }
            }}
          >
            <MdDelete className="mr-1" /> Delete
          </Button>
        </div>
      );
    },
  },
];