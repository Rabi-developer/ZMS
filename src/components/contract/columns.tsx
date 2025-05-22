'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash, Eye } from 'lucide-react';
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
  refer?: string;
  referdate?: string;
  fabricType: string;
  descriptionId: string;
  descriptionName?: string;
  stuff: string;
  blendRatio?: string;
  blendType?: string;
  warpCount?: string;
  warpYarnType?: string;
  weftCount?: string;
  weftYarnType: string;
  noOfEnds?: string;
  noOfPicks?: string;
  weaves?: string;
  pickInsertion?: string;
  width?: string;
  final?: string;
  selvedge?: string;
  selvedgeWeave?: string;
  selvedgeWidth?: string;
  quantity: string;
  unitOfMeasure: string;
  tolerance?: string;
  rate: string;
  packing?: string;
  pieceLength?: string;
  fabricValue: string;
  gst: string;
  gstValue?: string;
  totalAmount: string;
  paymentTermsSeller?: string;
  paymentTermsBuyer?: string;
  deliveryTerms?: string;
  commissionFrom?: string;
  commissionType?: string;
  commissionPercentage?: string;
  commissionValue?: string;
  dispatchAddress?: string;
  sellerRemark?: string;
  buyerRemark?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  endUse?: string;
  status?: 'Pending' | 'Approved' | 'Canceled' | 'Closed Dispatch' | 'Closed Payment' | 'Complete Closed';
  buyerDeliveryBreakups?: { qty: string; deliveryDate: string }[];
  sellerDeliveryBreakups?: { qty: string; deliveryDate: string }[];
  sampleDetails?: {
    sampleQty: string;
    sampleReceivedDate: string;
    sampleDeliveredDate: string;
    createdBy: string;
    creationDate: string;
    updatedBy: string;
    updateDate: string;
    additionalInfo: {
      endUse: string;
      count: string;
      weight: string;
      yarnBags: string;
      labs: string;
    }[];
  }[];
};

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleViewOpen: (id: string) => void,
  handleCheckboxChange: (id: string, checked: boolean) => void
): ColumnDef<Contract>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => {
          row.getToggleSelectedHandler()(e);
          handleCheckboxChange(row.original.id, e.target.checked);
        }}
        className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
      />
    ),
  },
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
    accessorKey: 'referenceNumber',
    header: 'Reference #',
  },
  {
    accessorKey: 'deliveryDate',
    header: 'Delivery Date',
  },
  {
    accessorKey: 'refer',
    header: 'Refer #',
  },
  {
    accessorKey: 'referdate',
    header: 'Refer Date',
  },
  {
    accessorKey: 'fabricType',
    header: 'Fabric Type',
  },
  {
    accessorKey: 'descriptionName',
    header: 'Description',
  },
  {
    accessorKey: 'stuff',
    header: 'Stuff',
  },
  {
    accessorKey: 'blendRatio',
    header: 'Blend Ratio',
  },
  {
    accessorKey: 'blendType',
    header: 'Blend Type',
  },
  {
    accessorKey: 'warpCount',
    header: 'Warp Count',
  },
  {
    accessorKey: 'warpYarnType',
    header: 'Warp Yarn Type',
  },
  {
    accessorKey: 'weftCount',
    header: 'Weft Count',
  },
  {
    accessorKey: 'weftYarnType',
    header: 'Weft Yarn Type',
  },
  {
    accessorKey: 'noOfEnds',
    header: 'No. of Ends',
  },
  {
    accessorKey: 'noOfPicks',
    header: 'No. of Picks',
  },
  {
    accessorKey: 'weaves',
    header: 'Weaves',
  },
  {
    accessorKey: 'pickInsertion',
    header: 'Pick Insertion',
  },
  {
    accessorKey: 'width',
    header: 'Width',
  },
  {
    accessorKey: 'final',
    header: 'Final',
  },
  {
    accessorKey: 'selvedge',
    header: 'Selvedge',
  },
  {
    accessorKey: 'selvedgeWeave',
    header: 'Selvedge Weave',
  },
  {
    accessorKey: 'selvedgeWidth',
    header: 'Selvedge Width',
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
    accessorKey: 'tolerance',
    header: 'Tolerance (%)',
  },
  {
    accessorKey: 'rate',
    header: 'Rate',
  },
  {
    accessorKey: 'packing',
    header: 'Packing',
  },
  {
    accessorKey: 'pieceLength',
    header: 'Piece Length',
  },
  {
    accessorKey: 'fabricValue',
    header: 'Fabric Value',
  },
  {
    accessorKey: 'gst',
    header: 'GST Type',
  },
  {
    accessorKey: 'gstValue',
    header: 'GST Value',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total Amount',
  },
  {
    accessorKey: 'paymentTermsSeller',
    header: 'Payment Terms Seller',
  },
  {
    accessorKey: 'paymentTermsBuyer',
    header: 'Payment Terms Buyer',
  },
  {
    accessorKey: 'deliveryTerms',
    header: 'Delivery Terms',
  },
  {
    accessorKey: 'commissionFrom',
    header: 'Commission From',
  },
  {
    accessorKey: 'commissionType',
    header: 'Commission Type',
  },
  {
    accessorKey: 'commissionPercentage',
    header: 'Commission (%)',
  },
  {
    accessorKey: 'commissionValue',
    header: 'Commission Value',
  },
  {
    accessorKey: 'dispatchAddress',
    header: 'Dispatch Address',
  },
  {
    accessorKey: 'sellerRemark',
    header: 'Seller Remark',
  },
  {
    accessorKey: 'buyerRemark',
    header: 'Buyer Remark',
  },
  {
    accessorKey: 'createdBy',
    header: 'Created By',
  },
  {
    accessorKey: 'creationDate',
    header: 'Creation Date',
  },
  {
    accessorKey: 'updatedBy',
    header: 'Updated By',
  },
  {
    accessorKey: 'updationDate',
    header: 'Updation Date',
  },
  {
    accessorKey: 'approvedBy',
    header: 'Approved By',
  },
  {
    accessorKey: 'approvedDate',
    header: 'Approved Date',
  },
  {
    accessorKey: 'endUse',
    header: 'End Use',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const contractId = row.original.id;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewOpen(contractId)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link href={`/contract/edit/${contractId}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(contractId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];