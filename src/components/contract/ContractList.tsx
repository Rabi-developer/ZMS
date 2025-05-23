'use client';
import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { getAllContract, deleteContract, updateContractStatus } from '@/apis/contract';
import { columns, Contract } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';

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
  const [updating, setUpdating] = React.useState(false);

  const statusOptions = ['All', 'Pending', 'Approved', 'Canceled', 'Closed Dispatch', 'Closed Payment', 'Complete Closed'];

  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#eab308' },
    { id: 2, name: 'Approved', color: '#22c55e' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Closed Dispatch', color: '#3b82f6' },
    { id: 5, name: 'Closed Payment', color: '#8b5cf6' },
    { id: 6, name: 'Complete Closed', color: '#ec4899' },
  ];

  // Define dropdown options with 'All' included
  const dropdownOptions = [
    { id: 0, name: 'All' },
    ...statusOptionsConfig.map((option) => ({
      id: option.id,
      name: option.name,
    })),
  ];

  // Function to get status styles for the view modal
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
        return 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]';
      case 'Complete Closed':
        return 'bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Function to format fabric details for selected contracts
  const getFabricDetails = () => {
    if (selectedContractIds.length === 0) {
      return 'No contract selected';
    }

    // For simplicity, show details for the first selected contract
    // You can modify this to handle multiple contracts differently (e.g., combine or show a message)
    const selectedContract = contracts.find((contract) => contract.id === selectedContractIds[0]);
    if (!selectedContract) {
      return 'N/A';
    }

    const fabricDetails = [
      `${selectedContract.warpCount || ''}${selectedContract.warpYarnType || ''}`,
      `${selectedContract.weftCount || ''}${selectedContract.weftYarnType || ''}`,
      `${selectedContract.noOfEnds || ''} * ${selectedContract.noOfPicks || ''}`,
      selectedContract.weaves || '',
      selectedContract.width || '',
      selectedContract.final || '',
      selectedContract.selvege || '',
    ]
      .filter((item) => item.trim() !== '')
      .join(' / ');

    return fabricDetails || 'N/A';
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await getAllContract(pageIndex === 0 ? 1 : pageIndex, pageSize);
      console.log('Fetched contracts:', response.data);
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
    console.log('Selected contract for view:', contract);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedContract(null);
  };

  const handleCheckboxChange = (contractId: string, checked: boolean) => {
    setSelectedContractIds((prev) => {
      const newSelectedIds = checked
        ? [...prev, contractId]
        : prev.filter((id) => id !== contractId);

      // Determine the status to highlight based on selected contracts
      if (newSelectedIds.length === 0) {
        setSelectedBulkStatus(null);
      } else if (newSelectedIds.length === 1) {
        const selectedContract = contracts.find((c) => c.id === newSelectedIds[0]);
        setSelectedBulkStatus(selectedContract?.status || 'Pending');
      } else {
        const selectedContracts = contracts.filter((c) => newSelectedIds.includes(c.id));
        const statuses = selectedContracts.map((c) => c.status || 'Pending');
        const allSameStatus = statuses.every((status) => status === statuses[0]);
        setSelectedBulkStatus(allSameStatus ? statuses[0] : null);
      }

      console.log('Selected contract IDs:', newSelectedIds);
      return newSelectedIds;
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      console.log('Updating status for contracts:', selectedContractIds, 'to', newStatus);
      const updatePromises = selectedContractIds.map((id) =>
        updateContractStatus({ id, status: newStatus }).then((response) => {
          console.log(`Update response for contract ${id}:`, response);
          return response;
        }).catch((error) => {
          console.error(`Error updating contract ${id}:`, error);
          throw error;
        })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedContractIds([]);
      setSelectedStatusFilter(newStatus);
      toast('Contracts Status Updated Successfully', { type: 'success' });
      await fetchContracts();
    } catch (error: any) {
      console.error('Failed to update selected contracts:', error);
      toast(`Failed to update contract status: ${error.message || 'Unknown error'}`, { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container bg-white rounded-md p-6">
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
      <div className="">
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
      </div>
      {/* Fabric Details Input Field */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Fabric Details
        </label>
        <input
          type="text"
          value={getFabricDetails()}
          readOnly
          className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-800 focus:outline-none"
          placeholder="Select a contract to view fabric details"
        />
      </div>
      {/* Status Update Buttons */}
      <div className="mt-4 space-y-2 border-t-2 h-[10vh]">
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
            <div className="p-6 flex bg-gray-50">
              {selectedContract && (
                <div className="flex space-y-6">
                  <div className="flex grid grid-cols-2 gap-4 gap-5">
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
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Status
                      </span>
                      <div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(
                            selectedContract.status || 'Pending'
                          )}`}
                        >
                          {selectedContract.status || 'Pending'}
                        </span>
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