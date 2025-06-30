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
import { getAllInvoice, deleteInvoice, updateInvoiceStatus } from '@/apis/invoice';
import { deleteInspectionNote, getAllInspectionNote, updateInspectionNoteStatus } from '@/apis/inspectnote';
import { Edit, Trash } from 'lucide-react';
import { columns, getStatusStyles, Invoice } from './columns';

interface InspectionNote {
  id: string;
  irnNumber: string;
  irnDate: string;
  seller: string;
  buyer: string;
  invoiceNumber?: string;
  status?: string;
  remarks?: string;
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    quantity?: string;
    dispatchQuantity?: string;
    bGrade?: string;
    sl?: string;
    shrinkage?: string;
    returnFabric?: string;
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

  const statusOptions = ['All', 'Approved Inspection', 'UnApproved Inspection', 'Active'];
  const statusOptionsConfig = [
    { id: 1, name: 'Approved Inspection', color: '#3b82f6' },
    { id: 2, name: 'UnApproved Inspection', color: '#5673ba' },
    { id: 3, name: 'Active', color: '#869719' },
  ];

  // Fetch approved invoices and their inspection notes
  const fetchInvoicesAndInspectionNotes = async () => {
    try {
      setLoading(true);
      const invoiceResponse = await getAllInvoice(pageIndex + 1, pageSize);
      const approvedInvoices = invoiceResponse?.data.filter((invoice: Invoice) => invoice.status === 'Approved') || [];

      const inspectionResponse = await getAllInspectionNote(1, 1000, { invoiceNumber: '' });
      const allInspectionNotes = inspectionResponse?.data || [];

      const invoicesWithInspectionNotes = approvedInvoices.map((invoice: Invoice) => {
        const notes = allInspectionNotes.filter((note: InspectionNote) => note.invoiceNumber === invoice.invoiceNumber);
        return {
          ...invoice,
          inspectionNotes: notes,
        };
      });

      setInvoices(invoicesWithInspectionNotes);

      const inspectionNotesMap = invoicesWithInspectionNotes.reduce(
        (acc: { [invoiceId: string]: InspectionNote[] }, invoice: Invoice & { inspectionNotes?: InspectionNote[] }) => {
          acc[invoice.id] = invoice.inspectionNotes || [];
          return acc;
        },
        {} as { [invoiceId: string]: InspectionNote[] }
      );
      setInspectionNotes(inspectionNotesMap);
    } catch (error) {
      toast('Failed to fetch data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectionNotes = async (invoiceId: string) => {
    try {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      const response = await getAllInspectionNote(1, 100, { invoiceNumber: invoice?.invoiceNumber || '' });
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
      // toast(`Failed to fetch inspection notes for invoice ${invoiceId}`, { type: 'error' });
    }
  };

  useEffect(() => {
    fetchInvoicesAndInspectionNotes();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = invoices;
    if (selectedStatusFilter !== 'All') {
      filtered = invoices.filter((invoice) =>
        invoice.inspectionNotes?.some((note) => note.status === selectedStatusFilter)
      );
    }
    setFilteredInvoices(filtered);
  }, [invoices, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchInvoicesAndInspectionNotes();
      router.replace('/inspectionnote');
    }
  }, [searchParams, router]);

  useEffect(() => {
    selectedInvoiceIds.forEach((invoiceId) => {
      if (!inspectionNotes[invoiceId]) {
        fetchInspectionNotes(invoiceId);
      }
    });
  }, [selectedInvoiceIds, inspectionNotes]);

  const handleDelete = async () => {
    try {
      await deleteInvoice(deleteId);
      setOpenDelete(false);
      toast('Invoice Deleted Successfully', { type: 'success' });
      fetchInvoicesAndInspectionNotes();
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
      fetchInspectionNotes(invoice.id);
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
        const selectedInvoices = invoices.filter((inv) => newSelectedIds.includes(inv.id));
        const statuses = selectedInvoices
          .flatMap((inv) => inv.inspectionNotes?.map((note) => note.status || 'Pending') || [])
          .filter((status, index, self) => self.indexOf(status) === index);
        const allSameStatus = statuses.length === 1 ? statuses[0] : null;
        setSelectedBulkStatus(allSameStatus);
      }
      return newSelectedIds;
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
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
      setPageIndex(0);
      toast('Inspection Note Status Updated Successfully', { type: 'success' });
      await fetchInvoicesAndInspectionNotes();
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
        'Seller': invoice.seller || '-',
        'Buyer': invoice.buyer || '-',
        'Status': invoice.status || 'Approved',
        'Remarks': invoice.invoiceremarks || '-',
        'IRN Number': invoice.inspectionNotes?.[0]?.irnNumber || '-',
        'IRN Date': invoice.inspectionNotes?.[0]?.irnDate || '-',
        'Contract Number': '',
        'Quantity': '',
        'Dispatch Quantity': '',
        'B Grade': '',
        'S.L': '',
        'Shrinkage': '',
        'Return Fabric': '',
        'A Grade': '',
        'Inspected By': '',
      };

      const inspectionNoteRows = (inspectionNotes[invoice.id] || []).flatMap((inspection) => [
        {
          'Invoice Number': '',
          'Invoice Date': '',
          'Seller': '',
          'Buyer': '',
          'Status': '',
          'Remarks': '',
          'IRN Number': inspection.irnNumber || '-',
          'IRN Date': inspection.irnDate || '-',
          'Contract Number': `Inspection Note: ${inspection.irnNumber}`,
          'Quantity': '',
          'Dispatch Quantity': '',
          'B Grade': '',
          'S.L': '',
          'Shrinkage': '',
          'Return Fabric': '',
          'A Grade': '',
          'Inspected By': '',
        },
        ...(inspection.relatedContracts?.map((contract) => ({
          'Invoice Number': '',
          'Invoice Date': '',
          'Seller': '',
          'Buyer': '',
          'Status': '',
          'Remarks': '',
          'IRN Number': '',
          'IRN Date': '',
          'Contract Number': contract.contractNumber || '-',
          'Quantity': contract.quantity || '-',
          'Dispatch Quantity': contract.dispatchQuantity || '-',
          'B Grade': contract.bGrade || '-',
          'S.L': contract.sl || '-',
          'Shrinkage': contract.shrinkage || '-',
          'Return Fabric': contract.returnFabric || '-',
          'A Grade': contract.aGrade || '-',
          'Inspected By': contract.inspectedBy || '-',
        })) || []),
      ]);

      return [invoiceData, ...inspectionNoteRows];
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ApprovedInvoices');
    XLSX.writeFile(workbook, 'ApprovedInvoices.xlsx');
  };

