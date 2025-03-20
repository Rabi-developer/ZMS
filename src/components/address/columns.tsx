"use client"
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Define a type for the new data structure
export type User = {
  addressLine1: string
  addressLine2: string
  city: string
  country: string
  state: string
  zip: string
  branchId: string
}

// Define the columns with the updated keys
export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<User>[] => [
  {
    accessorKey: 'name',
    header: ({ column }: any) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Branch ID
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'addressLine1',
    header: 'Address Line 1'
  },
  {
    accessorKey: 'addressLine2',
    header: 'Address Line 2'
  },
  {
    accessorKey: 'city',
    header: 'City'
  },
  {
    accessorKey: 'state',
    header: 'State'
  },
  {
    accessorKey: 'country',
    header: 'Country'
  },
  {
    accessorKey: 'zip',
    header: 'ZIP'
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }: any) => {
      const userId = row.original.id

      return (
        <div className='flex gap-2'>
          <Link href={`address/edit/${userId}`}>
            <Button
              variant='outline'
              size='sm'
            >
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteOpen(userId)}
          >
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      )
    }
  }
]
