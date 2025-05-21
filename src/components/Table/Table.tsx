import { FaFilter, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoIosCreate } from "react-icons/io";
import { MdManageSearch } from "react-icons/md";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading: boolean;
  hide?: boolean;
  link: string;
  searchName?: string;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  pageIndex: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  hide = true,
  link,
  searchName = "name",
  setPageIndex,
  pageIndex,
  setPageSize,
  pageSize,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const searchColumn = table.getColumn(searchName);

  const handleSort = (columnId: string) => {
    const isAsc = sorting[0]?.desc ? false : true;
    setSorting([{ id: columnId, desc: !isAsc }]);
  };

  return (
    <>
      <div className="flex justify-between px-5 py-4 mt-6 rounded-lg bg-white shadow-md">
        <div className="flex items-center space-x-4">
          {link && (
            <Button
              onClick={() => router.push(link)}
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-all duration-200"
            >
              <IoIosCreate size={20} className="mr-2" />
              Create
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 text-blue-600 hover:text-white bg-white hover:bg-blue-600 border-2 border-blue-600 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
              >
                <FaFilter />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hide && (
          <div className="relative max-w-sm w-full">
            <Input
              placeholder={`Search by ${searchName}...`}
              value={(searchColumn?.getFilterValue() as string) ?? ""}
              onChange={(event) => searchColumn?.setFilterValue(event.target.value)}
              className="w-full pl-10 rounded-full border-2 border-gray-300 focus:ring-2 focus:ring-blue-600 transition-all duration-200"
            />
            <MdManageSearch
              className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"
              size={20}
            />
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg bg-white shadow-md">
        <div className="relative overflow-auto max-h-[400px]">
          <Table className="w-[160vh] ml-5">
            <TableHeader className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`text-gray-500 text-sm font-semibold bg-gray-100 cursor-pointer ${
                        header.column.getIsSorted() ? "bg-blue-100" : ""
                      }`}
                      onClick={() => handleSort(header.id)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === "desc" ? (
                          <HiChevronDown size={18} />
                        ) : (
                          <HiChevronUp size={18} />
                        )
                      ) : (
                        <span className="text-gray-400">
                          <FaFilter size={12} />
                        </span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <div className="Z-Scroll">
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 text-sm text-gray-600">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-gray-500 py-8"
                  >
                    {loading ? <Loader /> : "No Record Found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </div>
          </Table>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white flex items-center justify-between py-4 mt-4 px-5">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-full p-2 text-sm cursor-pointer focus:ring-2 focus:ring-blue-600"
          >
            {[5, 10, 20, 50, 100].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="hover:bg-blue-600"
          >
            <FaArrowLeft size={16} className="text-blue-600" />
          </Button>
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full">
            {pageIndex + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={data.length < pageSize}
            className="hover:bg-blue-600"
          >
            <FaArrowRight size={16} className="text-blue-600" />
          </Button>
          <span className="ml-2 text-gray-500 text-sm">
            Page {`${pageIndex + 1} of ${Math.ceil(data.length / pageSize)}`}
          </span>
        </div>
      </div>
    </>
  );
}