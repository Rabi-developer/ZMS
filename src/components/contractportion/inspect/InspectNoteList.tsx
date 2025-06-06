'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllInvoice, deleteInvoice } from '@/apis/invoice';
import { deleteInspectionNote, getAllInspectionNote, updateInspectionNoteStatus } from '@/apis/inspectnote';
import { columns, getStatusStyles, Invoice } from './columns';
import { Edit, Trash } from 'lucide-react';

interface InspectionNote {
  id: string;
  irnNumber: string;
  irnDate: string;
  seller: string;
  buyer: string;
  invoiceNumber: string;
  status?: string;
  remarks?: string;
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    quantity?: string;
    dispatchQty?: string;
    bGrade?: string;
    sl?: string;
    aGrade?: string;
    inspectedBy?: string;
  }[];
}

const InspectionNoteList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState<{ [invoiceId: string]: InspectionNote[] }>({});
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Define status options and their styles
  const statusOptions = ['All', 'Approved Inspection'];
  const statusOptionsConfig = [
    { id: 1, name: 'Approved Inspection', color: '#3b82f6' },
  ];

  // Fetch invoices and attach inspection notes
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllInvoice(pageIndex + 1, pageSize);
      const invoices = response?.data || [];
      // Fetch all inspection notes in one go
      const allInspectionNotesRes = await getAllInspectionNote(1, 1000, { invoiceNumber: '' });
      const allInspectionNotes = allInspectionNotesRes?.data || [];
      // Attach inspection notes to the correct invoice by matching invoiceNumber
      const invoicesWithInspectionNotes = invoices.map((invoice: Invoice) => {
        const notes = allInspectionNotes.filter((note: InspectionNote) => note.invoiceNumber === invoice.invoiceNumber);
        return {
          ...invoice,
          inspectionNotes: notes,
        };
      });
      setInvoices(invoicesWithInspectionNotes);
    } catch (error) {
      toast('Failed to fetch invoices', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectionNotes = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await getAllInspectionNote(1, 100, { invoiceNumber });
      setInspectionNotes((prev) => ({
        ...prev,
        [invoiceId]: response?.data || [],
      }));
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, inspectionNotes: response?.data || [] } : inv
        )
      );
    } catch (error) {
      // toast(`Failed to fetch inspection notes for invoice ${invoiceNumber}`, { type: 'error' });
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchInspectionNotes('', ''); // Initial fetch for inspection notes
  }, [pageIndex, pageSize]);

  // Only show invoices with status 'Approved'
  useEffect(() => {
    const filtered = invoices.filter((invoice) => invoice.status === 'Approved');
    setFilteredInvoices(filtered);
  }, [invoices]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchInvoices();
      const filtered = invoices.filter((invoice) =>
        ['Approved Inspection', 'Approved Inspection'].includes(invoice.status || '')
      );
      filtered.forEach((invoice) => {
        fetchInspectionNotes(invoice.id, invoice.invoiceNumber);
      });
      router.replace('/invoice');
    }
  }, [searchParams, invoices]);

  const handleDelete = async () => {
    try {
      await deleteInvoice(deleteId);
      setOpenDelete(false);
      toast('Invoice Deleted Successfully', { type: 'success' });
      fetchInvoices();
    } catch (error) {
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
    if (invoice) {
      fetchInspectionNotes(invoice.id, invoice.invoiceNumber);
    }
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedInvoice(null);
  };

  const handleCheckboxChange = (invoiceId: string, checked: boolean) => {
    setSelectedInvoiceIds((prev) => {
      let newSelectedIds: string[];
      if (checked) {
        newSelectedIds = prev.includes(invoiceId) ? prev : [...prev, invoiceId];
      } else {
        newSelectedIds = prev.filter((id) => id !== invoiceId);
      }
      if (newSelectedIds.length === 0) {
        setSelectedBulkStatus(null);
      } else {
        const selectedInvoices = invoices.filter((i) => newSelectedIds.includes(i.id));
        const statuses = selectedInvoices.map((i) => i.status || 'Pending');
        const allSameStatus = statuses.every((status) => status === statuses[0]);
        setSelectedBulkStatus(allSameStatus ? statuses[0] : null);
      }
      return newSelectedIds;
    });
  };

  // Bulk status update using inspection note IDs
  const handleBulkStatusUpdate = async (newStatus: string) => {
    // Collect all inspection note IDs from selected invoices
    const selectedInspectionNoteIds = invoices
      .filter((invoice) => selectedInvoiceIds.includes(invoice.id))
      .flatMap((invoice) => invoice.inspectionNotes?.map((note) => note.id) || []);

    if (selectedInspectionNoteIds.length === 0) {
      toast('Please select at least one invoice with inspection notes', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedInspectionNoteIds.map((id) =>
        updateInspectionNoteStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedInvoiceIds([]);
      setSelectedStatusFilter(newStatus);
      setPageIndex(0); // Reset to first page
      toast('Inspection Note Status Updated Successfully', { type: 'success' });
      await fetchInvoices();
    } catch (error: any) {
      toast(`Failed to update inspection note status: ${error.message || 'Unknown error'}`, { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedInvoiceIds.length > 0
      ? filteredInvoices.filter((invoice) => selectedInvoiceIds.includes(invoice.id))
      : filteredInvoices;

    if (dataToExport.length === 0) {
      toast('No invoices to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.flatMap((invoice) => {
      const invoiceData = {
        'Invoice Number': invoice.invoiceNumber || '-',
        'Invoice Date': invoice.invoiceDate || '-',
        'Due Date': invoice.dueDate || '-',
        'Seller': invoice.seller || '-',
        'Buyer': invoice.buyer || '-',
        'IRN Number': invoice.inspectionNotes?.[0]?.irnNumber || '-',
        'IRN Date': invoice.inspectionNotes?.[0]?.irnDate || '-',
        'Status': invoice.status || '-',
        'Remarks': invoice.remarks || '-',
        'Contract Number': '',
        'Quantity': '',
        'Dispatch Quantity': '',
        'Invoice Quantity': '',
        'Invoice Rate': '',
        'GST': '',
        'GST Value': '',
        'Invoice Value with GST': '',
        'WHT Value': '',
        'Total Invoice Value': '',
      };

      const contractRows = invoice.relatedContracts?.map((contract) => ({
        'Invoice Number': '',
        'Invoice Date': '',
        'Due Date': '',
        'Seller': '',
        'Buyer': '',
        'IRN Number': '',
        'IRN Date': '',
        'Status': '',
        'Remarks': '',
        'Contract Number': contract.contractNumber || '-',
        'Quantity': contract.quantity || '-',
        'Dispatch Quantity': contract.dispatchQty || '-',
        'Invoice Quantity': contract.invoiceQty || '-',
        'Invoice Rate': contract.invoiceRate || '-',
        'GST': contract.gst || '-',
        'GST Value': contract.gstValue || '-',
        'Invoice Value with GST': contract.invoiceValueWithGst || '-',
        'WHT Value': contract.whtValue || '-',
        'Total Invoice Value': contract.totalInvoiceValue || '-',
      })) || [];

      const inspectionNoteRows = (inspectionNotes[invoice.id] || []).flatMap((inspection) => [
        {
          'Invoice Number': '',
          'Invoice Date': '',
          'Due Date': '',
          'Seller': '',
          'Buyer': '',
          'IRN Number': inspection.irnNumber || '-',
          'IRN Date': inspection.irnDate || '-',
          'Status': inspection.status || '-',
          'Remarks': inspection.remarks || '-',
          'Contract Number': `Inspection Note: ${inspection.irnNumber}`,
          'Quantity': '',
          'Dispatch Quantity': '',
          'Invoice Quantity': '',
          'Invoice Rate': '',
          'GST': '',
          'GST Value': '',
          'Invoice Value with GST': '',
          'WHT Value': '',
          'Total Invoice Value': '',
        },
        ...(inspection.relatedContracts?.map((contract) => ({
          'Invoice Number': '',
          'Invoice Date': '',
          'Due Date': '',
          'Seller': '',
          'Buyer': '',
          'IRN Number': '',
          'IRN Date': '',
          'Status': '',
          'Remarks': '',
          'Contract Number': contract.contractNumber || '-',
          'Quantity': contract.quantity || '-',
          'Dispatch Quantity': contract.dispatchQty || '-',
          'Invoice Quantity': contract.bGrade || '-',
          'Invoice Rate': contract.sl || '-',
          'GST': contract.aGrade || '-',
          'GST Value': contract.inspectedBy || '-',
          'Invoice Value with GST': '',
          'WHT Value': '',
          'Total Invoice Value': '',
        })) || []),
      ]);

      return [invoiceData, ...contractRows, ...inspectionNoteRows];
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, 'Approved InspectionInvoices.xlsx');
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
          columns={columns(handleDeleteOpen, handleViewOpen, handleCheckboxChange)}
          data={filteredInvoices}
          loading={loading}
          link={''}
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
      <div className="mt-4 space-y-2 border-t-2 border-b-2 h-[18vh]">
        <div className="flex flex-wrap p-3 gap-3">
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
      {openDelete && (
        <DeleteConfirmModel
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
          isOpen={openDelete}
        />
      )}
      {openView && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#06b6d4]">Invoice Details</h2>
              <button onClick={handleViewClose} className="text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</div>
              <div><strong>Invoice Date:</strong> {selectedInvoice.invoiceDate || '-'}</div>
              <div><strong>Due Date:</strong> {selectedInvoice.dueDate || '-'}</div>
              <div><strong>Seller:</strong> {selectedInvoice.seller || '-'}</div>
              <div><strong>Buyer:</strong> {selectedInvoice.buyer || '-'}</div>
              <div>
                <strong>Status:</strong>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
                    selectedInvoice.status || 'Pending'
                  )}`}
                >
                  {selectedInvoice.status || 'Pending'}
                </span>
              </div>
              <div className="col-span-2">
                <strong>Remarks:</strong> {selectedInvoice.remarks || '-'}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Related Contracts</h3>
              <table className="w-full text-left border-collapse text-sm md:text-base ">
                <thead>
                  <tr className="bg-[#06b6d4] text-white">
                    <th className="p-3">Contract #</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Dispatch Qty</th>
                    <th className="p-3">Invoice Qty</th>
                    <th className="p-3">Invoice Rate</th>
                    <th className="p-3">GST</th>
                    <th className="p-3">GST Value</th>
                    <th className="p-3">Invoice Value with GST</th>
                    <th className="p-3">WHT Value</th>
                    <th className="p-3">Total Invoice Value</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.relatedContracts?.map((contract) => (
                    <tr key={contract.id} className="border-b">
                      <td className="p-3">{contract.contractNumber || '-'}</td>
                      <td className="p-3">{contract.quantity || '-'}</td>
                      <td className="p-3">{contract.dispatchQty || '-'}</td>
                      <td className="p-3">{contract.invoiceQty || '-'}</td>
                      <td className="p-3">{contract.invoiceRate || '-'}</td>
                      <td className="p-3">{contract.gst || '-'}</td>
                      <td className="p-3">{contract.gstValue || '-'}</td>
                      <td className="p-3">{contract.invoiceValueWithGst || '-'}</td>
                      <td className="p-3">{contract.whtValue || '-'}</td>
                      <td className="p-3">{contract.totalInvoiceValue || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Inspection Notes</h3>
              {inspectionNotes[selectedInvoice.id]?.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-3">IRN Number</th>
                      <th className="p-3">IRN Date</th>
                      <th className="p-3">Seller</th>
                      <th className="p-3">Buyer</th>
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Remarks</th>
                      <th className="p-3">Related Contracts</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionNotes[selectedInvoice.id]?.map((inspection) => (
                      <tr key={inspection.id} className="border-b">
                        <td className="p-3">{inspection.irnNumber || '-'}</td>
                        <td className="p-3">{inspection.irnDate || '-'}</td>
                        <td className="p-3">{inspection.seller || '-'}</td>
                        <td className="p-3">{inspection.buyer || '-'}</td>
                        <td className="p-3">{inspection.invoiceNumber || '-'}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
                              inspection.status || 'Pending'
                            )}`}
                          >
                            {inspection.status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-3">{inspection.remarks || '-'}</td>
                        <td className="p-3">
                          {inspection.relatedContracts && inspection.relatedContracts.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="p-2">Contract #</th>
                                  <th className="p-2">Quantity</th>
                                  <th className="p-2">Dispatch Qty</th>
                                  <th className="p-2">B Grade</th>
                                  <th className="p-2">S.L</th>
                                  <th className="p-2">A Grade</th>
                                  <th className="p-2">Inspected By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inspection.relatedContracts.map((contract) => (
                                  <tr key={contract.id} className="border-b">
                                    <td className="p-2">{contract.contractNumber || '-'}</td>
                                    <td className="p-2">{contract.quantity || '-'}</td>
                                    <td className="p-2">{contract.dispatchQty || '-'}</td>
                                    <td className="p-2">{contract.bGrade || '-'}</td>
                                    <td className="p-2">{contract.sl || '-'}</td>
                                    <td className="p-2">{contract.aGrade || '-'}</td>
                                    <td className="p-2">{contract.inspectedBy || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            'No contracts'
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Link href={`/inspectionnote/edit/${inspection.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await deleteInspectionNote(inspection.id);
                                  toast('Inspection Note Deleted Successfully', { type: 'success' });
                                  fetchInspectionNotes(selectedInvoice.id, selectedInvoice.invoiceNumber);
                                } catch (error) {
                                  toast('Failed to delete inspection note', { type: 'error' });
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No inspection notes found for this invoice.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionNoteList;