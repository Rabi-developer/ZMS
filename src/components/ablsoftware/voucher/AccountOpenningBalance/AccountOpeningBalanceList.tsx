'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllAccountOpeningBalance,
  deleteAccountOpeningBalance,
  updateAccountOpeningBalanceStatus,
} from '@/apis/accountopeningbalance';
import { columns, AccountOpeningBalance } from './columns';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllEquality } from '@/apis/equality';

const AccountOpeningBalanceList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<AccountOpeningBalance[]>([]);
  const [filteredData, setFilteredData] = useState<AccountOpeningBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [accountIndex, setAccountIndex] = useState<Record<string, any>>({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'UnApproved', 'Closed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#3b82f6' },
    { id: 2, name: 'Approved', color: '#10b981' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'UnApproved', color: '#f59e0b' },
    { id: 5, name: 'Closed', color: '#6b7280' },
  ];

  const fetchOpeningBalances = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllAccountOpeningBalance(pageIndex + 1, pageSize);
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
    const filtered = selectedStatusFilter === 'All'
      ? data
      : data.filter((d) => (d.status || 'Prepared') === selectedStatusFilter);
    setFilteredData(filtered);
    setSelectedIds([]);
    setSelectedBulkStatus(null);
  }, [data, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchOpeningBalances();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router, fetchOpeningBalances]);

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
      await deleteAccountOpeningBalance(deleteId);
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

  const handleRowClick = (id: string) => {
    const row = filteredData.find((item) => item.id === id) || data.find((item) => item.id === id);
    setSelectedIds([id]);
    setSelectedBulkStatus(row?.status || 'Prepared');
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const row = filteredData.find((item) => item.id === id) || data.find((item) => item.id === id);
    if (checked) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setSelectedBulkStatus(row?.status || 'Prepared');
    } else {
      setSelectedIds((prev) => {
        const next = prev.filter((x) => x !== id);
        const first = next[0];
        const firstRow = first ? (filteredData.find((item) => item.id === first) || data.find((item) => item.id === first)) : null;
        setSelectedBulkStatus(firstRow?.status || null);
        return next;
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!selectedIds.length) {
      toast('Please select at least one opening balance', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      await Promise.all(
        selectedIds.map((id) =>
          updateAccountOpeningBalanceStatus({ id, status: newStatus })
        )
      );
      setSelectedBulkStatus(newStatus);
      setSelectedIds([]);
      toast('Status updated', { type: 'success' });
      await fetchOpeningBalances();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={fetchOpeningBalances}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <DataTable
          columns={columns(handleDeleteOpen, accountIndex, handleCheckboxChange, selectedIds)}
          data={filteredData}
          loading={loading}
          link="/AccountOpeningBalance/create"
          searchName="accountName"
          setPageIndex={handlePageIndexChange}
          pageIndex={pageIndex}
          setPageSize={handlePageSizeChange}
          pageSize={pageSize}
          totalRows={totalRows}
          onRowClick={handleRowClick}
          selectedRowIds={selectedIds}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4 p-4">
          {statusOptionsConfig.map((opt) => {
            const active = selectedBulkStatus === opt.name;
            return (
              <button
                key={opt.id}
                onClick={() => handleBulkStatusUpdate(opt.name)}
                disabled={updating || !selectedIds.length}
                className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
                ${active ? 'bg-white' : 'border-gray-300 bg-white'}
                ${updating || !selectedIds.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                style={active ? { borderColor: opt.color, color: opt.color } : undefined}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      )}

      <DeleteConfirmModel
        isOpen={open}
        handleDeleteclose={handleDeleteClose}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default AccountOpeningBalanceList;

