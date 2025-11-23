'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFileUpload, FaEye, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllCharges, deleteCharges, updateChargesStatus } from '@/apis/charges';
import { getAllConsignment } from '@/apis/consignment';
import { columns, Charge } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

const ChargesList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [filteredCharges, setFilteredCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  // File upload states
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedChargeForFiles, setSelectedChargeForFiles] = useState<string | null>(null);
  const [chargeFiles, setChargeFiles] = useState<{ [chargeId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Canceled', 'Closed', 'UnApproved', 'Approved'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#f59e0b' },
    { id: 2, name: 'Approved', color: '#3b82f6' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Closed', color: '#6b7280' },
    { id: 5, name: 'UnApproved', color: '#10b981' },
  ];

  // Create stable handlers for pagination
  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    const resolvedPageIndex = typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex;
    console.log('Charges page index changing from', pageIndex, 'to', resolvedPageIndex);
    setPageIndex(resolvedPageIndex);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    const resolvedPageSize = typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize;
    console.log('Charges page size changing from', pageSize, 'to', resolvedPageSize);
    setPageSize(resolvedPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  }, [pageSize]);

  const fetchCharges = useCallback(async () => {
    try {
      setLoading(true);
      // Convert 0-based pageIndex to 1-based for API
      const apiPageIndex = pageIndex + 1;
      console.log('Fetching charges with pageIndex:', pageIndex, 'apiPageIndex:', apiPageIndex, 'pageSize:', pageSize);
      
      const response = await getAllCharges(apiPageIndex, pageSize);
      console.log('Charges Response:', response); // Debug API response
      
      const transformedCharges = response?.data.map((charge: any) => {
        // Handle case where lines is null or empty array
        const lines = charge.lines || [];
        const firstLine = lines.length > 0 ? lines[0] : {};
        
        // Calculate total amount from all lines, or default to 0
        const totalAmount = lines.reduce((sum: number, line: any) => sum + (line.amount || 0), 0);
        
        return {
          ...charge,
          orderNo: charge.orderNo || '-',
          amount: totalAmount.toString() || '0',
          biltyNo: firstLine.biltyNo || '-',
          date: firstLine.date || '-',
          vehicleNo: firstLine.vehicle || '-',
          paidToPerson: firstLine.paidTo || '-',
          contactNo: firstLine.contact || '-',
          remarks: firstLine.remarks || '-',
          status: charge.status || 'Unpaid',
        };
      });
      setCharges(transformedCharges || []);
      
      // Set total rows from the API response
      if (response.misc) {
        setTotalRows(response.misc.total || 0);
        console.log('Charges total rows set to:', response.misc.total);
      }
    } catch (error) {
      console.error('Failed to fetch charges:', error);
      toast('Failed to fetch charges', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    console.log('Charges useEffect triggered with pageIndex:', pageIndex, 'pageSize:', pageSize);
    fetchCharges();
  }, [fetchCharges]);

  useEffect(() => {
    let filtered = charges;
    if (selectedStatusFilter !== 'All') {
      filtered = charges.filter((c) => c.status === selectedStatusFilter);
    }
    setFilteredCharges(filtered);
  }, [charges, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchCharges();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteCharges(deleteId);
      setOpenDelete(false);
      toast('Charge Deleted Successfully', { type: 'success' });
      fetchCharges();
    } catch (error) {
      toast('Failed to delete charge', { type: 'error' });
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

  const handleRowClick = async (chargeId: string) => {
    if (selectedChargeIds.includes(chargeId)) {
      return;
    }
    setSelectedChargeIds([chargeId]);
    setSelectedRowId(chargeId);
    setSelectedChargeForFiles(chargeId);
    const charge = charges.find((item) => item.id === chargeId);
    console.log('Selected Charge:', charge); // Debug selected charge
    if (charge?.orderNo && charge.orderNo !== '-') {
      try {
        const response = await getAllConsignment(1, 100, { orderNo: charge.orderNo });
        setConsignments(response?.data || []);
      } catch (error) {
        toast('Failed to fetch consignments', { type: 'error' });
      }
    } else {
      setConsignments([]);
    }
    const selectedCharge = charges.find((c) => c.id === chargeId);
    setSelectedBulkStatus(selectedCharge?.status || null);
  };

  const handleRowDoubleClick = (chargeId: string) => {
    if (selectedChargeIds.includes(chargeId)) {
      setSelectedChargeIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setSelectedBulkStatus(null);
      setSelectedChargeForFiles(null);
    }
  };

  const handleCheckboxChange = async (chargeId: string, checked: boolean) => {
    if (checked) {
      setSelectedChargeIds([chargeId]);
      setSelectedRowId(chargeId);
      setSelectedChargeForFiles(chargeId);
      const charge = charges.find((item) => item.id === chargeId);
      console.log('Checked Charge:', charge); // Debug checked charge
      if (charge?.orderNo && charge.orderNo !== '-') {
        try {
          const response = await getAllConsignment(1, 100, { orderNo: charge.orderNo });
          setConsignments(response?.data || []);
        } catch (error) {
          toast('Failed to fetch consignments', { type: 'error' });
        }
      } else {
        setConsignments([]);
      }
    } else {
      setSelectedChargeIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setSelectedChargeForFiles(null);
    }
    const selectedCharge = charges.find((c) => c.id === chargeId);
    setSelectedBulkStatus(checked ? selectedCharge?.status || null : null);
  };

  const handleFileUploadClick = () => {
    if (!selectedChargeForFiles) {
      toast('Please select a charge first', { type: 'warning' });
      return;
    }
    setOpenFileUploadModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedChargeForFiles) {
      const newFiles = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      }));
      setChargeFiles((prev) => ({
        ...prev,
        [selectedChargeForFiles]: [...(prev[selectedChargeForFiles] || []), ...newFiles],
      }));
      toast(`${files.length} file(s) uploaded for charge ${selectedChargeForFiles}`, { type: 'success' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleRemoveFile = (chargeId: string, fileId: string) => {
    setChargeFiles((prev) => ({
      ...prev,
      [chargeId]: prev[chargeId].filter((file) => file.id !== fileId),
    }));
    toast('File removed successfully', { type: 'success' });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedChargeIds.length === 0) {
      toast('Please select at least one charge', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedChargeIds.map((id) =>
        updateChargesStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedChargeIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setSelectedChargeForFiles(null);
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
      toast('Charge Status Updated Successfully', { type: 'success' });
      await fetchCharges();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedChargeIds.length > 0
      ? filteredCharges.filter((c) => selectedChargeIds.includes(c.id))
      : filteredCharges;

    if (dataToExport.length === 0) {
      toast('No charges to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.map((c) => ({
      'Charge No': c.chargeNo || '-',
      'Charge Date': c.chargeDate || '-',
      'Order No': c.orderNo || '-',
      'Unpaid Charges': c.unpaidCharges || '-',
      'Payment': c.payment || '-',
      'Charges': c.charges || '-',
      'Bilty No': c.biltyNo || '-',
      'Date': c.date || '-',
      'Vehicle#': c.vehicleNo || '-',
      'Paid to Person': c.paidToPerson || '-',
      'Contact#': c.contactNo || '-',
      'Remarks': c.remarks || '-',
      'Amount': c.amount || '-',
      'Paid Amount': c.paidAmount || '-',
      'Bank/Cash': c.bankCash || '-',
      'Chq No': c.chqNo || '-',
      'Chq Date Pay. No': c.chqDate || '-',
      'Pay No': c.payNo || '-',
      'Total': c.total || '-',
      'Status': c.status || 'Unpaid',
      'Files': (chargeFiles[c.id] || []).map((f) => f.name).join(', ') || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Charges');
    XLSX.writeFile(workbook, 'Charges.xlsx');
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
            onClick={fetchCharges}
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
          columns={columns(handleDeleteOpen, handleCheckboxChange, selectedChargeIds)}
          data={filteredCharges}
          loading={loading}
          link="/charges/create"
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
                disabled={updating || !selectedChargeIds.length}
                className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                  ${updating || !selectedChargeIds.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
              </button>
            );
          })}
          <button
            onClick={handleFileUploadClick}
            disabled={!selectedChargeIds.length}
            className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
              ${selectedChargeIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-500' : 'border-gray-300 bg-white text-gray-700 opacity-50 cursor-not-allowed'}`}
          >
            <span className="text-sm font-semibold text-center">Upload Files</span>
            {selectedChargeIds.length && <FaFileUpload className="text-blue-500 animate-bounce" size={18} />}
          </button>
        </div>
      </div>
      {selectedRowId && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[#3a614c]">Charge Details</h3>
          <OrderProgress
            orderNo={charges.find((c) => c.id === selectedRowId)?.orderNo}
            bookingStatus={null}
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
      {openFileUploadModal && selectedChargeForFiles && (
        <div
          id="fileUploadModal"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'fileUploadModal') {
              setOpenFileUploadModal(false);
              setSelectedChargeForFiles(null);
            }
          }}
        >
          <div className="bg-white rounded shadow p-5 w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Files for Charge {charges.find((c) => c.id === selectedChargeForFiles)?.chargeNo || ''}</h3>
              <button
                onClick={() => {
                  setOpenFileUploadModal(false);
                  setSelectedChargeForFiles(null);
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
              {chargeFiles[selectedChargeForFiles]?.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                  <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {chargeFiles[selectedChargeForFiles].map((file) => (
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
                            onClick={() => handleRemoveFile(selectedChargeForFiles, file.id)}
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
                <p className="text-sm text-gray-500">No files uploaded for this charge.</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setOpenFileUploadModal(false);
                    setSelectedChargeForFiles(null);
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

export default ChargesList; 