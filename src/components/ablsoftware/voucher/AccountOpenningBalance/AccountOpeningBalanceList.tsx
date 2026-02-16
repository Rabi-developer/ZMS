'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllOpeningBalance,
  deleteOpeningBalance,
} from '@/apis/openingbalance';
import { columns, AccountOpeningBalance } from './columns';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllEquality } from '@/apis/equality';

const AccountOpeningBalanceList = () => {
  const router = useRouter();

  const [data, setData] = useState<AccountOpeningBalance[]>([]);
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
      toast.error('Failed to fetch opening balances');
      console.error(error);
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
        const [a, r, l, e, eq] = await Promise.all([
          getAllAblAssests(1, 10000),
          getAllAblRevenue(1, 10000),
          getAllAblLiabilities(1, 10000),
          getAllAblExpense(1, 10000),
          getAllEquality(1, 10000),
        ].map((p) => p.catch(() => ({ data: [] }))));

        const idx: Record<string, any> = {};
        [...(a.data || []), ...(r.data || []), ...(l.data || []), ...(e.data || []), ...(eq.data || [])].forEach(
          (item) => {
            if (item?.id) idx[item.id] = item;
          }
        );
        setAccountIndex(idx);
      } catch (err) {
        console.error('Error loading account index:', err);
      }
    };

    loadAccountIndex();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOpeningBalance(deleteId);
      toast.success('Deleted successfully');
      setOpen(false);
      fetchOpeningBalances();
    } catch (error) {
      toast.error('Failed to delete opening balance');
      console.error(error);
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

  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    setPageIndex(typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    setPageSize(typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize);
    setPageIndex(0);
  }, [pageSize]);

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <DataTable
          columns={columns(handleDeleteOpen, accountIndex)}
          data={data}
          loading={loading}
          link="/AccountOpeningBalance/create"
          searchName="accountName"
          setPageIndex={handlePageIndexChange}
          pageIndex={pageIndex}
          setPageSize={handlePageSizeChange}
          pageSize={pageSize}
          totalRows={totalRows}
        />
      </div>

      <DeleteConfirmModel
        isOpen={open}
        handleDeleteclose={handleDeleteClose}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default AccountOpeningBalanceList;