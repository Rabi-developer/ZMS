'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFilePdf, FaFileUpload, FaEye, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllBookingOrder,
  deleteBookingOrder,
  updateBookingOrderStatus,
  getConsignmentsForBookingOrder,
  updateBookingOrder, // Used to update the `files` field
  updateBookingOrderFiles, // New dedicated function for updating files
} from '@/apis/bookingorder';
import { getAllVendor } from '@/apis/vendors';
import { getAllTransporter } from '@/apis/transporter';
import { Edit, Trash } from 'lucide-react';
import { columns, getStatusStyles, BookingOrder } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { exportBiltiesReceivableToPDF } from '@/components/ablsoftware/Maintance/common/BiltiesReceivablePdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Consignment {
  id: string;
  biltyNo: string;
  receiptNo: string;
  consignor: string;
  consignee: string;
  item: string;
  qty: string;
  totalAmount: string;
  receivedAmount: string;
  deliveryDate: string;
  status: string;
}

interface ExtendedBookingOrder extends BookingOrder {
  relatedConsignments?: Consignment[];
  vehicleType?: string;
}

interface DropdownOption {
  id: string;
  name: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string; // Cloudinary secure URL
  type: string;
}

const BookingOrderList = () => {
  const formatABLDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear() % 100;
    return `ABL/${day}/${month}-${year}`;
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingOrders, setBookingOrders] = useState<ExtendedBookingOrder[]>([]);
  const [filteredBookingOrders, setFilteredBookingOrders] = useState<ExtendedBookingOrder[]>([]);
  const [consignments, setConsignments] = useState<{ [orderId: string]: Consignment[] }>({});
  const [vendors, setVendors] = useState<DropdownOption[]>([]);
  const [transporters, setTransporters] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [fetchingConsignments, setFetchingConsignments] = useState<{ [orderId: string]: boolean }>({});
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  // File upload states
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedOrderForFiles, setSelectedOrderForFiles] = useState<string | null>(null);
  const [orderFiles, setOrderFiles] = useState<{ [orderId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF modal state
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState<string>('');
  const [pdfEndDate, setPdfEndDate] = useState<string>('');

  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'UnApproved', 'Closed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#3b82f6' },
    { id: 2, name: 'Approved', color: '#10b981' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'UnApproved', color: '#f59e0b' },
    { id: 5, name: 'Closed', color: '#6b7280' },
  ];

  const resolvePartyName = (val?: string): string => {
    if (!val) return '-';
    const fromVendors = vendors.find((v) => v.id === val || v.name === val);
    if (fromVendors) return fromVendors.name;
    const fromTransporters = transporters.find((t) => t.id === val || t.name === val);
    if (fromTransporters) return fromTransporters.name;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
      console.warn(`Unresolved party ID: ${val}`);
      return `Unresolved ID: ${val.substring(0, 8)}...`;
    }
    return val;
  };

  const fetchBookingOrdersAndConsignments = async () => {
    try {
      setLoading(true);
      const [ordersRes, vendorsRes, transportersRes] = await Promise.all([
        getAllBookingOrder(pageIndex + 1, pageSize),
        getAllVendor(),
        getAllTransporter(),
      ]);

      const orders = ordersRes?.data || [];
      const vendorsData = vendorsRes.data?.map((v: any) => ({ id: v.id, name: v.name })) || [];
      const transportersData = transportersRes.data?.map((t: any) => ({ id: t.id, name: t.name })) || [];

      setVendors(vendorsData);
      setTransporters(transportersData);
      setBookingOrders(orders);

      const consignmentsMap: { [orderId: string]: Consignment[] } = {};
      for (const order of orders) {
        const consRes = await getConsignmentsForBookingOrder(order.id, 1, 100);
        consignmentsMap[order.id] = consRes?.data?.map((c: any) => ({
          ...c,
          consignor: resolvePartyName(c.consignor),
          consignee: resolvePartyName(c.consignee),
          orderNo: order.orderNo,
        })) || [];
      }
      setConsignments(consignmentsMap);
    } catch (error) {
      toast('Failed to fetch data', { type: 'error' });
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsignments = async (orderId: string) => {
    try {
      const order = bookingOrders.find((o) => o.id === orderId);
      if (!order) return;

      if (!consignments[orderId]) {
        setFetchingConsignments((prev) => ({ ...prev, [orderId]: true }));
        const response = await getConsignmentsForBookingOrder(orderId, 1, 100);
        const notes = response?.data?.map((c: any) => ({
          ...c,
          consignor: resolvePartyName(c.consignor),
          consignee: resolvePartyName(c.consignee),
          orderNo: order.orderNo,
        })) || [];
        setConsignments((prev) => ({ ...prev, [orderId]: notes }));
        setBookingOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, relatedConsignments: notes } : o))
        );
      }
    } catch (error) {
      toast('Failed to fetch consignments', { type: 'error' });
      console.error('Error fetching consignments:', error);
    } finally {
      setFetchingConsignments((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  useEffect(() => {
    fetchBookingOrdersAndConsignments();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    let filtered = bookingOrders;
    if (selectedStatusFilter !== 'All') {
      filtered = bookingOrders.filter((order) => order.status === selectedStatusFilter);
    }
    setFilteredBookingOrders(filtered);
  }, [bookingOrders, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchBookingOrdersAndConsignments();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteBookingOrder(deleteId);
      setOpenDelete(false);
      toast('Booking Order Deleted Successfully', { type: 'success' });
      fetchBookingOrdersAndConsignments();
    } catch (error) {
      toast('Failed to delete booking order', { type: 'error' });
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

  const handleRowClick = async (orderId: string) => {
    if (selectedOrderIds.includes(orderId)) {
      return;
    }
    setSelectedOrderIds([orderId]);
    setSelectedRowId(orderId);
    setSelectedOrderForFiles(orderId);
    await fetchConsignments(orderId);
    const selectedOrder = bookingOrders.find((order) => order.id === orderId);
    setSelectedBulkStatus(selectedOrder?.status || null);
  };

  const handleRowDoubleClick = (orderId: string) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds([]);
      setSelectedRowId(null);
      setSelectedBulkStatus(null);
      setSelectedOrderForFiles(null);
    }
  };

  const handleCheckboxChange = async (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds([orderId]);
      setSelectedRowId(orderId);
      setSelectedOrderForFiles(orderId);
      if (!consignments[orderId]) {
        await fetchConsignments(orderId);
      }
    } else {
      setSelectedOrderIds([]);
      setSelectedRowId(null);
      setSelectedOrderForFiles(null);
    }
    const selectedOrder = bookingOrders.find((order) => order.id === orderId);
    setSelectedBulkStatus(checked ? selectedOrder?.status || null : null);
  };

  const handleFileUploadClick = () => {
    if (!selectedOrderForFiles) {
      toast('Please select an order first', { type: 'warning' });
      return;
    }
    
    // Load existing files from the selected order if available
    const selectedOrder = bookingOrders.find((o) => o.id === selectedOrderForFiles);
    if (selectedOrder?.files && !orderFiles[selectedOrderForFiles]) {
      // Parse the comma-separated URLs and create file objects
      const existingFiles = selectedOrder.files.split(',').map((url: string, index: number) => {
        const fileName = url.split('/').pop() || `file-${index + 1}`;
        return {
          id: `existing-${index}`,
          name: fileName,
          url: url.trim(),
          type: url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
        };
      });
      setOrderFiles((prev) => ({
        ...prev,
        [selectedOrderForFiles]: existingFiles,
      }));
    }
    
    setOpenFileUploadModal(true);
  };

  // Upload files to Cloudinary using /api/upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedOrderForFiles || files.length === 0) {
      toast('No files selected', { type: 'warning' });
      return;
    }

    setLoading(true);
    toast(`Uploading ${files.length} file(s)...`, { type: 'info' });

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        console.log('Uploading file:', file.name, 'Size:', file.size);

        // Send file to /api/upload, which uploads to Cloudinary
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error(`Upload failed for ${file.name}: ${errorText}`);
        }

        const { url } = await response.json();
        console.log('Upload successful:', url);

        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url, // Cloudinary secure URL
          type: file.type,
        };
      });

      const newFiles = await Promise.all(uploadPromises);

      setOrderFiles((prev) => ({
        ...prev,
        [selectedOrderForFiles]: [...(prev[selectedOrderForFiles] || []), ...newFiles],
      }));

      toast(`${files.length} file(s) uploaded to Cloudinary!`, { type: 'success' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast('Upload failed', { type: 'error' });
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save Cloudinary URLs to backend using updateBookingOrderFiles
  const handleSaveFilesToBackend = async () => {
    if (!selectedOrderForFiles || orderFiles[selectedOrderForFiles]?.length === 0) {
      toast('No files to save', { type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      // Join Cloudinary URLs into a comma-separated string
      const urls = orderFiles[selectedOrderForFiles].map((f) => f.url).join(',');
      
      console.log('Saving files to backend:', { id: selectedOrderForFiles, files: urls });

      // Update the `files` field using updateBookingOrderFiles
      await updateBookingOrderFiles({ id: selectedOrderForFiles, files: urls });

      toast('Files saved to backend successfully!', { type: 'success' });
      setOpenFileUploadModal(false);
      setSelectedOrderForFiles(null);
      
      // Refresh the data to reflect the changes
      await fetchBookingOrdersAndConsignments();
    } catch (error) {
      toast('Failed to save files', { type: 'error' });
      console.error('Save files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleRemoveFile = (orderId: string, fileId: string) => {
    setOrderFiles((prev) => ({
      ...prev,
      [orderId]: prev[orderId].filter((file) => file.id !== fileId),
    }));
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) {
      toast('Please select at least one order', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      const updatePromises = selectedOrderIds.map((id) =>
        updateBookingOrderStatus({ id, status: newStatus })
      );
      await Promise.all(updatePromises);
      setSelectedBulkStatus(newStatus);
      setSelectedOrderIds([]);
      setSelectedRowId(null);
      setSelectedOrderForFiles(null);
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
      toast(`Booking Order Status Updated to ${newStatus}`, { type: 'success' });
      await fetchBookingOrdersAndConsignments();
    } catch (error) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = selectedOrderIds.length > 0
      ? filteredBookingOrders.filter((order) => selectedOrderIds.includes(order.id))
      : filteredBookingOrders;

    if (dataToExport.length === 0) {
      toast('No orders to export', { type: 'warning' });
      return;
    }

    const formattedData = dataToExport.flatMap((order) => {
      const cons = consignments[order.id] || [];

      if (cons.length === 0) {
        return [{
          'Order No': order.orderNo || '-',
          'Order Date': order.orderDate || '-',
          'Company': order.company || '-',
          'Branch': order.branch || '-',
          'Order Status': order.status || 'Prepared',
          'Remarks': order.remarks || '-',
          'Bilty No': '-',
          'Receipt No': '-',
          'Consignor': '-',
          'Consignee': '-',
          'Item': '-',
          'Qty': '-',
          'Total Amount': '-',
          'Recv. Amount': '-',
          'Del. Date': '-',
          'Consignment Status': '-',
          'Files': (orderFiles[order.id] || []).map((f) => f.name).join(', ') || '-',
        }];
      }

      return cons.map((c, index) => ({
        'Order No': index === 0 ? order.orderNo || '-' : '',
        'Order Date': index === 0 ? order.orderDate || '-' : '',
        'Company': index === 0 ? order.company || '-' : '',
        'Branch': index === 0 ? order.branch || '-' : '',
        'Order Status': index === 0 ? order.status || 'Prepared' : '',
        'Remarks': index === 0 ? order.remarks || '-' : '',
        'Bilty No': c.biltyNo || '-',
        'Receipt No': c.receiptNo || '-',
        'Consignor': c.consignor || '-',
        'Consignee': c.consignee || '-',
        'Item': c.item || '-',
        'Qty': c.qty || '-',
        'Total Amount': c.totalAmount || '-',
        'Recv. Amount': c.receivedAmount || '-',
        'Del. Date': c.deliveryDate || '-',
        'Consignment Status': c.status || '-',
        'Files': index === 0 ? (orderFiles[order.id] || []).map((f) => f.name).join(', ') || '-' : '',
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BookingOrders');
    XLSX.writeFile(workbook, 'BookingOrders.xlsx');
  };

  const openPdfDialog = () => setOpenPdfModal(true);
  const closePdfDialog = () => setOpenPdfModal(false);

  const handleGenerateReceivablePdf = () => {
    try {
      const targetOrders = filteredBookingOrders.filter((o) => {
        const cons = consignments[o.id] || [];
        return cons.every((c) => !c.biltyNo || c.biltyNo.trim() === '');
      });

      if (targetOrders.length === 0) {
        toast('No receivable entries found (all have Bilty No)', { type: 'info' });
        return;
      }

      const rows = targetOrders.map((o) => ({
        orderNo: o.orderNo,
        orderDate: o.orderDate,
        vehicleNo: o.vehicleNo,
        consignor: consignments[o.id]?.[0]?.consignor || '-',
        consignee: consignments[o.id]?.[0]?.consignee || '-',
        carrier: o.transporter,
        vendor: o.vendor,
        departure: o.fromLocation,
        destination: o.toLocation,
        vehicleType: o.vehicleType,
      }));

      exportBiltiesReceivableToPDF({ rows, startDate: pdfStartDate, endDate: pdfEndDate });
      closePdfDialog();
    } catch (e) {
      toast('Failed to generate PDF', { type: 'error' });
    }
  };

  const handleGenerateGeneralPdf = () => {
    try {
      const pageData = filteredBookingOrders;
      if (pageData.length === 0) {
        toast('No orders to export', { type: 'info' });
        return;
      }
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('AL NASAR BASHEER LOGISTICS', pageWidth / 2, 42, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Booking Orders (All)', pageWidth / 2, 70, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const startText = `Start From: ${pdfStartDate || '-'}`;
      const toText = `To Date: ${pdfEndDate || '-'}`;
      const nowText = `Report: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      doc.text(startText, 40, 96, { align: 'left' });
      doc.text(toText, pageWidth / 2, 96, { align: 'center' });
      doc.text(nowText, pageWidth - 40, 96, { align: 'right' });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(40, 108, pageWidth - 40, 108);

      const head = [
        [
          'Serial',
          'Order No',
          'ABL Date',
          'Vehicle No',
          'Bilty No',
          'Bilty Amount',
          'Article',
          'Qty',
          'Departure',
          'Destination',
          'Vendor',
          'Carrier',
          'Consignor',
          'Consignee',
          'Files',
        ],
      ];
      const body = pageData.map((o, idx) => {
        const cons = consignments[o.id]?.[0] || undefined;
        const ablDate = o.orderDate ? formatABLDate(o.orderDate) : '-';
        const vehicleNo = o.vehicleNo || '-';
        const biltyNo = cons ? cons.biltyNo || '-' : '-';
        const biltyAmount = cons ? cons.totalAmount || '-' : '-';
        const article = cons ? cons.item || '-' : '-';
        const qty = cons ? cons.qty || '-' : '-';
        const departure = o.fromLocation || '-';
        const destination = o.toLocation || '-';
        const vendor = o.vendor || '-';
        const carrier = o.transporter || '-';
        const consignor = cons ? cons.consignor || '-' : '-';
        const consignee = cons ? cons.consignee || '-' : '-';
        const files = (orderFiles[o.id] || []).map((f) => f.name).join(', ') || '-';
        return [
          idx + 1,
          o.orderNo || '-',
          ablDate,
          vehicleNo,
          biltyNo,
          biltyAmount,
          article,
          qty,
          departure,
          destination,
          vendor,
          carrier,
          consignor,
          consignee,
          files,
        ];
      });

      autoTable(doc, {
        startY: 120,
        head,
        body,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, lineColor: [220, 220, 220], lineWidth: 0.5, textColor: [30, 30, 30] },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10, halign: 'center' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 120, left: 40, right: 40, bottom: 60 },
        theme: 'grid',
        didDrawPage: (d) => {
          const pw = doc.internal.pageSize.getWidth();
          const ph = doc.internal.pageSize.getHeight();
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, ph - 30);
          doc.text(`Page ${d.pageNumber}`, pw - 40, ph - 30, { align: 'right' });
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(40, ph - 50, pw - 40, ph - 50);
        },
      });

      doc.save('BookingOrders_All.pdf');
      closePdfDialog();
    } catch (e) {
      toast('Failed to generate PDF', { type: 'error' });
    }
  };

  return (
    <div className="container mx-auto mt-4 max-w-screen p-6">
      <div className="h-full w-full flex flex-col">
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
            <button
              onClick={fetchBookingOrdersAndConsignments}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              Refresh Data
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-200"
            >
              <FaFileExcel size={18} />
              Download Excel
            </button>
            <button
              onClick={openPdfDialog}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              Bilties Receivable
            </button>
            <button
              onClick={() => router.push('/ablorderreport')}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md transition-all duration-200"
              title="General Report PDF"
            >
              <FaFilePdf size={18} />
              ABL Order Report
            </button>
          </div>
        </div>
        <div>
          <DataTable
            columns={columns(handleDeleteOpen, handleCheckboxChange, selectedOrderIds)}
            data={filteredBookingOrders}
            loading={loading}
            link="/bookingorder/create"
            setPageIndex={setPageIndex}
            pageIndex={pageIndex}
            pageSize={pageSize}
            setPageSize={setPageSize}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
          />
        </div>

        {selectedRowId && (
          <div className="mt-4">
            <OrderProgress
              orderNo={bookingOrders.find((o) => o.id === selectedRowId)?.orderNo}
              bookingStatus={bookingOrders.find((o) => o.id === selectedRowId)?.status}
              consignments={consignments[selectedRowId] || []}
              hideBookingOrderInfo
            />
          </div>
        )}

        <div className="space-y-2 h-[10vh]">
          <div className="flex flex-wrap p-3 gap-3">
            {statusOptionsConfig.map((option) => {
              const isSelected = selectedBulkStatus === option.name;
              return (
                <button
                  key={option.id}
                  onClick={() => handleBulkStatusUpdate(option.name)}
                  disabled={updating || !selectedOrderIds.length}
                  className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                    ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                    ${updating || !selectedOrderIds.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-sm font-semibold text-center">{option.name}</span>
                  {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
                </button>
              );
            })}
            <button
              onClick={handleFileUploadClick}
              disabled={!selectedOrderIds.length}
              className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                ${selectedOrderIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-500' : 'border-gray-300 bg-white text-gray-700 opacity-50 cursor-not-allowed'}`}
            >
              <span className="text-sm font-semibold text-center">Upload Files</span>
              {selectedOrderIds.length && <FaFileUpload className="text-blue-500 animate-bounce" size={18} />}
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

        {openPdfModal && (
          <div
            id="pdfModal"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.id === 'pdfModal') closePdfDialog();
            }}
          >
            <div className="bg-white rounded shadow p-5 w-full max-w-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Bilties Receivable</h3>
                <button onClick={closePdfDialog} className="text-gray-500 hover:text-black">✕</button>
              </div>
              <div className="space-y-3">
                <CustomSingleDatePicker
                  label="Start From"
                  selectedDate={pdfStartDate}
                  onChange={setPdfStartDate}
                  name="startDate"
                />
                <CustomSingleDatePicker
                  label="To Date"
                  selectedDate={pdfEndDate}
                  onChange={setPdfEndDate}
                  name="endDate"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closePdfDialog} className="px-4 py-2 rounded border">Cancel</button>
                  <button onClick={handleGenerateGeneralPdf} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">General PDF</button>
                  <button onClick={handleGenerateReceivablePdf} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">Bilties Receivable</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {openFileUploadModal && selectedOrderForFiles && (
          <div
            id="fileUploadModal"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.id === 'fileUploadModal') {
                setOpenFileUploadModal(false);
                setSelectedOrderForFiles(null);
              }
            }}
          >
            <div className="bg-white rounded shadow p-5 w-full max-w-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  Files for Order {bookingOrders.find((o) => o.id === selectedOrderForFiles)?.orderNo || ''}
                </h3>
                <button
                  onClick={() => {
                    setOpenFileUploadModal(false);
                    setSelectedOrderForFiles(null);
                  }}
                  className="text-gray-500 hover:text-black"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                  max={10}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {orderFiles[selectedOrderForFiles]?.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                    <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {orderFiles[selectedOrderForFiles].map((file) => (
                        <li key={file.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {file.type.startsWith('image/') && (
                              <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded" />
                            )}
                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewFile(file.url)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <FaEye size={18} />
                            </button>
                            <button
                              onClick={() => handleRemoveFile(selectedOrderForFiles, file.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove"
                            >
                              <FaTrash size={18} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No files uploaded yet.</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setOpenFileUploadModal(false);
                      setSelectedOrderForFiles(null);
                    }}
                    className="px-4 py-2 rounded border"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add More
                  </button>
                  <button
                    onClick={handleSaveFilesToBackend}
                    disabled={orderFiles[selectedOrderForFiles]?.length === 0}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    Save Files to Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingOrderList;
