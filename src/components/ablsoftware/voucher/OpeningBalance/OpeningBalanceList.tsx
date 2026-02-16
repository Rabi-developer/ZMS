'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/CommissionTable'; // assuming this is your paginated table
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllOpeningBalance,
  deleteOpeningBalance,
} from '@/apis/openingbalance';
import { columns, OpeningBalance } from '@/components/ablsoftware/voucher/OpeningBalance/column';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllEquality } from '@/apis/equality';
import { getAllMunshyana } from '@/apis/munshyana';

// ... rest of your imports

const OpeningBalanceList = () => {
  const router = useRouter();
  const [data, setData] = useState<OpeningBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [accountIndex, setAccountIndex] = useState<Record<string, any>>({});

  const fetchOpeningBalances = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllOpeningBalance(pageIndex + 1, pageSize);
      setData(response?.data || []);
      setTotalRows(response.misc?.total || 0);
    } catch (error) {
      toast.error('Failed to load opening balances');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    fetchOpeningBalances();
  }, [fetchOpeningBalances]);

  useEffect(() => {
    const loadAccountIndex = async () => {
      try {
        const [assets, revenue, liabilities, expense, equity, munshyana] = await Promise.all([
          getAllAblAssests(1, 10000),
          getAllAblRevenue(1, 10000),
          getAllAblLiabilities(1, 10000),
          getAllAblExpense(1, 10000),
          getAllEquality(1, 10000),
          getAllMunshyana(1, 10000),
        ].map(p => p.catch(() => ({ data: [] })))); // catch individual errors to prevent Promise.all from failing

        const idx: Record<string, any> = {};
        
        // Add chart of accounts (Assets, Revenue, Liabilities, Expense, Equality)
        [...assets.data, ...revenue.data, ...liabilities.data, ...expense.data, ...equity.data]
          .forEach(item => {
            if (item?.id) idx[item.id] = item;
          });
        
        // Add Munshyana (charge types) - use chargesDesc as the name
        (munshyana.data || []).forEach((item: any) => {
          if (item?.id || item?.chargesDesc) {
            const key = item.id || item.chargesDesc;
            idx[key] = { ...item, name: item.chargesDesc };
          }
        });
        
        setAccountIndex(idx);
      } catch (err) {
        console.error('Failed to load account index:', err);
      }
    };

    loadAccountIndex();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteOpeningBalance(deleteId);
      toast.success('Deleted successfully');
      setOpen(false);
      fetchOpeningBalances();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleDeleteOpen = (id: string) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDeleteClose = () => {
    setOpen(false);
    setDeleteId('');
  };

  const handlePageIndexChange = useCallback((newIndex: number | ((prev: number) => number)) => {
    setPageIndex(typeof newIndex === 'function' ? newIndex(pageIndex) : newIndex);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newSize: number | ((prev: number) => number)) => {
    setPageSize(typeof newSize === 'function' ? newSize(pageSize) : newSize);
    setPageIndex(0);
  }, [pageSize]);

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <DataTable
          columns={columns(handleDeleteOpen, accountIndex)}
          data={data}
          loading={loading}
          link="/openingbalance/create"
          searchName="openingNo"           // better than searching by accountName here
          setPageIndex={handlePageIndexChange}
          pageIndex={pageIndex}
          setPageSize={handlePageSizeChange}
          pageSize={pageSize}
          totalRows={totalRows}
        />
      </div>

      {open && (
        <DeleteConfirmModel
          isOpen={open}
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default OpeningBalanceList;