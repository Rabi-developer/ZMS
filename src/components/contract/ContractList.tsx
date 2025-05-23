'use client';
import React from 'react';
import { FaCheck, FaFileExcel, FaFilePdf, FaSignature } from 'react-icons/fa';
import { getAllContract, deleteContract, updateContractStatus } from '@/apis/contract';
import { columns, Contract } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import ContractPDFExport from './ContractPDFExport';
import SignatureCanvas from 'react-signature-canvas';

type ExtendedContract = Contract;

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
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string | null>(null);
  const [sellerSignature, setSellerSignature] = React.useState<string | undefined>(undefined);
  const [buyerSignature, setBuyerSignature] = React.useState<string | undefined>(undefined);

  // Canvas refs for signatures
  const sellerSigCanvas = React.useRef<SignatureCanvas | null>(null);
  const buyerSigCanvas = React.useRef<SignatureCanvas | null>(null);

  const statusOptions = ['All', 'Pending', 'Approved', 'Canceled', 'Closed Dispatch', 'Closed Payment', 'Complete Closed'];

  const statusOptionsConfig = [
    { id: 1, name: 'Pending', color: '#eab308' },
    { id: 2, name: 'Approved', color: '#22c55e' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Closed Dispatch', color: '#3b82f6' },
    { id: 5, name: 'Closed Payment', color: '#8b5cf6' },
    { id: 6, name: 'Complete Closed', color: '#ec4899' },
  ];

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

  const exportToExcel = () => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }

    const dataToExport = filteredContracts
      .filter((contract) => selectedContractIds.includes(contract.id))
      .map((contract) => ({
        'Contract Number': contract.contractNumber,
        'Date': contract.date || '-',
        'Contract Type': contract.contractType,
        'Seller': contract.buyer, // Show buyer's name
        'Buyer': contract.buyer,
        'Description': contract.descriptionName || '-',
        'Finish Width': contract.width || '-',
        'Quantity': `${contract.quantity} ${contract.unitOfMeasure}`,
        'Rate': contract.rate || '-',
        'Piece Length': contract.pieceLength || '-',
        'Delivery': contract.refer || '-',
        'Payment Terms': `Seller: ${contract.paymentTermsSeller || '-'} | Buyer: ${contract.paymentTermsBuyer || '-'}`,
        'Packing': contract.packing || '-',
        'GST': contract.gst || '-',
        'GST Value': contract.gstValue || '-',
        'Fabric Value': contract.fabricValue || '-',
        'Total Amount': contract.totalAmount,
        'Commission': contract.commissionPercentage || '-',
        'Commission Value': contract.commissionValue || '-',
        'Dispatch Address': contract.dispatchAddress || '-',
        'Remarks': `Seller: ${contract.sellerRemark || '-'} | Buyer: ${contract.buyerRemark || '-'}`,
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contracts');

    const wscols = Array(21).fill({ wch: 20 });
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, 'Contracts.xlsx');
  };

  const exportSingleRowToExcel = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) {
      toast('Contract not found', { type: 'error' });
      return;
    }

    const dataToExport = [{
      'Contract Number': contract.contractNumber,
      'Date': contract.date || '-',
      'Contract Type': contract.contractType,
      'Seller': contract.buyer, // Show buyer's name
      'Buyer': contract.buyer,
      'Description': contract.descriptionName || '-',
      'Finish Width': contract.width || '-',
      'Quantity': `${contract.quantity} ${contract.unitOfMeasure}`,
      'Rate': contract.rate || '-',
      'Piece Length': contract.pieceLength || '-',
      'Delivery': contract.refer || '-',
      'Payment Terms': `Seller: ${contract.paymentTermsSeller || '-'} | Buyer: ${contract.paymentTermsBuyer || '-'}`,
      'Packing': contract.packing || '-',
      'GST': contract.gst || '-',
      'GST Value': contract.gstValue || '-',
      'Fabric Value': contract.fabricValue || '-',
      'Total Amount': contract.totalAmount,
      'Commission': contract.commissionPercentage || '-',
      'Commission Value': contract.commissionValue || '-',
      'Dispatch Address': contract.dispatchAddress || '-',
      'Remarks': `Seller: ${contract.sellerRemark || '-'} | Buyer: ${contract.buyerRemark || '-'}`,
    }];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contract');

    const wscols = Array(21).fill({ wch: 20 });
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Contract_${contract.contractNumber}.xlsx`);
  };

  const handleExportToPDF = (includeSellerSignature: boolean = false) => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    selectedContractIds.forEach((id) => {
      const contract = contracts.find((c) => c.id === id);
      if (contract) {
        ContractPDFExport.exportToPDF({
          contract,
          sellerSignature: includeSellerSignature ? sellerSignature : undefined,
          buyerSignature,
        });
      }
    });
  };

  const handleSignatureUpload = (type: 'seller' | 'buyer') => {
    const canvas = type === 'seller' ? sellerSigCanvas.current : buyerSigCanvas.current;
    if (canvas && !canvas.isEmpty()) {
      const base64 = canvas.toDataURL('image/png');
      if (type === 'seller') {
        setSellerSignature(base64);
        toast('Seller signature drawn. Click "Export PDF" to download the signed PDF.', { type: 'info' });
      } else {
        setBuyerSignature(base64);
        toast('Buyer signature drawn.', { type: 'info' });
      }
    }
  };

  const handleSignAndExport = () => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    // Open the view modal for the first selected contract
    const firstContractId = selectedContractIds[0];
    handleViewOpen(firstContractId);
  };

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

  React.useEffect(() => {
    let filtered = contracts;

    if (startDate && endDate) {
      filtered = filtered.filter((contract) => {
        if (!contract.date) return false;
        const contractDate = new Date(contract.date).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return contractDate >= start && contractDate <= end;
      });
    }

    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter((contract) => contract.status === selectedStatusFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, selectedStatusFilter, startDate, endDate]);

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

  const handleCheckboxChange = (contractId: string, checked: boolean) => {
    setSelectedContractIds((prev) => {
      const newSelectedIds = checked
        ? [...prev, contractId]
        : prev.filter((id) => id !== contractId);

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
      const updatePromises = selectedContractIds.map((id) =>
        updateContractStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedContractIds([]);
      setSelectedStatusFilter(newStatus);
      toast('Contracts Status Updated Successfully', { type: 'success' });
      await fetchContracts();
    } catch (error: any) {
      toast(`Failed to update contract status: ${error.message || 'Unknown error'}`, { type: 'error' });
    } finally {
      setUpdating(false);
    }
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
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
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
          <button
            onClick={handleSignAndExport}
            disabled={selectedContractIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              selectedContractIds.length === 0
                ? 'bg-cyan-300 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            <FaSignature size={18} />
            Sign and Export PDF
          </button>
          <button
            onClick={() => handleExportToPDF(true)}
            disabled={selectedContractIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              selectedContractIds.length === 0
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <FaFilePdf size={18} />
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            disabled={selectedContractIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              selectedContractIds.length === 0
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <FaFileExcel size={18} />
            Export Excel
          </button>
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
            <div className="p-6 bg-gray-50">
              {selectedContract && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
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
                        Date
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.date || '-'}
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
                        Seller
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.buyer} {/* Show buyer's name */}
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seller Signature
                      </label>
                      <SignatureCanvas
                        ref={sellerSigCanvas}
                        penColor="black"
                        canvasProps={{
                          className: 'border border-gray-300 rounded-md w-full h-24',
                        }}
                        onEnd={() => handleSignatureUpload('seller')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buyer Signature
                      </label>
                      <SignatureCanvas
                        ref={buyerSigCanvas}
                        penColor="black"
                        canvasProps={{
                          className: 'border border-gray-300 rounded-md w-full h-24',
                        }}
                        onEnd={() => handleSignatureUpload('buyer')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractList;