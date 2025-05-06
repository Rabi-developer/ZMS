'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type CommissionTypeType = {
    id: string;
    listid: string;
    descriptions: string;
    segment: string;
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (commissionId: string) => void
): ColumnDef<CommissionTypeType>[] => [
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
  accessorKey: 'segment', 
  header: 'Segment',
  cell: ({ row }) => {
  const segment = row.original.segment;
  return segment ? segment.split('|').join(', ') : '';
  },
 },
  {
    accessorKey: 'name',
    header: '',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const commissionTypeId = row.original.id;
      const commissionId = row.original.listid;
      return (
        <div className="flex gap-2">
          <Link href={`/commissiontype/edit/${commissionTypeId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(commissionId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(commissionTypeId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];