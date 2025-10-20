'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFilePdf, FaFileUpload, FaEye, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllBiltyPaymentInvoice, deleteBiltyPaymentInvoice, updateBiltyPaymentInvoiceStatus } from '@/apis/biltypaymentnnvoice';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { columns, BillPaymentInvoice } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import { exportBiltyPaymentInvoicePdf } from '@/components/ablsoftware/Maintance/common/BiltyPaymentInvoicePdf';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface ApiBiltyPaymentInvoice {
  id: string;
  invoiceNo: string;
  paymentDate: string;
  createdBy: string | null;
  creationDate: string | null;
  updatedBy: string | null;
  updationDate: string | null;
  status: string | null;
  lines: Array<{
    id: string;
    vehicleNo: string;
    orderNo: string;
    amount: number;
    munshayana: string;
    broker: string;
    dueDate: string;
    remarks: string;
    isAdditionalLine?: boolean;
    nameCharges?: string;
    amountCharges?: number;
    invoice?: any;
  }>;
  isActive: boolean;
  isDeleted: boolean;
  createdDateTime: string;
  modifiedDateTime: string | null;
  modifiedBy: string | null;
}

const transformBiltyPaymentInvoice = (apiData: ApiBiltyPaymentInvoice[]): BillPaymentInvoice[] => {
  return apiData.map((item) => {
    const firstLine = item.lines[0] || {};
    return {
      id: item.id,
      invoiceNo: item.invoiceNo,
      paymentDate: item.paymentDate,
      totalAmount: firstLine.amount?.toString() || '0',
      status: item.status || 'Unpaid',
      vehicleNo: firstLine.vehicleNo || '',
      orderNo: firstLine.orderNo || '',
      amount: firstLine.amount?.toString() || '0',
      broker: firstLine.broker || '',
    };
  });
};

