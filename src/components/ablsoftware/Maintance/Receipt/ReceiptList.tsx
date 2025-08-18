'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllReceipt, deleteReceipt, updateReceiptStatus } from '@/apis/receipt';
import { columns, getStatusStyles, Receipt } from './columns';

const ReceiptList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const statusOptions = ['All', 'Pending', 'Completed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#ef4444' },
    { id: 2, name: 'Completed', color: '#22c55e' },
  ];

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await getAllReceipt(pageIndex + 1, pageSize);
      setReceipts(response?.data || []);
    } catch (error) {
      toast('Failed to fetch receipts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = receipts;
    if (selectedStatusFilter !== 'All') {
      filtered = receipts.filter((r) => r.status === selectedStatusFilter);
    }
    setFilteredReceipts(filtered);
  }, [receipts, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchReceipts();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname);
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

  const handleDeleteOpen = (id: string) => {
    setOpenDelete(true);
    setDeleteId(id);
  };

  const handleDeleteClose = () => {
    setOpenDelete(false);
    setDeleteId('');
  };

  const handleViewOpen = (receiptId: string) => {
    const receipt = receipts.find((item) => item.id === receiptId);
    setSelectedReceipt(receipt || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedReceipt(null);
  };

  const handleCheckboxChange = (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedReceiptIds((prev) => [...prev, receiptId]);
    } else {
      setSelectedReceiptIds((prev) => prev.filter((id) => id !== receiptId));
    }

    setTimeout(() => {
      const selected = receipts.filter((r) => selectedReceiptIds.includes(r.id));
      const statuses = selected.map((r) => r.status).filter((status, index, self) => self.indexOf(status) === index);
      setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
    }, 100);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedReceiptIds.length === 0) {
      toast('Please select at least one receipt', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedReceiptIds.map((id) =>
        updateReceiptStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedReceiptIds([]);
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
      toast('Receipt Status Updated Successfully', { type: 'success' });
      await fetchReceipts();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedReceiptIds.length > 0
      ? filteredReceipts.filter((r) => selectedReceiptIds.includes(r.id))
      : filteredReceipts;

    if (dataToExport.length === 0) {
      toast('No receipts to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.map((r) => ({
      'Receipt No': r.receiptNo || '-',
      'Receipt Date': r.receiptDate || '-',
      'Party': r.party || '-',
      'Payment Mode': r.paymentMode || '-',
      'Bank Name': r.bankName || '-',
      'Cheque No': r.chequeNo || '-',
      'Cheque Date': r.chequeDate || '-',
      'Receipt Amount': r.receiptAmount || '-',
      'Total Amount': r.totalAmount || '-',
      'Status': r.status || 'Pending',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');
    XLSX.writeFile(workbook, 'Receipts.xlsx');
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
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchReceipts}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
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
      <div>
        <DataTable
          columns={columns(handleDeleteOpen, handleViewOpen)}
          data={filteredReceipts}
          loading={loading}
          link="/receipt/create"
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
      {openDelete && (
        <DeleteConfirmModel
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
          isOpen={openDelete}
        />
      )}
      {openView && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#06b6d4]">Receipt Details</h2>
              <button onClick={handleViewClose} className="text-2xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Receipt No:</strong> {selectedReceipt.receiptNo || '-'}</div>
                <div><strong>Receipt Date:</strong> {selectedReceipt.receiptDate || '-'}</div>
                <div><strong>Party:</strong> {selectedReceipt.party || '-'}</div>
                <div><strong>Payment Mode:</strong> {selectedReceipt.paymentMode || '-'}</div>
                <div><strong>Bank Name:</strong> {selectedReceipt.bankName || '-'}</div>
                <div><strong>Cheque No:</strong> {selectedReceipt.chequeNo || '-'}</div>
                <div><strong>Cheque Date:</strong> {selectedReceipt.chequeDate || '-'}</div>
                <div><strong>Receipt Amount:</strong> {selectedReceipt.receiptAmount || '-'}</div>
                <div><strong>Remarks:</strong> {selectedReceipt.remarks || '-'}</div>
                <div><strong>Total Amount:</strong> {selectedReceipt.totalAmount || '-'}</div>
                <div><strong>Status:</strong> <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(selectedReceipt.status || 'Pending')}`}>{selectedReceipt.status || 'Pending'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
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
                  ${isSelected ? `border-[${option.color}] bg-gradientto-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                  ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReceiptList;