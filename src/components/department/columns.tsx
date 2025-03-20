"use client"
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Define a type for the new data structure
export type User = {
  id: string
  name: string
  shortName: string
  headOfDepartment: string
  addressId: string
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
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'shortName',
    header: 'Short Name'
  },
  {
    accessorKey: 'headOfDepartment',
    header: 'Head of Department'
  },
  {
    accessorKey: 'addressId',
    header: 'Address ID'
  },
  {
    accessorKey: 'branchId',
    header: 'Branch'
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }: any) => {
      const userId = row.original.id

      return (
        <div className='flex gap-2'>
          <Link href={`department/edit/${userId}`}>
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
