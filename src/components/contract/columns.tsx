import { ColumnDef } from "@tanstack/react-table";
// Update the path below to the correct relative path if needed
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export interface Contract {
  paymenterm: string;
  paymenterms: string;
  id: string;
  contractNumber: string;
  date: string;
  contractType: string;
  companyId: string;
  branchId: string;
  contractOwner: string;
  seller: string | { id: string; sellerName: string };
  buyer: string | { id: string; buyerName: string };
  referenceNumber: string;
  deliveryDate: string;
  refer: string;
  referdate: string;
  fabricType: string | { listid: string; descriptions: string };
  description: string | { listid: string; descriptions: string };
  descriptionSubOptions: string;
  stuff: string;
  stuffSubOptions: string;
  blendRatio: string;
  blendType: string;
  warpCount: string;
  weftCount: string;
  warpYarnType: string;
  warpYarnTypeSubOptions: string;
  weftYarnType: string;
  weftYarnTypeSubOptions: string;
  noOfEnds: string;
  noOfPicks: string;
  weaves: string;
  weavesSubOptions: string;
  pickInsertion: string;
  pickInsertionSubOptions: string;
  width: string;
  final: string;
  selvege: string;
  selvegeSubOptions: string;
  selvegeWeaves: string;
  selvegeWeaveSubOptions: string;
  selvegeWidth: string;
  quantity: string;
  unitOfMeasure: string;
  tolerance: string;
  rate: string;
  packing: string;
  pieceLength: string;
  inductionThread: string;
  inductionThreadSubOptions: string;
  fabricValue: string;
  gsm: string;
  gst: string;
  gstValue: string;
  totalAmount: string;
  createdBy: string;
  creationDate: string;
  updatedBy: string;
  updationDate: string;
  approvedBy: string;
  approvedDate: string;
  endUse: string;
  selvegeThickness: string;
  selvegeThicknessSubOptions: string;
  endUseSubOptions: string;
  notes: string;
  dispatchLater: string;
  status: string;
  finishWidth: string;
  buyerDeliveryBreakups: {
    id: string;
    qty: string;
    deliveryDate: string;
  }[];
  sellerDeliveryBreakups: {
    id: string;
    qty: string;
    deliveryDate: string;
  }[];
 conversionContractRow : {
    id: string;
    contractId: string;
    width: string;
    quantity: string;
    pickRate: string;
    fabRate: string;
    rate: string;
    amounts: string;
    deliveryDate: string;
    wrapwt: string;
    weftwt: string;
    wrapBag: string;
    weftBag: string;
    totalAmountMultiple: string;
    gst: string;
    gstValue: string;
    fabricValue: string;
    commissionType: string;
    commissionPercentage: string;
    commissionValue: string;
    totalAmount: string;
    commisionInfo: {
      id: string;
      paymentTermsSeller: string;
      paymentTermsBuyer: string;
      deliveryTerms: string;
      commissionFrom: string;
      dispatchAddress: string;
      sellerRemark: string;
      buyerRemark: string;
      endUse: string;
      endUseSubOptions: string;
      dispatchLater: string;
      sellerCommission: string;
      buyerCommission: string;
    };
    buyerDeliveryBreakups: {
      id: string;
      qty: string;
      deliveryDate: string;
    }[];
    sellerDeliveryBreakups: {
      id: string;
      qty: string;
      deliveryDate: string;
    }[];
  }[];
  dietContractRow: {
    id: string;
    contractId: string;
    labDispatchNo: string;
    labDispatchDate: string;
    color: string;
    quantity: string;
    finish: string;
    rate: string;
    amountTotal: string;
    deliveryDate: string;
    gst: string;
    gstValue: string;
    fabricValue: string;
    commissionType: string;
    commissionPercentage: string;
    commissionValue: string;
    totalAmount: string;
    shrinkage: string;
    finishWidth: string;
    weight: string;
    commisionInfo: {
      id: string;
      paymentTermsSeller: string;
      paymentTermsBuyer: string;
      deliveryTerms: string;
      commissionFrom: string;
      dispatchAddress: string;
      sellerRemark: string;
      buyerRemark: string;
      endUse: string;
      endUseSubOptions: string;
      dispatchLater: string;
      sellerCommission: string;
      buyerCommission: string;
    };
    buyerDeliveryBreakups: {
      id: string;
      qty: string;
      deliveryDate: string;
    }[];
    sellerDeliveryBreakups: {
      id: string;
      qty: string;
      deliveryDate: string;
    }[];
  }[];
  multiWidthContractRow: {
    totalAmountMultiple: string;
    wrapBag: string;
    weftBag: string;
    weftwt: string;
    wrapwt: string;
    id: string;
    contractId: string;
    width: string;
    quantity: string;
    rate: string;
    amount: string;
    gst: string;
    gstValue: string;
    fabricValue: string;
    commissionType: string;
    commissionPercentage: string;
    commissionValue: string;
    totalAmount: string;
    date: string;
    commisionInfo: {
      id: string;
      paymentTermsSeller: string;
      paymentTermsBuyer: string;
      deliveryTerms: string;
      commissionFrom: string;
      dispatchAddress: string;
      sellerRemark: string;
      buyerRemark: string;
      endUse: string;
      endUseSubOptions: string;
      dispatchLater: string;
      sellerCommission: string;
      buyerCommission: string;
    };
    buyerDeliveryBreakups: {
      id: string;
      qty: string;
      deliveryDate: string;
    }[];
    sellerDeliveryBreakups: {
      id: string;
      qty: string;
      deliveryDate: string;
    }[];
  }[];
}

export const columns = (
  handleDeleteOpen: (id: string) => void,
  handleCheckboxChange: (id: string, checked: boolean) => void,
  getSellerName?: (sellerId: string | any) => string,
  getBuyerName?: (buyerId: string | any) => string,
  getFabricTypeName?: (fabricTypeId: string | any) => string,
  getDescriptionName?: (descId: string | any) => string,
  getWidthName?: (widthId: string | any) => string,
  getWeavesName?: (weavesId: string | any) => string
): ColumnDef<Contract>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onChange={e => table.toggleAllPageRowsSelected(!!e.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={e => {
          handleCheckboxChange(row.original.id, !!e.target.checked);
          row.toggleSelected(!!e.target.checked);
        }}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "contractNumber",
    header: "Contract Number",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "contractType",
    header: "Contract Type",
  },
  {
    accessorKey: "seller",
    header: "Seller",
    cell: ({ row }) => {
      const seller = row.original.seller;
      return getSellerName ? getSellerName(seller) : (seller || '-');
    },
  },
  {
    accessorKey: "buyer",
    header: "Buyer",
    cell: ({ row }) => {
      const buyer = row.original.buyer;
      return getBuyerName ? getBuyerName(buyer) : (buyer || '-');
    },
  },
  
  {
    accessorKey: "name",
    header: "",
  },
  {
    accessorKey: "referenceNumber",
    header: "Reference Number",
  },
  {
    accessorKey: "fabricType",
    header: "Fabric Type",
    cell: ({ row }) => {
      const fabricType = row.original.fabricType;
      return getFabricTypeName ? getFabricTypeName(fabricType) : (fabricType || '-');
    },
  },
  {
    accessorKey: "description",
    header: "Fabric Detail",
    cell: ({ row }) => {
      const description = row.original.description;
      const weaves = row.original.weaves;
      
      // Get width from multiWidthContractRow or conversionContractRow
      let width = row.original.width;
      if (row.original.multiWidthContractRow && row.original.multiWidthContractRow.length > 0) {
        const widths = row.original.multiWidthContractRow
          .map(item => item.width)
          .filter(w => w && w.trim() !== '')
          .join(', ');
        if (widths) width = widths;
      } else if (row.original.conversionContractRow && row.original.conversionContractRow.length > 0) {
        const widths = row.original.conversionContractRow
          .map(item => item.width)
          .filter(w => w && w.trim() !== '')
          .join(', ');
        if (widths) width = widths;
      }
      
      const descText = getDescriptionName ? getDescriptionName(description) : (description || '');
      const weavesText = getWeavesName ? getWeavesName(weaves) : (weaves || '');
      const widthText = width || '';
      
      const parts = [descText, weavesText, widthText].filter(part => {
        if (!part) return false;
        const str = typeof part === 'string' ? part : String(part);
        return str !== '-' && str.trim() !== '';
      });
      return parts.length > 0 ? parts.join(' / ') : '-';
    },
  },
  {
    accessorKey: "deliveryDate",
    header: "Delivery Date",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
          row.original.status === "Pending"
            ? "bg-[#eab308]/10 text-[#eab308] border-[#eab308]"
            : row.original.status === "Approved"
            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]"
            : row.original.status === "Canceled"
            ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]"
            : row.original.status === "Closed Dispatch"
            ? "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]"
            : row.original.status === "Closed Payment"
            ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]"
            : row.original.status === "Complete Closed"
            ? "bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]"
            : "bg-gray-100 text-gray-800 border-gray-300"
        }`}
      >
        {row.original.status || "Pending"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
         <div className="flex gap-2">
          <Link href={`/contract/edit/${row.original.id}?mode=view`}>
            <Button variant="outline" size="sm" title="View Details">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/contract/edit/${row.original.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOpen(row.original.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
    ),
  },
];