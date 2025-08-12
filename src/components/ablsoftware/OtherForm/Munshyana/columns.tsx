'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type MunshyanaType = {
  id: string;
  chargesDesc: string;
  chargesType: 'Payable' | 'Receivable';
  accountId: string;
  description: string;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void
): ColumnDef<MunshyanaType>[] => [
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
    accessorKey: 'chargesDesc',
    header: 'Charges Description',
  },
  {
    accessorKey: 'chargesType',
    header: 'Charges Type',
  },
  {
    accessorKey: 'accountId',
    header: 'Account ID',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const munshyanaId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/munshyana/edit/${munshyanaId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleViewOpen(munshyanaId)}
          >
            <Eye className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteOpen(munshyanaId)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];