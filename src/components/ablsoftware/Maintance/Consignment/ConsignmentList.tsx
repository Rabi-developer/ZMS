'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllConsignment, deleteConsignment, updateConsignmentStatus } from '@/apis/consignment';
import { columns, getStatusStyles, Consignment } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import { getAllBookingOrder } from '@/apis/bookingorder';

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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedConsignmentIds, setSelectedConsignmentIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null); // Track selected row

  const statusOptions = ['All', 'Pending', 'In Transit', 'Delivered'];
  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#f59e0b' },
    { id: 2, name: 'In Transit', color: '#5673ba' },
    { id: 3, name: 'Delivered', color: '#869719' },
  ];

  const fetchConsignments = async () => {
    try {
      setLoading(true);
      const response = await getAllConsignment(pageIndex + 1, pageSize);
      setConsignments(response?.data || []);
    } catch (error) {
      toast('Failed to fetch consignments', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignments();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = consignments;
    if (selectedStatusFilter !== 'All') {
      filtered = consignments.filter((c) => c.status === selectedStatusFilter);
    }
    setFilteredConsignments(filtered);
  }, [consignments, selectedStatusFilter]);

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

  const handleViewOpen = async (consignmentId: string) => {
    setSelectedRowId((prev) => (prev === consignmentId ? null : consignmentId));
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
  };

  const handleCheckboxChange = (consignmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedConsignmentIds((prev) => [...prev, consignmentId]);
    } else {
      setSelectedConsignmentIds((prev) => prev.filter((id) => id !== consignmentId));
    }

    setTimeout(() => {
      const selected = consignments.filter((c) => selectedConsignmentIds.includes(c.id));
      const statuses = selected.map((c) => c.status).filter((status, index, self) => self.indexOf(status) === index);
      setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
    }, 100);
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
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
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
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consignments');
    XLSX.writeFile(workbook, 'Consignments.xlsx');
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
          columns={columns(handleDeleteOpen, handleViewOpen)}
          data={filteredConsignments}
          loading={loading}
          link="/consignment/create"
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
      {selectedRowId && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[#06b6d4]">Order Progress</h3>
          <OrderProgress
            orderNo={consignments.find((c) => c.id === selectedRowId)?.orderNo}
            bookingStatus={bookingStatus}
            consignments={[consignments.find((c) => c.id === selectedRowId)]}
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

export default ConsignmentList;