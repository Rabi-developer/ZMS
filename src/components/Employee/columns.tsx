"use client"
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export type Employee = {
  id: string
  employeename: string
  employeemiddlename?: string
  employeelastname: string
  email: string
  cnicnumber: number
  number: number
  address: string
}

export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<Employee>[] => [
  {
    accessorKey: 'name',
    header: ({ column }: any) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
         Name
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
  
  {
    accessorKey: 'gender',
    header: 'Gender'
  },

  {
    accessorKey: 'position',
    header: 'Position'
  },
  {
    accessorKey: 'mobileNumber',
    header: 'Mobile Number'
  },
  {
    accessorKey: 'hireDate',
    header: 'Hire Date'
  },
  {
    accessorKey: 'cnicNumber',
    header: 'CNIC Number'
  },
  {
    accessorKey: 'industryType',
    header: 'Industry Type'
  },
  {
    accessorKey: 'employmentType',
    header: 'Employment Type'
  },
 
  {
    accessorKey: 'address',
    header: 'Address'
  },
  {
    accessorKey: 'country',
    header: 'Country'
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }: any) => {
      const employeeId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`employee/edit/${employeeId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button variant='outline' size='sm' onClick={() => handleDeleteOpen(employeeId)}>
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    }
  }
];
