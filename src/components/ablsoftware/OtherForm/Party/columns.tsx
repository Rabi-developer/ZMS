'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type PartyType = {
  id: string;
  partyNumber: number;
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
  receivableAccount: string;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void
): ColumnDef<PartyType>[] => [
  {
    accessorKey: 'partyNumber',
    header: ({ column }: any) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
         Party Number
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
        cell: ({ row }: { row: Row<Party> }) => (
        <span>{row.index + 1}</span>
    ),
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Party Name',
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
      const partyId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/party/edit/${partyId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleViewOpen(partyId)}
          >
            <Eye className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteOpen(partyId)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];