import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  onRowsPerPageChange: (rows: number) => void;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  rowsPerPage,
  onRowsPerPageChange,
  onPageChange,
}) => {
  const goToPreviousPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="pagination-container1 flex items-center gap-1 w-full h-10 mt-0 ml-2 justify-end">
      <label htmlFor="rowsPerPage" className="text-sm">
        Rows per page:
      </label>
      <select
        id="rowsPerPage"
        value={rowsPerPage}
        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        className="border border-gray-400 rounded px-2 py-1 text-sm"
      >
       <option value={50}>50 rows</option>
        <option value={500}>500 rows</option>
        <option value={5000}>5000 rows</option>
     </select>
      <a
        href="#"
        onClick={goToPreviousPage}
        className={`px-2 py-1 border border-gray-800 rounded text-gray-800 font-bold text-sm ${
          currentPage === 1
            ? "cursor-not-allowed text-gray-400"
            : "hover:bg-[#7D9DF1] hover:text-white"
        }`}
      >
        &larr; prev
      </a>
      {[...Array(totalPages)].map((_, index) => (
        <a
          key={index}
          href="#"
          onClick={() => onPageChange(index + 1)}
          className={`px-2 py-1 border ${
            currentPage === index + 1
              ? "bg-[#7D9DF1] text-white"
              : "border-gray-800 text-gray-800 font-bold hover:bg-[#7D9DF1] hover:text-white"
          } rounded text-sm`}
        >
          {index + 1}
        </a>
      ))}
      <a
        href="#"
        onClick={goToNextPage}
        className={`px-2 py-1 border border-gray-800 rounded text-gray-800 font-bold text-sm ${
          currentPage === totalPages
            ? "cursor-not-allowed text-gray-400"
            : "hover:bg-[#7D9DF1] hover:text-white"
        }`}
      >
        next &rarr;
      </a>
      <div className="page-info text-xs text-black">
    Page {currentPage} of {totalPages}
  </div>
    </div>
  );
};

export default Pagination;
