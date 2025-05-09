'use client';
import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { getAllContract, deleteContract, updateContract } from '@/apis/contract';
import { columns, Contract } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

// Extend Contract type to include status
interface ExtendedContract extends Contract {
  status?: 'Pending' | 'Approved' | 'Canceled' | 'Closed Dispatch' | 'Closed Payment' | 'Complete Closed';
}

const ContractList = () => {
  const [contracts, setContracts] = React.useState<ExtendedContract[]>([]);
  const [filteredContracts, setFilteredContracts] = React.useState<ExtendedContract[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [selectedContract, setSelectedContract] = React.useState<ExtendedContract | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>('All');
  const [selectedContractIds, setSelectedContractIds] = React.useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = React.useState<string | null>(null);

  const statusOptions = ['All', 'Pending', 'Approved', 'Canceled', 'Dispatched'];
  const statusSteps = ['Pending', 'Approved', 'Canceled', 'Dispatched'];
  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#eab308' },
    { id: 2, name: 'Approved', color: '#22c55e' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Dispatched', color: '#3b82f6' },
  ];

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await getAllContract(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast('Failed to fetch contracts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchContracts();
  }, [pageIndex, pageSize]);

  // Filter contracts based on selected status
  React.useEffect(() => {
    if (selectedStatusFilter === 'All') {
      setFilteredContracts(contracts);
    } else {
      setFilteredContracts(
        contracts.filter((contract) => contract.status === selectedStatusFilter)
      );
    }
  }, [contracts, selectedStatusFilter]);

  const handleDelete = async () => {
    try {
      await deleteContract(deleteId);
      setOpenDelete(false);
      toast('Contract Deleted Successfully', { type: 'success' });
      fetchContracts();
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast('Failed to delete contract', { type: 'error' });
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

  const handleViewOpen = (contractId: string) => {
    const contract = contracts.find((item) => item.id === contractId);
    setSelectedContract(contract || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedContract(null);
  };

  const handleStatusUpdate = async (contractId: string, newStatus: string) => {
    try {
      await updateContract(contractId, { status: newStatus });
      toast('Contract Status Updated Successfully', { type: 'success' });
      fetchContracts();
    } catch (error) {
      console.error('Failed to update contract status:', error);
      toast('Failed to update contract status', { type: 'error' });
    }
  };

  const handleCheckboxChange = (contractId: string, checked: boolean) => {
    setSelectedContractIds((prev) =>
      checked ? [...prev, contractId] : prev.filter((id) => id !== contractId)
    );
    // Clear selectedBulkStatus when selection changes
    if (!checked) {
      setSelectedBulkStatus(null);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedContractIds.length === 0) {
      return;
    }
    try {
      setLoading(true);
      await Promise.all(
        selectedContractIds.map((id) =>
          updateContract(id, { status: newStatus })
        )
      );
      setSelectedBulkStatus(newStatus);
      setSelectedContractIds([]);
      fetchContracts();
    } catch (error) {
      console.error('Failed to update selected contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status color mapping for table badges
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]';
      case 'Approved':
        return 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]';
      case 'Canceled':
        return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]';
      case 'Closed Dispatch':
        return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]';
        case 'Closed Payment':
        return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]';
        case 'Compelete Closed':
        return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="container bg-white rounded-md p-6">
      {/* Status Filter */}
      <div className="mb-4 flex items-center">
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

      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen, handleCheckboxChange)}
        data={filteredContracts}
        loading={loading}
        link={'/contract/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* Bulk Status Update Checkboxes */}
      {/* <div className="mt-4 space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Update Status for Selected Contracts
        </label>
        <div className="flex flex-wrap gap-4">
          {statusOptionsConfig.map((option) => {
            const isSelected = selectedBulkStatus === option.name;
            return (
              <label
                key={option.id}
                className={`relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected
                    ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]`
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleBulkStatusUpdate(option.name)}
                  className="hidden"
                  disabled={selectedContractIds.length === 0 || loading}
                />
                <span className="text-sm font-semibold">{option.name}</span>
                {isSelected && (
                  <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />
                )}
              </label>
            );
          })}
        </div>
      </div> */}

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
                Contract Details
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={handleViewClose}
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              {selectedContract && (
                <div className="space-y-6">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Status
                    </label>
                    <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                      {statusSteps.map((status, index) => (
                        <div key={status} className="flex flex-col items-center relative">
                          <input
                            type="radio"
                            id={`status-${status}`}
                            value={status}
                            checked={(selectedContract.status || 'Pending') === status}
                            onChange={() => handleStatusUpdate(selectedContract.id, status)}
                            className="h-6 w-6 text-[#154593] focus:ring-[#0e61e7] cursor-pointer"
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm mt-2 text-gray-700"
                          >
                            {status}
                          </label>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`absolute top-3 left-1/2 w-1/2 h-1 ${
                                statusSteps.indexOf(selectedContract.status || 'Pending') > index
                                  ? 'bg-[#154593]'
                                  : 'bg-gray-300'
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Contract Number
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.contractNumber}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Contract Type
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.contractType}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Company
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.companyName || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Branch
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.branchName || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Seller
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.seller}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Buyer
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.buyer}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Fabric Type
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.fabricType}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Quantity
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.quantity} {selectedContract.unitOfMeasure}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Total Amount
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.totalAmount}
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

export default ContractList;