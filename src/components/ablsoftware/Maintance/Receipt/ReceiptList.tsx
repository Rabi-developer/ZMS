'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFileUpload, FaEye, FaTrash } from 'react-icons/fa';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllReceipt, deleteReceipt, updateReceiptStatus } from '@/apis/receipt';
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
  // File upload states
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedReceiptForFiles, setSelectedReceiptForFiles] = useState<string | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<{ [receiptId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Pending', 'Completed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#f59e0b' },
    { id: 2, name: 'Completed', color: '#10b981' },
  ];

  // Create stable handlers for pagination
  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    const resolvedPageIndex = typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex;
    console.log('Receipt page index changing from', pageIndex, 'to', resolvedPageIndex);
    setPageIndex(resolvedPageIndex);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    const resolvedPageSize = typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize;
    console.log('Receipt page size changing from', pageSize, 'to', resolvedPageSize);
    setPageSize(resolvedPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  }, [pageSize]);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      // Convert 0-based pageIndex to 1-based for API
      const apiPageIndex = pageIndex + 1;
      console.log('Fetching receipts with pageIndex:', pageIndex, 'apiPageIndex:', apiPageIndex, 'pageSize:', pageSize);
      
      const response = await getAllReceipt(apiPageIndex, pageSize);
      console.log('Receipts Response:', response);
      
      // Transform receipts to extract orderNo from items
      const transformedReceipts = response?.data?.map((receipt: any) => ({
        ...receipt,
        orderNo: receipt.items?.[0]?.vehicleNo || receipt.orderNo || undefined,
      })) || [];
      
      setReceipts(transformedReceipts);
      
      // Set total rows from the API response
      if (response.misc) {
        setTotalRows(response.misc.total || 0);
        console.log('Receipt total rows set to:', response.misc.total);
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      toast('Failed to fetch receipts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    console.log('Receipt useEffect triggered with pageIndex:', pageIndex, 'pageSize:', pageSize);
    fetchReceipts();
  }, [fetchReceipts]);

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
    if (selectedReceiptIds.includes(receiptId)) {
      return;
    }
    setSelectedReceiptIds([receiptId]);
    setSelectedRowId(receiptId);
    setSelectedReceiptForFiles(receiptId);
    const receipt = receipts.find((item) => item.id === receiptId);
    console.log('Selected Receipt:', receipt);
    if (receipt?.orderNo) {
      try {
        const bookingResponse = await getAllBookingOrder(1, 200, { orderNo: receipt.orderNo });
        const booking = bookingResponse?.data?.find((b: any) => String(b.orderNo) === String(receipt.orderNo));
        setBookingStatus(booking?.status || null);
        
        if (booking?.id) {
          const consResponse = await getConsignmentsForBookingOrder(booking.id, 1, 100, { includeDetails: true });
          console.log('Fetched consignments for receipt:', consResponse?.data);
          setConsignments(consResponse?.data || []);
        } else {
          console.warn('No booking order found for orderNo:', receipt.orderNo);
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
    const selectedReceipt = receipts.find((r) => r.id === receiptId);
    setSelectedBulkStatus(selectedReceipt?.status || null);
  };

  const handleRowDoubleClick = (receiptId: string) => {
    if (selectedReceiptIds.includes(receiptId)) {
      setSelectedReceiptIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedBulkStatus(null);
      setSelectedReceiptForFiles(null);
    }
  };

  const handleCheckboxChange = async (receiptId: string, checked: boolean) => {
    if (checked) {
      // Auto-refresh data when checkbox is selected
      await fetchReceipts();
      
      setSelectedReceiptIds([receiptId]);
      setSelectedRowId(receiptId);
      setSelectedReceiptForFiles(receiptId);
      const receipt = receipts.find((item) => item.id === receiptId);
      console.log('Checked Receipt:', receipt);
      if (receipt?.orderNo) {
        try {
          const bookingResponse = await getAllBookingOrder(1, 200, { orderNo: receipt.orderNo });
          const booking = bookingResponse?.data?.find((b: any) => String(b.orderNo) === String(receipt.orderNo));
          setBookingStatus(booking?.status || null);
          
          if (booking?.id) {
            const consResponse = await getConsignmentsForBookingOrder(booking.id, 1, 100, { includeDetails: true });
            console.log('Fetched consignments for checked receipt:', consResponse?.data);
            setConsignments(consResponse?.data || []);
          } else {
            console.warn('No booking order found for orderNo:', receipt.orderNo);
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
    } else {
      setSelectedReceiptIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedReceiptForFiles(null);
    }
    const selectedReceipt = receipts.find((r) => r.id === receiptId);
    setSelectedBulkStatus(checked ? selectedReceipt?.status || null : null);
  };

  const handleFileUploadClick = () => {
    if (!selectedReceiptForFiles) {
      toast('Please select a receipt first', { type: 'warning' });
      return;
    }
    setOpenFileUploadModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedReceiptForFiles) {
      const newFiles = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      }));
      setReceiptFiles((prev) => ({
        ...prev,
        [selectedReceiptForFiles]: [...(prev[selectedReceiptForFiles] || []), ...newFiles],
      }));
      toast(`${files.length} file(s) uploaded for receipt ${selectedReceiptForFiles}`, { type: 'success' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleRemoveFile = (receiptId: string, fileId: string) => {
    setReceiptFiles((prev) => ({
      ...prev,
      [receiptId]: prev[receiptId].filter((file) => file.id !== fileId),
    }));
    toast('File removed successfully', { type: 'success' });
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
      setSelectedReceiptForFiles(null);
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
      'Files': (receiptFiles[r.id] || []).map((f) => f.name).join(', ') || '-',
    }));

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
          setPageIndex={handlePageIndexChange}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          totalRows={totalRows}
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
                disabled={updating || !selectedReceiptIds.length}
                className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                  ${updating || !selectedReceiptIds.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
              </button>
            );
          })}
          <button
            onClick={handleFileUploadClick}
            disabled={!selectedReceiptIds.length}
            className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
              ${selectedReceiptIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-500' : 'border-gray-300 bg-white text-gray-700 opacity-50 cursor-not-allowed'}`}
          >
            <span className="text-sm font-semibold text-center">Upload Files</span>
            {selectedReceiptIds.length && <FaFileUpload className="text-blue-500 animate-bounce" size={18} />}
          </button>
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
      {openFileUploadModal && selectedReceiptForFiles && (
        <div
          id="fileUploadModal"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'fileUploadModal') {
              setOpenFileUploadModal(false);
              setSelectedReceiptForFiles(null);
            }
          }}
        >
          <div className="bg-white rounded shadow p-5 w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Files for Receipt {receipts.find((r) => r.id === selectedReceiptForFiles)?.receiptNo || ''}</h3>
              <button
                onClick={() => {
                  setOpenFileUploadModal(false);
                  setSelectedReceiptForFiles(null);
                }}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {receiptFiles[selectedReceiptForFiles]?.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                  <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {receiptFiles[selectedReceiptForFiles].map((file) => (
                      <li key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') && (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewFile(file.url)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View File"
                          >
                            <FaEye size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveFile(selectedReceiptForFiles, file.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove File"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No files uploaded for this receipt.</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setOpenFileUploadModal(false);
                    setSelectedReceiptForFiles(null);
                  }}
                  className="px-4 py-2 rounded border gradient-border"
                >
                  Close
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add More Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptList;