'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type SalesTaxType = {
  id: string;
  taxName: string;
  taxType: 'Sale Tax' | 'WHT Tax' | 'SBR Tax' | '%';
  percentage?: string;
  receivable: { accountId: string; description: string };
  payable: { accountId: string; description: string };
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void
): ColumnDef<SalesTaxType>[] => [
  {
    accessorKey: 'salesTaxNumber',
    header: ({ column }: any) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Sales Tax Number
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'taxName',
    header: 'Tax Name',
  },
  {
    accessorKey: 'taxType',
    header: 'Tax Type',
  },
  {
    accessorKey: 'percentage',
    header: 'Percentage (%)',
    cell: ({ row }) => {
      const percentage = row.original.percentage;
      return percentage ? `${percentage}%` : '-';
    },
  },
  {
    accessorKey: 'receivable.accountId',
    header: 'Receivable Account ID',
  },
  {
    accessorKey: 'receivable.description',
    header: 'Receivable Description',
  },
  {
    accessorKey: 'payable.accountId',
    header: 'Payable Account ID',
  },
  {
    accessorKey: 'payable.description',
    header: 'Payable Description',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const salesTaxId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/salestexes/edit/${salesTaxId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleViewOpen(salesTaxId)}
          >
            <Eye className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteOpen(salesTaxId)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];