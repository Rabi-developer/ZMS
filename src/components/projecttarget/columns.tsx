'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as Progress from '@radix-ui/react-progress';

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
  employeeType: string;
  duedate: string;
  approvedBy: string;
  approvalDate: string;
  progress?: number; // Added for progress bar
};

export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<ProjectTarget>[] => [
  {
    accessorKey: 'targetPeriod',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Target Period
        <ArrowUpDown className="ml-2 h-4 w-4" />
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
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.original.projectStatus === 'Completed'
            ? 'bg-green-100 text-green-800'
            : row.original.projectStatus === 'In Progress'
            ? 'bg-blue-100 text-blue-800'
            : row.original.projectStatus === 'Planning'
            ? 'bg-yellow-100 text-yellow-800'
            : row.original.projectStatus === 'On Hold'
            ? 'bg-orange-100 text-orange-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {row.original.projectStatus}
      </span>
    ),
  },
  {
    accessorKey: 'progress',
    header: 'Progress',
    cell: ({ row }) => {
      // Sample progress calculation (replace with actual logic)
      const progress = row.original.progress || 
        (row.original.projectStatus === 'Completed' ? 100 :
         row.original.projectStatus === 'In Progress' ? 50 :
         row.original.projectStatus === 'Planning' ? 10 :
         row.original.projectStatus === 'On Hold' ? 0 : 0);
      return (
        <div className="flex items-center gap-2">
          <Progress.Root
            className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            value={progress}
          >
            <Progress.Indicator
              className="h-full bg-cyan-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </Progress.Root>
          <span className="text-sm text-gray-700 dark:text-gray-300">{progress}%</span>
        </div>
      );
    },
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
      <ul className="list-disc pl-4">
        {row.original.stepsToComplete.map((step, index) => (
          <li key={index} className="text-gray-700 dark:text-gray-300">
            {step}
          </li>
        ))}
      </ul>
    ),
  },
  {
    accessorKey: 'employeeId',
    header: 'Employee',
  },
  {
    accessorKey: 'employeeType',
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
    accessorKey:'name',
    header: '',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const projectTargetId = row.original.id;
      return (
        <div className="flex gap-2">
          <Link href={`/projecttarget/edit/${projectTargetId}`}>
            <Button
              variant="outline"
              size="sm"
              className="border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900 transition-all duration-300"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(projectTargetId)}
            className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-300"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];