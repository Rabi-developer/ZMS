'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFileUpload, FaEye, FaTrash, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllConsignment,
  deleteConsignment,
  updateConsignmentStatus,
  getSingleConsignment,
  updateConsignmentFiles,
} from '@/apis/consignment';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllCustomers } from '@/apis/customer';
import { getAllPartys } from '@/apis/party';
import { getAllVendor } from '@/apis/vendors';
import { getAllTransporter } from '@/apis/transporter';
import { columns, Consignment } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface PartyOption {
  id: string;
  name: string;
}

const ConsignmentList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [filteredConsignments, setFilteredConsignments] = useState<Consignment[]>([]);
  const [consignmentsWithItems, setConsignmentsWithItems] = useState<{ [id: string]: any }>({});
  const [loadingItems, setLoadingItems] = useState<{ [id: string]: boolean }>({});

  const [customers, setCustomers] = useState<PartyOption[]>([]);
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [vendors, setVendors] = useState<PartyOption[]>([]);
  const [transporters, setTransporters] = useState<PartyOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedConsignmentIds, setSelectedConsignmentIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // File Upload States
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedConsignmentForFiles, setSelectedConsignmentForFiles] = useState<string | null>(null);
  const [consignmentFiles, setConsignmentFiles] = useState<{ [consignmentId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Canceled', 'Closed', 'UnApproved', 'Approved'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#f59e0b' },
    { id: 2, name: 'Canceled', color: '#ef4444' },
    { id: 3, name: 'Closed', color: '#6b7280' },
    { id: 4, name: 'UnApproved', color: '#10b981' },
    { id: 5, name: 'Approved', color: '#3b82f6' },
  ];

  const resolvePartyName = (
    id?: string,
    lists?: {
      customers: PartyOption[];
      parties: PartyOption[];
      vendors: PartyOption[];
      transporters: PartyOption[];
    }
  ): string => {
    if (!id || id.trim() === '') return '-';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
    const srcCustomers = lists?.customers ?? customers;
    const srcParties = lists?.parties ?? parties;
    const srcVendors = lists?.vendors ?? vendors;
    const srcTransporters = lists?.transporters ?? transporters;

    const found =
      srcCustomers.find(c => c.id === id) ||
      srcParties.find(p => p.id === id) ||
      srcVendors.find(v => v.id === id) ||
      srcTransporters.find(t => t.id === id);
    return found ? found.name : `ID: ${id.substring(0, 8)}...`;
  };

  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    const resolved = typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex;
    setPageIndex(resolved);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    const resolved = typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize;
    setPageSize(resolved);
    setPageIndex(0);
  }, [pageSize]);

  const fetchConsignmentDetails = useCallback(async (consignmentId: string) => {
    if (consignmentsWithItems[consignmentId] || loadingItems[consignmentId]) return;
    try {
      setLoadingItems(prev => ({ ...prev, [consignmentId]: true }));
      const response = await getSingleConsignment(consignmentId);
      if (response?.data) {
        setConsignmentsWithItems(prev => ({ ...prev, [consignmentId]: response.data }));
        setConsignments(prev => prev.map(c => c.id === consignmentId ? { ...c, items: response.data.items } : c));
        setFilteredConsignments(prev => prev.map(c => c.id === consignmentId ? { ...c, items: response.data.items } : c));
      }
    } catch (error) {
      console.error('Error fetching consignment details:', error);
      toast.error('Failed to load consignment details');
    } finally {
      setLoadingItems(prev => ({ ...prev, [consignmentId]: false }));
    }
  }, [consignmentsWithItems, loadingItems]);

  const fetchConsignments = useCallback(async () => {
    try {
      setLoading(true);
      const [consRes, custRes, partyRes, vendRes, transRes] = await Promise.all([
        getAllConsignment(pageIndex + 1, pageSize, selectedStatusFilter !== 'All' ? { status: selectedStatusFilter } : {}),
        getAllCustomers(1, 1000).catch(() => ({ data: [] })),
        getAllPartys(1, 1000).catch(() => ({ data: [] })),
        getAllVendor(1, 1000).catch(() => ({ data: [] })),
        getAllTransporter(1, 1000).catch(() => ({ data: [] })),
      ]);

      const customersData = custRes?.data?.map((c: any) => ({ id: c.id, name: c.name || c.customerName || c.title || '-' })) || [];
      const partiesData = partyRes?.data?.map((p: any) => ({ id: p.id, name: p.name || p.partyName || p.title || '-' })) || [];
      const vendorsData = vendRes?.data?.map((v: any) => ({ id: v.id, name: v.name || v.vendorName || v.title || '-' })) || [];
      const transportersData = transRes?.data?.map((t: any) => ({ id: t.id, name: t.name || t.transporterName || t.title || '-' })) || [];

      setCustomers(customersData);
      setParties(partiesData);
      setVendors(vendorsData);
      setTransporters(transportersData);

      if (consRes?.data) {
        const resolved = consRes.data.map((c: any) => ({
          ...c,
          consignor: resolvePartyName(c.consignor || c.consignorId, { customers: customersData, parties: partiesData, vendors: vendorsData, transporters: transportersData }),
          consignee: resolvePartyName(c.consignee || c.consigneeId, { customers: customersData, parties: partiesData, vendors: vendorsData, transporters: transportersData }),
        }));
        setConsignments(resolved);

        const misc = consRes.misc || {};
        const total = misc.total ?? misc.totalCount ?? resolved.length;
        setTotalRows(Number(total) || 0);
        setTotalPages(total && pageSize ? Math.ceil(total / pageSize) : 0);

        if (totalPages > 0 && pageIndex >= totalPages) {
          setPageIndex(Math.max(0, totalPages - 1));
        }
      } else {
        setConsignments([]);
        setTotalRows(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching consignments:', error);
      toast('Failed to fetch consignments', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, selectedStatusFilter]);

  useEffect(() => { fetchConsignments(); }, [fetchConsignments]);
  useEffect(() => { setFilteredConsignments(consignments); }, [consignments]);
  useEffect(() => { setPageIndex(0); }, [selectedStatusFilter]);
  useEffect(() => {
    if (totalPages > 0 && pageIndex >= totalPages) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [totalPages, pageIndex]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchConsignments();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteConsignment(deleteId);
      setOpenDelete(false);
      toast('Consignment Deleted Successfully', { type: 'success' });
      fetchConsignments();
    } catch (error) {
      toast('Failed to delete consignment', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => { setOpenDelete(true); setDeleteId(id); };
  const handleDeleteClose = () => { setOpenDelete(false); setDeleteId(''); };

  const handleRowClick = async (consignmentId: string) => {
    if (selectedConsignmentIds.includes(consignmentId)) return;
    setSelectedConsignmentIds([consignmentId]);
    setSelectedRowId(consignmentId);
    setSelectedConsignmentForFiles(consignmentId);
    await fetchConsignmentDetails(consignmentId);

    const consignment = consignments.find(c => c.id === consignmentId);
    if (consignment?.orderNo) {
      try {
        const res = await getAllBookingOrder(1, 100, { orderNo: consignment.orderNo });
        const booking = res?.data.find((b: any) => b.orderNo === consignment.orderNo);
        setBookingStatus(booking?.status || null);
      } catch (err) { console.error(err); }
    }
    setSelectedBulkStatus(consignment?.status || null);
  };

  const handleRowDoubleClick = () => {
    setSelectedConsignmentIds([]);
    setSelectedRowId(null);
    setBookingStatus(null);
    setSelectedBulkStatus(null);
    setSelectedConsignmentForFiles(null);
  };

  const handleCheckboxChange = async (consignmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedConsignmentIds([consignmentId]);
      setSelectedRowId(consignmentId);
      setSelectedConsignmentForFiles(consignmentId);
      const consignment = consignments.find(c => c.id === consignmentId);
      if (consignment?.orderNo) {
        try {
          const res = await getAllBookingOrder(1, 100, { orderNo: consignment.orderNo });
          const booking = res?.data.find((b: any) => b.orderNo === consignment.orderNo);
          setBookingStatus(booking?.status || null);
        } catch (err) { console.error(err); }
      }
    } else {
      setSelectedConsignmentIds([]);
      setSelectedRowId(null);
      setBookingStatus(null);
      setSelectedConsignmentForFiles(null);
    }
    setSelectedBulkStatus(checked ? consignments.find(c => c.id === consignmentId)?.status || null : null);
  };

  // === FILE UPLOAD LOGIC (Same as BookingOrderList) ===
  const handleFileUploadClick = () => {
    if (!selectedConsignmentForFiles) {
      toast('Please select a consignment first', { type: 'warning' });
      return;
    }

    const consignment = consignments.find(c => c.id === selectedConsignmentForFiles);
    if (consignment?.files && !consignmentFiles[selectedConsignmentForFiles]) {
      const existingFiles = consignment.files.split(',').map((url: string, i: number) => {
        const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || `file-${i + 1}`);
        const type = name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        return { id: `exist-${i}`, name, url: url.trim(), type };
      });
      setConsignmentFiles(prev => ({ ...prev, [selectedConsignmentForFiles]: existingFiles }));
    }

    setOpenFileUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedConsignmentForFiles) return;

    setLoading(true);
    toast(`Uploading ${files.length} file(s)...`, { type: 'info' });

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error(await res.text());
          const { url } = await res.json();
          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url,
            type: file.type || 'application/octet-stream',
          };
        })
      );

      setConsignmentFiles(prev => ({
        ...prev,
        [selectedConsignmentForFiles]: [...(prev[selectedConsignmentForFiles] || []), ...uploaded],
      }));

      toast('Files uploaded successfully!', { type: 'success' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast('Upload failed: ' + err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilesToBackend = async () => {
    if (!selectedConsignmentForFiles || !consignmentFiles[selectedConsignmentForFiles]?.length) {
      toast('No files to save', { type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const urls = consignmentFiles[selectedConsignmentForFiles].map(f => f.url).join(',');
      await updateConsignmentFiles({ id: selectedConsignmentForFiles, files: urls });
      toast('Files saved to consignment!', { type: 'success' });
      setOpenFileUploadModal(false);
      setSelectedConsignmentForFiles(null);
      await fetchConsignments();
    } catch (err) {
      toast('Failed to save files', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (url: string) => window.open(url, '_blank');
  const handleRemoveFile = (consignmentId: string, fileId: string) => {
    setConsignmentFiles(prev => ({
      ...prev,
      [consignmentId]: prev[consignmentId].filter(f => f.id !== fileId),
    }));
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!selectedConsignmentIds.length) {
      toast('Please select at least one consignment', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      await Promise.all(selectedConsignmentIds.map(id => updateConsignmentStatus({ id, status: newStatus })));
      setSelectedBulkStatus(newStatus);
      setSelectedConsignmentIds([]);
      setSelectedRowId(null);
      setBookingStatus(null);
      setSelectedConsignmentForFiles(null);
      // Keep the current filter selection instead of auto-changing it
      toast('Status updated successfully', { type: 'success' });
      await fetchConsignments();
    } catch (err) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = async () => {
    const data = selectedConsignmentIds.length > 0
      ? filteredConsignments.filter(c => selectedConsignmentIds.includes(c.id))
      : filteredConsignments;

    if (!data.length) {
      toast('No data to export', { type: 'warning' });
      return;
    }

    const rows = data.map(c => {
      const items = consignmentsWithItems[c.id]?.items || c.items || [];
      const desc = Array.isArray(items) ? items.map((i: any) => i.desc).filter(Boolean).join(', ') : '';
      const qty = Array.isArray(items) ? items.map((i: any) => `${i.qty || 0} ${i.qtyUnit || ''}`).join(', ') : '';
      const weight = Array.isArray(items) ? items.map((i: any) => `${i.weight || 0} ${i.weightUnit || ''}`).join(', ') : '';

      return {
        'Receipt No': c.receiptNo || '-',
        'Order No': c.orderNo || '-',
        'Bilty No': c.biltyNo || '-',
        'Consignment No': c.consignmentNo || '-',
        'Consignor': c.consignor || '-',
        'Consignee': c.consignee || '-',
        'Items': desc || 'No items',
        'Qty': qty || '-',
        'Weight': weight || '-',
        'Total Amount': c.totalAmount || '-',
        'Received': c.receivedAmount || '-',
        'Status': c.status || '-',
        'Files': (consignmentFiles[c.id] || []).map(f => f.name).join(', ') || '-',
      };
    });

    // Prefer exceljs for professional styling; fallback to basic XLSX if needed
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Consignments');

      // Page setup for printing
      ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } } as any;

      // Define headers (with Serial column first)
      const headers = [
        'Serial', 'Receipt No', 'Order No', 'Bilty No', 'Consignment No', 'Consignor', 'Consignee',
        'Items', 'Qty', 'Weight', 'Total Amount', 'Received', 'Status', 'Files'
      ];

      // Compact column widths, centered by default
      const widths: number[] = [8, 12, 10, 14, 16, 20, 20, 30, 10, 10, 14, 14, 12, 16];
      ws.columns = headers.map((h, i) => ({ header: h, key: `col${i}`, width: widths[i] }));

      // Insert title rows above header
      const title = 'AL-NASAR BASHEER LOGISTICS';
      const subtitle = 'Consignments Report';
      ws.spliceRows(1, 0, [title]);
      ws.spliceRows(2, 0, [subtitle]);

      const totalCols = headers.length;
      ws.mergeCells(1, 1, 1, totalCols);
      ws.mergeCells(2, 1, 2, totalCols);

      const titleRow = ws.getRow(1);
      titleRow.font = { bold: true, size: 16 } as any;
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' } as any;
      titleRow.height = 20;

      const subtitleRow = ws.getRow(2);
      subtitleRow.font = { bold: true, size: 12 } as any;
      subtitleRow.alignment = { vertical: 'middle', horizontal: 'center' } as any;
      subtitleRow.height = 18;

      // After splicing rows, header is now at row 3
      const headerRow = ws.getRow(3);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FF000000' } } as any;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } as any;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EEF7' } } as any;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF9E9E9E' } },
          left: { style: 'thin', color: { argb: 'FF9E9E9E' } },
          bottom: { style: 'thin', color: { argb: 'FF9E9E9E' } },
          right: { style: 'thin', color: { argb: 'FF9E9E9E' } },
        } as any;
      });
      headerRow.height = 18;

      // Freeze panes below header
      ws.views = [{ state: 'frozen', ySplit: 3 }];

      // Data rows with serial and centered alignment
      let totalAmountSum = 0;
      let receivedSum = 0;
      rows.forEach((r, idx) => {
        const data = headers.map((h) => {
          if (h === 'Serial') return idx + 1;
          return (r as any)[h];
        });
        const added = ws.addRow(data);
        // Update totals
        const ta = (r as any)['Total Amount'];
        const ra = (r as any)['Received'];
        const taNum = typeof ta === 'number' ? ta : parseFloat(String(ta ?? '').replace(/[^0-9.-]/g, ''));
        const raNum = typeof ra === 'number' ? ra : parseFloat(String(ra ?? '').replace(/[^0-9.-]/g, ''));
        if (!isNaN(taNum)) totalAmountSum += taNum;
        if (!isNaN(raNum)) receivedSum += raNum;
      });

      // Style body: borders, alignment, zebra striping, number formats
      ws.eachRow((row, rowNumber) => {
        if (rowNumber <= 3) return; // skip title+header rows
        const isEven = rowNumber % 2 === 0;
        row.eachCell((cell, colNumber) => {
          // Base style
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } as any;
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          } as any;
          if (isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F7' } } as any;
          }
          // Numeric formatting for Qty, Weight, Total Amount, Received
          if (colNumber === 9 || colNumber === 10) {
            const num = parseFloat(String(cell.value ?? '').replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) {
              cell.value = num;
              cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true } as any;
            }
          }
          if (colNumber === 11 || colNumber === 12) {
            const num = parseFloat(String(cell.value ?? '').replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) {
              cell.value = num;
              (cell as any).numFmt = '#,##0.00';
              cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true } as any;
            }
          }
        });
      });

      // Totals row
      const totalsRow = ws.addRow([
        '', '', '', '', '', '', '', 'TOTAL', '', '', totalAmountSum, receivedSum, '', ''
      ]);
      totalsRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true } as any;
        cell.alignment = { vertical: 'middle', horizontal: colNumber >= 11 && colNumber <= 12 ? 'right' : 'center' } as any;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF9E9E9E' } },
          left: { style: 'thin', color: { argb: 'FF9E9E9E' } },
          bottom: { style: 'thin', color: { argb: 'FF9E9E9E' } },
          right: { style: 'thin', color: { argb: 'FF9E9E9E' } },
        } as any;
      });
      const lastCol = headers.length;
      ws.mergeCells(totalsRow.number, 8, totalsRow.number, 9); // merge "TOTAL" label over Items -> Qty
      // Apply number formats to totals
      const totalAmtCell = totalsRow.getCell(11);
      const receivedCell = totalsRow.getCell(12);
      (totalAmtCell as any).numFmt = '#,##0.00';
      (receivedCell as any).numFmt = '#,##0.00';

      // Apply autofilter to header row (row 3)
      ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: lastCol } } as any;

      // Export
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Consignments.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('exceljs not available, falling back to basic XLSX export', err);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Consignments');
      XLSX.writeFile(wb, 'Consignments.xlsx');
    }
  };

  return (
    <div className="container mx-auto mt-4 max-w-screen p-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2">Filter by Status:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={fetchConsignments} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            Refresh
          </button>
        </div>
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          <FaFileExcel size={18} /> Download Excel
        </button>
      </div>

      <DataTable
        columns={columns(handleDeleteOpen, handleCheckboxChange, selectedConsignmentIds)}
        data={filteredConsignments}
        loading={loading}
        link="/consignment/create"
        searchName="consignmentNo"
        setPageIndex={handlePageIndexChange}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        totalRows={totalRows}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />

      {selectedRowId && (
        <div className="mt-6">
          <OrderProgress
            orderNo={consignments.find(c => c.id === selectedRowId)?.orderNo}
            bookingStatus={bookingStatus}
            consignments={consignments
              .filter(c => c.id === selectedRowId)
              .map(c => ({
                ...c,
                items: (consignmentsWithItems[c.id]?.items || c.items || []),
                qty: typeof c.qty === 'string' ? parseFloat(c.qty) || 0 : c.qty,
              }))}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 p-4">
        {statusOptionsConfig.map(opt => {
          const active = selectedBulkStatus === opt.name;
          return (
            <button
              key={opt.id}
              onClick={() => handleBulkStatusUpdate(opt.name)}
              disabled={updating || !selectedConsignmentIds.length}
              className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
                ${active ? `border-[${opt.color}] bg-gradient-to-r from-[${opt.color}]/10 text-[${opt.color}]` : 'border-gray-300 bg-white'}
                ${updating || !selectedConsignmentIds.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {opt.name}
              {active && <FaCheck className="ml-2 animate-bounce" />}
            </button>
          );
        })}
        <button
          onClick={handleFileUploadClick}
          disabled={!selectedConsignmentIds.length}
          className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
            ${selectedConsignmentIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:scale-105' : 'border-gray-300 bg-white opacity-50'}`}
        >
          Upload Files
          {selectedConsignmentIds.length && <FaFileUpload className="ml-2 animate-bounce" />}
        </button>
      </div>

      {openDelete && <DeleteConfirmModel handleDeleteclose={handleDeleteClose} handleDelete={handleDelete} isOpen={openDelete} />}

      {/* === FILE UPLOAD MODAL === */}
      {openFileUploadModal && selectedConsignmentForFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={(e) => e.target === e.currentTarget && setOpenFileUploadModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Files - {consignments.find(c => c.id === selectedConsignmentForFiles)?.consignmentNo || 'Consignment'}
              </h3>
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedConsignmentForFiles(null); }} className="text-3xl text-gray-500 hover:text-gray-800">&times;</button>
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {consignmentFiles[selectedConsignmentForFiles]?.length > 0 ? (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Uploaded Files</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {consignmentFiles[selectedConsignmentForFiles].map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        {file.type.startsWith('image/') && <img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded" />}
                        {file.type.includes('pdf') && <FaFilePdf size={48} className="text-red-600" />}
                        <div>
                          <p className="font-medium truncate max-w-xs">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleViewFile(file.url)} className="text-blue-600 hover:text-blue-800"><FaEye size={20} /></button>
                        <button onClick={() => handleRemoveFile(selectedConsignmentForFiles, file.id)} className="text-red-600 hover:text-red-800"><FaTrash size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-8">No files uploaded yet.</p>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedConsignmentForFiles(null); }} className="px-5 py-2 border rounded hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add More Files
              </button>
              <button
                onClick={handleSaveFilesToBackend}
                disabled={!consignmentFiles[selectedConsignmentForFiles]?.length || loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save to Consignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsignmentList;