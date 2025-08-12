'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type BusinessAssociateType = {
  id: string;
  name: string;
  mobile: string;
  address: string;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void
): ColumnDef<BusinessAssociateType>[] => [
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
    header: 'Business Associate Name',
  },
  {
    accessorKey: 'mobile',
    header: 'Mobile Number',
  },
  {
    accessorKey: 'address',
    header: 'Address',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const businessAssociateId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/businessAssociates/edit/${businessAssociateId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleViewOpen(businessAssociateId)}
          >
            <Eye className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteOpen(businessAssociateId)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];