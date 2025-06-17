'use client';
import React from 'react';
import { FaCheck, FaFileExcel, FaFilePdf, FaSignature, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { getAllContract, deleteContract, updateContractStatus } from '@/apis/contract';
import { columns, Contract } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import ContractPDFExport from './ContractPDFExport';
import DietPDFExport from './DietPDFExport';
import SignatureCanvas from 'react-signature-canvas';
import ConversionPDFExport from './ConversionPDFExport';
import MultiContractPDFExport from './MultiContractPDFExport';

type ExtendedContract = Contract;

const ContractList = () => {
  const [contracts, setContracts] = React.useState<ExtendedContract[]>([]);
  const [filteredContracts, setFilteredContracts] = React.useState<ExtendedContract[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [openEmailModal, setOpenEmailModal] = React.useState(false);
  const [openWhatsAppModal, setOpenWhatsAppModal] = React.useState(false);
  const [openPDFModal, setOpenPDFModal] = React.useState(false);
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
  const [zmsSignature, setZmsSignature] = React.useState<string | undefined>(undefined);
  const [emailRecipient, setEmailRecipient] = React.useState('');
  const [whatsappNumber, setWhatsappNumber] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [messageBody, setMessageBody] = React.useState('');
  const [showSinglePDFOptions, setShowSinglePDFOptions] = React.useState(false);
  const [showMultiPDFOptions, setShowMultiPDFOptions] = React.useState(false);
  const [showDietPDFOptions, setDietMultiPDFOptions] = React.useState(false);
  const [showConversionPDFOptions, setShowConversionPDFOptions] = React.useState(false);

  const zmsSigCanvas = React.useRef<SignatureCanvas | null>(null);

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
    let dataToExport: ExtendedContract[] = [];

    if (selectedContractIds.length > 0) {
      dataToExport = filteredContracts.filter((contract) =>
        selectedContractIds.includes(contract.id)
      );
      if (dataToExport.length === 0) {
        toast('No contracts match the selected criteria', { type: 'warning' });
        return;
      }
    } else {
      dataToExport = filteredContracts;
      if (dataToExport.length === 0) {
        toast('No contracts available to export', { type: 'warning' });
        return;
      }
    }

    const formattedData = dataToExport.map((contract) => ({
      'Contract Number': contract.contractNumber,
      'Date': contract.date || '-',
      'Contract Type': contract.contractType,
      'Seller': contract.seller,
      'Buyer': contract.buyer,
      'Reference Number': contract.referenceNumber || '-',
      'Fabric Type': contract.fabricType || '-',
      'Description': contract.description || '-',
      'Finish Width': contract.finishWidth || '-',
      'Quantity': contract.buyerDeliveryBreakups?.length
        ? contract.buyerDeliveryBreakups.map((detail) => detail.qty).join(', ')
        : contract.quantity || '-',
      'Rate': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.rate).join(', ')
        : contract.rate || '-',
      'Piece Length': contract.pieceLength || '-',
      'Delivery': contract.buyerDeliveryBreakups?.length
        ? contract.buyerDeliveryBreakups.map((detail) => detail.deliveryDate).join(', ')
        : contract.deliveryDate || '-',
      'Payment Terms': `Seller: ${contract.dietContractRow[0]?.commisionInfo?.paymentTermsSeller || '-'} | Buyer: ${contract.dietContractRow[0]?.commisionInfo?.paymentTermsBuyer || '-'}`,
      'Packing': contract.packing || '-',
      'GST': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.gst).join(', ')
        : contract.gst || '-',
      'GST Value': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.gstValue).join(', ')
        : contract.gstValue || '-',
      'Fabric Value': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.fabricValue).join(', ')
        : contract.fabricValue || '-',
      'Total Amount': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.totalAmount).join(', ')
        : contract.totalAmount || '-',
      'Commission': contract.dietContractRow[0]?.commissionPercentage || '-',
      'Commission Value': contract.dietContractRow[0]?.commissionValue || '-',
      'Dispatch Address': contract.dietContractRow[0]?.commisionInfo?.dispatchAddress || '-',
      'Remarks': `Seller: ${contract.dietContractRow[0]?.commisionInfo?.sellerRemark || '-'} | Buyer: ${contract.dietContractRow[0]?.commisionInfo?.buyerRemark || '-'}`,
      'Color': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.color).join(', ')
        : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
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
      'Seller': contract.seller,
      'Buyer': contract.buyer,
      'Reference Number': contract.referenceNumber || '-',
      'Fabric Type': contract.fabricType || '-',
      'Description': contract.description || '-',
      'Finish Width': contract.finishWidth || '-',
      'Quantity': contract.buyerDeliveryBreakups?.length
        ? contract.buyerDeliveryBreakups.map((detail) => detail.qty).join(', ')
        : contract.quantity || '-',
      'Rate': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.rate).join(', ')
        : contract.rate || '-',
      'Piece Length': contract.pieceLength || '-',
      'Delivery': contract.buyerDeliveryBreakups?.length
        ? contract.buyerDeliveryBreakups.map((detail) => detail.deliveryDate).join(', ')
        : contract.deliveryDate || '-',
      'Payment Terms': `Seller: ${contract.dietContractRow[0]?.commisionInfo?.paymentTermsSeller || '-'} | Buyer: ${contract.dietContractRow[0]?.commisionInfo?.paymentTermsBuyer || '-'}`,
      'Packing': contract.packing || '-',
      'GST': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.gst).join(', ')
        : contract.gst || '-',
      'GST Value': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.gstValue).join(', ')
        : contract.gstValue || '-',
      'Fabric Value': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.fabricValue).join(', ')
        : contract.fabricValue || '-',
      'Total Amount': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.totalAmount).join(', ')
        : contract.totalAmount || '-',
      'Commission': contract.dietContractRow[0]?.commissionPercentage || '-',
      'Commission Value': contract.dietContractRow[0]?.commissionValue || '-',
      'Dispatch Address': contract.dietContractRow[0]?.commisionInfo?.dispatchAddress || '-',
      'Remarks': `Seller: ${contract.dietContractRow[0]?.commisionInfo?.sellerRemark || '-'} | Buyer: ${contract.dietContractRow[0]?.commisionInfo?.buyerRemark || '-'}`,
      'Color': contract.dietContractRow?.length
        ? contract.dietContractRow.map((detail) => detail.color).join(', ')
        : '-',
    }];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contract');

    const wscols = Array(21).fill({ wch: 20 });
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Contract_${contract.contractNumber}.xlsx`);
  };

  const handleExportToPDF = async (type: 'purchase' | 'sale' | 'diet' | 'multiwidth' | 'single' | 'conversion') => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    for (const id of selectedContractIds) {
      const contract = contracts.find((c) => c.id === id);
      if (contract) {
        try {
          if (type === 'purchase' || type === 'sale') {
            return;
          } else if (type === 'diet') {
            await DietPDFExport.exportToPDF({
              contract,
              zmsSignature: zmsSignature || '',
              sellerSignature: undefined,
              buyerSignature: undefined,
              sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
              buyerAddress: undefined,
              type: 'sale', // or 'purchase', depending on your logic
            });
          } else if (type === 'single') {
            await ContractPDFExport.exportToPDF({
              contract,
              zmsSignature: zmsSignature || '',
              sellerSignature: undefined,
              buyerSignature: undefined,
              sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
              buyerAddress: undefined,
              type: 'purchase',
            });
          } else if (type === 'conversion') {
            await ConversionPDFExport.exportToPDF({
              contract,
              zmsSignature: zmsSignature || '',
              sellerSignature: undefined,
              buyerSignature: undefined,
              sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
              buyerAddress: undefined,
              type: 'purchase', // or 'sale', depending on your logic
            });
          } else if (type === 'multiwidth') {
            await MultiContractPDFExport.exportToPDF({
              contract,
              zmsSignature: zmsSignature || '',
              sellerSignature: undefined,
              buyerSignature: undefined,
              sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
              buyerAddress: undefined,
              type,
            });
          }
        } catch (error) {
          console.error(`Failed to generate ${type} PDF:`, error);
          toast(`Failed to generate ${type} PDF`, { type: 'error' });
        }
      }
    }
    setOpenPDFModal(false);
    setShowSinglePDFOptions(false);
    setShowMultiPDFOptions(false);
    setShowConversionPDFOptions(false);
    setDietMultiPDFOptions(false);
  };

  const handleSendEmail = async () => {
    if (selectedContractIds.length === 0 && !uploadedFile) {
      toast('Please select at least one contract or upload a file', { type: 'warning' });
      return;
    }
    if (!emailRecipient) {
      toast('Please enter a recipient email', { type: 'warning' });
      return;
    }

    try {
      const attachmentUrls: string[] = [];

      for (const id of selectedContractIds) {
        const contract = contracts.find((c) => c.id === id);
        if (contract) {
          await ContractPDFExport.exportToPDF({
            contract,
            zmsSignature,
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type: 'purchase',
          });
          await DietPDFExport.exportToPDF({
            contract,
            zmsSignature,
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type: 'sale',
          });
        }
      }

      if (uploadedFile) {
        const fileUrl = await uploadPDFToServer(uploadedFile, uploadedFile.name);
        attachmentUrls.push(fileUrl);
      }

      if (attachmentUrls.length === 0) {
        toast('No files to send', { type: 'error' });
        return;
      }

      await sendEmailWithAttachments(attachmentUrls, emailRecipient, messageBody);
      toast('Files sent via email successfully', { type: 'success' });
      setOpenEmailModal(false);
      resetModalInputs();
    } catch (error) {
      console.error('Failed to send email:', error);
      toast('Failed to send email', { type: 'error' });
    }
  };

  const handleSendWhatsApp = async () => {
    if (selectedContractIds.length === 0 && !uploadedFile) {
      toast('Please select at least one contract or upload a file', { type: 'warning' });
      return;
    }
    if (!whatsappNumber) {
      toast('Please enter a WhatsApp number', { type: 'warning' });
      return;
    }

    try {
      const attachmentUrls: string[] = [];

      for (const id of selectedContractIds) {
        const contract = contracts.find((c) => c.id === id);
        if (contract) {
          await ContractPDFExport.exportToPDF({
            contract,
            zmsSignature,
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type: 'purchase',
          });
          await DietPDFExport.exportToPDF({
            contract,
            zmsSignature,
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type: 'sale',
          });
        }
      }

      if (uploadedFile) {
        const fileUrl = await uploadPDFToServer(uploadedFile, uploadedFile.name);
        attachmentUrls.push(fileUrl);
      }

      if (attachmentUrls.length === 0) {
        toast('No files to send', { type: 'error' });
        return;
      }

      const message = `${messageBody || 'Please find the attached files:'}\n${attachmentUrls.join('\n')}`;
      const encodedMessage = encodeURIComponent(message);
      const cleanedNumber = whatsappNumber.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      toast('WhatsApp message prepared with file links', { type: 'info' });
      setOpenWhatsAppModal(false);
      resetModalInputs();
    } catch (error) {
      console.error('Failed to prepare WhatsApp message:', error);
      toast('Failed to prepare WhatsApp message', { type: 'error' });
    }
  };

  const uploadPDFToServer = async (file: Blob | File, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file, fileName);
    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload file');
    const data = await response.json();
    return data.url;
  };

  const sendEmailWithAttachments = async (attachmentUrls: string[], recipient: string, message: string) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipient,
        subject: 'ZMS Sourcing Contract Files',
        body: message || 'Please find the attached files.',
        attachments: attachmentUrls,
      }),
    });
    if (!response.ok) throw new Error('Failed to send email');
  };

  const handleSignatureUpload = () => {
    if (zmsSigCanvas.current && !zmsSigCanvas.current.isEmpty()) {
      const base64 = zmsSigCanvas.current.toDataURL('image/png');
      setZmsSignature(base64);
      toast('Z.M.SOURCING signature drawn. Click "Export PDF" to download the signed PDF.', { type: 'info' });
    }
  };

  const handleSignAndExport = () => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    const firstContractId = selectedContractIds[0];
    handleViewOpen(firstContractId);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      toast('File size exceeds 10MB limit', { type: 'error' });
      return;
    }
    if (file) {
      setUploadedFile(file);
      toast(`File "${file.name}" selected for upload`, { type: 'info' });
    } else {
      setUploadedFile(null);
    }
  };

  const resetModalInputs = () => {
    setEmailRecipient('');
    setWhatsappNumber('');
    setUploadedFile(null);
    setMessageBody('');
  };

  const getFabricDetails = () => {
    if (selectedContractIds.length === 0) {
      return 'No contract selected';
    }

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
      selectedContract.dietContractRow?.map((detail) => detail.color).join(', ') || '',
    ]
      .filter((item) => item.trim() !== '')
      .join(' / ');

    return fabricDetails || 'N/A';
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await getAllContract(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setContracts(response.data);
      setFilteredContracts(response.data);
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

  const handleExportDietPDF = async (type: 'sale' | 'purchase') => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    for (const id of selectedContractIds) {
      const contract = contracts.find((c) => c.id === id);
      if (contract) {
        try {
          await DietPDFExport.exportToPDF({
            contract,
            zmsSignature: zmsSignature || '',
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type,
          });
        } catch (error) {
          console.error(`Failed to generate ${type} PDF:`, error);
          toast(`Failed to generate ${type} PDF`, { type: 'error' });
        }
      }
    }
    setOpenPDFModal(false);
    setShowSinglePDFOptions(false);
    setShowMultiPDFOptions(false);
    setShowConversionPDFOptions(false);
    setDietMultiPDFOptions(false);
  };

  const handleSingleMultiPDF = async (type: 'sale' | 'purchase') => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    for (const id of selectedContractIds) {
      const contract = contracts.find((c) => c.id === id);
      if (contract) {
        try {
          await ContractPDFExport.exportToPDF({
            contract,
            zmsSignature: zmsSignature || '',
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type,
          });
        } catch (error) {
          console.error(`Failed to generate ${type} PDF:`, error);
          toast(`Failed to generate ${type} PDF`, { type: 'error' });
        }
      }
    }
    setOpenPDFModal(false);
    setShowSinglePDFOptions(false);
    setShowMultiPDFOptions(false);
    setShowConversionPDFOptions(false);
    setDietMultiPDFOptions(false);
  };

  const handleExportMultiPDF = async (type: 'sale' | 'purchase') => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    for (const id of selectedContractIds) {
      const contract = contracts.find((c) => c.id === id);
      if (contract) {
        try {
          await MultiContractPDFExport.exportToPDF({
            contract,
            zmsSignature: zmsSignature || '',
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type,
          });
        } catch (error) {
          console.error(`Failed to generate ${type} PDF:`, error);
          toast(`Failed to generate ${type} PDF`, { type: 'error' });
        }
      }
    }
    setOpenPDFModal(false);
    setShowSinglePDFOptions(false);
    setShowMultiPDFOptions(false);
    setShowConversionPDFOptions(false);
    setDietMultiPDFOptions(false);
  };

  const handleExportConversionPDF = async (type: 'sale' | 'purchase') => {
    if (selectedContractIds.length === 0) {
      toast('Please select at least one contract', { type: 'warning' });
      return;
    }
    for (const id of selectedContractIds) {
      const contract = contracts.find((c) => c.id === id);
      if (contract) {
        try {
          await ConversionPDFExport.exportToPDF({
            contract,
            zmsSignature: zmsSignature || '',
            sellerSignature: undefined,
            buyerSignature: undefined,
            sellerAddress: contract.dietContractRow[0]?.commisionInfo?.dispatchAddress,
            buyerAddress: undefined,
            type,
          });
        } catch (error) {
          console.error(`Failed to generate ${type} conversion PDF:`, error);
          toast(`Failed to generate ${type} conversion PDF`, { type: 'error' });
        }
      }
    }
    setOpenPDFModal(false);
    setShowSinglePDFOptions(false);
    setShowMultiPDFOptions(false);
    setShowConversionPDFOptions(false);
    setDietMultiPDFOptions(false);
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
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
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
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
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
      <div>
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
      </div>
      <div className="mt-4 space-y-2 border-t-2 border-b-2 h-[18vh]">
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
            onClick={() => setOpenPDFModal(true)}
            disabled={selectedContractIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              selectedContractIds.length === 0
                ? 'bg-purple-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <FaFilePdf size={18} />
            PDF
          </button>
          <button
            onClick={exportToExcel}
            disabled={selectedContractIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 h-16 w-15 rounded-md transition-all duration-200 ${
              selectedContractIds.length === 0
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <FaFileExcel size={18} />
            Export Excel
          </button>
          <button
            onClick={() => setOpenEmailModal(true)}
            disabled={selectedContractIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 h-16 rounded-md transition-all duration-200 ${
              selectedContractIds.length === 0
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FaEnvelope size={18} />
            Email
          </button>
          <button
            onClick={() => setOpenWhatsAppModal(true)}
            disabled={selectedContractIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              selectedContractIds.length === 0
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <FaWhatsapp size={18} />
            WhatsApp
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
                        Reference Number
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.referenceNumber || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Fabric Type
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.fabricType || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Rate
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.rate || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Quantity
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.quantity || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Total Amount
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.totalAmount || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Commission
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.dietContractRow[0]?.commissionPercentage || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Commission Value
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.dietContractRow[0]?.commissionValue || '-'}
                      </div>
                    </div>
                    <div className="group">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                        Delivery
                      </span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                        {selectedContract.buyerDeliveryBreakups?.map((detail) => detail.deliveryDate).join(', ') || selectedContract.deliveryDate || '-'}
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
                        Z.M.SOURCING Signature
                      </label>
                      <SignatureCanvas
                        ref={zmsSigCanvas}
                        penColor="black"
                        canvasProps={{
                          className: 'border border-gray-300 rounded-md w-full h-24',
                        }}
                        onEnd={() => handleSignatureUpload()}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleExportToPDF('purchase')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200"
                      >
                        <FaFilePdf size={18} />
                        Export Purchase PDF
                      </button>
                      <button
                        onClick={() => handleExportToPDF('sale')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200"
                      >
                        <FaFilePdf size={18} />
                        Export Sale PDF
                      </button>
                      <button
                        onClick={() => handleExportToPDF('conversion')}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-all duration-200"
                      >
                        <FaFilePdf size={18} />
                        Export Conversion PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {openEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Send Email
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={() => {
                  setOpenEmailModal(false);
                  resetModalInputs();
                }}
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-gray-50 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="Enter recipient email"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach File (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={messageBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageBody(e.target.value)}
                  placeholder="Enter your message"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setOpenEmailModal(false);
                    resetModalInputs();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Send WhatsApp
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={() => {
                  setOpenWhatsAppModal(false);
                  resetModalInputs();
                }}
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-gray-50 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g., +923001234567"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach File (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Enter your message"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setOpenWhatsAppModal(false);
                    resetModalInputs();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openPDFModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Download PDF
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={() => {
                  setShowSinglePDFOptions(false);
                  setShowMultiPDFOptions(false);
                  setShowConversionPDFOptions(false);
                  setDietMultiPDFOptions(false);
                  setOpenPDFModal(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-gray-50 space-y-4">
              <p className="text-sm text-gray-700">
                Select the type of PDF to download for the selected contract(s).
              </p>
              <div className="flex justify-end gap-2 flex-wrap">
                {!showSinglePDFOptions && !showMultiPDFOptions && 
                 !showConversionPDFOptions && !showDietPDFOptions ? (
                  <>
                    <button
                      onClick={() => setShowSinglePDFOptions(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      SINGLE PDF
                    </button>
                    <button
                      onClick={() => setShowMultiPDFOptions(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      MULTIWIDTH PDF
                    </button>
                    <button
                      onClick={() => setShowConversionPDFOptions(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      CONVERSION PDF
                    </button>
                    <button
                      onClick={() => setDietMultiPDFOptions(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      DIET PDF
                    </button>
                  </>
                ) : showSinglePDFOptions ? (
                  <>
                    <button
                      onClick={() => handleSingleMultiPDF('purchase')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Purchase Contract
                    </button>
                    <button
                      onClick={() => handleSingleMultiPDF('sale')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Sale Contract
                    </button>
                    <button
                      onClick={() => setShowSinglePDFOptions(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200"
                    >
                      Back
                    </button>
                  </>
                ) : showMultiPDFOptions ? (
                  <>
                    <button
                      onClick={() => handleExportMultiPDF('purchase')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Purchase Contract
                    </button>
                    <button
                      onClick={() => handleExportMultiPDF('sale')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Sale Contract
                    </button>
                    <button
                      onClick={() => setShowMultiPDFOptions(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200"
                    >
                      Back
                    </button>
                  </>
                ) : showConversionPDFOptions ? (
                  <>
                    <button
                      onClick={() => handleExportConversionPDF('purchase')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Purchase Contract
                    </button>
                    <button
                      onClick={() => handleExportConversionPDF('sale')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Sale Contract
                    </button>
                    <button
                      onClick={() => setShowConversionPDFOptions(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200"
                    >
                      Back
                    </button>
                  </>
                ) : showDietPDFOptions ? (
                  <>
                    <button
                      onClick={() => handleExportDietPDF('purchase')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Purchase Contract
                    </button>
                    <button
                      onClick={() => handleExportDietPDF('sale')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200"
                    >
                      <FaFilePdf size={18} />
                      Sale Contract
                    </button>
                    <button
                      onClick={() => setDietMultiPDFOptions(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200"
                    >
                      Back
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractList;