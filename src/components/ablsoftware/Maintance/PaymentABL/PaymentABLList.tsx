'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllPaymentABL, deletePaymentABL, updatePaymentABLStatus } from '@/apis/paymentABL';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { columns, PaymentABL } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';

const PaymentABLList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<PaymentABL[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentABL[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const statusOptions = ['All', 'Pending', 'Completed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#ef4444' },
    { id: 2, name: 'Completed', color: '#22c55e' },
  ];

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getAllPaymentABL(pageIndex + 1, pageSize);
      setPayments(response?.data || []);
    } catch (error) {
      toast('Failed to fetch payments', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = payments;
    if (selectedStatusFilter !== 'All') {
      filtered = payments.filter((p) => p.status === selectedStatusFilter);
    }
    setFilteredPayments(filtered);
  }, [payments, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchPayments();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deletePaymentABL(deleteId);
      setOpenDelete(false);
      toast('Payment Deleted Successfully', { type: 'success' });
      fetchPayments();
    } catch (error) {
      toast('Failed to delete payment', { type: 'error' });
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

  const handleViewOpen = async (paymentId: string) => {
    setSelectedRowId((prev) => (prev === paymentId ? null : paymentId));
    const payment = payments.find((item) => item.id === paymentId);
    if (payment?.items && payment.items.length > 0) {
      const orderNo = payment.items[0].orderNo; // Use the first item's orderNo
      try {
        const consResponse = await getAllConsignment(1, 100, { orderNo });
        setConsignments(consResponse?.data || []);
        const bookingResponse = await getAllBookingOrder(1, 100, { orderNo });
        const booking = bookingResponse?.data.find((b: any) => b.orderNo === orderNo);
        setBookingStatus(booking?.status || null);
      } catch (error) {
        toast('Failed to fetch related data', { type: 'error' });
      }
    }
  };

  const handleCheckboxChange = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentIds((prev) => [...prev, paymentId]);
    } else {
      setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
    }

    setTimeout(() => {
      const selected = payments.filter((p) => selectedPaymentIds.includes(p.id));
      const statuses = selected.map((p) => p.status).filter((status, index, self) => self.indexOf(status) === index);
      setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
    }, 100);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedPaymentIds.length === 0) {
      toast('Please select at least one payment', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedPaymentIds.map((id) =>
        updatePaymentABLStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedPaymentIds([]);
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
      toast('Payment Status Updated Successfully', { type: 'success' });
      await fetchPayments();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedPaymentIds.length > 0
      ? filteredPayments.filter((p) => selectedPaymentIds.includes(p.id))
      : filteredPayments;

    if (dataToExport.length === 0) {
      toast('No payments to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.map((p) => ({
      'Payment No': p.paymentNo || '-',
      'Payment Date': p.paymentDate || '-',
      'Paid To': p.paidTo || '-',
      'Payment Mode': p.paymentMode || '-',
      'Bank Name': p.bankName || '-',
      'Cheque No': p.chequeNo || '-',
      'Cheque Date': p.chequeDate || '-',
      'Paid Amount': p.paidAmount || '-',
      'Status': p.status || 'Pending',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, 'Payments.xlsx');
  };

  return (
    <div className="container mx-auto mt-4  max-w-screen  p-6 ">
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
            onClick={fetchPayments}
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
          data={filteredPayments}
          loading={loading}
          link="/paymentABL/create"
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
          onRowClick={handleViewOpen}
        />
      </div>
      {selectedRowId && (
        <div className="mt-4">
          <OrderProgress
            orderNo={payments.find((p) => p.id === selectedRowId)?.items?.[0]?.orderNo}
            bookingStatus={bookingStatus}
            consignments={consignments}
          />
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

export default PaymentABLList;