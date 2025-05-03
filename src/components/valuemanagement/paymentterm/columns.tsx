'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type PaymentTermType = {
  id: string;
  listid: string;
  descriptions: string;
  subDescription: string;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (listid: string) => void
): ColumnDef<PaymentTermType>[] => [
  {
    accessorKey: 'listid',
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'descriptions',
    header: 'Description',
  },
  {
    accessorKey: 'subDescription',
    header: 'Segment',
  },
  {
    accessorKey: 'name',
    header: '',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const paymentTermId = row.original.id;
      const listId = row.original.listid;
      return (
        <div className="flex gap-2">
          <Link href={`/paymentterm/edit/${paymentTermId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(listId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(paymentTermId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];