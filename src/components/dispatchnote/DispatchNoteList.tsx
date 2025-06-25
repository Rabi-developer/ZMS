'use client';
import React from 'react';
import { toast } from 'react-toastify';
import { columns, DispatchNote } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllDispatchNotes, deleteDispatchNote , updateDispatchNoteStatus } from '@/apis/dispatchnote';
import { MdLocalShipping } from 'react-icons/md';
import DispatchPDFExport from './DispatchPDFExport'; // Import the PDF export module
import { FiDownload } from 'react-icons/fi'; // Optional: Icon for the button
import { FaCheck, FaFileExcel } from 'react-icons/fa';


const DispatchNoteList = () => {
  const [dispatchNotes, setDispatchNotes] = React.useState<DispatchNote[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [selectedDispatchNote, setSelectedDispatchNote] = React.useState<DispatchNote | null>(null);
  const [selectedDispatchNoteIds, setSelectedDispatchNoteIds] = React.useState<string[]>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [filteredInvoices, setFilteredInvoices] = React.useState<DispatchNote[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>('All');
  const [selectedBulkStatus, setSelectedBulkStatus] = React.useState<string | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = React.useState<string[]>([]);
  const [updating, setUpdating] = React.useState(false);
  
    
  // Status options aligned with getStatusStyles
  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'Closed', 'UnApproved'];

  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#eab308' },
    { id: 2, name: 'Approved', color: '#22c55e' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Closed', color: '#3b82f6' },
    { id: 5, name: 'UnApproved', color: '#8b5cf6' },
  ];

  const fetchDispatchNotes = async () => {
    try {
      setLoading(true);
      const response = await getAllDispatchNotes(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setDispatchNotes(response.data);
      console.log('Fetched dispatch notes:', response.data);
    } catch (error) {
      console.error('Error fetching dispatch notes:', error);
      toast('Failed to fetch dispatch notes', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDispatchNotes();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteDispatchNote(deleteId);
      setOpenDelete(false);
      toast('Dispatch Note Deleted Successfully', { type: 'success' });
      fetchDispatchNotes();
    } catch (error) {
      console.error('Failed to delete dispatch note:', error);
      toast('Failed to delete dispatch note', { type: 'error' });
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

  const handleViewOpen = (dispatchNoteId: string) => {
    const dispatchNote = dispatchNotes.find((item) => item.id === dispatchNoteId);
    setSelectedDispatchNote(dispatchNote || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedDispatchNote(null);
  };

  const handleDispatchNoteCheckboxChange = (dispatchNoteId: string, checked: boolean) => {
    setSelectedDispatchNoteIds((prev) =>
      checked ? [...prev, dispatchNoteId] : prev.filter((id) => id !== dispatchNoteId)
    );
  };
  
  
  const handleCheckboxChange = (invoiceId: string, checked: boolean) => {
    setSelectedInvoiceIds((prev) => {
      const newSelectedIds = checked
        ? [...prev, invoiceId]
        : prev.filter((id) => id !== invoiceId);

      if (newSelectedIds.length === 0) {
        setSelectedBulkStatus(null);
      } else if (newSelectedIds.length === 1) {
        const selectedInvoice = dispatchNotes.find((inv) => inv.id === newSelectedIds[0]);
        setSelectedBulkStatus(selectedInvoice?.status || 'Pending');
      } else {
        const selectedInvoices = dispatchNotes.filter((inv) => newSelectedIds.includes(inv.id));
        const statuses = selectedInvoices.map((inv) => inv.status || 'Pending');
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
          updateDispatchNoteStatus({ id, status: newStatus })
        );
        await Promise.all(updatePromises);
        setSelectedBulkStatus(newStatus);
        setSelectedInvoiceIds([]);
        setSelectedStatusFilter(newStatus);
        toast('Invoices Status Updated Successfully', { type: 'success' });
        await fetchDispatchNotes();
      } catch (error: any) {
        toast(`Failed to update invoice status: ${error.message || 'Unknown error'}`, { type: 'error' });
      } finally {
        setUpdating(false);
      }
    };
  // Handle PDF download for selected dispatch notes
  const handleDownloadPDF = async () => {
    if (selectedDispatchNoteIds.length === 0) {
      toast('No dispatch notes selected', { type: 'warning' });
      return;
    }

    try {
      for (const id of selectedDispatchNoteIds) {
        const dispatchNote = dispatchNotes.find((dn) => dn.id === id);
        if (dispatchNote) {
          // Ensure 'destination' is always a string
          const safeDispatchNote = {
            ...dispatchNote,
            destination: dispatchNote.destination ?? '',
          };
          await DispatchPDFExport.exportToPDF({
            dispatchNote: safeDispatchNote,
            sellerSignature: undefined, // Add actual signature if available
            buyerSignature: undefined, // Add actual signature if available
            zmsSignature: undefined, // Add actual signature if available
            sellerAddress: undefined, // Will be fetched in exportToPDF
            buyerAddress: undefined, // Will be fetched in exportToPDF
          });
        }
      }
      toast('PDFs generated successfully', { type: 'success' });
    } catch (error) {
      console.error('Error generating PDFs:', error);
      toast('Failed to generate PDFs', { type: 'error' });
    }
  };

  // Define all columns for related contracts
  const relatedContractColumns = [
    { header: 'Contract #', accessor: 'contractNumber' },
    //{ header: 'Seller', accessor: 'seller' },
  //  { header: 'Buyer#', accessor: 'buyerRefer' },
    { header: 'Width/Color', accessor: 'widthOrColor' },
    { header: 'Buyer Refer', accessor: 'buyerRefer' },
    { header: 'Fabric Details', accessor: 'fabricDetails' },
    { header: 'Date', accessor: 'date' },
    { header: 'Base', accessor: 'base' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Dispatch Quantity', accessor: 'totalDispatchQuantity' },
    { header: 'Total Dispatch Quantity', accessor: 'totalDispatchQuantity' },
    { header: 'Balance Quantity', accessor: 'balanceQuantity' },
    { header: 'Contract Type', accessor: 'contractType' },
  ];

  return (
    <div className="container bg-white rounded-md p-6">
      {/* Download PDF Button */}
      <div className='flex flex-wrap gap-5 '>
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

           {selectedDispatchNoteIds.length > 0 && (
        <div className="">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-4 py-2 bg-[#06b6d4] text-white rounded-md hover:bg-cyan-700 transition-colors duration-200"
            disabled={loading}
          >
            <FiDownload className="mr-2" />
            Download PDF{selectedDispatchNoteIds.length > 1 ? 's' : ''} ({selectedDispatchNoteIds.length})
          </button>
        </div>
      )}
      </div>
     

      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen, handleDispatchNoteCheckboxChange)}
        data={dispatchNotes}
        loading={loading}
        link={'/dispatchnote/create'}
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
      {selectedDispatchNoteIds.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl text-[#06b6d4] font-bold">Related Contracts for Selected Dispatch Notes</h2>
          <div className="border rounded p-4 mt-2">
            {selectedDispatchNoteIds.map((id) => {
              const dispatchNote = dispatchNotes.find((dn) => dn.id === id);
              if (!dispatchNote || !dispatchNote.relatedContracts?.length) {
                return (
                  <p key={id} className="text-gray-500">
                    No related contracts found for Dispatch Note {dispatchNote?.bilty || id}.
                  </p>
                );
              }
              return (
                <div key={id} className="mb-4">
                  <h3 className="text-lg font-semibold">Dispatch Note: {dispatchNote.bilty}</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] font-extrabold text-white">
                        {relatedContractColumns.map((col) => (
                          <th key={col.accessor} className="p-3 font-bold uppercase">{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchNote.relatedContracts.map((contract) => (
                        <tr key={contract.id} className="border-b hover:bg-gray-100">
                          {relatedContractColumns.map((col) => (
                            <td key={col.accessor} className="p-3 font-bold">
                              {contract[col.accessor as keyof typeof contract] || '-'}
                            </td>
                          ))}
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

      {openView && selectedDispatchNote && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ">
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Dispatch Note Details
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={handleViewClose}
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      ID
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.listid || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Date
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.date}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Bilty Number
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.bilty}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Seller
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.seller}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Buyer
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.buyer}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Contract Number
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.contractNumber}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Driver Name
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.driverName}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Vehicle Type
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.vehicleType || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Vehicle
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.vehicle || '-'}
                    </div>
                  </div>
                  <div className="group col-span-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Remarks
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedDispatchNote.remarks || '-'}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h2 className="text-xl text-[#06b6d4] font-bold">Related Contracts</h2>
                  <div className="border rounded p-4 mt-2 overflow-x-auto">
                    {selectedDispatchNote.relatedContracts && selectedDispatchNote.relatedContracts.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#06b6d4] font-bold text-white">
                            {relatedContractColumns.map((col) => (
                              <th key={col.accessor} className="p-3 font-extrabold font-medium">{col.header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDispatchNote.relatedContracts.map((contract) => (
                            <tr key={contract.id} className="border-b hover:bg-gray-100">
                              {relatedContractColumns.map((col) => (
                                <td key={col.accessor} className="p-3">
                                  {contract[col.accessor as keyof typeof contract] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500">No related contracts found.</p>
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

export default DispatchNoteList;