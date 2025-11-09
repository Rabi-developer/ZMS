'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFileUpload, FaEye, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllConsignment, deleteConsignment, updateConsignmentStatus } from '@/apis/consignment';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { columns, Consignment, getStatusStyles } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

const ConsignmentList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [filteredConsignments, setFilteredConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedConsignmentIds, setSelectedConsignmentIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  // File upload states
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedConsignmentForFiles, setSelectedConsignmentForFiles] = useState<string | null>(null);
  const [consignmentFiles, setConsignmentFiles] = useState<{ [consignmentId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Canceled', 'Closed', 'UnApproved', 'Pending'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#f59e0b' },
    { id: 2, name: 'Canceled', color: '#ef4444' },
    { id: 3, name: 'Closed', color: '#6b7280' },
    { id: 4, name: 'UnApproved', color: '#10b981' },
    { id: 5, name: 'Pending', color: '#3b82f6' },
  ];

  // Create stable handlers for pagination
  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    const resolvedPageIndex = typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex;
    console.log('Consignment page index changing from', pageIndex, 'to', resolvedPageIndex);
    setPageIndex(resolvedPageIndex);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    const resolvedPageSize = typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize;
    console.log('Consignment page size changing from', pageSize, 'to', resolvedPageSize);
    setPageSize(resolvedPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  }, [pageSize]);

  const fetchConsignments = useCallback(async () => {
    try {
      setLoading(true);
      // Include status filter in API call if not 'All'
      const filterParams = selectedStatusFilter !== 'All' ? { status: selectedStatusFilter } : {};
      const response = await getAllConsignment(pageIndex + 1, pageSize, filterParams);
      
      if (response?.data) {
        setConsignments(response.data);
        const misc = response.misc || {};
        const serverTotal = misc.total ?? misc.totalCount ?? response.data.length;
        const serverTotalPages = misc.totalPages ?? (serverTotal && pageSize ? Math.ceil(serverTotal / pageSize) : 0);
        setTotalRows(Number(serverTotal) || 0);
        setTotalPages(Number(serverTotalPages) || 0);
        
        // If we're on a page that doesn't exist, go to the last available page
        if (serverTotalPages > 0 && pageIndex >= serverTotalPages) {
          setPageIndex(Math.max(0, serverTotalPages - 1));
        }
      } else {
        setConsignments([]);
        setTotalRows(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching consignments:', error);
      toast('Failed to fetch consignments', { type: 'error' });
      setConsignments([]);
      setTotalRows(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, selectedStatusFilter]);

  useEffect(() => {
    console.log('Consignment useEffect triggered with pageIndex:', pageIndex, 'pageSize:', pageSize, 'statusFilter:', selectedStatusFilter);
    fetchConsignments();
  }, [fetchConsignments]);

  useEffect(() => {
    // Since we're now filtering on the server side, just use the consignments as they are
    setFilteredConsignments(consignments);
  }, [consignments]);

  useEffect(() => {
    setPageIndex(0);
  }, [selectedStatusFilter]);

  // Reset to first page if current page exceeds total pages
  useEffect(() => {
    if (totalPages > 0 && pageIndex >= totalPages) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [totalPages, pageIndex]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchConsignments();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteConsignment(deleteId);
      setOpenDelete(false);
      toast('Consignment Deleted Successfully', { type: 'success' });
      fetchConsignments();
    } catch (error) {
      toast('Failed to delete consignment', { type: 'error' });
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

  const handleRowClick = async (consignmentId: string) => {
    if (selectedConsignmentIds.includes(consignmentId)) {
      return;
    }
    setSelectedConsignmentIds([consignmentId]);
    setSelectedRowId(consignmentId);
    setSelectedConsignmentForFiles(consignmentId);
    const consignment = consignments.find((item) => item.id === consignmentId);
    if (consignment?.orderNo) {
      try {
        const response = await getAllBookingOrder(1, 100, { orderNo: consignment.orderNo });
        const booking = response?.data.find((b: any) => b.orderNo === consignment.orderNo);
        setBookingStatus(booking?.status || null);
      } catch (error) {
        toast('Failed to fetch booking status', { type: 'error' });
      }
    }
    const selectedConsignment = consignments.find((c) => c.id === consignmentId);
    setSelectedBulkStatus(selectedConsignment?.status || null);
  };

  const handleRowDoubleClick = (consignmentId: string) => {
    if (selectedConsignmentIds.includes(consignmentId)) {
      setSelectedConsignmentIds([]);
      setSelectedRowId(null);
      setBookingStatus(null);
      setSelectedBulkStatus(null);
      setSelectedConsignmentForFiles(null);
    }
  };

  const handleCheckboxChange = async (consignmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedConsignmentIds([consignmentId]);
      setSelectedRowId(consignmentId);
      setSelectedConsignmentForFiles(consignmentId);
      const consignment = consignments.find((item) => item.id === consignmentId);
      if (consignment?.orderNo) {
        try {
          const response = await getAllBookingOrder(1, 100, { orderNo: consignment.orderNo });
          const booking = response?.data.find((b: any) => b.orderNo === consignment.orderNo);
          setBookingStatus(booking?.status || null);
        } catch (error) {
          toast('Failed to fetch booking status', { type: 'error' });
        }
      }
    } else {
      setSelectedConsignmentIds([]);
      setSelectedRowId(null);
      setBookingStatus(null);
      setSelectedConsignmentForFiles(null);
    }
    const selectedConsignment = consignments.find((c) => c.id === consignmentId);
    setSelectedBulkStatus(checked ? selectedConsignment?.status || null : null);
  };

  const handleFileUploadClick = () => {
    if (!selectedConsignmentForFiles) {
      toast('Please select a consignment first', { type: 'warning' });
      return;
    }
    setOpenFileUploadModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedConsignmentForFiles) {
      const newFiles = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      }));
      setConsignmentFiles((prev) => ({
        ...prev,
        [selectedConsignmentForFiles]: [...(prev[selectedConsignmentForFiles] || []), ...newFiles],
      }));
      toast(`${files.length} file(s) uploaded for consignment ${selectedConsignmentForFiles}`, { type: 'success' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleRemoveFile = (consignmentId: string, fileId: string) => {
    setConsignmentFiles((prev) => ({
      ...prev,
      [consignmentId]: prev[consignmentId].filter((file) => file.id !== fileId),
    }));
    toast('File removed successfully', { type: 'success' });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedConsignmentIds.length === 0) {
      toast('Please select at least one consignment', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedConsignmentIds.map((id) =>
        updateConsignmentStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedConsignmentIds([]);
      setSelectedRowId(null);
      setBookingStatus(null);
      setSelectedConsignmentForFiles(null);
      
      // Only change filter if it's different and reset page
      if (selectedStatusFilter !== newStatus) {
        setSelectedStatusFilter(newStatus);
        setPageIndex(0);
      }
      
      toast('Consignment Status Updated Successfully', { type: 'success' });
      await fetchConsignments();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedConsignmentIds.length > 0
      ? filteredConsignments.filter((c) => selectedConsignmentIds.includes(c.id))
      : filteredConsignments;

    if (dataToExport.length === 0) {
      toast('No consignments to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.map((c) => ({
      'Receipt No': c.receiptNo || '-',
      'Order No': c.orderNo || '-',
      'Bilty No': c.biltyNo || '-',
      'Date': c.date || '-',
      'Consignment No': c.consignmentNo || '-',
      'Consignor': c.consignor || '-',
      'Consignment Date': c.consignmentDate || '-',
      'Consignee': c.consignee || '-',
      'Receiver Name': c.receiverName || '-',
      'Receiver Contact No': c.receiverContactNo || '-',
      'Shipping Line': c.shippingLine || '-',
      'Container No': c.containerNo || '-',
      'Port': c.port || '-',
      'Destination': c.destination || '-',
      'Items': c.items || '-',
      'Item Desc': c.itemDesc || '-',
      'Qty': c.qty || '-',
      'Weight': c.weight || '-',
      'Total Qty': c.totalQty || '-',
      'Freight': c.freight || '-',
      'SRB Tax': c.srbTax || '-',
      'SRB Amount': c.srbAmount || '-',
      'Delivery Charges': c.deliveryCharges || '-',
      'Insurance Charges': c.insuranceCharges || '-',
      'Toll Tax': c.tollTax || '-',
      'Other Charges': c.otherCharges || '-',
      'Total Amount': c.totalAmount || '-',
      'Received Amount': c.receivedAmount || '-',
      'Income Tax Ded.': c.incomeTaxDed || '-',
      'Income Tax Amount': c.incomeTaxAmount || '-',
      'Delivery Date': c.deliveryDate || '-',
      'Freight From': c.freightFrom || '-',
      'Remarks': c.remarks || '-',
      'Status': c.status || 'Pending',
      'Files': (consignmentFiles[c.id] || []).map((f) => f.name).join(', ') || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consignments');
    XLSX.writeFile(workbook, 'Consignments.xlsx');
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
            onClick={fetchConsignments}
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
          columns={columns(handleDeleteOpen, handleCheckboxChange, selectedConsignmentIds)}
          data={filteredConsignments}
          loading={loading}
          link="/consignment/create"
          setPageIndex={handlePageIndexChange}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          totalRows={totalRows}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </div>
      <div className="space-y-2 h-[10vh]">
        <div className="flex flex-wrap p-3 gap-3">
          {statusOptionsConfig.map((option) => {
            const isSelected = selectedBulkStatus === option.name;
            return (
              <button
                key={option.id}
                onClick={() => handleBulkStatusUpdate(option.name)}
                disabled={updating || !selectedConsignmentIds.length}
                className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                  ${updating || !selectedConsignmentIds.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
              </button>
            );
          })}
          <button
            onClick={handleFileUploadClick}
            disabled={!selectedConsignmentIds.length}
            className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
              ${selectedConsignmentIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-500' : 'border-gray-300 bg-white text-gray-700 opacity-50 cursor-not-allowed'}`}
          >
            <span className="text-sm font-semibold text-center">Upload Files</span>
            {selectedConsignmentIds.length && <FaFileUpload className="text-blue-500 animate-bounce" size={18} />}
          </button>
        </div>
      </div>
      {selectedRowId && (
        <div className="mt-4">
          <OrderProgress
            orderNo={consignments.find((c) => c.id === selectedRowId)?.orderNo}
            bookingStatus={bookingStatus}
            consignments={consignments
              .filter((c) => c.id === selectedRowId)
              .map((consignment) => ({
                ...consignment,
                items: Array.isArray(consignment.items) ? consignment.items : undefined,
              }))}
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
      {openFileUploadModal && selectedConsignmentForFiles && (
        <div
          id="fileUploadModal"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'fileUploadModal') {
              setOpenFileUploadModal(false);
              setSelectedConsignmentForFiles(null);
            }
          }}
        >
          <div className="bg-white rounded shadow p-5 w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Files for Consignment {consignments.find((c) => c.id === selectedConsignmentForFiles)?.consignmentNo || ''}</h3>
              <button
                onClick={() => {
                  setOpenFileUploadModal(false);
                  setSelectedConsignmentForFiles(null);
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
              {consignmentFiles[selectedConsignmentForFiles]?.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                  <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {consignmentFiles[selectedConsignmentForFiles].map((file) => (
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
                            onClick={() => handleRemoveFile(selectedConsignmentForFiles, file.id)}
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
                <p className="text-sm text-gray-500">No files uploaded for this consignment.</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setOpenFileUploadModal(false);
                    setSelectedConsignmentForFiles(null);
                  }}
                  className="px-4 py-2 rounded border"
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

export default ConsignmentList;