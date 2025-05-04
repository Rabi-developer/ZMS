"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import Link from "next/link";

export type GeneralSaleTextType = {
  id: string;
  gstType: string;
  percentage: string;
};

export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<GeneralSaleTextType>[] => [
  {
    accessorKey: "gstType",
    header: "GST Type",
    cell: ({ row }) => <div>{row.original.gstType}</div>,
  },
  {
    accessorKey: "percentage",
    header: "Percentage",
    cell: ({ row }) => <div>{row.original.percentage}%</div>,
  },
  {
    accessorKey: 'name',
    header: '',
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link href={`/general-sale-text-type/${row.original.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-[#0e7d90] text-[#0e7d90] hover:bg-[#0891b2] hover:text-white"
          >
            <FiEdit />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          onClick={() => handleDeleteOpen(row.original.id)}
        >
          <FiTrash2 />
        </Button>
      </div>
    ),
  },
];