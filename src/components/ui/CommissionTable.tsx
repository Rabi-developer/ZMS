"use client";
import { motion } from "framer-motion";
import {
  FaFilter,
  FaAngleLeft,
  FaAngleRight,
  FaSearch,
  FaTimes,
  FaSortAmountDown,
  FaSortAmountUp,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { LuGitPullRequestCreateArrow } from "react-icons/lu";
import { FaPersonCircleXmark } from "react-icons/fa6";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { BiSearchAlt2 } from "react-icons/bi";
import { cn } from "@/components/lib/StaticData/utils";
import React, { useState, useMemo, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
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

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-x-auto" style={{ width: '100%' }}>
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

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
));
TableRow.displayName = "TableRow";

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
));
TableHead.displayName = "TableHead";

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
));
TableCell.displayName = "TableCell";

interface DataTableProps<TData extends { id: string }, TValue> {
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
  totalRows?: number;
  onRowClick?: (id: string) => void;
  onRowDoubleClick?: (id: string) => void;
  selectedRowIds?: string[];
  onCheckboxChange?: (id: string, checked: boolean) => void;
  expandedRowId?: string | null;
  expandedRowRender?: (row: TData) => React.ReactElement;
}

function globalFilterFn(row: any, columnId: string, value: string) {
  const search = value.toLowerCase();
  return Object.values(row.original).some((cellValue: any) => {
    if (cellValue == null) return false;
    return String(cellValue).toLowerCase().includes(search);
  });
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  loading,
  link,
  pageIndex,
  pageSize,
  setPageIndex,
  setPageSize,
  totalRows,
  searchName = "name",
  hide = true,
  onRowClick,
  onRowDoubleClick,
  selectedRowIds = [],
  onCheckboxChange,
  expandedRowId,
  expandedRowRender,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"global" | "column">("global");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Disable built-in pagination since we're doing server-side pagination
    manualPagination: true,
  });

  const searchColumn = table.getColumn(searchName);

  const handleColumnSearch = (columnId: string, value: string) => {
    setColumnSearches((prev) => ({ ...prev, [columnId]: value }));
    table.getColumn(columnId)?.setFilterValue(value);
  };

  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setColumnSearches({});
    table.resetColumnFilters();
  };

  const searchableColumns = useMemo(() => {
    return table.getAllColumns().filter((column) => column.getCanFilter());
  }, [table]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dark:bg-[#1a2a22] bg-white rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="bg-[#3a614c] rounded-t-xl p-6">
          <div className="flex justify-between items-center">
            {link && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => router.push(link)}
                  className="inline-flex items-center bg-white text-[#3a614c] hover:bg-gray-100 px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-lg shadow-md hover:shadow-lg"
                >
                  <LuGitPullRequestCreateArrow size={20} className="mr-2" />
                  Create New
                </Button>
              </motion.div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setSearchMode("global")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    searchMode === "global"
                      ? "bg-white text-[#3a614c] shadow-sm"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  Global Search
                </button>
                <button
                  onClick={() => setSearchMode("column")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    searchMode === "column"
                      ? "bg-white text-[#3a614c] shadow-sm"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  Column Search
                </button>
              </div>
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-200"
              >
                <HiOutlineAdjustmentsHorizontal size={18} className="mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
          {searchMode === "global" && hide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="relative max-w-md">
                <Input
                  placeholder="Search across all columns..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 pr-10 border-2 border-[#3a614c]/30 focus:border-[#3a614c] focus:ring-2 focus:ring-[#3a614c]/20 transition-all duration-200 rounded-lg"
                />
                <BiSearchAlt2
                  className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                {globalFilter && (
                  <button
                    onClick={() => setGlobalFilter("")}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
          {searchMode === "column" && hide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchableColumns.slice(0, 6).map((column) => (
                  <div key={column.id} className="relative">
                    <Input
                      placeholder={`Search ${column.id}...`}
                      value={columnSearches[column.id] || ""}
                      onChange={(e) => handleColumnSearch(column.id, e.target.value)}
                      className="pl-8 border border-gray-300 focus:border-[#3a614c] focus:ring-1 focus:ring-[#3a614c]/20 transition-all duration-200 rounded-md text-sm"
                    />
                    <FaSearch
                      className="absolute top-1/2 left-2.5 transform -translate-y-1/2 text-gray-400"
                      size={12}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4 mt-4"
            >
              <div className="flex flex-wrap gap-3 items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 bg-white border-[#3a614c]/30 hover:border-[#3a614c] hover:bg-[#3a614c]/5 transition-all duration-200"
                    >
                      <FaEye className="text-[#3a614c]" size={14} />
                      Columns ({table.getVisibleLeafColumns().length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white border-gray-200 shadow-lg rounded-lg min-w-[200px]"
                  >
                    <div className="p-2 border-b">
                      <span className="text-sm font-semibold text-gray-700">Toggle Columns</span>
                    </div>
                    {table.getAllColumns().map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize hover:bg-[#3a614c]/5 transition-colors"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        <span className="flex items-center gap-2">
                          {column.getIsVisible() ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
                          {column.id}
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {(globalFilter || columnFilters.length > 0) && (
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                  >
                    <FaTimes size={12} />
                    Clear All
                  </Button>
                )}
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {table.getFilteredRowModel().rows.length} of {totalRows || data.length} records
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div className="px-6 pb-6">
            <div className="overflow-hidden rounded-lg border-2 border-[#6e997f] dark:border-[#6e997f] shadow-sm">
              <div className="overflow-x-auto">
                <div className="max-h-[350px] overflow-y-auto relative">
                  <table className="w-full table-fixed">
                    <thead className="bg-[#3a614c]/5 sticky top-0 z-10">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b-2 border-[#6e997f]">
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="text-sm font-bold text-[#3a614c] dark:text-[#3a614c] px-4 py-4 bg-white/80 backdrop-blur-sm"
                            >
                              <div className="flex items-center gap-2">
                                {header.isPlaceholder ? null : (
                                  <div
                                    className={cn(
                                      "flex items-center gap-2",
                                      header.column.getCanSort() && "cursor-pointer select-none hover:text-[#3a614c] transition-colors"
                                    )}
                                    onClick={header.column.getToggleSortingHandler()}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                    {header.column.getCanSort() && (
                                      <span className="ml-1">
                                        {header.column.getIsSorted() === "desc" ? (
                                          <FaSortAmountDown size={12} className="text-[#3a614c]" />
                                        ) : header.column.getIsSorted() === "asc" ? (
                                          <FaSortAmountUp size={12} className="text-[#3a614c]" />
                                        ) : (
                                          <div className="w-3 h-3 opacity-30">
                                            <FaSortAmountDown size={12} />
                                          </div>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, index) => (
                          <React.Fragment key={row.id}>
                            <motion.tr
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="border-b border-[#6e997f]/30 hover:bg-[#3a614c]/5 transition-all duration-200 group cursor-pointer"
                              onClick={() => onRowClick?.(row.original.id)}
                              onDoubleClick={() => onRowDoubleClick?.(row.original.id)}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className="px-4 py-3 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </motion.tr>
                            {expandedRowId === row.original.id && expandedRowRender && (
                              <tr>
                                <td colSpan={columns.length} className="p-0">
                                  {expandedRowRender(row.original)}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="text-center py-12"
                          >
                            {loading ? (
                              <div className="flex flex-col items-center gap-4">
                                <Loader />
                                <span className="text-gray-500">Loading data...</span>
                              </div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-4"
                              >
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                  <FaPersonCircleXmark
                                    size={32}
                                    className="text-gray-400"
                                  />
                                </div>
                                <div className="text-center">
                                  <h3 className="text-lg font-semibold text-gray-700 mb-1">No Records Found</h3>
                                  <p className="text-gray-500">
                                    {globalFilter || columnFilters.length > 0
                                      ? "Try adjusting your search criteria"
                                      : "No data available to display"}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray dark:border-[#6e997f] rounded-b-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="font-medium">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newPageSize = Number(e.target.value);
                    setPageSize(newPageSize);
                    setPageIndex(0); // Reset to the first page
                  }}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm cursor-pointer focus:ring-2 focus:ring-[#3a614c]/20 focus:border-[#3a614c] transition-all"
                >
                  {[10, 50, 500, 50000].map((pageSizeOption) => (
                    <option key={pageSizeOption} value={pageSizeOption}>
                      {pageSizeOption}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:block text-sm">
                Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, totalRows || data.length)} of {totalRows || data.length} entries
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(0)}
                disabled={pageIndex === 0}
                className="border-[#4d7c61] text-[#4d7c61] hover:bg-[#6e997f] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prevPage = Math.max(pageIndex - 1, 0);
                  setPageIndex(prevPage);
                }}
                disabled={pageIndex === 0}
                className="border-[#4d7c61] text-[#4d7c61] hover:bg-[#6e997f] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaAngleLeft className="mr-1" /> Previous
              </Button>
              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil((totalRows || data.length) / pageSize);
                  const maxVisiblePages = 5; // Limit visible pages to prevent too many buttons
                  const startPage = Math.max(0, Math.min(pageIndex - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages));
                  const endPage = Math.min(totalPages, startPage + maxVisiblePages);
                  
                  return Array.from(
                    { length: endPage - startPage },
                    (_, i) => {
                      const pageNumber = startPage + i;
                      return (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === pageIndex ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPageIndex(pageNumber)}
                          className={cn(
                            "w-8 h-8 p-0 transition-all duration-200",
                            pageNumber === pageIndex
                              ? "bg-[#6e997f] text-white hover:bg-[#6e997f]/80"
                              : "border-[#6e997f] text-[#4d7c61] hover:bg-[#6e997f] hover:text-white"
                          )}
                        >
                          {pageNumber + 1}
                        </Button>
                      );
                    }
                  );
                })()}
              </div>
              {(() => {
                const lastIndex = Math.max(Math.ceil((totalRows || data.length) / pageSize) - 1, 0);
                return (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextPage = Math.min(pageIndex + 1, lastIndex);
                        setPageIndex(nextPage);
                      }}
                      disabled={pageIndex >= lastIndex || (totalRows || data.length) === 0}
                      className="border-[#4d7c61] text-[#4d7c61] hover:bg-[#6e997f] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <FaAngleRight className="ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageIndex(lastIndex)}
                      disabled={pageIndex >= lastIndex}
                      className="border-[#4d7c61] text-[#4d7c61] hover:bg-[#6e997f] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default DataTable;