  return (
    <div className="container bg-white rounded-md p-6 h-[110vh]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2">Filter by Inspection Status:</label>
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
          link=""
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
      {selectedInvoiceIds.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[#06b6d4]">Selected Invoices and Inspection Notes</h3>
          {selectedInvoiceIds.map((invoiceId) => {
            const invoice = invoices.find((inv) => inv.id === invoiceId);
            const notes = inspectionNotes[invoiceId] || [];
            return (
              <div key={invoiceId} className="mt-4">
                <h4 className="text-md font-medium">Invoice: {invoice?.invoiceNumber || '-'}</h4>
                <table className="w-full text-left border-collapse text-sm md:text-base mt-2">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-3">Related Contract</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">
                        {notes.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-200">
                                <th className="p-2">IRN Number</th>
                                <th className="p-2">IRN Date</th>
                                <th className="p-2">Contract #</th>
                                <th className="p-2">Quantity</th>
                                <th className="p-2">Dispatch Qty</th>
                                <th className="p-2">B Grade</th>
                                <th className="p-2">S.L</th>
                                <th className="p-2">Shrinkage</th>
                                <th className="p-2">Return Fabric</th>
                                <th className="p-2">A Grade</th>
                                <th className="p-2">Inspected By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {notes.map((inspection) => (
                                <tr key={inspection.id} className="border-b">
                                  <td className="p-2">{inspection.irnNumber || '-'}</td>
                                  <td className="p-2">{inspection.irnDate || '-'}</td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.contractNumber).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.quantity).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.dispatchQuantity).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.bGrade).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.sl).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.shrinkage).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.returnFabric).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.aGrade).join(', ') || '-'}
                                  </td>
                                  <td className="p-2">
                                    {inspection.relatedContracts?.map((c) => c.inspectedBy).join(', ') || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          'No inspection notes'
                        )}
                      </td>
                      
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
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
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#06b6d4]">Invoice Details</h2>
              <button onClick={handleViewClose} className="text-2xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber || '-'}</div>
                <div><strong>Invoice Date:</strong> {selectedInvoice.invoiceDate || '-'}</div>
                <div><strong>Seller:</strong> {selectedInvoice.seller || '-'}</div>
                <div><strong>Buyer:</strong> {selectedInvoice.buyer || '-'}</div>
                <div>
                  <strong>Status:</strong>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
                      selectedInvoice.status || 'Approved'
                    )}`}
                  >
                    {selectedInvoice.status || 'Approved'}
                  </span>
                </div>
                <div className="col-span-2">
                  <strong>Remarks:</strong> {selectedInvoice.invoiceremarks || '-'}
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <h3 className="text-lg font-semibold">Inspection Notes</h3>
                {inspectionNotes[selectedInvoice.id]?.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3">IRN Number</th>
                        <th className="p-3">IRN Date</th>
                        <th className="p-3">Contract #</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Dispatch Qty</th>
                        <th className="p-3">B Grade</th>
                        <th className="p-3">S.L</th>
                        <th className="p-3">Shrinkage</th>
                        <th className="p-3">Return Fabric</th>
                        <th className="p-3">A Grade</th>
                        <th className="p-3">Inspected By</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectionNotes[selectedInvoice.id]?.map((inspection) => (
                        <tr key={inspection.id} className="border-b">
                          <td className="p-3">{inspection.irnNumber || '-'}</td>
                          <td className="p-3">{inspection.irnDate || '-'}</td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.contractNumber).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.quantity).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.dispatchQuantity).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.bGrade).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.sl).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.shrinkage).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.returnFabric).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.aGrade).join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            {inspection.relatedContracts?.map((c) => c.inspectedBy).join(', ') || '-'}
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
                                    fetchInspectionNotes(selectedInvoice.id);
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
            <Link href={`/inspectionnote/create?invoiceId=${selectedInvoice.id}`}>
              <Button className="mt-4 bg-[#06b6d4] hover:bg-[#0891b2] text-white">
                Create Inspection Note
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionNoteList;