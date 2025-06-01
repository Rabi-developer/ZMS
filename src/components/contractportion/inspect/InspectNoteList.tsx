'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { columns, InspectionNote, getStatusStyles } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllInspectionNote, deleteInspectionNote, updateInspectionNoteStatus } from '@/apis/inspectnote';
import { getAllInvoice } from '@/apis/invoice';
import { MdOutlineAssignment } from 'react-icons/md';
import { FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  seller: string;
  buyer: string;
}

const InspectionNoteList = () => {
  const [inspectionNotes, setInspectionNotes] = useState<InspectionNote[]>([]);
  const [filteredInspectionNotes, setFilteredInspectionNotes] = useState<InspectionNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [selectedInspectionNote, setSelectedInspectionNote] = useState<InspectionNote | null>(null);
  const [selectedInspectionNoteIds, setSelectedInspectionNoteIds] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [updating, setUpdating] = useState(false);

  const statusOptions = ['All', 'Approved', 'InspectionApproved'];

  const statusOptionsConfig = [
    { id: 1, name: 'InspectApproved', color: '#10b981' },
  ];

  const fetchInspectionNotes = async () => {
    try {
      setLoading(true);
      const response = await getAllInspectionNote(pageIndex + 1, pageSize);
      setInspectionNotes(response?.data || []);
    } catch (error) {
      toast('Failed to fetch inspection notes', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await getAllInvoice(1, 100);
      setInvoices(response?.data || []);
    } catch (error) {
      toast('Failed to fetch invoices', { type: 'error' });
    }
  };

  useEffect(() => {
    fetchInspectionNotes();
    fetchInvoices();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = inspectionNotes;

    filtered = filtered.filter((note) => {
      const invoice = invoices.find((inv) => inv.invoiceNumber === note.invoiceNumber);
      return invoice && invoice.status === 'Approved';
    });

    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter((note) => note.status === selectedStatusFilter);
    }

    setFilteredInspectionNotes(filtered);
  }, [inspectionNotes, invoices, selectedStatusFilter]);

  const handleDelete = async () => {
    try {
      await deleteInspectionNote(deleteId);
      setOpenDelete(false);
      toast('Inspection Note Deleted Successfully', { type: 'success' });
      fetchInspectionNotes();
    } catch (error) {
      toast('Failed to delete inspection note', { type: 'error' });
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

  const handleViewOpen = (inspectionNoteId: string) => {
    const inspectionNote = inspectionNotes.find((item) => item.id === inspectionNoteId);
    setSelectedInspectionNote(inspectionNote || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedInspectionNote(null);
  };

  const handleCheckboxChange = (inspectionNoteId: string, checked: boolean) => {
    setSelectedInspectionNoteIds((prev) =>
      checked ? [...prev, inspectionNoteId] : prev.filter((id) => id !== inspectionNoteId)
    );
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedInspectionNoteIds.length === 0) {
      toast('Please select at least one inspection note', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      await Promise.all(
        selectedInspectionNoteIds.map((id) =>
          updateInspectionNoteStatus({ id, status: newStatus })
        )
      );
      toast('Inspection Notes Status Updated Successfully', { type: 'success' });
      fetchInspectionNotes();
      setSelectedInspectionNoteIds([]);
    } catch (error) {
      toast('Failed to update inspection note status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = selectedInspectionNoteIds.length > 0
      ? filteredInspectionNotes.filter((note) => selectedInspectionNoteIds.includes(note.id))
      : filteredInspectionNotes;

    if (dataToExport.length === 0) {
      toast('No inspection notes to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.flatMap((note) => {
      const invoice = invoices.find((inv) => inv.invoiceNumber === note.invoiceNumber);
      const noteData = {
        'IRN Number': note.irnNumber || '-',
        'IRN Date': note.irnDate || '-',
        'Seller': note.seller || '-',
        'Buyer': note.buyer || '-',
        'Invoice Number': note.invoiceNumber || '-',
        'Invoice Status': invoice?.status || '-',
        'Inspection Note Status': note.status || '-',
        'Remarks': note.remarks || '-',
        'Contract Number': '',
        'Contract Quantity': '',
        'Dispatch Quantity': '',
        'B Grade': '',
        'S.L': '',
        'A Grade': '',
        'Inspected By': '',
      };

      const contractRows = note.relatedContracts?.map((contract) => ({
        'IRN Number': '',
        'IRN Date': '',
        'Seller': '',
        'Buyer': '',
        'Invoice Number': '',
        'Invoice Status': '',
        'Inspection Note Status': '',
        'Remarks': '',
        'Contract Number': contract.contractNumber || '-',
        'Contract Quantity': contract.quantity || '-',
        'Dispatch Quantity': contract.dispatchQty || '-',
        'B Grade': contract.bGrade || '-',
        'S.L': contract.sl || '-',
        'A Grade': contract.aGrade || '-',
        'Inspected By': contract.inspectedBy || '-',
      })) || [];

      return [noteData, ...contractRows];
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'InspectionNotes');
    XLSX.writeFile(workbook, 'InspectionNotes.xlsx');
  };

  return (
    <div className="container bg-white rounded-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2">Filter by Status:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
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
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          <FaFileExcel size={18} />
          Download Excel
        </button>
      </div>
      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen, handleCheckboxChange)}
        data={filteredInspectionNotes}
        loading={loading}
        link={'/inspectionnote/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
      <div className="mt-4 space-y-2 border-t-2 border-b-2 py-3">
        <div className="flex flex-wrap gap-3">
          {statusOptionsConfig.map((option) => (
            <button
              key={option.id}
              onClick={() => handleBulkStatusUpdate(option.name)}
              disabled={updating}
              className={`w-40 h-16 p-4 border-2 rounded-xl ${
                updating ? 'opacity-50' : 'hover:scale-105'
              } border-[${option.color}] bg-[${option.color}/10] text-[${option.color}]`}
            >
              <span className="text-sm font-semibold">{option.name}</span>
            </button>
          ))}
        </div>
      </div>
      {selectedInspectionNoteIds.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl text-[#06b6d4] font-bold">Related Contracts</h2>
          <div className="border rounded p-4 mt-2">
            {selectedInspectionNoteIds.map((id) => {
              const note = inspectionNotes.find((n) => n.id === id);
              return (
                <div key={id} className="mb-4">
                  <h3 className="text-lg font-semibold">Inspection Note: {note?.irnNumber}</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3">Contract #</th>
                        <th className="p-3">Contract Quantity</th>
                        <th className="p-3">Dispatch Qty</th>
                        <th className="p-3">B Grade</th>
                        <th className="p-3">S.L</th>
                        <th className="p-3">A Grade</th>
                        <th className="p-3">Inspected By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {note?.relatedContracts?.map((contract) => (
                        <tr key={contract.id} className="border-b hover:bg-gray-100">
                          <td className="p-3">{contract.contractNumber || '-'}</td>
                          <td className="p-3">{contract.quantity || '-'}</td>
                          <td className="p-3">{contract.dispatchQty || '-'}</td>
                          <td className="p-3">{contract.bGrade || '-'}</td>
                          <td className="p-3">{contract.sl || '-'}</td>
                          <td className="p-3">{contract.aGrade || '-'}</td>
                          <td className="p-3">{contract.inspectedBy || '-'}</td>
                        </tr>
                      ))}
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
      {openView && selectedInspectionNote && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#06b6d4]">Inspection Note Details</h2>
              <button onClick={handleViewClose} className="text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>IRN Number:</strong> {selectedInspectionNote.irnNumber}</div>
              <div><strong>IRN Date:</strong> {selectedInspectionNote.irnDate || '-'}</div>
              <div><strong>Seller:</strong> {selectedInspectionNote.seller || '-'}</div>
              <div><strong>Buyer:</strong> {selectedInspectionNote.buyer || '-'}</div>
              <div><strong>Invoice Number:</strong> {selectedInspectionNote.invoiceNumber || '-'}</div>
              <div>
                <strong>Invoice Status:</strong>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${
                    invoices.find((inv) => inv.invoiceNumber === selectedInspectionNote.invoiceNumber)?.status === 'Approved'
                      ? 'border-green-500 bg-green-500/10 text-green-500'
                      : 'border-gray-500 bg-gray-500/10 text-gray-500'
                  }`}
                >
                  {invoices.find((inv) => inv.invoiceNumber === selectedInspectionNote.invoiceNumber)?.status || 'Unknown'}
                </span>
              </div>
              <div>
                <strong>Inspection Note Status:</strong>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
                    selectedInspectionNote.status || 'Pending'
                  )}`}
                >
                  {selectedInspectionNote.status || 'Pending'}
                </span>
              </div>
              <div className="col-span-2">
                <strong>Remarks:</strong> {selectedInspectionNote.remarks || '-'}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Related Contracts</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#06b6d4] text-white">
                    <th className="p-3">Contract #</th>
                    <th className="p-3">Contract Quantity</th>
                    <th className="p-3">Dispatch Qty</th>
                    <th className="p-3">B Grade</th>
                    <th className="p-3">S.L</th>
                    <th className="p-3">A Grade</th>
                    <th className="p-3">Inspected By</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInspectionNote.relatedContracts?.map((contract) => (
                    <tr key={contract.id} className="border-b">
                      <td className="p-3">{contract.contractNumber || '-'}</td>
                      <td className="p-3">{contract.quantity || '-'}</td>
                      <td className="p-3">{contract.dispatchQty || '-'}</td>
                      <td className="p-3">{contract.bGrade || '-'}</td>
                      <td className="p-3">{contract.sl || '-'}</td>
                      <td className="p-3">{contract.aGrade || '-'}</td>
                      <td className="p-3">{contract.inspectedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionNoteList;