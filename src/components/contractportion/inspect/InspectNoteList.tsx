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
import { getAllDispatchNotes, deleteDispatchNote, updateDispatchNoteStatus } from '@/apis/dispatchnote';
import { deleteInspectionNote, getAllInspectionNote, updateInspectionNoteStatus } from '@/apis/inspectnote';
import { columns, getStatusStyles, DispatchNote } from './columns';
import { Edit, Trash } from 'lucide-react';

interface InspectionNote {
  id: string;
  irnNumber: string;
  irnDate: string;
  seller: string;
  buyer: string;
  dispatchNoteId: string;
  status?: string;
  remarks?: string;
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    quantity?: string;
    dispatchQuantity?: string;
    bGrade?: string;
    sl?: string;
    shrinkage: string;
    returnFabric: string;
    aGrade?: string;
    inspectedBy?: string;
  }[];
}

const InspectionNoteList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dispatchNotes, setDispatchNotes] = useState<DispatchNote[]>([]);
  const [filteredDispatchNotes, setFilteredDispatchNotes] = useState<DispatchNote[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState<{ [dispatchNoteId: string]: InspectionNote[] }>({});
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [selectedDispatchNote, setSelectedDispatchNote] = useState<DispatchNote | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedDispatchNoteIds, setSelectedDispatchNoteIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Define status options and their styles
  const statusOptions = ['All', 'Approved Inspection', 'UnApproved Inspection', 'Active'];
  const statusOptionsConfig = [
    { id: 1, name: 'Approved Inspection', color: '#3b82f6' },
    { id: 2, name: 'UnApproved Inspection', color: '#5673ba' },
    { id: 3, name: 'Active', color: '#869719' },
  ];

  // Fetch dispatch notes and attach inspection notes
  const fetchDispatchNotes = async () => {
    try {
      setLoading(true);
      const response = await getAllDispatchNotes(pageIndex + 1, pageSize);
      const dispatchNotes = response?.data || [];
      // Fetch all inspection notes in one go
      const allInspectionNotesRes = await getAllInspectionNote(1, 1000, { invoiceNumber: '' });
      const allInspectionNotes = allInspectionNotesRes?.data || [];
      // Attach inspection notes to the correct dispatch note by matching dispatchNoteId
      const dispatchNotesWithInspectionNotes = dispatchNotes.map((dispatchNote: DispatchNote) => {
        const notes = allInspectionNotes.filter((note: InspectionNote) => note.dispatchNoteId === dispatchNote.id);
        return {
          ...dispatchNote,
          inspectionNotes: notes,
        };
      });
      setDispatchNotes(dispatchNotesWithInspectionNotes);
      // Update inspectionNotes state for all dispatch notes
      const updatedInspectionNotes: { [dispatchNoteId: string]: InspectionNote[] } = {};
      dispatchNotesWithInspectionNotes.forEach((dispatchNote) => {
        updatedInspectionNotes[dispatchNote.id] = dispatchNote.inspectionNotes || [];
      });
      setInspectionNotes(updatedInspectionNotes);
    } catch (error) {
      toast('Failed to fetch dispatch notes', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectionNotes = async (dispatchNoteId: string) => {
    try {
      const response = await getAllInspectionNote(1, 100, { invoiceNumber: dispatchNoteId });
      const notes = response?.data || [];
      setInspectionNotes((prev) => ({
        ...prev,
        [dispatchNoteId]: notes,
      }));
      setDispatchNotes((prev) =>
        prev.map((dn) =>
          dn.id === dispatchNoteId ? { ...dn, inspectionNotes: notes } : dn
        )
      );
    } catch (error) {
      toast(`Failed to fetch inspection notes for dispatch note ${dispatchNoteId}`, { type: 'error' });
    }
  };

  useEffect(() => {
    fetchDispatchNotes();
  }, [pageIndex, pageSize]);

  // Filter dispatch notes based on status
  useEffect(() => {
    let filtered = dispatchNotes.filter((dispatchNote) => dispatchNote.status === 'Approved');
    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter((dispatchNote) =>
        dispatchNote.inspectionNotes?.some((note) => note.status === selectedStatusFilter)
      );
    }
    setFilteredDispatchNotes(filtered);
  }, [dispatchNotes, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchDispatchNotes();
      router.replace('/inspectionnote');
    }
  }, [searchParams, router]);

  // Fetch inspection notes for selected dispatch notes
  useEffect(() => {
    selectedDispatchNoteIds.forEach((dispatchNoteId) => {
      if (!inspectionNotes[dispatchNoteId]) {
        fetchInspectionNotes(dispatchNoteId);
      }
    });
  }, [selectedDispatchNoteIds, inspectionNotes]);

  const handleDelete = async () => {
    try {
      await deleteDispatchNote(deleteId);
      setOpenDelete(false);
      toast('Dispatch Note Deleted Successfully', { type: 'success' });
      fetchDispatchNotes();
    } catch (error) {
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
    if (dispatchNote) {
      fetchInspectionNotes(dispatchNote.id);
    }
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedDispatchNote(null);
  };

  const handleCheckboxChange = (dispatchNoteId: string, checked: boolean) => {
    setSelectedDispatchNoteIds((prev) => {
      let newSelectedIds: string[];
      if (checked) {
        newSelectedIds = prev.includes(dispatchNoteId) ? prev : [...prev, dispatchNoteId];
      } else {
        newSelectedIds = prev.filter((id) => id !== dispatchNoteId);
      }
      // Set default status to 'Active' when a checkbox is clicked
      if (newSelectedIds.length > 0 && !selectedBulkStatus) {
        setSelectedBulkStatus('Active');
      } else if (newSelectedIds.length === 0) {
        setSelectedBulkStatus(null);
        setSelectedStatusFilter('All');
      }
      return newSelectedIds;
    });
    // Ensure inspection notes are fetched for the dispatch note
    if (checked && !inspectionNotes[dispatchNoteId]) {
      fetchInspectionNotes(dispatchNoteId);
    }
  };

  // Bulk status update using inspection note IDs
  const handleBulkStatusUpdate = async (newStatus: string) => {
    const selectedInspectionNoteIds = dispatchNotes
      .filter((dispatchNote) => selectedDispatchNoteIds.includes(dispatchNote.id))
      .flatMap((dispatchNote) => dispatchNote.inspectionNotes?.map((note) => note.id) || []);

    if (selectedInspectionNoteIds.length === 0) {
      toast('Please select at least one dispatch note with inspection notes', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedInspectionNoteIds.map((id) =>
        updateInspectionNoteStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedStatusFilter(newStatus);
      setSelectedDispatchNoteIds([]);
      setPageIndex(0);
      toast('Inspection Note Status Updated Successfully', { type: 'success' });
      await fetchDispatchNotes();
    } catch (error: any) {
      toast(`Failed to update inspection note status: ${error.message || 'Unknown error'}`, { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedDispatchNoteIds.length > 0
      ? filteredDispatchNotes.filter((dispatchNote) => selectedDispatchNoteIds.includes(dispatchNote.id))
      : filteredDispatchNotes;

    if (dataToExport.length === 0) {
      toast('No dispatch notes to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.flatMap((dispatchNote) => {
      const dispatchNoteData = {
        'Dispatch Note ID': dispatchNote.listid || '-',
        'Dispatch Date': dispatchNote.date || '-',
        'Bilty Number': dispatchNote.bilty || '-',
        'Seller': dispatchNote.seller || '-',
        'Buyer': dispatchNote.buyer || '-',
        'IRN Number': dispatchNote.inspectionNotes?.[0]?.irnNumber || '-',
        'IRN Date': dispatchNote.inspectionNotes?.[0]?.irnDate || '-',
        'Status': dispatchNote.status || '-',
        'Remarks': dispatchNote.remarks || '-',
        'Contract Number': '',
        'Vehicle Type': dispatchNote.vehicleType || '-',
        'Vehicle': dispatchNote.vehicle || '-',
        'Driver Name': dispatchNote.driverName || '-',
        'Destination': dispatchNote.destination || '-',
      };

      const contractRows = dispatchNote.relatedContracts?.map((contract) => ({
        'Dispatch Note ID': '',
        'Dispatch Date': '',
        'Bilty Number': '',
        'Seller': '',
        'Buyer': '',
        'IRN Number': '',
        'IRN Date': '',
        'Status': '',
        'Remarks': '',
        'Contract Number': contract.contractNumber || '-',
        'Vehicle Type': '',
        'Vehicle': '',
        'Driver Name': '',
        'Destination': '',
      })) || [];

      const inspectionNoteRows = (inspectionNotes[dispatchNote.id] || []).flatMap((inspection) => [
        {
          'Dispatch Note ID': '',
          'Dispatch Date': '',
          'Bilty Number': '',
          'Seller': '',
          'Buyer': '',
          'IRN Number': inspection.irnNumber || '-',
          'IRN Date': inspection.irnDate || '-',
          'Status': inspection.status || '-',
          'Remarks': inspection.remarks || '-',
          'Contract Number': `Inspection Note: ${inspection.irnNumber}`,
          'Vehicle Type': '',
          'Vehicle': '',
          'Driver Name': '',
          'Destination': '',
        },
        ...(inspection.relatedContracts?.map((contract) => ({
          'Dispatch Note ID': '',
          'Dispatch Date': '',
          'Bilty Number': '',
          'Seller': '',
          'Buyer': '',
          'IRN Number': '',
          'IRN Date': '',
          'Status': '',
          'Remarks': '',
          'Contract Number': contract.contractNumber || '-',
          'Vehicle Type': '',
          'Vehicle': '',
          'Driver Name': '',
          'Destination': '',
        })) || []),
      ]);

      return [dispatchNoteData, ...contractRows, ...inspectionNoteRows];
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DispatchNotes');
    XLSX.writeFile(workbook, 'ApprovedDispatchNotes.xlsx');
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
          data={filteredDispatchNotes}
          loading={loading}
          link={''}
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
      {/* Display inspection notes and related contracts for selected dispatch notes */}
      {selectedDispatchNoteIds.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[#06b6d4]">Selected Inspection Notes and Contracts</h3>
          {selectedDispatchNoteIds.map((dispatchNoteId) => {
            const dispatchNote = dispatchNotes.find((dn) => dn.id === dispatchNoteId);
            const notes = inspectionNotes[dispatchNoteId] || [];
            return (
              <div key={dispatchNoteId} className="mt-4">
                <h4 className="text-md font-medium">Dispatch Note: {dispatchNote?.listid || '-'}</h4>
                {notes.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm md:text-base mt-2 ml-5">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3">Related Contracts</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((inspection) => (
                        <tr key={inspection.id} className="">
                          <td className="p-3">
                            {inspection.relatedContracts && inspection.relatedContracts.length > 0 ? (
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-gray-200">
                                    <th className="p-2">Contract #</th>
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
                                  {inspection.relatedContracts.map((contract) => (
                                    <tr key={contract.id} className="border-b">
                                      <td className="p-2">{contract.contractNumber || '-'}</td>
                                      <td className="p-2">{contract.dispatchQuantity || '-'}</td>
                                      <td className="p-2">{contract.bGrade || '-'}</td>
                                      <td className="p-2">{contract.sl || '-'}</td>
                                      <td className="p-2">{contract.shrinkage || '-'}</td>
                                      <td className="p-2">{contract.returnFabric || '-'}</td>
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
                                    fetchInspectionNotes(dispatchNoteId);
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
                  <p className="text-gray-500 text-sm md:text-base">No inspection notes found for this dispatch note.</p>
                )}
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
      {openView && selectedDispatchNote && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#06b6d4]">Dispatch Note Details</h2>
              <button onClick={handleViewClose} className="text-2xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Dispatch Note ID:</strong> {selectedDispatchNote.listid || '-'}</div>
                <div><strong>Dispatch Date:</strong> {selectedDispatchNote.date || '-'}</div>
                <div><strong>Bilty Number:</strong> {selectedDispatchNote.bilty || '-'}</div>
                <div><strong>Seller:</strong> {selectedDispatchNote.seller || '-'}</div>
                <div><strong>Buyer:</strong> {selectedDispatchNote.buyer || '-'}</div>
                <div>
                  <strong>Status:</strong>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
                      selectedDispatchNote.status || 'Pending'
                    )}`}
                  >
                    {selectedDispatchNote.status || 'Pending'}
                  </span>
                </div>
                <div><strong>Vehicle Type:</strong> {selectedDispatchNote.vehicleType || '-'}</div>
                <div><strong>Driver Name:</strong> {selectedDispatchNote.driverName || '-'}</div>
                <div><strong>Destination:</strong> {selectedDispatchNote.destination || '-'}</div>
                <div className="col-span-2">
                  <strong>Vehicle</strong> {selectedDispatchNote.remarks || '-'}
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <h3 className="text-lg font-semibold">Related Contracts</h3>
                <table className="w-full text-left border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-3">Contract #</th>
                      <th className="p-3">Width/Color</th>
                      <th className="p-3">Buyer Refer</th>
                      <th className="p-3 w-[50vh]">Fabric Details</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Base</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Dispatch Quantity</th>
                      <th className="p-3">Total Dispatch Quantity</th>
                      <th className="p-3">Balance Quantity</th>
                      <th className="p-3">Contract Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDispatchNote.relatedContracts?.map((contract) => (
                      <tr key={contract.id} className="border-b">
                        <td className="p-3">{contract.contractNumber || '-'}</td>
                        <td className="p-3">{contract.widthOrColor || '-'}</td>
                        <td className="p-3">{contract.buyerRefer || '-'}</td>
                        <td className="p-3 w-[50vh]">{contract.fabricDetails || '-'}</td>
                        <td className="p-3">{contract.date || '-'}</td>
                        <td className="p-3">{contract.base || '-'}</td>
                        <td className="p-3">{contract.quantity || '-'}</td>
                        <td className="p-3">{contract.dispatchQuantity || ''}</td>
                        <td className="p-3">{contract.totalDispatchQuantity || '-'}</td>
                        <td className="p-3">{contract.balanceQuantity || '-'}</td>
                        <td className="p-3">{contract.contractType || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 overflow-x-auto">
                <h3 className="text-lg font-semibold">Inspection Notes</h3>
                {inspectionNotes[selectedDispatchNote.id]?.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3">Related Contracts</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectionNotes[selectedDispatchNote.id]?.map((inspection) => (
                        <tr key={inspection.id} className="border-b">
                          <td className="p-3">
                            {inspection.relatedContracts && inspection.relatedContracts.length > 0 ? (
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-gray-200">
                                    <th className="p-2">Contract #</th>
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
                                      <td className="p-2">{contract.dispatchQuantity || '-'}</td>
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
                                    fetchInspectionNotes(selectedDispatchNote.id);
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
                  <p className="text-gray-500">No inspection notes found for this dispatch note.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionNoteList;