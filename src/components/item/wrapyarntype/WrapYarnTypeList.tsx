'use client';
import React from 'react';
import { getAllWrapYarnTypes, deleteWrapYarnType } from '@/apis/wrapyarntype'; 
import { columns, WrapYarnType } from '@/components/item/wrapyarntype/columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const WrapYarnTypeList = () => {
  const [WrapYarnType, setWrapYarnType] = React.useState<WrapYarnType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [selectedWrapYarnType, setSelectedWrapYarnType] = React.useState<WrapYarnType | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const fetchWrapYarnType = async () => {
    try {
      setLoading(true);
      const response = await getAllWrapYarnTypes(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setWrapYarnType(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWrapYarnType();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteWrapYarnType(deleteId);
      setWrapYarnType(prev => prev.filter(item => item.id !== deleteId));
      setOpenDelete(false);
      setDeleteId(null);
      toast.success("Deleted Successfully");
    } catch (error) {
      console.error('Failed to delete Wrap Yarn Type:', error);
      toast.error('Failed to delete Wrap Yarn Type');
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

  const handleViewOpen = (ListId: string) => { 
    const item = WrapYarnType.find(item => item.listid === ListId);
    setSelectedWrapYarnType(item || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedWrapYarnType(null);
  };

  return (
    <div className="container bg-white rounded-md">
      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen)}
        data={WrapYarnType}
        loading={loading}
        link={'/wrapyarntype/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
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
                Stuff Details
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={handleViewClose}
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              {selectedWrapYarnType && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        ID
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedWrapYarnType.listid} 
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Name
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedWrapYarnType.descriptions}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Details
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedWrapYarnType.subDescription}
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

export default WrapYarnTypeList;
