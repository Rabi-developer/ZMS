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
  description: string
  email: string
  id: string
  name: string
  state: string
  website: string
  zip: string
  organizationId:string
}

// Define the columns with the updated keys
export const columns = (handleDeleteOpen: (id:string) => void): ColumnDef<User>[] => [
  {
    accessorKey: 'name',
    header: ({ column }: any) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'description',
    header: 'Description'
  },
  {
    accessorKey: 'organizationId',
    header: 'Organization',
    cell: ({ row }: any) => row?.original.organizationId
  },
  {
    accessorKey: 'website',
    header: 'Website',
    cell: ({ row }: any) => {
      return <a href={row.getValue('website')} target="_blank" rel="noopener noreferrer">{row.getValue('website')}</a>
    }
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
    accessorKey: 'addressLine1',
    header: 'Address Line 1'
  },
  {
    accessorKey: 'addressLine2',
    header: 'Address Line 2'
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }: any) => {
      const userId = row.original.id

      return (
        <div className='flex gap-2'>
          <Link href={`branchs/edit/${userId}`}>
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
