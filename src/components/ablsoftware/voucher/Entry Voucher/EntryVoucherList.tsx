'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import { MdReceipt, MdClose } from 'react-icons/md';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllEntryVoucher, deleteEntryVoucher, updateEntryVoucher, getSingleEntryVoucher } from '@/apis/entryvoucher';
import { columns, Voucher } from './columns';
import EntryVoucherPDFExport from './EntryVoucherPDFExport';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllEquality } from '@/apis/equality';

const EntryVoucherList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [accountIndex, setAccountIndex] = useState<Record<string, { id: string; listid?: string; description?: string }>>({});

  const statusOptions = ['All', 'Posted', 'Draft', 'Cancelled'];
  const statusOptionsConfig = [
    { id: 1, name: 'Posted', color: '#22c55e' },
    { id: 2, name: 'Draft', color: '#eab308' },
    { id: 3, name: 'Cancelled', color: '#ef4444' },
  ];

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await getAllEntryVoucher(pageIndex + 1, pageSize);
      setVouchers(response?.data || []);
    } catch (error) {
      toast('Failed to fetch vouchers', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = vouchers;
    if (selectedStatusFilter !== 'All') {
      filtered = vouchers.filter((v) => v.status === selectedStatusFilter);
    }
    setFilteredVouchers(filtered);
  }, [vouchers, selectedStatusFilter]);

  useEffect(() => {
    const refresh = searchParams.get('refresh') === 'true';
    const createdId = searchParams.get('created');
    if (refresh) {
      fetchVouchers();
      if (createdId) {
        // Auto-open PDF for the created/updated voucher
        handlePdf(createdId);
      }
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      newUrl.searchParams.delete('created');
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  // Build a flat index of accounts (id -> {listid, description}) for PDF mapping
  useEffect(() => {
    const loadAccountIndex = async () => {
      try {
        const [assets, revenues, liabilities, expenses, equities] = await Promise.all([
          getAllAblAssests(1, 10000).catch(() => ({ data: [] })),
          getAllAblRevenue(1, 10000).catch(() => ({ data: [] })),
          getAllAblLiabilities(1, 10000).catch(() => ({ data: [] })),
          getAllAblExpense(1, 10000).catch(() => ({ data: [] })),
          getAllEquality(1, 10000).catch(() => ({ data: [] })),
        ]);
        const idx: Record<string, { id: string; listid?: string; description?: string }> = {};
        const add = (arr: any[]) => arr?.forEach?.((a: any) => { if (a?.id) idx[a.id] = { id: a.id, listid: a.listid, description: a.description }; });
        add(assets?.data || []);
        add(revenues?.data || []);
        add(liabilities?.data || []);
        add(expenses?.data || []);
        add(equities?.data || []);
        setAccountIndex(idx);
      } catch (e) {
        console.error('Failed to build account index', e);
      }
    };
    loadAccountIndex();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteEntryVoucher(deleteId);
      setOpenDelete(false);
      toast('Voucher Deleted Successfully', { type: 'success' });
      fetchVouchers();
    } catch (error) {
      toast('Failed to delete voucher', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => {
    setOpenDelete(true);
    setDeleteId(id);
  };

  const handleDeleteClose = () => {
    setOpenDelete(false);
    setDeleteId('');
  };

  const handleCheckboxChange = (voucherId: string, checked: boolean) => {
    if (checked) {
      setSelectedVoucherIds((prev) => [...prev, voucherId]);
    } else {
      setSelectedVoucherIds((prev) => prev.filter((id) => id !== voucherId));
    }

    setTimeout(() => {
      const selected = vouchers.filter((v) => selectedVoucherIds.includes(v.id));
      const statuses = selected.map((v) => v.status).filter((status, index, self) => self.indexOf(status) === index);
      setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
    }, 100);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedVoucherIds.length === 0) {
      toast('Please select at least one voucher', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedVoucherIds.map((id) =>
        updateEntryVoucher({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedVoucherIds([]);
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
      toast('Voucher Status Updated Successfully', { type: 'success' });
      await fetchVouchers();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePdf = async (id: string) => {
    try {
      const res = await getSingleEntryVoucher(id);
      const v = res?.data;
      if (!v) {
        toast('Voucher not found', { type: 'error' });
        return;
      }
      EntryVoucherPDFExport.exportToPDF({
        voucher: {
          id: v.id,
          voucherNo: v.voucherNo,
          voucherDate: v.voucherDate,
          referenceNo: v.referenceNo,
          chequeNo: v.chequeNo,
          depositSlipNo: v.depositSlipNo,
          paymentMode: v.paymentMode,
          bankName: v.bankName,
          chequeDate: v.chequeDate,
          paidTo: v.paidTo,
          narration: v.narration,
          description: v.description,
          tableData: v.tableData || [],
        },
        accountIndex,
      });
    } catch (error) {
      console.error('Failed to generate voucher PDF:', error);
      toast('Failed to generate voucher PDF', { type: 'error' });
    }
  };

  const handleRangePdf = async () => {
    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;
    const inRange = filteredVouchers.filter((v) => {
      const d = new Date(v.voucherDate);
      if (isNaN(d.getTime())) return false;
      return (!s || d >= s) && (!e || d <= e);
    });
    if (inRange.length === 0) {
      toast('No vouchers in selected range', { type: 'warning' });
      return;
    }
    for (const v of inRange) {
      await handlePdf(v.id);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedVoucherIds.length > 0
      ? filteredVouchers.filter((v) => selectedVoucherIds.includes(v.id))
      : filteredVouchers;

    if (dataToExport.length === 0) {
      toast('No vouchers to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.map((v) => ({
      'Voucher No': v.voucherNo || '-',
      'Voucher Date': v.voucherDate || '-',
      'Reference No': v.referenceNo || '-',
      'Payment Mode': v.paymentMode || '-',
      'Paid To': v.paidTo || '-',
      'Total Debit': v.totalDebit || '-',
      'Total Credit': v.totalCredit || '-',
      'Status': v.status || 'Draft',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vouchers');
    XLSX.writeFile(workbook, 'Vouchers.xlsx');
  };

  return (
    <div className="container bg-white rounded-md p-6 h-[110vh]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2">Filter by Status:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3a614c]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchVouchers}
            className="px-3 py-2 bg-[#3a614c] text-white rounded-md hover:bg-[#3a614c]/90 text-sm"
          >
            Refresh Data
          </button>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-200"
        >
          <FaFileExcel size={18} />
          Download Excel
        </button>
      </div>
      <div className="mb-4 flex items-center gap-2 justify-end">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-md p-2" />
        <span className="text-sm text-gray-600">to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-md p-2" />
        <button onClick={handleRangePdf} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-all duration-200">
          <MdReceipt size={18} /> Download PDF (Date Range)
        </button>
      </div>
      <div>
        <DataTable
          columns={columns(handleDeleteOpen, handlePdf)}
          data={filteredVouchers}
          loading={loading}
          link="/entryvoucher/create"
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
      <div className="mt-4 space-y-2 h-[18vh]">
        <div className="flex flex-wrap p-3 gap-3">
          {statusOptionsConfig.map((option) => {
            const isSelected = selectedBulkStatus === option.name;
            return (
              <button
                key={option.id}
                onClick={() => handleBulkStatusUpdate(option.name)}
                disabled={updating}
                className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                  ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
              </button>
            );
          })}
        </div>
      </div>
      {openDelete && (
        <DeleteConfirmModel
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
          isOpen={openDelete}
        />
      )}
    </div>
  );
};

export default EntryVoucherList;