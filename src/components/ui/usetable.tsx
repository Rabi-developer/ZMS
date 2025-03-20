// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { FiSearch } from "react-icons/fi";
// import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

// interface Column {
//   key: string;
//   title: string;
// }

// interface Data {
//   [key: string]: any;
//   id: string | number; 
// }

// interface UseTableProps {
//   columns: Column[];
//   data: Data[];
//   onRowClick?: (row: Data) => void;
//   rowsPerPage?: number;
// }

// const UseTable: React.FC<UseTableProps> = ({ columns, data, onRowClick, rowsPerPage = 5 }) => {
//   const [searchValues, setSearchValues] = useState<Record<string, string>>({});
//   const [visibleSearch, setVisibleSearch] = useState<Record<string, boolean>>({});
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [filteredData, setFilteredData] = useState<Data[]>(data);
//   const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

//   const totalPages = Math.ceil(filteredData.length / rowsPerPage);

//   // Handle sorting
//   const handleSort = (columnKey: string) => {
//     let direction: "ascending" | "descending" = "ascending";
//     if (sortConfig?.key === columnKey && sortConfig.direction === "ascending") {
//       direction = "descending";
//     }
//     setSortConfig({ key: columnKey, direction });
//   };

//   const sortedData = useMemo(() => {
//     if (sortConfig) {
//       return [...filteredData].sort((a, b) => {
//         if (a[sortConfig.key] < b[sortConfig.key]) {
//           return sortConfig.direction === "ascending" ? -1 : 1;
//         }
//         if (a[sortConfig.key] > b[sortConfig.key]) {
//           return sortConfig.direction === "ascending" ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return filteredData;
//   }, [filteredData, sortConfig]);

//   // Handle search
//   const handleSearch = (value: string, key: string) => {
//     setSearchValues((prev) => ({ ...prev, [key]: value }));
//   };

//   useEffect(() => {
//     const filtered = data.filter((item) =>
//       columns.every((column) =>
//         searchValues[column.key]
//           ? String(item[column.key]).toLowerCase().includes(searchValues[column.key].toLowerCase())
//           : true
//       )
//     );
//     setFilteredData(filtered);
//   }, [searchValues, data, columns]);

//   // Handle row selection
//   const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.checked) {
//       setSelectedRows(filteredData.map((row) => row.id));
//     } else {
//       setSelectedRows([]);
//     }
//   };

//   const handleRowSelect = (id: string | number) => {
//     setSelectedRows((prev) =>
//       prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
//     );
//   };
  

//   const paginatedData = sortedData.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   return (
//     <div className="bg-[#06b6d4] p-4 rounded-lg">
//       <div className="flex justify-between mb-4">
//         <input
//           type="text"
//           placeholder="Global Search..."
//           className="border rounded px-2 py-1"
//           onChange={(e) => handleSearch(e.target.value, "global")}
//         />
//         <button
//   onClick={() => onRowClick && onRowClick({ id: "" })} 
//   className="bg-white text-[#06b6d4] px-4 py-2 rounded shadow"
// >
//   Add Row
// </button>

//       </div>
//       <table className="w-full bg-white rounded shadow">
//         <thead>
//           <tr>
//             <th>
//               <input
//                 type="checkbox"
//                 onChange={handleSelectAll}
//                 checked={selectedRows.length === filteredData.length}
//               />
//             </th>
//             {columns.map((column) => (
//               <th
//                 key={column.key}
//                 onClick={() => handleSort(column.key)}
//                 className="cursor-pointer"
//               >
//                 {column.title}
//                 {visibleSearch[column.key] && (
//                   <input
//                     type="text"
//                     className="border rounded px-1 ml-2"
//                     placeholder={`Search ${column.title}`}
//                     onChange={(e) => handleSearch(e.target.value, column.key)}
//                   />
//                 )}
//                 <FiSearch
//                   className="inline ml-2 cursor-pointer"
//                   onClick={() =>
//                     setVisibleSearch((prev) => ({
//                       ...prev,
//                       [column.key]: !prev[column.key],
//                     }))
//                   }
//                 />
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {paginatedData.map((row) => (
//             <tr key={row.id} className="hover:bg-gray-100">
//               <td>
//                 <input
//                   type="checkbox"
//                   checked={selectedRows.includes(row.id)}
//                   onChange={() => handleRowSelect(row.id)}
//                 />
//               </td>
//               {columns.map((column) => (
//                 <td key={column.key}>{row[column.key]}</td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div className="flex justify-between mt-4">
//         <button
//           disabled={currentPage === 1}
//           onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//           className="bg-white text-[#06b6d4] px-4 py-2 rounded shadow"
//         >
//           <BsChevronLeft />
//         </button>
//         <span>
//           Page {currentPage} of {totalPages}
//         </span>
//         <button
//           disabled={currentPage === totalPages}
//           onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//           className="bg-white text-[#06b6d4] px-4 py-2 rounded shadow"
//         >
//           <BsChevronRight />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default UseTable;