const BillPaymentInvoicesList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billPaymentInvoices, setBillPaymentInvoices] = useState<BillPaymentInvoice[]>([]);
  const [filteredBillPaymentInvoices, setFilteredBillPaymentInvoices] = useState<BillPaymentInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedBillPaymentIds, setSelectedBillPaymentIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  // File upload states
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedBillPaymentForFiles, setSelectedBillPaymentForFiles] = useState<string | null>(null);
  const [billPaymentFiles, setBillPaymentFiles] = useState<{ [billPaymentId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'UnApproved', 'Closed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#3b82f6' },
    { id: 2, name: 'Approved', color: '#10b981' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'UnApproved', color: '#f59e0b' },
    { id: 5, name: 'Closed', color: '#6b7280' },
  ];

  const fetchBillPaymentInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllBiltyPaymentInvoice(pageIndex + 1, pageSize);
      console.log('Bill Payment Invoices Response:', response?.data);
      const transformedData = transformBiltyPaymentInvoice(response?.data || []);
      setBillPaymentInvoices(transformedData);
    } catch (error) {
      toast('Failed to fetch bill payment invoices', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillPaymentInvoices();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = billPaymentInvoices;
    if (selectedStatusFilter !== 'All') {
      filtered = billPaymentInvoices.filter((b) => b.status === selectedStatusFilter);
    }
    setFilteredBillPaymentInvoices(filtered);
  }, [billPaymentInvoices, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchBillPaymentInvoices();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteBiltyPaymentInvoice(deleteId);
      setOpenDelete(false);
      toast('Bill Payment Invoice Deleted Successfully', { type: 'success' });
      fetchBillPaymentInvoices();
    } catch (error) {
      toast('Failed to delete bill payment invoice', { type: 'error' });
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

  const handleRowClick = async (billPaymentId: string) => {
    if (selectedBillPaymentIds.includes(billPaymentId)) {
      return;
    }
    setSelectedBillPaymentIds([billPaymentId]);
    setSelectedRowId(billPaymentId);
    setSelectedBillPaymentForFiles(billPaymentId);
    const billPayment = billPaymentInvoices.find((item) => item.id === billPaymentId);
    console.log('Selected Bill Payment Invoice:', billPayment);
    if (billPayment?.orderNo) {
      try {
        const consResponse = await getAllConsignment(1, 100, { orderNo: billPayment.orderNo });
        setConsignments(consResponse?.data || []);
        const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: billPayment.orderNo });
        const booking = bookingResponse?.data.find((b: any) => b.orderNo === billPayment.orderNo);
        setBookingStatus(booking?.status || null);
      } catch (error) {
        toast('Failed to fetch related data', { type: 'error' });
      }
    } else {
      setConsignments([]);
      setBookingStatus(null);
    }
    const selectedBillPayment = billPaymentInvoices.find((b) => b.id === billPaymentId);
    setSelectedBulkStatus(selectedBillPayment?.status || null);
  };

  const handleRowDoubleClick = (billPaymentId: string) => {
    if (selectedBillPaymentIds.includes(billPaymentId)) {
      setSelectedBillPaymentIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedBulkStatus(null);
      setSelectedBillPaymentForFiles(null);
    }
  };

  const handleCheckboxChange = async (billPaymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedBillPaymentIds([billPaymentId]);
      setSelectedRowId(billPaymentId);
      setSelectedBillPaymentForFiles(billPaymentId);
      const billPayment = billPaymentInvoices.find((item) => item.id === billPaymentId);
      console.log('Checked Bill Payment Invoice:', billPayment);
      if (billPayment?.orderNo) {
        try {
          const consResponse = await getAllConsignment(1, 100, { orderNo: billPayment.orderNo });
          setConsignments(consResponse?.data || []);
          const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: billPayment.orderNo });
          const booking = bookingResponse?.data.find((b: any) => b.orderNo === billPayment.orderNo);
          setBookingStatus(booking?.status || null);
        } catch (error) {
          toast('Failed to fetch related data', { type: 'error' });
        }
      } else {
        setConsignments([]);
        setBookingStatus(null);
      }
    } else {
      setSelectedBillPaymentIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedBillPaymentForFiles(null);
    }
    const selectedBillPayment = billPaymentInvoices.find((b) => b.id === billPaymentId);
    setSelectedBulkStatus(checked ? selectedBillPayment?.status || null : null);
  };

  const handleFileUploadClick = () => {
    if (!selectedBillPaymentForFiles) {
      toast('Please select a bill payment invoice first', { type: 'warning' });
      return;
    }
    setOpenFileUploadModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedBillPaymentForFiles) {
      const newFiles = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      }));
      setBillPaymentFiles((prev) => ({
        ...prev,
        [selectedBillPaymentForFiles]: [...(prev[selectedBillPaymentForFiles] || []), ...newFiles],
      }));
      toast(`${files.length} file(s) uploaded for bill payment ${selectedBillPaymentForFiles}`, { type: 'success' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleRemoveFile = (billPaymentId: string, fileId: string) => {
    setBillPaymentFiles((prev) => ({
      ...prev,
      [billPaymentId]: prev[billPaymentId].filter((file) => file.id !== fileId),
    }));
    toast('File removed successfully', { type: 'success' });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedBillPaymentIds.length === 0) {
      toast('Please select at least one bill payment invoice', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedBillPaymentIds.map((id) =>
        updateBiltyPaymentInvoiceStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedBillPaymentIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedBillPaymentForFiles(null);
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
      toast('Bill Payment Invoice Status Updated Successfully', { type: 'success' });
      await fetchBillPaymentInvoices();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedBillPaymentIds.length > 0
      ? filteredBillPaymentInvoices.filter((b) => selectedBillPaymentIds.includes(b.id))
      : filteredBillPaymentInvoices;

    if (dataToExport.length === 0) {
      toast('No bill payment invoices to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.map((b) => ({
      'Invoice No': b.invoiceNo || '-',
      'Vehicle No': b.vehicleNo || '-',
      'Order No': b.orderNo || '-',
      'Amount': b.amount || '-',
      'Broker': b.broker || '-',
      'Payment Date': b.paymentDate || '-',
      'Total Amount': b.totalAmount || '-',
      'Status': b.status || 'Unpaid',
      'Files': (billPaymentFiles[b.id] || []).map((f) => f.name).join(', ') || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BillPaymentInvoices');
    XLSX.writeFile(workbook, 'BillPaymentInvoices.xlsx');
  };

  const preparePdfPayload = async (invoiceId: string) => {
    try {
      const response = await getAllBiltyPaymentInvoice(1, 1000);
      const detailedInvoice = response?.data?.find((item: ApiBiltyPaymentInvoice) => item.id === invoiceId);

      if (!detailedInvoice) {
        toast('Failed to fetch invoice details', { type: 'error' });
        return null;
      }

      const firstLine = detailedInvoice.lines?.find((line: ApiBiltyPaymentInvoice['lines'][0]) => !line.isAdditionalLine);
      const brokerDetails = {
        name: firstLine?.broker || undefined,
        mobile: undefined,
      };

      return {
        invoiceNo: detailedInvoice.invoiceNo,
        paymentDate: detailedInvoice.paymentDate,
        bookingDate: detailedInvoice.creationDate || detailedInvoice.createdDateTime,
        checkDate: detailedInvoice.updationDate || detailedInvoice.modifiedDateTime || detailedInvoice.paymentDate,
        lines: detailedInvoice.lines?.map((line: ApiBiltyPaymentInvoice['lines'][0]) => ({
          isAdditionalLine: line.isAdditionalLine || false,
          biltyNo: line.orderNo,
          vehicleNo: line.vehicleNo,
          orderNo: line.orderNo,
          amount: Number(line.amount) || 0,
          munshayana: Number(line.munshayana) || 0,
          nameCharges: line.nameCharges || undefined,
          amountCharges: Number(line.amountCharges) || undefined,
        })) || [],
        broker: brokerDetails,
      };
    } catch (error) {
      console.error('Failed to prepare PDF payload:', error);
      toast('Unable to prepare invoice PDF', { type: 'error' });
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    if (selectedBillPaymentIds.length === 0) {
      toast('Please select a bill payment invoice first', { type: 'warning' });
      return;
    }

    const invoiceId = selectedBillPaymentIds[0];
    const payload = await preparePdfPayload(invoiceId);
    if (!payload) {
      return;
    }

    await exportBiltyPaymentInvoicePdf(payload, `${payload.invoiceNo || invoiceId}.pdf`);
    toast('Invoice PDF downloaded successfully', { type: 'success' });
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
            onClick={fetchBillPaymentInvoices}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Refresh Data
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-200"
          >
            <FaFileExcel size={18} />
            Download Excel
          </button>
          {selectedBillPaymentIds.length > 0 && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-all duration-200"
            >
              <FaFilePdf size={18} />
              Download PDF
            </button>
          )}
        </div>
      </div>
      <div>
        <DataTable
          columns={columns(handleDeleteOpen, handleCheckboxChange, selectedBillPaymentIds)}
          data={filteredBillPaymentInvoices}
          loading={loading}
          link="/billpaymentinvoices/create"
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
                disabled={updating || !selectedBillPaymentIds.length}
                className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                  ${updating || !selectedBillPaymentIds.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
              </button>
            );
          })}
          <button
            onClick={handleFileUploadClick}
            disabled={!selectedBillPaymentIds.length}
            className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
              ${selectedBillPaymentIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-500' : 'border-gray-300 bg-white text-gray-700 opacity-50 cursor-not-allowed'}`}
          >
            <span className="text-sm font-semibold text-center">Upload Files</span>
            {selectedBillPaymentIds.length && <FaFileUpload className="text-blue-500 animate-bounce" size={18} />}
          </button>
        </div>
      </div>
      {selectedRowId && (
        <div>
          <OrderProgress
            orderNo={billPaymentInvoices.find((b) => b.id === selectedRowId)?.orderNo}
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
      {openFileUploadModal && selectedBillPaymentForFiles && (
        <div
          id="fileUploadModal"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'fileUploadModal') {
              setOpenFileUploadModal(false);
              setSelectedBillPaymentForFiles(null);
            }
          }}
        >
          <div className="bg-white rounded shadow p-5 w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Files for Invoice {billPaymentInvoices.find((b) => b.id === selectedBillPaymentForFiles)?.invoiceNo || ''}</h3>
              <button
                onClick={() => {
                  setOpenFileUploadModal(false);
                  setSelectedBillPaymentForFiles(null);
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
              {billPaymentFiles[selectedBillPaymentForFiles]?.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                  <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {billPaymentFiles[selectedBillPaymentForFiles].map((file) => (
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
                            onClick={() => handleRemoveFile(selectedBillPaymentForFiles, file.id)}
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
                <p className="text-sm text-gray-500">No files uploaded for this invoice.</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setOpenFileUploadModal(false);
                    setSelectedBillPaymentForFiles(null);
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

export default BillPaymentInvoicesList;