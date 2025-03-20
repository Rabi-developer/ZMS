"use client"
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export type EmployeeManagement = {
    id: string;
    employeeId: string;
    department: string;
    jobtittle: string;
    hireDate: string;
    EmployeeType: string;
    salary: string;
    paidSalary: string;
    remainingSalary: string;
    importantDates: string;
    worklocation: string;
    promotion: string;
    position: string;
  };
  
export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<EmployeeManagement>[] => [
    {
    accessorKey: 'employeeId',
    header: ({ column }: any) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Employee Id
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'jobTitle',
    header: 'Job Title',
  },
  {
    accessorKey: 'hireDate',
    header: 'Hire Date',
  },
  {
    accessorKey: 'employeeType',
    header: 'Employee Type',
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
  },
  {
    accessorKey: 'importantDates',
    header: 'Important Dates',
  },
  {
    accessorKey: 'workLocation',
    header: 'Work Location',
  },
  {
    accessorKey: 'promotion',
    header: 'Promotion History',
  },
  {
    accessorKey: 'position',
    header: 'Position',
  },
  {
    accessorKey: 'name',
    header: '',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }: any) => {
      const employeeManagementId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`employeemanagement/edit/${employeeManagementId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button variant='outline' size='sm' onClick={() => handleDeleteOpen(employeeManagementId)}>
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    }
  }
];
