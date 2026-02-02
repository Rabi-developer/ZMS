'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFileUpload, FaEye, FaTrash, FaFilePdf } from 'react-icons/fa';
import { MdReceipt } from 'react-icons/md';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllEntryVoucher,
  deleteEntryVoucher,
  updateEntryVoucher,
  getSingleEntryVoucher,
  updateEntryVoucherFiles,
} from '@/apis/entryvoucher';
import { columns, Voucher } from './columns';
import EntryVoucherPDFExport from './EntryVoucherPDFExport';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllEquality } from '@/apis/equality';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

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
  const [totalRows, setTotalRows] = useState(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [accountIndex, setAccountIndex] = useState<Record<string, any>>({});

  // Row Expansion & Details
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedVoucherDetails, setExpandedVoucherDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // File Upload
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedVoucherForFiles, setSelectedVoucherForFiles] = useState<string | null>(null);
  const [voucherFiles, setVoucherFiles] = useState<{ [id: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Checked', 'Approved'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#22c55e' },
    { id: 2, name: 'Checked', color: '#eab308' },
    { id: 3, name: 'Approved', color: '#ef4444' },
  ];

  const displayAccount = (value: string) => accountIndex[value]?.description || value || '-';

  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    setPageIndex(typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    setPageSize(typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize);
    setPageIndex(0);
  }, [pageSize]);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllEntryVoucher(pageIndex + 1, pageSize);
      const data = (response?.data || []).map((v: any) => ({ ...v, files: v.files || '' }));
      setVouchers(data);
      setTotalRows(response.misc?.total || 0);
    } catch (error) {
      toast('Failed to fetch vouchers', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  useEffect(() => {
    let filtered = vouchers;
    if (selectedStatusFilter !== 'All') filtered = filtered.filter(v => v.status === selectedStatusFilter);
    if (startDate || endDate) {
      filtered = filtered.filter(v => {
        const d = new Date(v.voucherDate);
        const s = startDate ? new Date(startDate) : null;
        const e = endDate ? new Date(endDate) : null;
        return (!s || d >= s) && (!e || d <= e);
      });
    }
    setFilteredVouchers(filtered);
  }, [vouchers, selectedStatusFilter, startDate, endDate]);

  useEffect(() => {
    const loadAccountIndex = async () => {
      try {
        const [a, r, l, e, eq] = await Promise.all([
          getAllAblAssests(1, 10000),
          getAllAblRevenue(1, 10000),
          getAllAblLiabilities(1, 10000),
          getAllAblExpense(1, 10000),
          getAllEquality(1, 10000),
        ].map(p => p.catch(() => ({ data: [] }))));

        const idx: Record<string, any> = {};
        [...a.data, ...r.data, ...l.data, ...e.data, ...eq.data].forEach(item => {
          if (item?.id) idx[item.id] = item;
        });
        setAccountIndex(idx);
      } catch (err) { console.error(err); }
    };
    loadAccountIndex();
  }, []);

  // Row Click: Toggle Expand + Load Details + Select Row
  const handleRowClick = async (voucherId: string) => {
    const isCurrentlyExpanded = expandedRowId === voucherId;

    // Collapse if already open
    if (isCurrentlyExpanded) {
      setExpandedRowId(null);
      setExpandedVoucherDetails(null);
      setSelectedVoucherIds([]);
      setSelectedVoucherForFiles(null);
      setSelectedBulkStatus(null);
      return;
    }

    // Expand and load
    setExpandedRowId(voucherId);
    setSelectedVoucherIds([voucherId]);
    setSelectedVoucherForFiles(voucherId);

    try {
      setDetailsLoading(true);
      const res = await getSingleEntryVoucher(voucherId);
      setExpandedVoucherDetails(res?.data || null);
    } catch (err) {
      toast('Failed to load details', { type: 'error' });
    } finally {
      setDetailsLoading(false);
    }

    const voucher = vouchers.find(v => v.id === voucherId);
    setSelectedBulkStatus(voucher?.status || null);
  };

  const handleCheckboxChange = (voucherId: string, checked: boolean) => {
    setSelectedVoucherIds(checked ? [voucherId] : []);
    setSelectedVoucherForFiles(checked ? voucherId : null);
    setSelectedBulkStatus(checked ? vouchers.find(v => v.id === voucherId)?.status || null : null);
  };

  // PDF Download for Individual Voucher
  const handlePdf = async (id: string) => {
    try {
      const res = await getSingleEntryVoucher(id);
      const v = res?.data;
      if (!v) return toast('Voucher not found', { type: 'error' });

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
          preparedByName: v.preparedByName || v.createdBy || v.preparedUser?.name,
          preparedAt: v.preparedAt || v.createdAt,
          checkedByName: v.checkedByName || v.checkedUser?.name,
          checkedAt: v.checkedAt,
          approvedByName: v.approvedByName || v.approvedUser?.name,
          approvedAt: v.approvedAt,
          tableData: v.voucherDetails || [],
        },
        accountIndex,
      });
    } catch (error) {
      toast('Failed to generate PDF', { type: 'error' });
    }
  };

  // PDF Export for date range
  const handlePdfRange = async () => {
    try {
      const list = filteredVouchers;
      if (!list.length) {
        toast('No vouchers in selected range', { type: 'warning' });
        return;
      }
      setLoading(true);
      const details = await Promise.all(
        list.map(v =>
          getSingleEntryVoucher(v.id)
            .then(res => res?.data)
            .catch(() => null)
        )
      );
      const vouchersDocs = details
        .filter(Boolean)
        .map((v: any) => ({
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
          preparedByName: v.preparedByName || v.createdBy || v.preparedUser?.name,
          preparedAt: v.preparedAt || v.createdAt,
          checkedByName: v.checkedByName || v.checkedUser?.name,
          checkedAt: v.checkedAt,
          approvedByName: v.approvedByName || v.approvedUser?.name,
          approvedAt: v.approvedAt,
          tableData: v.voucherDetails || [],
        }));
      const filenameParts: string[] = [];
      if (startDate) filenameParts.push(startDate);
      if (endDate) filenameParts.push(endDate);
      const filename = filenameParts.length ? `EntryVouchers_${filenameParts.join('_to_')}.pdf` : 'EntryVouchers.pdf';
      EntryVoucherPDFExport.exportManyToPDF({ vouchers: vouchersDocs, accountIndex, filename });
    } catch (error) {
      toast('Failed to generate range PDF', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // File Upload Logic
  const handleFileUploadClick = () => {
    if (!selectedVoucherForFiles) return toast('Please select a voucher', { type: 'warning' });

    const v = vouchers.find(v => v.id === selectedVoucherForFiles);
    if (v?.files && !voucherFiles[selectedVoucherForFiles]) {
      const files = v.files.split(',').map((url: string, i: number) => {
        const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || `file-${i + 1}`);
        const type = name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        return { id: `old-${i}`, name, url: url.trim(), type };
      });
      setVoucherFiles(prev => ({ ...prev, [selectedVoucherForFiles]: files }));
    }
    setOpenFileUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !selectedVoucherForFiles) return;

    setLoading(true);
    toast(`Uploading ${files.length} file(s)...`, { type: 'info' });

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async file => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error(await res.text());
          const { url } = await res.json();
          return { id: String(Date.now() + Math.random()), name: file.name, url, type: file.type };
        })
      );

      setVoucherFiles(prev => ({
        ...prev,
        [selectedVoucherForFiles]: [...(prev[selectedVoucherForFiles] || []), ...uploaded],
      }));

      toast('Uploaded!', { type: 'success' });
      fileInputRef.current && (fileInputRef.current.value = '');
    } catch (err: any) {
      toast('Upload failed: ' + err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilesToBackend = async () => {
    if (!selectedVoucherForFiles || !voucherFiles[selectedVoucherForFiles]?.length) return toast('No files', { type: 'warning' });

    try {
      setLoading(true);
      const urls = voucherFiles[selectedVoucherForFiles].map(f => f.url).join(',');
      await updateEntryVoucherFiles({ id: selectedVoucherForFiles, files: urls });
      toast('Files saved!', { type: 'success' });
      setOpenFileUploadModal(false);
      setSelectedVoucherForFiles(null);
      await fetchVouchers();
    } catch (err) {
      toast('Failed to save files', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (url: string) => window.open(url, '_blank');
  const handleRemoveFile = (id: string, fileId: string) => {
    setVoucherFiles(prev => ({
      ...prev,
      [id]: prev[id].filter(f => f.id !== fileId),
    }));
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (!selectedVoucherIds.length) return toast('Select a voucher', { type: 'warning' });
    try {
      setUpdating(true);
      await Promise.all(selectedVoucherIds.map(id => updateEntryVoucher({ id, status })));
      toast('Status updated', { type: 'success' });
      setSelectedVoucherIds([]);
      setSelectedVoucherForFiles(null);
      setSelectedBulkStatus(status);
      await fetchVouchers();
    } catch (err) {
      toast('Update failed', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    const data = selectedVoucherIds.length ? filteredVouchers.filter(v => selectedVoucherIds.includes(v.id)) : filteredVouchers;
    if (!data.length) return toast('No data', { type: 'warning' });

    const rows = data.map(v => ({
      'Voucher No': v.voucherNo || '-',
      'Date': v.voucherDate || '-',
      'Paid To': displayAccount(v.paidTo),
      'Debit': v.totalDebit || '-',
      'Credit': v.totalCredit || '-',
      'Status': v.status || '-',
      'Files': (voucherFiles[v.id] || []).map(f => f.name).join(', ') || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vouchers');
    XLSX.writeFile(wb, 'EntryVouchers.xlsx');
  };

  const handleDeleteOpen = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  return (
    <div className="container mx-auto mt-4 p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Entry Vouchers</h1>
      </div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select value={selectedStatusFilter} onChange={e => setSelectedStatusFilter(e.target.value)} className="border rounded p-2">
            {statusOptions.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={fetchVouchers} className="px-4 py-2 bg-[#3a614c] text-white rounded hover:bg-[#3a614c]/90">
            Refresh
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <FaFileExcel /> Excel
          </button>
          <button onClick={handlePdfRange} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <MdReceipt /> PDF (Range)
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-4 flex items-center gap-2 justify-end">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded p-2" />
        <span>to</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded p-2" />
      </div>

      {/* DataTable with Expandable Rows + PDF Button */}
      <DataTable
        columns={columns(
          handleDeleteOpen,
          handlePdf,
          selectedVoucherIds,
          handleCheckboxChange,
          () => {}
        )}
        data={filteredVouchers}
        loading={loading}
        link="/entryvoucher/create"
        searchName="voucherNo"
        setPageIndex={handlePageIndexChange}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        totalRows={totalRows}
        onRowClick={handleRowClick}
        selectedRowIds={selectedVoucherIds}
        onCheckboxChange={handleCheckboxChange}
        expandedRowId={expandedRowId}
        expandedRowRender={(row: any) => (
          <div className="p-6 bg-gray-50 border-t">
            {detailsLoading ? (
              <div className="text-center py-8">Loading details...</div>
            ) : expandedVoucherDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><strong>Voucher No:</strong> {expandedVoucherDetails.voucherNo}</div>
                  <div><strong>Date:</strong> {expandedVoucherDetails.voucherDate}</div>
                  <div><strong>Mode:</strong> {expandedVoucherDetails.paymentMode}</div>
                  <div><strong>Paid To:</strong> {displayAccount(expandedVoucherDetails.paidTo)}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-3 py-2 text-left">Account</th>
                        <th className="border px-3 py-2 text-right">Debit</th>
                        <th className="border px-3 py-2 text-right">Credit</th>
                        <th className="border px-3 py-2 text-left">Narration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(expandedVoucherDetails.voucherDetails || []).map((d: any, i: number) => (
                        <tr key={i}>
                          <td className="border px-3 py-2">{displayAccount(d.account1 || d.account2)}</td>
                          <td className="border px-3 py-2 text-right">{Number(d.debit1 || d.debit2 || 0).toLocaleString()}</td>
                          <td className="border px-3 py-2 text-right">{Number(d.credit1 || d.credit2 || 0).toLocaleString()}</td>
                          <td className="border px-3 py-2">{d.narration || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No details</div>
            )}
          </div>
        )}
      />

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-4 p-4">
        {statusOptionsConfig.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleBulkStatusUpdate(opt.name)}
            disabled={updating || !selectedVoucherIds.length}
            className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
              ${selectedBulkStatus === opt.name ? `border-[${opt.color}] bg-gradient-to-r from-[${opt.color}]/10 text-[${opt.color}]` : 'border-gray-300'}
              ${updating || !selectedVoucherIds.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {opt.name}
            {selectedBulkStatus === opt.name && <FaCheck className="ml-2 animate-bounce" />}
          </button>
        ))}
        <button
          onClick={handleFileUploadClick}
          disabled={!selectedVoucherIds.length}
          className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
            ${selectedVoucherIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:scale-105' : 'border-gray-300 opacity-50'}`}
        >
          Upload Files
          {selectedVoucherIds.length && <FaFileUpload className="ml-2 animate-bounce" />}
        </button>
      </div>

      {/* Modals */}
      {openDelete && <DeleteConfirmModel isOpen={openDelete} handleDeleteclose={() => setOpenDelete(false)} handleDelete={async () => { await deleteEntryVoucher(deleteId); setOpenDelete(false); fetchVouchers(); }} />}
      
      {openFileUploadModal && selectedVoucherForFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Files - {vouchers.find(v => v.id === selectedVoucherForFiles)?.voucherNo}</h3>
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedVoucherForFiles(null); }} className="text-3xl">&times;</button>
            </div>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700" />
            {/* File list + actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setOpenFileUploadModal(false)} className="px-5 py-2 border rounded">Cancel</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 bg-blue-600 text-white rounded">Add More</button>
              <button onClick={handleSaveFilesToBackend} disabled={loading || !voucherFiles[selectedVoucherForFiles]?.length} className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryVoucherList;