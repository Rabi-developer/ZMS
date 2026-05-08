'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFilePdf, FaFileUpload, FaEye, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllBookingOrder,
  deleteBookingOrder,
  updateBookingOrderStatus,
  getConsignmentsForBookingOrder,
  updateBookingOrderFiles,
} from '@/apis/bookingorder';
import { getAllVendor } from '@/apis/vendors';
import { getAllTransporter } from '@/apis/transporter';
import { getAllCustomers } from '@/apis/customer';
import { getAllPartys } from '@/apis/party';
import { columns, BookingOrder } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { exportBiltiesReceivableToPDF } from '@/components/ablsoftware/Maintance/common/BiltiesReceivablePdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermissions } from '@/contexts/PermissionContext';
import { WithTablePermission } from '@/components/permissions/PermissionTableActions';

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
  consignmentNo: string;
}

interface ExtendedBookingOrder extends BookingOrder {
  relatedConsignments?: Consignment[];
  vehicleType?: string;
}

interface DropdownOption { id: string; name: string; }

interface UploadedFile { id: string; name: string; url: string; type: string; }

const getLookupName = (item: any): string =>
  item?.name || item?.vendorName || item?.VendorName || item?.transporterName ||
  item?.TransporterName || item?.customerName || item?.CustomerName ||
  item?.partyName || item?.PartyName || item?.title || item?.Title || '-';

const statusOptionsConfig = [
  { id: 1, name: 'Prepared',   color: 'blue'   },
  { id: 2, name: 'Approved',   color: 'green'  },
  { id: 3, name: 'Canceled',   color: 'red'    },
  { id: 4, name: 'UnApproved', color: 'amber'  },
  { id: 5, name: 'Closed',     color: 'gray'   },
];

const statusColorMap: Record<string, string> = {
  blue:  'border-blue-500 bg-blue-50 text-blue-700',
  green: 'border-green-500 bg-green-50 text-green-700',
  red:   'border-red-500 bg-red-50 text-red-700',
  amber: 'border-amber-500 bg-amber-50 text-amber-700',
  gray:  'border-gray-400 bg-gray-100 text-gray-700',
};

const formatABLDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `ABL/${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()%100}`;
};

