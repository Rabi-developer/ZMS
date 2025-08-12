'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type VendorType = {
  id: string;
  name: string;
  address: string;
  country: string;
  city: string;
  phone: string;
  mobile: string;
  fax: string;
  email: string;
  stn: string;
  ntn: string;
  payableCode: string;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void
): ColumnDef<VendorType>[] => [
  {
    accessorKey: 'id',
    header: ({ column }: any) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          ID
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Vendor Name',
  },
  {
    accessorKey: 'country',
    header: 'Country',
  },
  {
    accessorKey: 'city',
    header: 'City',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const vendorId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/vendors/edit/${vendorId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleViewOpen(vendorId)}
          >
            <Eye className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteOpen(vendorId)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];