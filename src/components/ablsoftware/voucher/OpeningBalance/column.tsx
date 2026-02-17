import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';

export interface OpeningBalanceEntry {
  id: string;
  biltyNo: string;
  biltyDate: string;
  vehicleNo: string;
  city: string;
  customer: string | null;
  broker: string | null;
  chargeType: string | null;
  debit: number;
  credit: number;
}

export interface OpeningBalance {
  id: string;
  openingNo: number;
  openingDate: string;
  createdBy: string;
  creationDate: string;
  updatedBy: string | null;
  updationDate: string | null;
  status: string | null;
  openingBalanceEntrys: OpeningBalanceEntry[];
}

export const getStatusStyles = (status: string | null) => {
  const s = (status || 'Prepared').toLowerCase();
  switch (s) {
    case 'prepared':
      return 'bg-yellow-100 text-yellow-800';
    case 'checked':
      return 'bg-blue-100 text-blue-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatPrimaryWithMore = (items: string[]) => {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  return `${items[0]} +${items.length - 1} more`;
};

export const columns = (
 handleDeleteOpen: (id: string) => void, 
 handlePdf: (id: string) => void, 
 selectedOpeningBalanceIds: string[], 
 onCheckboxChange: (id: string, checked: boolean) => void, 
 p0: (id: string) => void
): ColumnDef<OpeningBalance>[] => [
  {
    id: 'select',
    header: ({ table }) => {
      const rowIds = table.getRowModel().rows.map((r) => r.original.id);
      const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedOpeningBalanceIds.includes(id));
      
      const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const checked = e.target.checked;
        
        // Call onCheckboxChange for each row individually
        rowIds.forEach(id => {
          const isCurrentlySelected = selectedOpeningBalanceIds.includes(id);
          // Only call if the state needs to change
          if (checked && !isCurrentlySelected) {
            onCheckboxChange(id, true);
          } else if (!checked && isCurrentlySelected) {
            onCheckboxChange(id, false);
          }
        });
      };
      
      return (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={handleToggleAll}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      );
    },
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedOpeningBalanceIds.includes(row.original.id)}
        onChange={(e) => {
          e.stopPropagation();
          onCheckboxChange(row.original.id, e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
      />
    ),
  },
  {
    header: 'Opening No',
    accessorKey: 'openingNo',
  },
  {
    header: 'Opening Date',
    accessorKey: 'openingDate',
  },
  {
    header: 'Vehicle No',
    id: 'vehicleNo',
    cell: ({ row }) => {
      const vehicles = [...new Set(
        (row.original.openingBalanceEntrys || [])
          .map(e => e.vehicleNo?.trim())
          .filter(Boolean)
      )];
      return formatPrimaryWithMore(vehicles as string[]);
    },
  },
  {
    header: 'Vehicle Date',
    id: 'vehicleDate',
    cell: ({ row }) => {
      const dates = [...new Set(
        (row.original.openingBalanceEntrys || [])
          .map(e => e.biltyDate?.trim())
          .filter(Boolean)
      )];
      return formatPrimaryWithMore(dates as string[]);
    },
  },
  {
    header: 'Customer',
    id: 'customer',
    cell: ({ row }) => {
      const customers = [...new Set(
        (row.original.openingBalanceEntrys || [])
          .map(e => e.customer?.trim())
          .filter((c): c is string => !!c)
      )];
      return formatPrimaryWithMore(customers);
    },
  },
  {
    header: 'Broker',
    id: 'broker',
    cell: ({ row }) => {
      const brokers = [...new Set(
        (row.original.openingBalanceEntrys || [])
          .map(e => e.broker?.trim())
          .filter((b): b is string => !!b)
      )];
      return formatPrimaryWithMore(brokers);
    },
  },
  
  // {
  //   header: 'Charge Type',
  //   id: 'chargeType',
  //   cell: ({ row }) => {
  //     const types = [...new Set(
  //       (row.original.openingBalanceEntrys || [])
  //         .map(e => {
  //           if (!e.chargeType) return null;
  //           const name = accountIndex[e.chargeType]?.name || e.chargeType;
  //           return name?.trim() || null;
  //         })
  //         .filter((t): t is string => !!t)
  //     )];
  //     return types.length ? types.join(', ') : '';
  //   },
  // },
  {
    header: 'Debit',
    id: 'totalDebit',
    cell: ({ row }) => {
      const total = (row.original.openingBalanceEntrys || []).reduce(
        (sum, entry) => sum + (entry.debit || 0),
        0
      );
      return total > 0 ? total.toFixed(2) : '';
    },
  },
  {
    header: 'Credit',
    id: 'totalCredit',
    cell: ({ row }) => {
      const total = (row.original.openingBalanceEntrys || []).reduce(
        (sum, entry) => sum + (entry.credit || 0),
        0
      );
      return total > 0 ? total.toFixed(2) : '';
    },
  },
  {
    header: 'Status',
    id: 'status',
    cell: ({ row }) => {
      const status = row.original.status || 'Prepared';
      return (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const isApproved = (row.original.status || '').toLowerCase() === 'approved';

      return (
        <div className="flex items-center gap-2">
          {isApproved ? (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="text-gray-400 cursor-not-allowed"
              title="Approved records cannot be edited"
            >
              <Edit size={16} />
            </Button>
          ) : (
            <Link href={`/openingbalance/edit/${row.original.id}`}>
              <Button size="sm" variant="outline" className="hover:bg-yellow-50">
                <Edit size={16} />
              </Button>
            </Link>
          )}

          <Button
            size="sm"
            variant="outline"
            className="hover:bg-red-50 text-red-600 border-red-200"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteOpen(row.original.id);
            }}
          >
            <Trash size={16} />
          </Button>
        </div>
      );
    },
  },
];
