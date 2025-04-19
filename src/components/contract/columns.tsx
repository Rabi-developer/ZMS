'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type Contract = {
  id: string;
  contractNumber: string;
  date: string;
  contractType: 'Sale' | 'Purchase';
  companyId: string;
  companyName?: string;
  branchId: string;
  branchName?: string;
  contractOwner: string;
  seller: string;
  buyer: string;
  referenceNumber?: string;
  deliveryDate: string;
  fabricType: string;
  quantity: string;
  unitOfMeasure: string;
  rate: string;
  fabricValue: string;
  totalAmount: string;
  createdBy?: string;
  creationDate?: string;
};

export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<Contract>[] => [
  {
    accessorKey: 'contractNumber',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Contract Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'contractType',
    header: 'Contract Type',
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
  },
  {
    accessorKey: 'branchName',
    header: 'Branch',
  },
  {
    accessorKey: 'contractOwner',
    header: 'Contract Owner',
  },
  {
    accessorKey: 'seller',
    header: 'Seller',
  },
  {
    accessorKey: 'buyer',
    header: 'Buyer',
  },
  {
    accessorKey: 'deliveryDate',
    header: 'Delivery Date',
  },
  {
    accessorKey: 'fabricType',
    header: 'Fabric Type',
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
  },
  {
    accessorKey: 'unitOfMeasure',
    header: 'Unit of Measure',
  },
  {
    accessorKey: 'rate',
    header: 'Rate',
  },
  {
    accessorKey: 'fabricValue',
    header: 'Fabric Value',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total Amount',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const contractId = row.original.id;
      return (
        <div className="flex gap-2">
          <Link href={`/contracts/edit/${contractId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => handleDeleteOpen(contractId)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];