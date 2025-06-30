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
  const [fetchingNotes, setFetchingNotes] = useState<{ [invoiceId: string]: boolean }>({});

  const statusOptions = ['All', 'Approved Inspection', 'UnApproved Inspection', 'Active'];
  const statusOptionsConfig = [
    { id: 1, name: 'Approved Inspection', color: '#3b82f6' },
    { id: 2, name: 'UnApproved Inspection', color: '#5673ba' },
    { id: 3, name: 'Active', color: '#869719' },
  ];

  // Fetch approved invoices and their inspection notes with related contracts
  const fetchInvoicesAndInspectionNotes = async () => {
    try {
      setLoading(true);
      const invoiceResponse = await getAllInvoice(pageIndex + 1, pageSize);
      const approvedInvoices = invoiceResponse?.data.filter((invoice: Invoice) => invoice.status === 'Approved') || [];

      // Clear existing inspection notes to prevent data bleeding
      setInspectionNotes({});

      const inspectionResponse = await getAllInspectionNote(1, 1000, { invoiceNumber: '' });
      const allInspectionNotes = inspectionResponse?.data || [];

      // Map invoices with their inspection notes and related contracts
      const invoicesWithInspectionNotes = approvedInvoices.map((invoice: Invoice) => {
        // Filter notes to only include those that match the specific invoice number exactly
        const notes = allInspectionNotes.filter((note: InspectionNote) => 
          note.invoiceNumber === invoice.invoiceNumber
        );
        return {
          ...invoice,
          inspectionNotes: notes.length > 0 ? notes.map((note: InspectionNote) => ({
            ...note,
            relatedContracts: note.relatedContracts || [], // Ensure relatedContracts is always an array
          })) : [],
        };
      });

      setInvoices(invoicesWithInspectionNotes);

      // Create inspectionNotes map with fresh data, ensuring each invoice only has its own notes
      const inspectionNotesMap: { [invoiceId: string]: InspectionNote[] } = {};
      invoicesWithInspectionNotes.forEach((invoice: Invoice & { inspectionNotes?: InspectionNote[] }) => {
        // Only add notes that belong to this specific invoice
        const invoiceSpecificNotes = (invoice.inspectionNotes || []).filter((note: InspectionNote) => 
          note.invoiceNumber === invoice.invoiceNumber
        );
        inspectionNotesMap[invoice.id] = invoiceSpecificNotes;
      });
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
      if (!invoice) {
        console.warn(`Invoice not found for ID: ${invoiceId}`);
        return;
      }
      
      // Set loading state for this specific invoice
      setFetchingNotes((prev) => ({ ...prev, [invoiceId]: true }));
      
      console.log(`Fetching inspection notes for invoice: ${invoice.invoiceNumber}`);
      const response = await getAllInspectionNote(1, 100, { invoiceNumber: invoice.invoiceNumber || '' });
      
      // Filter notes to only include those that match the specific invoice number
      const notes = response?.data
        .filter((note: InspectionNote) => note.invoiceNumber === invoice.invoiceNumber)
        .map((note: InspectionNote) => ({
          ...note,
          relatedContracts: note.relatedContracts || [],
        })) || [];
      
      console.log(`Found ${notes.length} inspection notes for invoice ${invoice.invoiceNumber}:`, notes);
      
      // Update inspection notes state with only this invoice's notes
      setInspectionNotes((prev) => ({
        ...prev,
        [invoiceId]: notes,
      }));
      
      // Update invoices state to keep it in sync
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, inspectionNotes: notes } : inv
        )
      );
    } catch (error) {
      console.error(`Failed to fetch inspection notes for invoice ${invoiceId}:`, error);
    } finally {
      // Clear loading state for this specific invoice
      setFetchingNotes((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  useEffect(() => {
    fetchInvoicesAndInspectionNotes();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = invoices;
    if (selectedStatusFilter !== 'All') {
      filtered = invoices.filter((invoice) =>
        invoice.inspectionNotes?.some((note) => note.status === selectedStatusFilter) ||
        (selectedStatusFilter === 'UnApproved Inspection' && invoice.inspectionNotes?.length === 0)
      );
    }
    setFilteredInvoices(filtered);
  }, [invoices, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchInvoicesAndInspectionNotes();
      // Clear the refresh parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  useEffect(() => {
    // This effect will run when selectedInvoiceIds changes
    // But we don't need to fetch here since we're doing it in handleCheckboxChange
    console.log('Selected invoice IDs changed:', selectedInvoiceIds);
  }, [selectedInvoiceIds]);

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

  const handleCheckboxChange = async (invoiceId: string, checked: boolean) => {
    console.log(`Checkbox changed for invoice ${invoiceId}: ${checked}`);
    
    if (checked) {
      // Add to selected invoices
      setSelectedInvoiceIds((prev) => {
        if (prev.includes(invoiceId)) {
          console.log(`Invoice ${invoiceId} already selected`);
          return prev;
        }
        console.log(`Adding invoice ${invoiceId} to selection`);
        return [...prev, invoiceId];
      });
      
      // Immediately fetch inspection notes for the selected invoice
      console.log(`Fetching inspection notes for selected invoice ${invoiceId}`);
      try {
        await fetchInspectionNotes(invoiceId);
        console.log(`Successfully fetched inspection notes for invoice ${invoiceId}`);
      } catch (error) {
        console.error(`Error fetching inspection notes for invoice ${invoiceId}:`, error);
      }
    } else {
      console.log(`Removing invoice ${invoiceId} from selection`);
      // Remove from selected invoices
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
      
      // Clear inspection notes for unselected invoice
      setInspectionNotes((prevNotes) => {
        const updatedNotes = { ...prevNotes };
        delete updatedNotes[invoiceId];
        console.log(`Cleared inspection notes for invoice ${invoiceId}`);
        return updatedNotes;
      });
    }
    
    // Update bulk status based on current selection
    setTimeout(() => {
      setSelectedInvoiceIds((currentIds) => {
        console.log('Current selected IDs:', currentIds);
        if (currentIds.length === 0) {
          setSelectedBulkStatus(null);
        } else {
          const selectedInvoices = invoices.filter((inv) => currentIds.includes(inv.id));
          const statuses = selectedInvoices
            .flatMap((inv) => inv.inspectionNotes?.map((note) => note.status || 'Pending') || [])
            .filter((status, index, self) => self.indexOf(status) === index);
          const allSameStatus = statuses.length === 1 ? statuses[0] : null;
          setSelectedBulkStatus(allSameStatus);
        }
        return currentIds;
      });
    }, 100);
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
      // Force a complete refresh to get the latest data
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
      const notes = inspectionNotes[invoice.id] || [];
      
      if (notes.length === 0) {
        // Invoice without inspection notes
        return [{
          'Invoice Number': invoice.invoiceNumber || '-',
          'Invoice Date': invoice.invoiceDate || '-',
          'Seller': invoice.seller || '-',
          'Buyer': invoice.buyer || '-',
          'Status': invoice.status || 'Approved',
          'Remarks': invoice.invoiceremarks || '-',
          'IRN Number': '-',
          'IRN Date': '-',
          'Inspection Status': 'No Inspection Notes',
          'Contract Number': '-',
          'Quantity': '-',
          'Dispatch Quantity': '-',
          'B Grade': '-',
          'S.L': '-',
          'Shrinkage': '-',
          'Return Fabric': '-',
          'A Grade': '-',
          'Inspected By': '-',
        }];
      }

      return notes.flatMap((inspection) => {
        const baseRow = {
          'Invoice Number': invoice.invoiceNumber || '-',
          'Invoice Date': invoice.invoiceDate || '-',
          'Seller': invoice.seller || '-',
          'Buyer': invoice.buyer || '-',
          'Status': invoice.status || 'Approved',
          'Remarks': invoice.invoiceremarks || '-',
          'IRN Number': inspection.irnNumber || '-',
          'IRN Date': inspection.irnDate || '-',
          'Inspection Status': inspection.status || 'Pending',
        };

        if (!inspection.relatedContracts || inspection.relatedContracts.length === 0) {
          return [{
            ...baseRow,
            'Contract Number': '-',
            'Quantity': '-',
            'Dispatch Quantity': '-',
            'B Grade': '-',
            'S.L': '-',
            'Shrinkage': '-',
            'Return Fabric': '-',
            'A Grade': '-',
            'Inspected By': '-',
          }];
        }

        return inspection.relatedContracts.map((contract) => ({
          ...baseRow,
          'Contract Number': contract.contractNumber || '-',
          'Quantity': contract.quantity || '-',
          'Dispatch Quantity': contract.dispatchQuantity || '-',
          'B Grade': contract.bGrade || '-',
          'S.L': contract.sl || '-',
          'Shrinkage': contract.shrinkage || '-',
          'Return Fabric': contract.returnFabric || '-',
          'A Grade': contract.aGrade || '-',
          'Inspected By': contract.inspectedBy || '-',
        }));
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ApprovedInvoices');
    XLSX.writeFile(workbook, 'ApprovedInvoices.xlsx');
  };

  return (
    <div className="container bg-white rounded-md p-6 h-[110vh]">
      <div className="mb-4 flex items-center justify-between">          <div className="flex items-center gap-4 flex-wrap">
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
            <button
              onClick={() => {
                console.log('Force refreshing data...');
                fetchInvoicesAndInspectionNotes();
              }}
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
          columns={columns(handleDeleteOpen, handleViewOpen, (invoiceId, checked) => {
            handleCheckboxChange(invoiceId, checked);
          })}
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
            // Only get notes that belong to this specific invoice
            const notes = inspectionNotes[invoiceId] || [];
            const invoiceSpecificNotes = notes.filter((note) => 
              note.invoiceNumber === invoice?.invoiceNumber
            );
            
            return (
              <div key={invoiceId} className="mt-4">
                <h4 className="text-md font-medium">Invoice: {invoice?.invoiceNumber || '-'}</h4>
                <table className="w-full text-left border-collapse text-sm md:text-base mt-2">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-3">IRN Number</th>
                      <th className="p-3">IRN Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Contract #</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Dispatch Qty</th>
                      <th className="p-3">B Grade</th>
                      <th className="p-3">S.L</th>
                      <th className="p-3">Shrinkage</th>
                      <th className="p-3">Return Fabric</th>
                      <th className="p-3">A Grade</th>
                      <th className="p-3">Inspected By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetchingNotes[invoiceId] ? (
                      <tr>
                        <td colSpan={12} className="p-3 text-center text-gray-500">
                          Loading inspection notes...
                        </td>
                      </tr>
                    ) : invoiceSpecificNotes.length > 0 ? (
                      invoiceSpecificNotes.flatMap((inspection) => 
                        inspection.relatedContracts && inspection.relatedContracts.length > 0 
                          ? inspection.relatedContracts.map((contract, contractIndex) => (
                              <tr key={`${inspection.id}-${contractIndex}`} className="border-b">
                                {contractIndex === 0 && (
                                  <>
                                    <td className="p-3" rowSpan={inspection.relatedContracts?.length || 1}>
                                      {inspection.irnNumber || '-'}
                                    </td>
                                    <td className="p-3" rowSpan={inspection.relatedContracts?.length || 1}>
                                      {inspection.irnDate || '-'}
                                    </td>
                                    <td className="p-3" rowSpan={inspection.relatedContracts?.length || 1}>
                                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(inspection.status || 'Pending')}`}>
                                        {inspection.status || 'Pending'}
                                      </span>
                                    </td>
                                  </>
                                )}
                                <td className="p-3">{contract.contractNumber || '-'}</td>
                                <td className="p-3">{contract.quantity || '-'}</td>
                                <td className="p-3">{contract.dispatchQuantity || '-'}</td>
                                <td className="p-3">{contract.bGrade || '-'}</td>
                                <td className="p-3">{contract.sl || '-'}</td>
                                <td className="p-3">{contract.shrinkage || '-'}</td>
                                <td className="p-3">{contract.returnFabric || '-'}</td>
                                <td className="p-3">{contract.aGrade || '-'}</td>
                                <td className="p-3">{contract.inspectedBy || '-'}</td>
                              </tr>
                            ))
                          : [
                              <tr key={inspection.id} className="border-b">
                                <td className="p-3">{inspection.irnNumber || '-'}</td>
                                <td className="p-3">{inspection.irnDate || '-'}</td>
                                <td className="p-3">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(inspection.status || 'Pending')}`}>
                                    {inspection.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="p-3" colSpan={9}>No contract details available</td>
                              </tr>
                            ]
                      )
                    ) : (
                      <tr>
                        <td colSpan={12} className="p-3 text-gray-500">No inspection notes for this invoice</td>
                      </tr>
                    )}
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
                {(() => {
                  const invoiceSpecificNotes = (inspectionNotes[selectedInvoice.id] || [])
                    .filter((note) => note.invoiceNumber === selectedInvoice.invoiceNumber);
                  
                  return invoiceSpecificNotes.length > 0 ? (
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
                        {invoiceSpecificNotes.map((inspection) => 
                          inspection.relatedContracts && inspection.relatedContracts.length > 0 
                            ? inspection.relatedContracts.map((contract, contractIndex) => (
                                <tr key={`${inspection.id}-${contractIndex}`} className="border-b">
                                  {contractIndex === 0 && (
                                    <>
                                      <td className="p-3" rowSpan={inspection.relatedContracts?.length || 1}>
                                        {inspection.irnNumber || '-'}
                                      </td>
                                      <td className="p-3" rowSpan={inspection.relatedContracts?.length || 1}>
                                        {inspection.irnDate || '-'}
                                      </td>
                                    </>
                                  )}
                                  <td className="p-3">{contract.contractNumber || '-'}</td>
                                  <td className="p-3">{contract.quantity || '-'}</td>
                                  <td className="p-3">{contract.dispatchQuantity || '-'}</td>
                                  <td className="p-3">{contract.bGrade || '-'}</td>
                                  <td className="p-3">{contract.sl || '-'}</td>
                                  <td className="p-3">{contract.shrinkage || '-'}</td>
                                  <td className="p-3">{contract.returnFabric || '-'}</td>
                                  <td className="p-3">{contract.aGrade || '-'}</td>
                                  <td className="p-3">{contract.inspectedBy || '-'}</td>
                                  {contractIndex === 0 && (
                                    <td className="p-3" rowSpan={inspection.relatedContracts?.length || 1}>
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
                                  )}
                                </tr>
                              ))
                            : [
                                <tr key={inspection.id} className="border-b">
                                  <td className="p-3">{inspection.irnNumber || '-'}</td>
                                  <td className="p-3">{inspection.irnDate || '-'}</td>
                                  <td className="p-3" colSpan={9}>No contract details available</td>
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
                              ]
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500">No inspection notes found for this invoice.</p>
                  );
                })()}
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