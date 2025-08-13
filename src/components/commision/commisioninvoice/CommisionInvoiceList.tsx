'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { columns, CommissionInvoice } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllCommisionInvoice, deleteCommisionInvoice, updateCommisionInvoiceStatus } from '@/apis/commisioninvoice';
import { FaFileInvoice } from 'react-icons/fa';
import { FaCheck } from 'react-icons/fa';

const CommissionInvoiceList = () => {
  const [invoices, setInvoices] = useState<CommissionInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<CommissionInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<CommissionInvoice | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const statusOptions = ['All', 'Pending', 'Approved', 'Canceled', 'Completed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#eab308' },
    { id: 2, name: 'Approved', color: '#22c55e' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Completed', color: '#3b82f6' },
  ];

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllCommisionInvoice(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching commission invoices:', error);
      toast('Failed to fetch commission invoices', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = invoices;
    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter((invoice) => invoice.status === selectedStatusFilter);
    }
    setFilteredInvoices(filtered);
  }, [invoices, selectedStatusFilter]);

  const handleDelete = async () => {
    try {
      await deleteCommisionInvoice(deleteId);
      setOpenDelete(false);
      toast('Commission Invoice Deleted Successfully', { type: 'success' });
      fetchInvoices();
    } catch (error) {
      console.error('Failed to delete commission invoice:', error);
      toast('Failed to delete commission invoice', { type: 'error' });
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

  const handleViewOpen = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    setSelectedInvoice(invoice || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedInvoice(null);
  };

  const handleCheckboxChange = (invoiceId: string, checked: boolean) => {
    setSelectedInvoiceIds((prev) => {
      const newSelectedIds = checked
        ? [...prev, invoiceId]
        : prev.filter((id) => id !== invoiceId);

      if (newSelectedIds.length === 0) {
        setSelectedBulkStatus(null);
      } else if (newSelectedIds.length === 1) {
        const selectedInvoice = invoices.find((inv) => inv.id === newSelectedIds[0]);
        setSelectedBulkStatus(selectedInvoice?.status || 'Pending');
      } else {
        const selectedInvoices = invoices.filter((inv) => newSelectedIds.includes(inv.id));
        const statuses = selectedInvoices.map((inv) => inv.status || 'Pending');
        const allSameStatus = statuses.every((status) => status === statuses[0]);
        setSelectedBulkStatus(allSameStatus ? statuses[0] : null);
      }

      return newSelectedIds;
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedInvoiceIds.length === 0) {
      toast('Please select at least one commission invoice', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedInvoiceIds.map((id) =>
        updateCommisionInvoiceStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedInvoiceIds([]);
      setSelectedStatusFilter(newStatus);
      toast('Commission Invoices Status Updated Successfully', { type: 'success' });
      await fetchInvoices();
    } catch (error: any) {
      toast(`Failed to update commission invoice status: ${error.message || 'Unknown error'}`, { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };
  return (
    <div className="container bg-white rounded-md p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <FaFileInvoice className="text-[#06b6d4] text-2xl" />
        <h1 className="text-2xl font-bold text-[#06b6d4]">Commission Invoice List</h1>
      </div>
      <div className="mb-4 flex items-center">
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
      </div>
      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen, handleCheckboxChange)}
        data={filteredInvoices}
        loading={loading}
        link={'/commisioninvoice/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
      <div className="mt-4 space-y-2 border-t-2 border-b-2 py-3">
        <div className="flex flex-wrap gap-3">
          {statusOptionsConfig.map((option) => {
            const isSelected = selectedBulkStatus === option.name;
            return (
              <button
                key={option.id}
                onClick={() => handleBulkStatusUpdate(option.name)}
                disabled={updating}
                className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected
                    ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]`
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && (
                  <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {selectedInvoiceIds.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold">Selected Commission Invoices</h2>
          <div className="border rounded p-4 mt-2">
            {invoices
              .filter((inv) => selectedInvoiceIds.includes(inv.id))
              .map((invoice) => (
                <div key={invoice.id} className="mb-4">
                  <h3 className="text-md md:text-lg font-semibold">Commission Invoice: {invoice.commissionInvoiceNumber}</h3>
                  <table className="w-full text-left border-collapse text-sm md:text-base">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-2 md:p-3 font-medium">Invoice #</th>
                        <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                        <th className="p-2 md:p-3 font-medium">Buyer Name</th>
                        <th className="p-2 md:p-3 font-medium">Quality</th>
                        <th className="p-2 md:p-3 font-medium">Invoice Qty</th>
                        <th className="p-2 md:p-3 font-medium">Rate</th>
                        <th className="p-2 md:p-3 font-medium">Invoice Value</th>
                        <th className="p-2 md:p-3 font-medium">Commission %</th>
                        <th className="p-2 md:p-3 font-medium">Amount</th>
                        <th className="p-2 md:p-3 font-medium">SR Tax</th>
                        <th className="p-2 md:p-3 font-medium">SR Tax Amount</th>
                        <th className="p-2 md:p-3 font-medium">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.relatedInvoices?.length ? (
                        invoice.relatedInvoices.map((relatedInvoice) => (
                          <tr key={relatedInvoice.id} className="border-b hover:bg-gray-100">
                            <td className="p-2 md:p-3">{relatedInvoice.invoiceNumber || '-'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.invoiceDate || '-'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.buyer || '-'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.quality || '-'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.invoiceQty || '0'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.rate || '0'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.invoiceValue || '0'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.commissionPercent || '0'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.amount || '0'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.srTax || '0'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.srTaxAmount || '0'}</td>
                            <td className="p-2 md:p-3">{relatedInvoice.totalAmount || '0'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={12} className="p-2 md:p-3 text-gray-500">
                            No related invoices found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </div>
      )}
      {openDelete && (
        <DeleteConfirmModel
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
          isOpen={openDelete}
        />
      )}
      {openView && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-5 flex justify-between items-center">
              <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Commission Invoice Details
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={handleViewClose}
              >
                ×
              </button>
            </div>
            <div className="p-4 md:p-6 bg-gray-50">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Comm.Invoice#
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.commissionInvoiceNumber || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Date
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.date || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Due Date
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.dueDate || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Commission From
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.commissionFrom || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Seller
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.seller || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Buyer
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.buyer || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Exclude SRB
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.excludeSRB ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Status
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.status || 'Pending'}
                    </div>
                  </div>
                  <div className="group col-span-1 md:col-span-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Remarks
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedInvoice.remarks || '-'}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold">Related Invoices</h2>
                  <div className="border rounded p-4 mt-2">
                    {selectedInvoice.relatedInvoices && selectedInvoice.relatedInvoices.length > 0 ? (
                      <table className="w-full text-left border-collapse text-sm md:text-base">
                        <thead>
                          <tr className="bg-[#06b6d4] text-white">
                            <th className="p-2 md:p-3 font-medium">Invoice #</th>
                            <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                            <th className="p-2 md:p-3 font-medium">Buyer Name</th>
                            <th className="p-2 md:p-3 font-medium">Quality</th>
                            <th className="p-2 md:p-3 font-medium">Invoice Qty</th>
                            <th className="p-2 md:p-3 font-medium">Rate</th>
                            <th className="p-2 md:p-3 font-medium">Invoice Value</th>
                            <th className="p-2 md:p-3 font-medium">Commission %</th>
                            <th className="p-2 md:p-3 font-medium">Amount</th>
                            <th className="p-2 md:p-3 font-medium">SR Tax</th>
                            <th className="p-2 md:p-3 font-medium">SR Tax Amount</th>
                            <th className="p-2 md:p-3 font-medium">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.relatedInvoices.map((relatedInvoice) => (
                            <tr key={relatedInvoice.id} className="border-b hover:bg-gray-100">
                              <td className="p-2 md:p-3">{relatedInvoice.invoiceNumber || '-'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.invoiceDate || '-'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.buyer || '-'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.quality || '-'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.invoiceQty || '0'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.rate || '0'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.invoiceValue || '0'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.commissionPercent || '0'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.amount || '0'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.srTax || '0'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.srTaxAmount || '0'}</td>
                              <td className="p-2 md:p-3">{relatedInvoice.totalAmount || '0'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 text-sm md:text-base">No related invoices found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-400 opacity-10 rounded-full -translate-x-12 -translate-y-12 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-400 opacity-10 rounded-full translate-x-12 translate-y-12 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionInvoiceList;