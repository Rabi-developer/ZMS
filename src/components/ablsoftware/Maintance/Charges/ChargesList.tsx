'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllCharges, deleteCharges, updateChargesStatus } from '@/apis/charges';
import { Edit, Trash } from 'lucide-react';
import { columns, getStatusStyles, Charge } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import { getAllConsignment } from '@/apis/consignment';

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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const statusOptions = ['All', 'Unpaid', 'Paid'];
  const statusOptionsConfig = [
    { id: 1, name: 'Unpaid', color: '#ef4444' },
    { id: 2, name: 'Paid', color: '#22c55e' },
  ];

  const fetchCharges = async () => {
    try {
      setLoading(true);
      const response = await getAllCharges(pageIndex + 1, pageSize);
      setCharges(response?.data || []);
    } catch (error) {
      toast('Failed to fetch charges', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, [pageIndex, pageSize]);

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

  const handleViewOpen = async (chargeId: string) => {
    setSelectedRowId((prev) => (prev === chargeId ? null : chargeId));
    const charge = charges.find((item) => item.id === chargeId);
    if (charge?.orderNo) {
      try {
        const response = await getAllConsignment(1, 100, { orderNo: charge.orderNo });
        setConsignments(response?.data || []);
      } catch (error) {
        toast('Failed to fetch consignments', { type: 'error' });
      }
    }
  };

  const handleCheckboxChange = (chargeId: string, checked: boolean) => {
    if (checked) {
      setSelectedChargeIds((prev) => [...prev, chargeId]);
    } else {
      setSelectedChargeIds((prev) => prev.filter((id) => id !== chargeId));
    }

    setTimeout(() => {
      const selected = charges.filter((c) => selectedChargeIds.includes(c.id));
      const statuses = selected.map((c) => c.status).filter((status, index, self) => self.indexOf(status) === index);
      setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
    }, 100);
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
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Charges');
    XLSX.writeFile(workbook, 'Charges.xlsx');
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
          columns={columns(handleDeleteOpen)}
          data={filteredCharges}
          loading={loading}
          link="/charges/create"
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
          onRowClick={handleViewOpen}
        />
      </div>
      {selectedRowId && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[#3a614c]"></h3>
          <OrderProgress
            orderNo={charges.find((c) => c.id === selectedRowId)?.orderNo}
            bookingStatus={null}
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

export default ChargesList;