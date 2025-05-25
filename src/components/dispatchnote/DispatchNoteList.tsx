'use client';
import React from 'react';
import { toast } from 'react-toastify';
import { columns, DispatchNote } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllDispatchNotes, deleteDispatchNote } from '@/apis/dispatchnote';
import { MdLocalShipping } from 'react-icons/md';

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

  const handleCheckboxChange = (dispatchNoteId: string, checked: boolean) => {
    setSelectedDispatchNoteIds((prev) =>
      checked ? [...prev, dispatchNoteId] : prev.filter((id) => id !== dispatchNoteId)
    );
  };

  return (
    <div className="container bg-white rounded-md p-6">
      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen, handleCheckboxChange)}
        data={dispatchNotes}
        loading={loading}
        link={'/dispatchnote/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

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
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3 font-medium">Contract #</th>
                        <th className="p-3 font-medium">Seller</th>
                        <th className="p-3 font-medium">Buyer</th>
                        <th className="p-3 font-medium">Date</th>
                        <th className="p-3 font-medium">Quantity</th>
                        <th className="p-3 font-medium">Total Amount</th>
                        <th className="p-3 font-medium">Base</th>
                        <th className="p-3 font-medium">Dispatch Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchNote.relatedContracts.map((contract) => (
                        <tr key={contract.id} className="border-b hover:bg-gray-100">
                          <td className="p-3">{contract.contractNumber || '-'}</td>
                          <td className="p-3">{contract.seller || '-'}</td>
                          <td className="p-3">{contract.buyer || '-'}</td>
                          <td className="p-3">{contract.date || '-'}</td>
                          <td className="p-3">{contract.quantity || '-'}</td>
                          <td className="p-3">{contract.totalAmount || '-'}</td>
                          <td className="p-3">{contract.base || '-'}</td>
                          <td className="p-3">{contract.dispatchQty || '-'}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="border rounded p-4 mt-2">
                    {selectedDispatchNote.relatedContracts && selectedDispatchNote.relatedContracts.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#06b6d4] text-white">
                            <th className="p-3 font-medium">Contract #</th>
                            <th className="p-3 font-medium">Seller</th>
                            <th className="p-3 font-medium">Buyer</th>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Quantity</th>
                            <th className="p-3 font-medium">Total Amount</th>
                            <th className="p-3 font-medium">Base</th>
                            <th className="p-3 font-medium">Dispatch Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDispatchNote.relatedContracts.map((contract) => (
                            <tr key={contract.id} className="border-b hover:bg-gray-100">
                              <td className="p-3">{contract.contractNumber || '-'}</td>
                              <td className="p-3">{contract.seller || '-'}</td>
                              <td className="p-3">{contract.buyer || '-'}</td>
                              <td className="p-3">{contract.date || '-'}</td>
                              <td className="p-3">{contract.quantity || '-'}</td>
                              <td className="p-3">{contract.totalAmount || '-'}</td>
                              <td className="p-3">{contract.base || '-'}</td>
                              <td className="p-3">{contract.dispatchQty || '-'}</td>
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