'use client';
import React, { useState, useEffect } from 'react';
import { getAllBusinessAssociate, deleteBusinessAssociate } from '@/apis/businessassociate';
import { columns, BusinessAssociateType } from '@/components/ablsoftware/OtherForm/Businessassociate/columns';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const BusinessAssociatesList = () => {
  const [businessAssociates, setBusinessAssociates] = useState<BusinessAssociateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedBusinessAssociate, setSelectedBusinessAssociate] = useState<BusinessAssociateType | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchBusinessAssociates = async () => {
    try {
      setLoading(true);
      const response = await getAllBusinessAssociate(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setBusinessAssociates(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessAssociates();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteBusinessAssociate(deleteId);
      setBusinessAssociates(prev => prev.filter(item => item.id !== deleteId));
      setOpenDelete(false);
      setDeleteId(null);
      toast.success("Deleted Successfully");
    } catch (error) {
      console.error('Failed to delete Business Associate:', error);
      toast.error('Failed to delete business associate');
    }
  };

  const handleDeleteOpen = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => {
    setOpenDelete(false);
    setDeleteId(null);
  };

  const handleViewOpen = (id: string) => {
    const item = businessAssociates.find(item => item.id === id);
    setSelectedBusinessAssociate(item || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedBusinessAssociate(null);
  };

  return (
    <div className="container bg-white rounded-md">
      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen)}
        data={businessAssociates}
        loading={loading}
        link={'/businessassociate/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
        searchName="name"
      />
      
      {openDelete && (
        <DeleteConfirmModel
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
          isOpen={openDelete}
        />
      )}
      {openView && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Business Associate Details
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={handleViewClose}
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              {selectedBusinessAssociate && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        ID
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedBusinessAssociate.id}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Business Associate Name
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedBusinessAssociate.name}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Mobile Number
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedBusinessAssociate.mobile}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Address
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedBusinessAssociate.address}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-400 opacity-10 rounded-full -translate-x-12 -translate-y-12 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-400 opacity-10 rounded-full translate-x-12 translate-y-12 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessAssociatesList;