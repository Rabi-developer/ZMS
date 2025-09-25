'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllReceipt, deleteReceipt, updateReceiptStatus } from '@/apis/receipt';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { columns, Receipt } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';

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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const statusOptions = ['All', 'Pending', 'Completed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#f59e0b' },
    { id: 2, name: 'Completed', color: '#10b981' },
  ];

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await getAllReceipt(pageIndex + 1, pageSize);
      console.log('Receipts Response:', response?.data); // Debug API response
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

  const handleRowClick = async (receiptId: string) => {
    // If the row is already selected, do nothing on single click
    if (selectedReceiptIds.includes(receiptId)) {
      return;
    }

    // Select the row and fetch related data
    setSelectedReceiptIds([receiptId]); // Only one row selected at a time
    setSelectedRowId(receiptId);
    const receipt = receipts.find((item) => item.id === receiptId);
    console.log('Selected Receipt:', receipt); // Debug selected receipt
    if (receipt?.orderNo) {
      try {
        const consResponse = await getAllConsignment(1, 100, { orderNo: receipt.orderNo });
        setConsignments(consResponse?.data || []);
        const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: receipt.orderNo });
        const booking = bookingResponse?.data.find((b: any) => b.orderNo === receipt.orderNo);
        setBookingStatus(booking?.status || null);
      } catch (error) {
        toast('Failed to fetch related data', { type: 'error' });
      }
    } else {
      setConsignments([]);
      setBookingStatus(null);
    }

    // Update selected bulk status
    const selectedReceipt = receipts.find((r) => r.id === receiptId);
    setSelectedBulkStatus(selectedReceipt?.status || null);
  };

  const handleRowDoubleClick = (receiptId: string) => {
    // Deselect the row on double-click
    if (selectedReceiptIds.includes(receiptId)) {
      setSelectedReceiptIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedBulkStatus(null);
    }
  };

  const handleCheckboxChange = async (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedReceiptIds([receiptId]); // Only one row selected at a time
      setSelectedRowId(receiptId);
      const receipt = receipts.find((item) => item.id === receiptId);
      console.log('Checked Receipt:', receipt); // Debug checked receipt
      if (receipt?.orderNo) {
        try {
          const consResponse = await getAllConsignment(1, 100, { orderNo: receipt.orderNo });
          setConsignments(consResponse?.data || []);
          const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: receipt.orderNo });
          const booking = bookingResponse?.data.find((b: any) => b.orderNo === receipt.orderNo);
          setBookingStatus(booking?.status || null);
        } catch (error) {
          toast('Failed to fetch related data', { type: 'error' });
        }
      } else {
        setConsignments([]);
        setBookingStatus(null);
      }
    } else {
      setSelectedReceiptIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
    }

    // Update selected bulk status
    const selectedReceipt = receipts.find((r) => r.id === receiptId);
    setSelectedBulkStatus(checked ? selectedReceipt?.status || null : null);
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
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
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

  const exportToExcel = async () => {
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

    // Dynamically import xlsx to avoid SSR/prerender issues
    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(formattedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Receipts');
    xlsx.writeFile(workbook, 'Receipts.xlsx');
  };

  return (
    <div className="container mx-auto mt-4 max-w-screen p-6">
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
          columns={columns(handleDeleteOpen, handleCheckboxChange, selectedReceiptIds)}
          data={filteredReceipts}
          loading={loading}
          link="/receipt/create"
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </div>
      <div className="mt-4 space-y-2 h-[10vh]">
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
      {selectedRowId && (
        <div className="">         
          <OrderProgress
            orderNo={receipts.find((r) => r.id === selectedRowId)?.orderNo}
            bookingStatus={bookingStatus}
            consignments={consignments}
          />
        </div>
      )}
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

export default ReceiptList;