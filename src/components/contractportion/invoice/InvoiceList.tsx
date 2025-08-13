'use client';
import React from 'react';
import { toast } from 'react-toastify';
import { columns, Invoice } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllInvoice, deleteInvoice, updateInvoiceStatus } from '@/apis/invoice';
import { MdReceipt } from 'react-icons/md';
import { FaCheck, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const InvoiceList = () => {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = React.useState<string[]>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>('All');
  const [selectedBulkStatus, setSelectedBulkStatus] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState(false);
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string | null>(null);

  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'Closed', 'UnApproved'];

  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#eab308' },
    { id: 2, name: 'Approved', color: '#22c55e' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Closed', color: '#3b82f6' },
    { id: 5, name: 'UnApproved', color: '#8b5cf6' },
  ];

  const getFabricDetails = (contract: {
    fabricValue: string;
    id?: string;
    contractNumber?: string;
    fabricDetails?: string;
    dispatchQty?: string;
    invoiceQty?: string;
    invoiceRate?: string;
    invoiceValue?: string;
    gst?: string;
    gstPercentage?: string;
    gstValue?: string;
    invoiceValueWithGst?: string;
    whtPercentage?: string;
    whtValue?: string;
    totalInvoiceValue?: string;
    warpCount?: string;
    warpYarnType?: string;
    weftCount?: string;
    weftYarnType?: string;
    noOfEnds?: string;
    noOfPicks?: string;
    weaves?: string;
    width?: string;
    final?: string;
    selvage?: string;
    selvedge?: string;
  }) => {
    const fabricDetails = [
      `${contract.warpCount || ''}${contract.warpYarnType || ''}`,
      `${contract.weftCount || ''}${contract.weftYarnType || ''}`,
      `${contract.noOfEnds || ''}${contract.noOfPicks ? ` * ${contract.noOfPicks}` : ''}`,
      contract.weaves || '',
      contract.width || '',
      contract.final || '',
      contract.selvage || '',
    ]
      .filter((item) => item.trim() !== '')
      .join(' / ');

    return fabricDetails || 'N/A';
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllInvoice(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast('Failed to fetch invoices', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInvoices();
  }, [pageIndex, pageSize]);

  React.useEffect(() => {
    let filtered = invoices;

    if (startDate && endDate) {
      filtered = filtered.filter((invoice) => {
        if (!invoice.invoiceDate) return false;
        const invoiceDate = new Date(invoice.invoiceDate).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return invoiceDate >= start && invoiceDate <= end;
      });
    }

    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter((invoice) => invoice.status === selectedStatusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, selectedStatusFilter, startDate, endDate]);

  const handleDelete = async () => {
    try {
      await deleteInvoice(deleteId);
      setOpenDelete(false);
      toast('Invoice Deleted Successfully', { type: 'success' });
      fetchInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast('Failed to delete invoice', { type: 'error' });
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
        setSelectedBulkStatus(selectedInvoice?.status || 'Prepared');
      } else {
        const selectedInvoices = invoices.filter((inv) => newSelectedIds.includes(inv.id));
        const statuses = selectedInvoices.map((inv) => inv.status || 'Prepared');
        const allSameStatus = statuses.every((status) => status === statuses[0]);
        setSelectedBulkStatus(allSameStatus ? statuses[0] : null);
      }

      return newSelectedIds;
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedInvoiceIds.length === 0) {
      toast('Please select at least one invoice', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedInvoiceIds.map((id) =>
        updateInvoiceStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedInvoiceIds([]);
      setSelectedStatusFilter(newStatus);
      toast('Invoices Status Updated Successfully', { type: 'success' });
      await fetchInvoices();
    } catch (error: any) {
      toast(`Failed to update invoice status: ${error.message || 'Unknown error'}`, { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport: Invoice[] = [];

    if (selectedInvoiceIds.length > 0) {
      dataToExport = filteredInvoices.filter((invoice) =>
        selectedInvoiceIds.includes(invoice.id)
      );
      if (dataToExport.length === 0) {
        toast('No invoices match the selected criteria', { type: 'warning' });
        return;
      }
    } else {
      dataToExport = filteredInvoices;
      if (dataToExport.length === 0) {
        toast('No invoices available to export', { type: 'warning' });
        return;
      }
    }

    const formattedData = dataToExport.flatMap((invoice) => {
      const invoiceData = {
        'Invoice Number': invoice.invoiceNumber || '-',
        'Invoice Date': invoice.invoiceDate || '-',
        'Due Date': invoice.dueDate || '-',
        'Seller': invoice.seller || '-',
        'Buyer': invoice.buyer || '-',
        'Status': invoice.status || 'Prepared',
        'Remarks': invoice.invoiceremarks || '-',
        'Contract Number': '',
        'Fabric Details': '',
        'Dispatch Quantity': '',
        'Invoice Quantity': '',
        'Invoice Rate': '',
        'Invoice Value': '',
        'GST': '',
        'GST %': '',
        'GST Value': '',
        'Invoice Value with GST': '',
        'WHT %': '',
        'WHT Value': '',
        'Total Invoice Value': '',
      };

      const contractRows = invoice.relatedContracts?.map((contract) => {
        const invoiceQty = parseFloat(contract.invoiceQty || contract.dispatchQty || '0') || 0;
        const invoiceRate = parseFloat(contract.invoiceRate || '0') || 0;
        const gstPercentage = parseFloat(contract.gstPercentage || contract.gst || '0') || 0;
        const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

        const invoiceValue = contract.invoiceValue || (invoiceQty * invoiceRate).toFixed(2);
        const gstValue = contract.gstValue || (parseFloat(invoiceValue) * (gstPercentage / 100)).toFixed(2);
        const invoiceValueWithGst = contract.invoiceValueWithGst || (parseFloat(invoiceValue) + parseFloat(gstValue)).toFixed(2);
        const whtValue = contract.whtValue || (parseFloat(invoiceValueWithGst) * (whtPercentage / 100)).toFixed(2);
        const totalInvoiceValue = contract.totalInvoiceValue || (parseFloat(invoiceValueWithGst) - parseFloat(whtValue)).toFixed(2);

        return {
          'Invoice Number': '',
          'Invoice Date': '',
          'Due Date': '',
          'Seller': '',
          'Buyer': '',
          'Status': '',
          'Remarks': '',
          'Contract Number': contract.contractNumber || '-',
          'Fabric Details': contract.fabricDetails || getFabricDetails(contract),
          'Dispatch Quantity': contract.dispatchQty || '-',
          'Invoice Quantity': contract.invoiceQty || contract.dispatchQty || '-',
          'Invoice Rate': contract.invoiceRate || '-',
          'Invoice Value': invoiceValue || '-',
          'GST': contract.gst || '-',
          'GST %': contract.gstPercentage || '-',
          'GST Value': gstValue || '-',
          'Invoice Value with GST': invoiceValueWithGst || '-',
          'WHT %': contract.whtPercentage || '-',
          'WHT Value': whtValue || '-',
          'Total Invoice Value': totalInvoiceValue || '-',
        };
      }) || [];

      return [invoiceData, ...contractRows];
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

    const wscols = [
      { wch: 15 }, // Invoice Number
      { wch: 12 }, // Invoice Date
      { wch: 12 }, // Due Date
      { wch: 20 }, // Seller
      { wch: 20 }, // Buyer
      { wch: 12 }, // Status
      { wch: 30 }, // Remarks
      { wch: 15 }, // Contract Number
      { wch: 30 }, // Fabric Details
      { wch: 15 }, // Dispatch Quantity
      { wch: 15 }, // Invoice Quantity
      { wch: 12 }, // Invoice Rate
      { wch: 15 }, // Invoice Value
      { wch: 12 }, // GST
      { wch: 10 }, // GST %
      { wch: 12 }, // GST Value
      { wch: 20 }, // Invoice Value with GST
      { wch: 10 }, // WHT %
      { wch: 12 }, // WHT Value
      { wch: 20 }, // Total Invoice Value
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, 'Invoices.xlsx');
  };

  return (
    <div className="container bg-white rounded-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <MdReceipt className="text-[#06b6d4] text-2xl" />
        <h1 className="text-2xl font-bold text-[#06b6d4]">Invoice List</h1>
      </div>
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-200"
        >
          <FaFileExcel size={18} />
          Export to Excel
        </button>
      </div>
      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen, handleCheckboxChange)}
        data={filteredInvoices}
        loading={loading}
        link={'/invoice/create'}
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
          <h2 className="text-xl text-[#06b6d4] font-bold">Related Contracts for Selected Invoices</h2>
          <div className="border rounded p-4 mt-2">
            {selectedInvoiceIds.map((id) => {
              const invoice = invoices.find((inv) => inv.id === id);
              if (!invoice || !invoice.relatedContracts?.length) {
                return (
                  <p key={id} className="text-gray-500">
                    No related contracts found for Invoice {invoice?.invoiceNumber || id}.
                  </p>
                );
              }
              return (
                <div key={id} className="mb-4">
                  <h3 className="text-lg font-semibold">Invoice: {invoice.invoiceNumber}</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3 font-medium">Contract#</th>
                        <th className="p-3 font-medium">Fabric Details</th>
                        <th className="p-3 font-medium">Dispatch Qty</th>
                        <th className="p-3 font-medium">Invoice Qty</th>
                        <th className="p-3 font-medium">Invoice Rate</th>
                        <th className="p-3 font-medium">Invoice Value</th>
                        {/* <th className="p-3 font-medium">GST</th> */}
                        <th className="p-3 font-medium">%</th>
                        <th className="p-3 font-medium">GST Value</th>
                        <th className="p-3 font-medium">Invoice Value with GST</th>
                        <th className="p-3 font-medium">WHT%</th>
                        <th className="p-3 font-medium">WHT Value</th>
                        <th className="p-3 font-medium">Total Invoice Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.relatedContracts.map((contract) => {
                        const invoiceQty = parseFloat(contract.invoiceQty || contract.dispatchQty || '0') || 0;
                        const invoiceRate = parseFloat(contract.invoiceRate || '0') || 0;
                        const gstPercentage = parseFloat(contract.gstPercentage || contract.gst || '0') || 0;
                        const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

                        const invoiceValue = contract.invoiceValue || (invoiceQty * invoiceRate).toFixed(2);
                        const gstValue = contract.gstValue || (parseFloat(invoiceValue) * (gstPercentage / 100)).toFixed(2);
                        const invoiceValueWithGst = contract.invoiceValueWithGst || (parseFloat(invoiceValue) + parseFloat(gstValue)).toFixed(2);
                        const whtValue = contract.whtValue || (parseFloat(invoiceValueWithGst) * (whtPercentage / 100)).toFixed(2);
                        const totalInvoiceValue = contract.totalInvoiceValue || (parseFloat(invoiceValueWithGst) - parseFloat(whtValue)).toFixed(2);

                        return (
                          <tr key={contract.id} className="border-b hover:bg-gray-100">
                            <td className="p-3">{contract.contractNumber || '-'}</td>
                            <td className="p-3">{contract.fabricDetails || getFabricDetails(contract)}</td>
                            <td className="p-3">{contract.invoiceQty || contract.dispatchQty || '-'}</td>
                            <td className="p-3">{contract.invoiceQty || contract.dispatchQty || '-'}</td>
                            <td className="p-3">{contract.invoiceRate || '-'}</td>
                            <td className="p-3">{invoiceValue || '-'}</td>
                            {/* <td className="p-3">{contract.gstPercentage || '-'}</td> */}
                            <td className="p-3">{contract.gstPercentage || '-'}</td>
                            <td className="p-3">{gstValue || '-'}</td>
                            <td className="p-3">{invoiceValueWithGst || '-'}</td>
                            <td className="p-3">{contract.whtPercentage || '-'}</td>
                            <td className="p-3">{whtValue || '-'}</td>
                            <td className="p-3">{totalInvoiceValue || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#06b6d4] mb-4">Invoice Details: {selectedInvoice.invoiceNumber}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber || '-'}</p>
                <p><strong>Invoice Date:</strong> {selectedInvoice.invoiceDate || '-'}</p>
                <p><strong>Due Date:</strong> {selectedInvoice.dueDate || '-'}</p>
                <p><strong>Seller:</strong> {selectedInvoice.seller || '-'}</p>
                <p><strong>Buyer:</strong> {selectedInvoice.buyer || '-'}</p>
                <p><strong>Status:</strong> {selectedInvoice.status || 'Prepared'}</p>
                <p><strong>Remarks:</strong> {selectedInvoice.invoiceremarks || '-'}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold mt-4">Related Contracts</h3>
            <table className="w-full text-left border-collapse mt-2">
              <thead>
                <tr className="bg-[#06b6d4] text-white">
                  <th className="p-3 font-medium">Contract#</th>
                  <th className="p-3 font-medium">Fabric Details</th>
                  <th className="p-3 font-medium">Dispatch Qty</th>
                  <th className="p-3 font-medium">Invoice Qty</th>
                  <th className="p-3 font-medium">Invoice Rate</th>
                  <th className="p-3 font-medium">Invoice Value</th>
                  <th className="p-3 font-medium">GST</th>
                  <th className="p-3 font-medium">%</th>
                  <th className="p-3 font-medium">GST Value</th>
                  <th className="p-3 font-medium">Invoice Value with GST</th>
                  <th className="p-3 font-medium">WHT%</th>
                  <th className="p-3 font-medium">WHT Value</th>
                  <th className="p-3 font-medium">Total Invoice Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.relatedContracts?.map((contract) => {
                  const invoiceQty = parseFloat(contract.invoiceQty || contract.dispatchQty || '0') || 0;
                  const invoiceRate = parseFloat(contract.invoiceRate || '0') || 0;
                  const gstPercentage = parseFloat(contract.gstPercentage || contract.gst || '0') || 0;
                  const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

                  const invoiceValue = contract.invoiceValue || (invoiceQty * invoiceRate).toFixed(2);
                  const gstValue = contract.gstValue || (parseFloat(invoiceValue) * (gstPercentage / 100)).toFixed(2);
                  const invoiceValueWithGst = contract.invoiceValueWithGst || (parseFloat(invoiceValue) + parseFloat(gstValue)).toFixed(2);
                  const whtValue = contract.whtValue || (parseFloat(invoiceValueWithGst) * (whtPercentage / 100)).toFixed(2);
                  const totalInvoiceValue = contract.totalInvoiceValue || (parseFloat(invoiceValueWithGst) - parseFloat(whtValue)).toFixed(2);

                  return (
                    <tr key={contract.id} className="border-b hover:bg-gray-100">
                      <td className="p-3">{contract.contractNumber || '-'}</td>
                      <td className="p-3">{contract.fabricDetails || getFabricDetails(contract)}</td>
                      <td className="p-3">{contract.dispatchQty || '-'}</td>
                      <td className="p-3">{contract.invoiceQty || contract.dispatchQty || '-'}</td>
                      <td className="p-3">{contract.invoiceRate || '-'}</td>
                      <td className="p-3">{invoiceValue || '-'}</td>
                      <td className="p-3">{contract.gst || '-'}</td>
                      <td className="p-3">{contract.gstPercentage || '-'}</td>
                      <td className="p-3">{gstValue || '-'}</td>
                      <td className="p-3">{invoiceValueWithGst || '-'}</td>
                      <td className="p-3">{contract.whtPercentage || '-'}</td>
                      <td className="p-3">{whtValue || '-'}</td>
                      <td className="p-3">{totalInvoiceValue || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              onClick={handleViewClose}
              className="mt-4 bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;