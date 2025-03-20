"use client";
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type ProjectTarget = {
  id: string;
  targetPeriod: string;
  targetDate: string;
  targetEndDate: string;
  targetValue: string;
  purpose: string;
  projectStatus: string;
  projectManager: string;
  financialHealth: string;
  buyerName: string;
  sellerName: string;
  stepsToComplete: string[];
  attachments: string;
  employeeId: string;
  EmployeeType: string;
  duedate: string;
  approvedBy: string;
  approvalDate: string;
};

export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<ProjectTarget>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Target Period
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'targetDate',
    header: 'Target Start Date',
  },
  {
    accessorKey: 'targetEndDate',
    header: 'Target End Date',
  },
  {
    accessorKey: 'targetValue',
    header: 'Target Value',
  },
  {
    accessorKey: 'purpose',
    header: 'Purpose',
  },
  {
    accessorKey: 'projectStatus',
    header: 'Project Status',
  },
  {
    accessorKey: 'projectManager',
    header: 'Project Manager',
  },
  {
    accessorKey: 'financialHealth',
    header: 'Financial Health',
  },
  {
    accessorKey: 'buyerName',
    header: 'Buyer Name',
  },
  {
    accessorKey: 'sellerName',
    header: 'Seller Name',
  },
  {
    accessorKey: 'stepsToComplete',
    header: 'Steps to Complete',
    cell: ({ row }) => (
      <ul>
        {row.original.stepsToComplete.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ul>
    ),
  },
  {
    accessorKey: 'attachments',
    header: 'Attachments',
  },
  {
    accessorKey: 'employeeId',
    header: 'Employee',
  },
  {
    accessorKey: 'EmployeeType',
    header: 'Employee Type',
  },
  {
    accessorKey: 'duedate',
    header: 'Due Date',
  },
  {
    accessorKey: 'approvedBy',
    header: 'Approved By',
  },
  {
    accessorKey: 'approvalDate',
    header: 'Approval Date',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const projectTargetId = row.original.id;
      return (
        <div className='flex gap-2'>
          <Link href={`/projecttarget/edit/${projectTargetId}`}>
            <Button variant='outline' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
          </Link>
          <Button variant='outline' size='sm' onClick={() => handleDeleteOpen(projectTargetId)}>
            <Trash className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];