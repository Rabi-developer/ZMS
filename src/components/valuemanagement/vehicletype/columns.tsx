'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type VehicleTypeType = {
  id: string;
  listid: string;
  descriptions: string;
  segment:string
 
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (listid: string) => void
): ColumnDef<VehicleTypeType>[] => [
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
        return segment ? segment.split('|').join(', ') : 'No segments';
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
      const vehicletypeId = row.original.id;
      const listId = row.original.listid;
      return (
        <div className="flex gap-2">
          <Link href={`/VehicleType/edit/${vehicletypeId}`}>
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
            onClick={() => handleDeleteOpen(vehicletypeId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];