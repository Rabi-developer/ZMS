"use client";
import { motion } from "framer-motion";
import { motion as motion$1 } from "framer-motion"; 
import { FaFilter, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoIosCreate } from "react-icons/io";
import { MdManageSearch } from "react-icons/md";
import { cn } from "@/components/lib/StaticData/utils";
import { GrFolderCycle } from "react-icons/gr";
import { FaPersonCircleXmark } from "react-icons/fa6";
import { LuGitPullRequestCreateArrow } from "react-icons/lu";
import { VscGoToSearch } from "react-icons/vsc";

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
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

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
  link,
  searchName = "name",
  hide = true,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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

  return (
    <>
    <div className="dark:bg-[#030630] rounded"> 
      <div className="flex justify-between px-9 mt-2  ">
        {/* Create Button */}
        {link && (
            <Button
              onClick={() => router.push(link)}
              className="inline-flex items-center bg-[#06b6d4] hover:bg-[#0891b2] text-white  px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base  hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2 dark:bg-[#387fbf] dark:hover:bg-[#5d9cd3] dark:text-white  "
            >
              <LuGitPullRequestCreateArrow size={20} className="mr-2" />
              Create
            </Button>
          )}

   <div className="flex gap-2 mt-2">
      {/* Search Bar */}
      {hide && (
          <div className="relative max-w-sm w-full">
            <Input
              placeholder={`Search by ${searchName}...`}
              value={(searchColumn?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                searchColumn?.setFilterValue(event.target.value)
              }
              className="w-full pl-10  border-2 border-[#06b6d4] focus:ring-2 focus:ring-[#0891b2] dark:focus:ring-[#0891b2]  transition-all duration-200"
            />
            <VscGoToSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" size={20} />
          </div>
        )}

        
             {/* Column Filter */}
                <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-white  border-[#06b6d4] focus:ring-2 focus:ring-[#0891b2] transition-all duration-200" >
                <FaFilter
                
                className="text-[#387fbf]"/>
         
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#ecfeff] text-[#387fbf]">
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

      </div>
<div>
 <div className="overflow-x-auto mt-7 rounded-lg ml-8">
  <div className="max-h-[500px] overflow-y-auto">
    <Table className="border-inherit w-full">
      <TableHeader className=" bg-[#e0f2fe]">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
           key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className="text-sm font-semibold border-t-2 border-b-2 border-[#bfdbfe] text-[#06b6d4] dark:text-[#387fbf]   w-[10.1vh]"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="border-b-2 border-[#bfdbfe] ">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="border-b  border-gray-200 hover:bg-gray-100">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-1 pl-2 px-1 text- text-gray-600">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-gray-500 py-8">
              {loading ? (
                <Loader />
              ) : (
                <div className="flex flex-col items-center">
                  <FaPersonCircleXmark size={32} className="mb-2 text-gray-500" />
                  <span>No Record Found</span>
                </div>
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>


{/* Pagination Controls */}
  {/* Pagination Controls */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Page count */}
          <div className="mb-4 md:mb-0">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, data.length)} of {data.length} entries
            </span>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center space-x-2">
            {/* Rows per page selection */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e61e7] dark:bg-[#0a0f3d] dark:text-white"
              >
                {[5, 10, 20, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Previous button */}
            <motion.button
              onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
              whileHover={{ scale: pageIndex === 0 ? 1 : 1.05 }}
              whileTap={{ scale: pageIndex === 0 ? 1 : 0.95 }}
              className={`p-2 text-sm border rounded-md ${
                pageIndex === 0
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-white dark:bg-[#124ebb] text-[#0e61e7] dark:text-white hover:bg-[#bae2ff] dark:hover:bg-[#387fbf]"
              }`}
            >
              <FaArrowLeft size={14} />
            </motion.button>

            {/* Page numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, Math.ceil(data.length / pageSize)) }, (_, i) => {
                const pageNumber = i + Math.max(0, Math.min(
                  pageIndex - 2,
                  Math.ceil(data.length / pageSize) - 5
                ));
                if (pageNumber >= Math.ceil(data.length / pageSize)) return null;
                
                return (
                  <motion.button
                    key={pageNumber}
                    onClick={() => setPageIndex(pageNumber)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 text-sm rounded-md ${
                      pageNumber === pageIndex
                        ? "bg-[#5ebbd2] text-white"
                        : "bg-white dark:bg-[#0a0f3d] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#124ebb]"
                    }`}
                  >
                    {pageNumber + 1}
                  </motion.button>
                );
              })}
            </div>

            {/* Next button */}
            <motion.button
              onClick={() => setPageIndex(Math.min(pageIndex + 1, Math.ceil(data.length / pageSize) - 1))}
              disabled={pageIndex >= Math.ceil(data.length / pageSize) - 1}
              whileHover={{ scale: pageIndex >= Math.ceil(data.length / pageSize) - 1 ? 1 : 1.05 }}
              whileTap={{ scale: pageIndex >= Math.ceil(data.length / pageSize) - 1 ? 1 : 0.95 }}
              className={`p-2 text-sm border rounded-md ${
                pageIndex >= Math.ceil(data.length / pageSize) - 1
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-white dark:bg-[#124ebb] text-[#0e61e7] dark:text-white hover:bg-[#bae2ff] dark:hover:bg-[#387fbf]"
              }`}
            >
              <FaArrowRight size={14} />
            </motion.button>
          </div>
      </motion.div>






</div>


    </div>
    </>
  );
}
