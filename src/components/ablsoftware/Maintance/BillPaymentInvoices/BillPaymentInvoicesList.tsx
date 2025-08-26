'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllBiltyPaymentInvoice, deleteBiltyPaymentInvoice, updateBiltyPaymentInvoice } from '@/apis/biltypaymentnnvoice';
import { columns, getStatusStyles, BillPaymentInvoice } from './columns';

// Interface for the API response
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
  }>;
  isActive: boolean;
  isDeleted: boolean;
  createdDateTime: string;
  modifiedDateTime: string | null;
  modifiedBy: string | null;
}

// Transform API response to match BillPaymentInvoice
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

  const statusOptions = ['All', 'Unpaid', 'Paid'];
  const statusOptionsConfig = [
    { id: 1, name: 'Unpaid', color: '#ef4444' },
    { id: 2, name: 'Paid', color: '#22c55e' },
  ];

  const fetchBillPaymentInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllBiltyPaymentInvoice(pageIndex + 1, pageSize);
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

  const handleCheckboxChange = (billPaymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedBillPaymentIds((prev) => [...prev, billPaymentId]);
    } else {
      setSelectedBillPaymentIds((prev) => prev.filter((id) => id !== billPaymentId));
    }

    setTimeout(() => {
      const selected = billPaymentInvoices.filter((b) => selectedBillPaymentIds.includes(b.id));
      const statuses = selected.map((b) => b.status).filter((status, index, self) => self.indexOf(status) === index);
      setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
    }, 100);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedBillPaymentIds.length === 0) {
      toast('Please select at least one bill payment invoice', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedBillPaymentIds.map((id) =>
        updateBiltyPaymentInvoice({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedBillPaymentIds([]);
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
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BillPaymentInvoices');
    XLSX.writeFile(workbook, 'BillPaymentInvoices.xlsx');
  };

  return (
    <div className="container p-6 h-[110vh]">
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
          columns={columns(handleDeleteOpen)}
          data={filteredBillPaymentInvoices}
          loading={loading}
          link="/billpaymentinvoices/create"
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

export default BillPaymentInvoicesList;