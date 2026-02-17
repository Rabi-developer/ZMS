'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllOpeningBalance,
  deleteOpeningBalance,
  updateOpeningBalanceStatus,
} from '@/apis/openingbalance';
import { columns, OpeningBalance } from '@/components/ablsoftware/voucher/OpeningBalance/column';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllEquality } from '@/apis/equality';
import { getAllMunshyana } from '@/apis/munshyana';

const OpeningBalanceList = () => {
  const [data, setData] = useState<OpeningBalance[]>([]);
  const [filteredData, setFilteredData] = useState<OpeningBalance[]>([]);
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
    const filtered = selectedStatusFilter === 'All'
      ? data
      : data.filter((d) => (d.status || 'Prepared') === selectedStatusFilter);
    setFilteredData(filtered);
    // Optional: clear selection when filter changes
    // setSelectedIds([]);
    // setSelectedBulkStatus(null);
  }, [data, selectedStatusFilter]);

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
        ].map((p) => p.catch(() => ({ data: [] }))));

        const idx: Record<string, any> = {};

        [...assets.data, ...revenue.data, ...liabilities.data, ...expense.data, ...equity.data].forEach(
          (item) => {
            if (item?.id) idx[item.id] = item;
          }
        );

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

  const handlePageIndexChange = useCallback(
    (newIndex: number | ((prev: number) => number)) => {
      setPageIndex(typeof newIndex === 'function' ? newIndex(pageIndex) : newIndex);
    },
    [pageIndex]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number | ((prev: number) => number)) => {
      setPageSize(typeof newSize === 'function' ? newSize(pageSize) : newSize);
      setPageIndex(0);
    },
    [pageSize]
  );

  // ────────────────────────────────────────────────
  // Row click → TOGGLE selection (add / remove)
  // ────────────────────────────────────────────────
  const handleRowClick = (id: string) => {
    setSelectedIds((prev) => {
      let next: string[];

      if (prev.includes(id)) {
        // Deselect
        next = prev.filter((x) => x !== id);
      } else {
        // Select
        next = [...prev, id];
      }

      // Update bulk status preview
      if (next.length === 0) {
        setSelectedBulkStatus(null);
      } else {
        const firstId = next[0];
        const firstRow =
          filteredData.find((r) => r.id === firstId) || data.find((r) => r.id === firstId);
        const firstStatus = firstRow?.status || 'Prepared';

        // Only show status if ALL selected rows have the same status
        const allSame = next.every((selId) => {
          const row =
            filteredData.find((r) => r.id === selId) || data.find((r) => r.id === selId);
          return (row?.status || 'Prepared') === firstStatus;
        });

        setSelectedBulkStatus(allSame ? firstStatus : null);
      }

      return next;
    });
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    console.log('handleCheckboxChange called:', { id, checked });
    
    setSelectedIds((prev) => {
      let next: string[];

      if (checked) {
        // Add to selection if not already selected
        next = prev.includes(id) ? prev : [...prev, id];
      } else {
        // Remove from selection
        next = prev.filter((x) => x !== id);
      }

      console.log('Selection changed from', prev, 'to', next);

      // Update bulk status preview
      if (next.length === 0) {
        setSelectedBulkStatus(null);
      } else {
        const firstId = next[0];
        const firstRow =
          filteredData.find((r) => r.id === firstId) || data.find((r) => r.id === firstId);
        const firstStatus = firstRow?.status || 'Prepared';

        const allSame = next.every((selId) => {
          const row =
            filteredData.find((r) => r.id === selId) || data.find((r) => r.id === selId);
          return (row?.status || 'Prepared') === firstStatus;
        });

        setSelectedBulkStatus(allSame ? firstStatus : null);
      }

      return next;
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!selectedIds.length) {
      toast.warning('Please select at least one record');
      return;
    }

    try {
      setUpdating(true);
      await Promise.all(
        selectedIds.map((id) => updateOpeningBalanceStatus({ id, status: newStatus }))
      );
      toast.success(`Updated ${selectedIds.length} record(s)`);
      setSelectedIds([]);
      setSelectedBulkStatus(null);
      await fetchOpeningBalances();
    } catch (error) {
      toast.error('Failed to update status');
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
          columns={columns(
            handleDeleteOpen,
            () => {}, // pdf handler (unused here)
            selectedIds,
            handleCheckboxChange,
            () => {} // dummy / unused param
          )}
          data={filteredData}
          loading={loading}
          link="/openingbalance/create"
          searchName="openingNo"
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
        <div className="mt-6 flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          {statusOptionsConfig.map((opt) => {
            const isActive = selectedBulkStatus === opt.name;
            return (
              <button
                key={opt.id}
                onClick={() => handleBulkStatusUpdate(opt.name)}
                disabled={updating || !selectedIds.length}
                className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
                  ${isActive ? 'bg-opacity-10 shadow-md' : 'bg-white'}
                  ${updating || !selectedIds.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}
                style={{
                  borderColor: opt.color,
                  color: opt.color,
                  backgroundColor: isActive ? `${opt.color}15` : undefined,
                }}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      )}

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