const BookingOrderList = () => {
  const { canRead, isSuperAdmin } = usePermissions();
  const canAccessBookingOrders = isSuperAdmin || canRead('BookingOrder');

  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bookingOrders, setBookingOrders]               = useState<ExtendedBookingOrder[]>([]);
  const [filteredOrders, setFilteredOrders]             = useState<ExtendedBookingOrder[]>([]);
  const [consignments, setConsignments]                 = useState<{ [id: string]: Consignment[] }>({});
  const [vendors, setVendors]                           = useState<DropdownOption[]>([]);
  const [transporters, setTransporters]                 = useState<DropdownOption[]>([]);
  const [customers, setCustomers]                       = useState<DropdownOption[]>([]);
  const [parties, setParties]                           = useState<DropdownOption[]>([]);
  const [loading, setLoading]                           = useState(false);
  const [openDelete, setOpenDelete]                     = useState(false);
  const [deleteId, setDeleteId]                         = useState('');
  const [pageIndex, setPageIndex]                       = useState(0);
  const [pageSize, setPageSize]                         = useState(10);
  const [totalRows, setTotalRows]                       = useState(0);
  const [statusFilter, setStatusFilter]                 = useState('All');
  const [selectedOrderIds, setSelectedOrderIds]         = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus]     = useState<string | null>(null);
  const [updating, setUpdating]                         = useState(false);
  const [selectedRowId, setSelectedRowId]               = useState<string | null>(null);
  const [orderFiles, setOrderFiles]                     = useState<{ [id: string]: UploadedFile[] }>({});
  const [selectedOrderForFiles, setSelectedOrderForFiles] = useState<string | null>(null);
  const [openFileModal, setOpenFileModal]               = useState(false);
  const [openPdfModal, setOpenPdfModal]                 = useState(false);
  const [pdfStartDate, setPdfStartDate]                 = useState('');
  const [pdfEndDate, setPdfEndDate]                     = useState('');

  const resolvePartyName = useCallback((val?: string, cData = customers, pData = parties, vData = vendors, tData = transporters): string => {
    if (!val) return '-';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) return val;
    return cData.find(c => c.id === val)?.name
      || pData.find(p => p.id === val)?.name
      || vData.find(v => v.id === val)?.name
      || tData.find(t => t.id === val)?.name
      || `ID:${val.substring(0,8)}…`;
  }, [customers, parties, vendors, transporters]);

  const handlePageIndexChange = useCallback((v: React.SetStateAction<number>) => {
    setPageIndex(typeof v === 'function' ? v(pageIndex) : v);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((v: React.SetStateAction<number>) => {
    setPageSize(typeof v === 'function' ? v(pageSize) : v);
    setPageIndex(0);
  }, [pageSize]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, vendorsRes, transportersRes, customersRes, partiesRes] = await Promise.all([
        getAllBookingOrder(pageIndex + 1, pageSize),
        getAllVendor(1, 1000),
        getAllTransporter(1, 1000),
        getAllCustomers(1, 1000).catch(() => ({ data: [] })),
        getAllPartys(1, 1000).catch(() => ({ data: [] })),
      ]);

      const vData = vendorsRes.data?.map((v: any) => ({ id: v.id, name: getLookupName(v) })) || [];
      const tData = transportersRes.data?.map((t: any) => ({ id: t.id, name: getLookupName(t) })) || [];
      const cData = customersRes?.data?.map((c: any) => ({ id: c.id, name: getLookupName(c) })) || [];
      const pData = partiesRes?.data?.map((p: any) => ({ id: p.id, name: getLookupName(p) })) || [];

      setVendors(vData); setTransporters(tData); setCustomers(cData); setParties(pData);

      const resolve = (val?: string) => resolvePartyName(val, cData, pData, vData, tData);

      const orders = (ordersRes?.data || []).map((o: any) => ({
        ...o,
        vendor: resolve(o.vendor),
        transporter: resolve(o.transporter),
      }));

      setBookingOrders(orders);
      if (ordersRes.misc) setTotalRows(ordersRes.misc.total || 0);

      const consMap: { [id: string]: Consignment[] } = {};
      for (const order of ordersRes?.data || []) {
        const res = await getConsignmentsForBookingOrder(order.id, 1, 100, { includeDetails: true });
        consMap[order.id] = (res?.data || []).map((c: any) => ({
          ...c,
          consignor: resolve(c.consignor || c.consignorId || c.Consignor),
          consignee: resolve(c.consignee || c.consigneeId || c.Consignee),
          biltyNo: c.biltyNo || c.BiltyNo || c.biltyNumber || c.consignmentNo || '',
          qty: c.qty || c.quantity || 0,
          status: c.status || 'Pending',
          totalAmount: c.totalAmount || '',
          receivedAmount: c.receivedAmount || '',
          deliveryDate: c.deliveryDate || '',
          receiptNo: c.receiptNo || '',
        }));
      }
      setConsignments(consMap);
    } catch (e) {
      toast('Failed to fetch data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, resolvePartyName]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    setFilteredOrders(statusFilter === 'All' ? bookingOrders : bookingOrders.filter(o => o.status === statusFilter));
  }, [bookingOrders, statusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchAll();
      const url = new URL(window.location.href);
      url.searchParams.delete('refresh');
      router.replace(url.pathname);
    }
  }, [searchParams, router, fetchAll]);

  const handleDelete = async () => {
    try {
      await deleteBookingOrder(deleteId);
      setOpenDelete(false);
      toast('Booking Order Deleted', { type: 'success' });
      fetchAll();
    } catch { toast('Failed to delete', { type: 'error' }); }
  };

  const handleRowClick = async (orderId: string) => {
    setSelectedRowId(orderId);
    setSelectedOrderForFiles(orderId);
    if (!selectedOrderIds.includes(orderId)) setSelectedOrderIds(prev => [...prev, orderId]);
    const order = bookingOrders.find(o => o.id === orderId);
    setSelectedBulkStatus(order?.status || null);
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
      setSelectedOrderIds(prev => [...prev, orderId]);
      setSelectedRowId(orderId);
      setSelectedOrderForFiles(orderId);
    } else {
      const next = selectedOrderIds.filter(id => id !== orderId);
      setSelectedOrderIds(next);
      if (next.length === 0) { setSelectedRowId(null); setSelectedOrderForFiles(null); }
    }
    const order = bookingOrders.find(o => o.id === orderId);
    setSelectedBulkStatus(checked ? order?.status || null : null);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!selectedOrderIds.length) { toast('Select at least one order', { type: 'warning' }); return; }
    try {
      setUpdating(true);
      await Promise.all(selectedOrderIds.map(id => updateBookingOrderStatus({ id, status: newStatus })));
      setSelectedBulkStatus(newStatus);
      setSelectedOrderIds([]);
      setSelectedRowId(null);
      setSelectedOrderForFiles(null);
      toast(`Status updated to ${newStatus}`, { type: 'success' });
      await fetchAll();
    } catch { toast('Failed to update status', { type: 'error' }); }
    finally { setUpdating(false); }
  };

  const handleFileUploadClick = () => {
    if (!selectedOrderForFiles) { toast('Select an order first', { type: 'warning' }); return; }
    const order = bookingOrders.find(o => o.id === selectedOrderForFiles);
    if (order?.files && !orderFiles[selectedOrderForFiles]) {
      const existing = order.files.split(',').map((url: string, i: number) => ({
        id: `existing-${i}`, name: url.split('/').pop() || `file-${i+1}`,
        url: url.trim(), type: url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
      }));
      setOrderFiles(prev => ({ ...prev, [selectedOrderForFiles]: existing }));
    }
    setOpenFileModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedOrderForFiles || !files.length) return;
    setLoading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(async file => {
        const fd = new FormData(); fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`Upload failed: ${file.name}`);
        const { url } = await res.json();
        return { id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`, name: file.name, url, type: file.type };
      }));
      setOrderFiles(prev => ({ ...prev, [selectedOrderForFiles]: [...(prev[selectedOrderForFiles] || []), ...uploaded] }));
      toast(`${files.length} file(s) uploaded`, { type: 'success' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch { toast('Upload failed', { type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleSaveFiles = async () => {
    if (!selectedOrderForFiles || !orderFiles[selectedOrderForFiles]?.length) { toast('No files to save', { type: 'warning' }); return; }
    try {
      setLoading(true);
      const urls = orderFiles[selectedOrderForFiles].map(f => f.url).join(',');
      await updateBookingOrderFiles({ id: selectedOrderForFiles, files: urls });
      toast('Files saved', { type: 'success' });
      setOpenFileModal(false);
      await fetchAll();
    } catch { toast('Failed to save files', { type: 'error' }); }
    finally { setLoading(false); }
  };

  const exportToExcel = () => {
    const data = selectedOrderIds.length
      ? filteredOrders.filter(o => selectedOrderIds.includes(o.id))
      : filteredOrders;
    if (!data.length) { toast('No orders to export', { type: 'warning' }); return; }

    type ExcelRow = {
      'Order No': string; 'Status': string; 'Vehicle No': string;
      'Bilty No': string; 'Consignor': string; 'Consignee': string;
      'Qty': string | number; 'Total': string; 'Received': string;
      'Vendor'?: string; 'Transporter'?: string; 'From'?: string; 'To'?: string;
    };

    const rows: ExcelRow[] = data.flatMap(order => {
      const cons = consignments[order.id] || [];
      if (!cons.length) return [{
        'Order No': order.orderNo || '-', 'Status': order.status || '-',
        'Vehicle No': order.vehicleNo || '-', 'Bilty No': '-',
        'Consignor': '-', 'Consignee': '-', 'Qty': '-', 'Total': '-', 'Received': '-',
        'Vendor': order.vendor || '-', 'Transporter': order.transporter || '-',
        'From': order.fromLocation || '-', 'To': order.toLocation || '-',
      }];
      return cons.map((c, i) => ({
        'Order No': i === 0 ? order.orderNo || '-' : '',
        'Status': i === 0 ? order.status || '-' : '',
        'Vehicle No': i === 0 ? order.vehicleNo || '-' : '',
        'Bilty No': c.biltyNo || '-', 'Consignor': c.consignor || '-',
        'Consignee': c.consignee || '-', 'Qty': c.qty || '-',
        'Total': c.totalAmount || '-', 'Received': c.receivedAmount || '-',
      }));
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BookingOrders');
    XLSX.writeFile(wb, 'BookingOrders.xlsx');
  };

  const handleGenerateReceivablePdf = () => {
    const targets = filteredOrders.filter(o => {
      const cons = consignments[o.id] || [];
      return cons.every(c => !c.biltyNo || c.biltyNo.trim() === '');
    });
    if (!targets.length) { toast('No receivable entries found', { type: 'info' }); return; }
    exportBiltiesReceivableToPDF({
      rows: targets.map(o => ({
        orderNo: o.orderNo, orderDate: o.orderDate, vehicleNo: o.vehicleNo,
        consignor: consignments[o.id]?.[0]?.consignor || '-',
        consignee: consignments[o.id]?.[0]?.consignee || '-',
        carrier: o.transporter, vendor: o.vendor,
        departure: o.fromLocation, destination: o.toLocation, vehicleType: (o as any).vehicleType,
      })),
      startDate: pdfStartDate, endDate: pdfEndDate,
    });
    setOpenPdfModal(false);
  };

  const handleGenerateGeneralPdf = () => {
    if (!filteredOrders.length) { toast('No orders to export', { type: 'info' }); return; }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
    const pw = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica','bold'); doc.setFontSize(18);
    doc.text('AL NASAR BASHEER LOGISTICS', pw/2, 42, { align: 'center' });
    doc.setFontSize(14); doc.text('Booking Orders', pw/2, 70, { align: 'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(80,80,80);
    doc.text(`From: ${pdfStartDate||'-'}`, 40, 96);
    doc.text(`To: ${pdfEndDate||'-'}`, pw/2, 96, { align: 'center' });
    doc.text(`${new Date().toLocaleString()}`, pw-40, 96, { align: 'right' });
    doc.setDrawColor(200,200,200); doc.line(40,108,pw-40,108);
    autoTable(doc, {
      startY: 120,
      head: [['#','Order No','ABL Date','Vehicle No','Bilty No','Amount','Article','Qty','From','To','Vendor','Carrier','Consignor','Consignee']],
      body: filteredOrders.map((o,i) => {
        const c = consignments[o.id]?.[0];
        return [i+1, o.orderNo||'-', formatABLDate(o.orderDate), o.vehicleNo||'-',
          c?.biltyNo||'-', c?.totalAmount||'-', c?.item||'-', c?.qty||'-',
          o.fromLocation||'-', o.toLocation||'-', o.vendor||'-', o.transporter||'-',
          c?.consignor||'-', c?.consignee||'-'];
      }),
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: [200,200,200], textColor: [0,0,0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245,245,245] },
      margin: { top: 120, left: 40, right: 40, bottom: 60 },
      theme: 'grid',
      didDrawPage: (d) => {
        const ph = doc.internal.pageSize.getHeight();
        doc.setFontSize(9); doc.setTextColor(150,150,150);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 40, ph-30);
        doc.text(`Page ${d.pageNumber}`, pw-40, ph-30, { align: 'right' });
      },
    });
    doc.save('BookingOrders.pdf');
    setOpenPdfModal(false);
  };

  if (!canAccessBookingOrders) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-500 mt-1">You don't have permission to view booking orders.</p>
        </div>
      </div>
    );
  }

  const selectedOrder = bookingOrders.find(o => o.id === selectedRowId);

  return (
    <WithTablePermission resource="BookingOrder">
      <div className="flex flex-col bg-gray-50 w-full">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-4 py- bg-white border-b border-gray-200 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">Booking Orders</h1>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {['All','Prepared','Approved','Canceled','UnApproved','Closed'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={fetchAll} className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportToExcel} className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors">
              <FaFileExcel size={13} /> Excel
            </button>
            <button onClick={() => setOpenPdfModal(true)} className="text-xs px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white transition-colors">
              Bilties Receivable
            </button>
            <button onClick={() => router.push('/ablorderreport')} className="flex items-center gap-1.5 text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded transition-colors">
              <FaFilePdf size={13} /> ABL Order Report
            </button>
          </div>
        </div>

        {/* ── DATA TABLE ── */}
        <div className="border-b border-gray-200">
          <DataTable
            columns={columns(id => { setOpenDelete(true); setDeleteId(id); }, handleCheckboxChange, selectedOrderIds)}
            data={filteredOrders}
            loading={loading}
            link="/bookingorder/create"
            setPageIndex={handlePageIndexChange}
            pageIndex={pageIndex}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
            totalRows={totalRows}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
           />
        </div>

        {/* ── STATUS BUTTONS + FILE UPLOAD ── */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">
          {statusOptionsConfig.map(opt => {
            const active = selectedBulkStatus === opt.name;
            const base = statusColorMap[opt.color];
            return (
              <button
                key={opt.id}
                onClick={() => handleBulkStatusUpdate(opt.name)}
                disabled={updating || !selectedOrderIds.length}
                className={`flex items-center gap-1.5 px-4 py-1.5 border-2 rounded-lg text-xs font-semibold transition-all
                  ${active ? base : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}
                  ${updating || !selectedOrderIds.length ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
              >
                {active && <FaCheck size={10} />}
                {opt.name}
              </button>
            );
          })}
          <button
            onClick={handleFileUploadClick}
            disabled={!selectedOrderIds.length}
            className={`flex items-center gap-1.5 px-4 py-1.5 border-2 rounded-lg text-xs font-semibold transition-all
              ${selectedOrderIds.length ? 'border-blue-500 bg-blue-50 text-blue-700 hover:scale-105 active:scale-95' : 'border-gray-200 bg-white text-gray-400 opacity-40 cursor-not-allowed'}`}
          >
            <FaFileUpload size={12} /> Upload Files
          </button>
          {selectedOrder && (
            <span className="ml-auto text-xs text-gray-500 font-medium">
              Selected: <span className="text-gray-800 font-bold">{selectedOrder.orderNo}</span>
              {' · '}{consignments[selectedRowId!]?.length || 0} consignment(s)
            </span>
          )}
        </div>

        {/* ── ORDER PROGRESS ── */}
        <div className="w-full">
          {selectedRowId ? (
            <OrderProgress
              bookingOrderId={selectedRowId}
              orderNo={selectedOrder?.orderNo}
              bookingStatus={selectedOrder?.status}
              consignments={(consignments[selectedRowId] || []).map(c => ({
                ...c, qty: typeof c.qty === 'string' ? parseInt(c.qty) || 0 : c.qty,
              }))}
              bookingOrder={{
                orderNo: selectedOrder?.orderNo || '',
                orderDate: selectedOrder?.orderDate || '',
                vehicleNo: selectedOrder?.vehicleNo || '',
              }}
              hideBookingOrderInfo={true}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
              Click a row to view order progress
            </div>
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRM ── */}
      {openDelete && (
        <DeleteConfirmModel
          handleDeleteclose={() => { setOpenDelete(false); setDeleteId(''); }}
          handleDelete={handleDelete}
          isOpen={openDelete}
        />
      )}

      {/* ── PDF MODAL ── */}
      {openPdfModal && (
        <div
          id="pdfModal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={e => { if ((e.target as HTMLElement).id === 'pdfModal') setOpenPdfModal(false); }}
        >
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Generate PDF</h3>
              <button onClick={() => setOpenPdfModal(false)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
            </div>
            <div className="space-y-3">
              <CustomSingleDatePicker label="Start From" selectedDate={pdfStartDate} onChange={setPdfStartDate} name="startDate" />
              <CustomSingleDatePicker label="To Date"    selectedDate={pdfEndDate}   onChange={setPdfEndDate}   name="endDate" />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setOpenPdfModal(false)} className="px-4 py-2 text-sm rounded border hover:bg-gray-50">Cancel</button>
                <button onClick={handleGenerateGeneralPdf}    className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white">General PDF</button>
                <button onClick={handleGenerateReceivablePdf} className="px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-700 text-white">Bilties Receivable</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FILE UPLOAD MODAL ── */}
      {openFileModal && selectedOrderForFiles && (
        <div
          id="fileModal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={e => { if ((e.target as HTMLElement).id === 'fileModal') { setOpenFileModal(false); setSelectedOrderForFiles(null); } }}
        >
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">
                Files — {bookingOrders.find(o => o.id === selectedOrderForFiles)?.orderNo}
              </h3>
              <button onClick={() => { setOpenFileModal(false); setSelectedOrderForFiles(null); }} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
            </div>
            <input
              type="file" multiple ref={fileInputRef} onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer mb-3"
            />
            <div className="max-h-52 overflow-y-auto space-y-1">
              {(orderFiles[selectedOrderForFiles] || []).map(file => (
                <div key={file.id} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded border text-sm">
                  <span className="truncate flex-1">{file.name}</span>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button onClick={() => window.open(file.url,'_blank')} className="text-blue-500 hover:text-blue-700"><FaEye size={13} /></button>
                    <button onClick={() => setOrderFiles(prev => ({ ...prev, [selectedOrderForFiles]: prev[selectedOrderForFiles].filter(f => f.id !== file.id) }))} className="text-red-500 hover:text-red-700"><FaTrash size={13} /></button>
                  </div>
                </div>
              ))}
              {!orderFiles[selectedOrderForFiles]?.length && (
                <p className="text-center text-gray-400 text-xs py-4">No files attached</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpenFileModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Close</button>
              <button onClick={handleSaveFiles} disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving…' : 'Save Files'}
              </button>
            </div>
          </div>
        </div>
      )}

    </WithTablePermission>
  );
};

export default BookingOrderList;
