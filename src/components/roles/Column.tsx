// src/components/roles/Column.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit, Trash, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export interface Role {
  id: string;
  name: string;
  resourcesKeywords?: string;
  claims: {
    id: number;
    roleId: string;
    claimType: string;
    claimValue: string;
  }[];
}

export const columns = (handleDeleteOpen: (id: string) => void): ColumnDef<Role>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-0 hover:bg-transparent"
        >
          Role Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium text-gray-800 capitalize">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "claims",
    header: "Permissions",
    cell: ({ row }) => {
      const claims = row.getValue("claims") as Role['claims'];
      const claimTypes = claims.map(claim => claim.claimType);
      
      return (
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {claimTypes.slice(0, 2).map((type, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200"
              >
                {type}
              </span>
            ))}
            {claimTypes.length > 2 && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                +{claimTypes.length - 2} more
              </span>
            )}
          </div>
          {claims.length > 0 && (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const role = row.original;

      return (
        <div className="flex gap-2">
          <Link href={`/roles/edit/${role.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={() => handleDeleteOpen(role.id)}
          >
            <Trash className="h-4 w-4 text-red-600" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      );
    },
  },
];