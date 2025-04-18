
"use client";
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type Seller = {
  id: string;
  SellerName: string;
  SellerType: string;
  Address: string;
  City: string;
  Country: string;
  PhoneNumber: string;
  EmailAddress?: string;
  MobileNumber: string;
  FaxNumber?: string;
  STN: string;
  MTN: string;
  PayableCode: string;
  accountNo: string; // comma separated string
  PaymentStatus?: string;
  OrderDate?: string;
  DeliveryDate?: string;
  Payableid?: string;
};

export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<Seller>[] => [
  {
    accessorKey: 'sellerName',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Seller Name
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'name',
    header: '',
  },
  {
    accessorKey: 'sellerType',
    header: 'Seller Type',
  },
 
  {
    accessorKey: 'city',
    header: 'City',
  },
  {
    accessorKey: 'country',
    header: 'Country',
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone Number',
  },
  {
    accessorKey: 'emailAddress',
    header: 'Email Address',
  },
  {
    accessorKey: 'mobileNumber',
    header: 'Mobile Number',
  },
  {
    accessorKey: 'faxNumber',
    header: 'Fax Number',
  },
  {
    accessorKey: 'stn',
    header: 'STN',
  },
  {
    accessorKey: 'mtn',
    header: 'MTN',
  },
  {
    accessorKey: 'payableCode',
    header: 'Payable Code',
  },
  {
    accessorKey: 'accountNo',
    header: 'Account Numbers',
    cell: ({ row }) => (
      <ul>
        {row.original.accountNo.split(',').map((acc, idx) => (
          <li key={idx}>{acc.trim()}</li>
        ))}
      </ul>
    ),
  },
  {
    accessorKey: 'orderDate',
    header: 'Order Date',
  },
  {
    accessorKey: 'deliveryDate',
    header: 'Delivery Date',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const sellerId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/saller/edit/${sellerId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button variant='outline' size='sm' onClick={() => handleDeleteOpen(sellerId)}>
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];
