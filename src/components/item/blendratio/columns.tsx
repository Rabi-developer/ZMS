'use client';
    import { ColumnDef } from '@tanstack/react-table';
 import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import Link from 'next/link';

    export type BlendRatioType = {
      id: string;
      listid: string;
      Descriptions: string;
      subDescription: string;
    };

    export const columns = (
      handleDeleteOpen: (id: string) => void,
      handleViewOpen: (listid: string) => void
    ): ColumnDef<BlendRatioType>[] => [
      {
        accessorKey: 'listid',
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
        accessorKey: 'descriptions',
        header: 'Description',
      },
      {
        accessorKey: 'subDescription',
        header: 'Sub-Description',
        cell: ({ row }) => {
          const subDescriptions = row.original.subDescription.split('|').filter((s: string) => s);
          return (
            <div className="flex flex-col gap-1">
              {subDescriptions.map((subDesc: string, index: number) => (
                <span key={index} className="text-gray-700">{subDesc}</span>
              ))}
            </div>
          );
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
          const blendRatioId = row.original.id;
          const listId = row.original.listid;
          return (
            <div className='flex gap-2'>
              <Link href={`/blendRatio/edit/${blendRatioId}`}>
                <Button variant='outline' size='sm'>
                  <Edit className='h-4 w-4' />
                </Button>
              </Link>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleViewOpen(listId)}
              >
                <Eye className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleDeleteOpen(blendRatioId)}
              >
                <Trash className='h-4 w-4' />
              </Button>
            </div>
          );
        },
      },
    ];