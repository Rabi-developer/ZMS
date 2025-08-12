'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type TransporterType = {
  id: string;
  name: string;
  currency: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bankName: string;
  tel: string;
  ntn: string;
  mobile: string;
  stn: string;
  fax: string;
  buyerCode: string;
  email: string;
  website: string;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void
): ColumnDef<TransporterType>[] => [
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
    header: 'Transporter Name',
  },
  {
    accessorKey: 'currency',
    header: 'Currency',
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
      const transporterId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/transporters/edit/${transporterId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleViewOpen(transporterId)}
          >
            <Eye className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteOpen(transporterId)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];