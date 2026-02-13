// 'use client';
// import React, { useState, useEffect } from 'react';
// import { DataTable } from '@/components/ui/CommissionTable'; // your custom table
// import { columns, OpeningBalanceEntry } from './columns';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';
// import { toast } from 'react-toastify';

// const OpeningBalanceList = () => {
//   const [data, setData] = useState<OpeningBalanceEntry[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // Replace with your real API call
//         // const res = await getAllOpeningBalances();
//         const mockData: OpeningBalanceEntry[] = [
//           {
//             id: '1',
//             description: 'Opening balance 01-Jul-2025',
//             entryDate: '2025-07-01',
//             totalDebit: 1250000,
//             totalCredit: 0,
//             status: 'Recorded',
//           },
//           // ...
//         ];
//         setData(mockData);
//       } catch (err) {
//         toast.error('Failed to load opening balances');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className="container mx-auto p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Opening Balances</h1>
//         <Link href="/opening-balance/create">
//           <Button className="bg-emerald-600 hover:bg-emerald-700">
//             + New Opening Balance
//           </Button>
//         </Link>
//       </div>

//       <DataTable
//         columns={columns}
//         data={data}
//         loading={loading}
//         searchName="description"
//         // add pagination, filters, etc. as needed
//       />
//     </div>
//   );
// };

// export default OpeningBalanceList;