'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFileUpload, FaEye, FaTrash, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllReceipt,
  deleteReceipt,
  updateReceiptStatus,
  updateReceiptFiles, // ← Add this API function
} from '@/apis/receipt';
import { getConsignmentsForBookingOrder, getAllBookingOrder } from '@/apis/bookingorder';
import { columns, Receipt } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

const ReceiptList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // File Upload States
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedReceiptForFiles, setSelectedReceiptForFiles] = useState<string | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<{ [receiptId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'UnApproved', 'Closed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#3b82f6' },
    { id: 2, name: 'Approved', color: '#10b981' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'UnApproved', color: '#f59e0b' },
    { id: 5, name: 'Closed', color: '#6b7280' },
  ];

  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    const resolved = typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex;
    setPageIndex(resolved);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    const resolved = typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize;
    setPageSize(resolved);
    setPageIndex(0);
  }, [pageSize]);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const apiPageIndex = pageIndex + 1;
      const response = await getAllReceipt(apiPageIndex, pageSize);

      const transformedReceipts = (response?.data || []).map((receipt: any) => ({
        ...receipt,
        orderNo: receipt.items?.[0]?.vehicleNo || receipt.orderNo || '-',
        files: receipt.files || '', // Preserve files field
      }));

      setReceipts(transformedReceipts);
      setTotalRows(response.misc?.total || 0);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      toast('Failed to fetch receipts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  useEffect(() => {
    const filtered = selectedStatusFilter === 'All'
      ? receipts
      : receipts.filter(r => r.status === selectedStatusFilter);
    setFilteredReceipts(filtered);
  }, [receipts, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchReceipts();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteReceipt(deleteId);
      setOpenDelete(false);
      toast('Receipt Deleted Successfully', { type: 'success' });
      fetchReceipts();
    } catch (error) {
      toast('Failed to delete receipt', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => { setOpenDelete(true); setDeleteId(id); };
  const handleDeleteClose = () => { setOpenDelete(false); setDeleteId(''); };

  const handleRowClick = async (receiptId: string) => {
    if (selectedReceiptIds.includes(receiptId)) return;

    setSelectedReceiptIds([receiptId]);
    setSelectedRowId(receiptId);
    setSelectedReceiptForFiles(receiptId);

    const receipt = receipts.find(r => r.id === receiptId);
    if (receipt?.orderNo && receipt.orderNo !== '-') {
      try {
        const bookingRes = await getAllBookingOrder(1, 200, { orderNo: receipt.orderNo });
        const booking = bookingRes?.data?.find((b: any) => String(b.orderNo) === String(receipt.orderNo));
        setBookingStatus(booking?.status || null);

        if (booking?.id) {
          const consRes = await getConsignmentsForBookingOrder(booking.id, 1, 100);
          setConsignments(consRes?.data || []);
        } else {
          setConsignments([]);
        }
      } catch (error) {
        console.error('Failed to fetch related data:', error);
        toast('Failed to fetch related data', { type: 'error' });
        setConsignments([]);
        setBookingStatus(null);
      }
    } else {
      setConsignments([]);
      setBookingStatus(null);
    }
    setSelectedBulkStatus(receipt?.status || null);
  };

  const handleRowDoubleClick = () => {
    setSelectedReceiptIds([]);
    setSelectedRowId(null);
    setConsignments([]);
    setBookingStatus(null);
    setSelectedBulkStatus(null);
    setSelectedReceiptForFiles(null);
  };

  const handleCheckboxChange = async (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedReceiptIds([receiptId]);
      setSelectedRowId(receiptId);
      setSelectedReceiptForFiles(receiptId);

      const receipt = receipts.find(r => r.id === receiptId);
      if (receipt?.orderNo && receipt.orderNo !== '-') {
        try {
          const bookingRes = await getAllBookingOrder(1, 200, { orderNo: receipt.orderNo });
          const booking = bookingRes?.data?.find((b: any) => String(b.orderNo) === String(receipt.orderNo));
          setBookingStatus(booking?.status || null);

          if (booking?.id) {
            const consRes = await getConsignmentsForBookingOrder(booking.id, 1, 100);
            setConsignments(consRes?.data || []);
          }
        } catch (error) {
          console.error('Failed to fetch related data:', error);
        }
      }
    } else {
      setSelectedReceiptIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedReceiptForFiles(null);
    }
    setSelectedBulkStatus(checked ? receipts.find(r => r.id === receiptId)?.status || null : null);
  };

  // === FILE UPLOAD LOGIC (Same as BookingOrderList) ===
  const handleFileUploadClick = () => {
    if (!selectedReceiptForFiles) {
      toast('Please select a receipt first', { type: 'warning' });
      return;
    }

    const receipt = receipts.find(r => r.id === selectedReceiptForFiles);
    if (receipt?.files && !receiptFiles[selectedReceiptForFiles]) {
      const existingFiles = receipt.files.split(',').map((url: string, i: number) => {
        const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || `file-${i + 1}`);
        const type = name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        return { id: `exist-${i}`, name, url: url.trim(), type };
      });
      setReceiptFiles(prev => ({ ...prev, [selectedReceiptForFiles]: existingFiles }));
    }

    setOpenFileUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedReceiptForFiles) return;

    setLoading(true);
    toast(`Uploading ${files.length} file(s)...`, { type: 'info' });

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error(await res.text());
          const { url } = await res.json();
          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url,
            type: file.type || 'application/octet-stream',
          };
        })
      );

      setReceiptFiles(prev => ({
        ...prev,
        [selectedReceiptForFiles]: [...(prev[selectedReceiptForFiles] || []), ...uploaded],
      }));

      toast('Files uploaded to Cloudinary!', { type: 'success' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast('Upload failed: ' + err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilesToBackend = async () => {
    if (!selectedReceiptForFiles || !receiptFiles[selectedReceiptForFiles]?.length) {
      toast('No files to save', { type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const urls = receiptFiles[selectedReceiptForFiles].map(f => f.url).join(',');
      await updateReceiptFiles({ id: selectedReceiptForFiles, files: urls });
      toast('Files saved to receipt successfully!', { type: 'success' });
      setOpenFileUploadModal(false);
      setSelectedReceiptForFiles(null);
      await fetchReceipts();
    } catch (err) {
      toast('Failed to save files', { type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (url: string) => window.open(url, '_blank');
  const handleRemoveFile = (receiptId: string, fileId: string) => {
    setReceiptFiles(prev => ({
      ...prev,
      [receiptId]: prev[receiptId].filter(f => f.id !== fileId),
    }));
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!selectedReceiptIds.length) {
      toast('Please select at least one receipt', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      await Promise.all(selectedReceiptIds.map(id => updateReceiptStatus({ id, status: newStatus })));
      setSelectedBulkStatus(newStatus);
      setSelectedReceiptIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedReceiptForFiles(null);
      // Keep the current filter selection instead of auto-changing it
      toast('Status updated', { type: 'success' });
      await fetchReceipts();
    } catch (err) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    const data = selectedReceiptIds.length > 0
      ? filteredReceipts.filter(r => selectedReceiptIds.includes(r.id))
      : filteredReceipts;

    if (!data.length) {
      toast('No data to export', { type: 'warning' });
      return;
    }

    const rows = data.map(r => ({
      'Receipt No': r.receiptNo || '-',
      'Receipt Date': r.receiptDate || '-',
      'Party': r.party || '-',
      'Payment Mode': r.paymentMode || '-',
      'Bank Name': r.bankName || '-',
      'Cheque No': r.chequeNo || '-',
      'Amount': r.receiptAmount || '-',
      'Status': r.status || '-',
      'Files': (receiptFiles[r.id] || []).map(f => f.name).join(', ') || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
    XLSX.writeFile(wb, 'Receipts.xlsx');
  };

  return (
    <div className="container mx-auto mt-4 max-w-screen p-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2">Filter by Status:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={fetchReceipts} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            Refresh
          </button>
        </div>
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          <FaFileExcel size={18} /> Excel
        </button>
      </div>

      <DataTable
        columns={columns(handleDeleteOpen, handleCheckboxChange, selectedReceiptIds)}
        data={filteredReceipts}
        loading={loading}
        link="/receipt/create"
        setPageIndex={handlePageIndexChange}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        totalRows={totalRows}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />

      {selectedRowId && (
        <div className="mt-6">
          <OrderProgress
            orderNo={receipts.find(r => r.id === selectedRowId)?.orderNo}
            bookingStatus={bookingStatus}
            consignments={consignments}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 p-4">
        {statusOptionsConfig.map(opt => {
          const active = selectedBulkStatus === opt.name;
          return (
            <button
              key={opt.id}
              onClick={() => handleBulkStatusUpdate(opt.name)}
              disabled={updating || !selectedReceiptIds.length}
              className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
                ${active ? `border-[${opt.color}] bg-gradient-to-r from-[${opt.color}]/10 text-[${opt.color}]` : 'border-gray-300 bg-white'}
                ${updating || !selectedReceiptIds.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {opt.name}
              {active && <FaCheck className="ml-2 animate-bounce" />}
            </button>
          );
        })}
        <button
          onClick={handleFileUploadClick}
          disabled={!selectedReceiptIds.length}
          className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
            ${selectedReceiptIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:scale-105' : 'border-gray-300 bg-white opacity-50'}`}
        >
          Upload Files
          {selectedReceiptIds.length && <FaFileUpload className="ml-2 animate-bounce" />}
        </button>
      </div>

      {openDelete && <DeleteConfirmModel handleDeleteclose={handleDeleteClose} handleDelete={handleDelete} isOpen={openDelete} />}

      {/* FILE UPLOAD MODAL */}
      {openFileUploadModal && selectedReceiptForFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={(e) => e.target === e.currentTarget && setOpenFileUploadModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Files - Receipt {receipts.find(r => r.id === selectedReceiptForFiles)?.receiptNo || ''}
              </h3>
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedReceiptForFiles(null); }} className="text-3xl text-gray-500 hover:text-gray-800">×</button>
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {receiptFiles[selectedReceiptForFiles]?.length > 0 ? (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Uploaded Files</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {receiptFiles[selectedReceiptForFiles].map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        {file.type.startsWith('image/') && <img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded" />}
                        {file.type.includes('pdf') && <FaFilePdf size={48} className="text-red-600" />}
                        <div>
                          <p className="font-medium truncate max-w-xs">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleViewFile(file.url)} className="text-blue-600 hover:text-blue-800"><FaEye size={20} /></button>
                        <button onClick={() => handleRemoveFile(selectedReceiptForFiles, file.id)} className="text-red-600 hover:text-red-800"><FaTrash size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-8 italic">No files uploaded yet.</p>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedReceiptForFiles(null); }} className="px-5 py-2 border rounded hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add More Files
              </button>
              <button
                onClick={handleSaveFilesToBackend}
                disabled={!receiptFiles[selectedReceiptForFiles]?.length || loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save to Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptList;