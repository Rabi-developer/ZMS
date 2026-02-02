'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFileUpload, FaEye, FaTrash, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllCharges,
  deleteCharges,
  updateChargesStatus,
  updateChargesFiles,
} from '@/apis/charges';
import { getConsignmentsForBookingOrder, getAllBookingOrder } from '@/apis/bookingorder';
import { getAllMunshyana } from '@/apis/munshyana';
import { columns, Charge } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import { exportChargesReportToPDF, ChargeReportRow } from '@/components/ablsoftware/Maintance/common/ChargesReportPdf';
import { exportChargesReportToExcel } from '@/components/ablsoftware/Maintance/common/ChargesReportExcel';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

const ChargesList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [charges, setCharges] = useState<Charge[]>([]);
  const [filteredCharges, setFilteredCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [munshyanas, setMunshyanas] = useState<{ id: string; name: string }[]>([]);

  const getChargeTypeName = useCallback((chargeId: string | number | undefined | null) => {
    if (chargeId === undefined || chargeId === null) return '-';
    const idStr = String(chargeId);
    return munshyanas.find(m => m.id === idStr)?.name || idStr;
  }, [munshyanas]);

  // Reporting States
  const [openReportModal, setOpenReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportFilterType, setReportFilterType] = useState<'All' | 'ChargeType' | 'OrderNo'>('All');
  const [reportSelectedChargeType, setReportSelectedChargeType] = useState('All');
  const [reportSelectedOrderNo, setReportSelectedOrderNo] = useState('All');

  // File Upload States
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedChargeForFiles, setSelectedChargeForFiles] = useState<string | null>(null);
  const [chargeFiles, setChargeFiles] = useState<{ [chargeId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Canceled', 'Closed', 'UnApproved', 'Approved'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#f59e0b' },
    { id: 2, name: 'Approved', color: '#3b82f6' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'Closed', color: '#6b7280' },
    { id: 5, name: 'UnApproved', color: '#10b981' },
  ];

  const handlePageIndexChange = useCallback((newPageIndex: React.SetStateAction<number>) => {
    const resolved = typeof newPageIndex === 'function' ? newPageIndex(pageIndex) : newPageIndex;
    setPageIndex(resolved);
  }, [pageIndex]);

  const handlePageSizeChange = useCallback((newPageSize: React.SetStateAction<number>) => {
    const resolved = typeof newPageSize === 'function' ? newPageSize(pageSize) : newPageSize;
    setPageSize(resolved);
    setPageIndex(0);
  }, [pageSize]);

  const fetchCharges = useCallback(async () => {
    try {
      setLoading(true);
      const apiPageIndex = pageIndex + 1;
      const [response, munRes] = await Promise.all([
        getAllCharges(apiPageIndex, pageSize),
        getAllMunshyana(1, 1000)
      ]);

      if (munRes?.data) {
        setMunshyanas(munRes.data.map((m: any) => ({
          id: String(m.id),
          name: m.chargesDesc || m.name || '-'
        })));
      }

      const transformedCharges = (response?.data || []).map((charge: any) => {
        const lines = charge.lines || [];
        const firstLine = lines.length > 0 ? lines[0] : {};
        const totalAmount = lines.reduce((sum: number, line: any) => sum + (line.amount || 0), 0);

        return {
          ...charge,
          orderNo: charge.orderNo || '-',
          amount: totalAmount.toString(),
          biltyNo: firstLine.biltyNo || '-',
          date: firstLine.date || '-',
          vehicleNo: firstLine.vehicle || '-',
          paidToPerson: firstLine.paidTo || '-',
          contactNo: firstLine.contact || '-',
          remarks: firstLine.remarks || '-',
          status: charge.status || 'Unpaid',
        };
      });

      setCharges(transformedCharges);
      setTotalRows(response.misc?.total || 0);
    } catch (error) {
      console.error('Failed to fetch charges:', error);
      toast('Failed to fetch charges', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => { fetchCharges(); }, [fetchCharges]);

  useEffect(() => {
    const filtered = selectedStatusFilter === 'All'
      ? charges
      : charges.filter(c => c.status === selectedStatusFilter);
    setFilteredCharges(filtered);
  }, [charges, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchCharges();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteCharges(deleteId);
      setOpenDelete(false);
      toast('Charge Deleted Successfully', { type: 'success' });
      fetchCharges();
    } catch (error) {
      toast('Failed to delete charge', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => { setOpenDelete(true); setDeleteId(id); };
  const handleDeleteClose = () => { setOpenDelete(false); setDeleteId(''); };

  const handleRowClick = async (chargeId: string) => {
    // Don't override existing selections - only add if not already selected
    if (!selectedChargeIds.includes(chargeId)) {
      setSelectedChargeIds(prev => [...prev, chargeId]);
    }

    setSelectedRowId(chargeId);
    setSelectedChargeForFiles(chargeId);

    const charge = charges.find(c => c.id === chargeId);
    if (charge?.orderNo && charge.orderNo !== '-') {
      try {
        const bookingRes = await getAllBookingOrder(1, 200, { orderNo: charge.orderNo });
        const bookingOrder = bookingRes?.data?.find((b: any) => String(b.orderNo) === String(charge.orderNo));
        if (bookingOrder?.id) {
          const consRes = await getConsignmentsForBookingOrder(bookingOrder.id, 1, 100);
          setConsignments(consRes?.data || []);
        } else {
          setConsignments([]);
        }
      } catch (err) {
        console.error(err);
        setConsignments([]);
      }
    } else {
      setConsignments([]);
    }

    setSelectedBulkStatus(charge?.status || null);
  };

  const handleRowDoubleClick = () => {
    setSelectedChargeIds([]);
    setSelectedRowId(null);
    setConsignments([]);
    setSelectedBulkStatus(null);
    setSelectedChargeForFiles(null);
  };

  const handleCheckboxChange = async (chargeId: string, checked: boolean) => {
    if (checked) {
      // Add to selection (support multiple selection)
      setSelectedChargeIds(prev => [...prev, chargeId]);
      setSelectedRowId(chargeId);
      setSelectedChargeForFiles(chargeId);

      const charge = charges.find(c => c.id === chargeId);
      if (charge?.orderNo && charge.orderNo !== '-') {
        try {
          const bookingRes = await getAllBookingOrder(1, 200, { orderNo: charge.orderNo });
          const bookingOrder = bookingRes?.data?.find((b: any) => String(b.orderNo) === String(charge.orderNo));
          if (bookingOrder?.id) {
            const consRes = await getConsignmentsForBookingOrder(bookingOrder.id, 1, 100);
            setConsignments(consRes?.data || []);
          }
        } catch (err) { console.error(err); }
      }
    } else {
      // Remove from selection
      const newSelection = selectedChargeIds.filter(id => id !== chargeId);
      setSelectedChargeIds(newSelection);
      
      // Clear everything if no items are selected
      if (newSelection.length === 0) {
        setSelectedRowId(null);
        setConsignments([]);
        setSelectedChargeForFiles(null);
      }
    }
    setSelectedBulkStatus(checked ? charges.find(c => c.id === chargeId)?.status || null : null);
  };

  // === FILE UPLOAD LOGIC (Same as BookingOrderList) ===
  const handleFileUploadClick = () => {
    if (!selectedChargeForFiles) {
      toast('Please select a charge first', { type: 'warning' });
      return;
    }

    const charge = charges.find(c => c.id === selectedChargeForFiles);
    if (charge?.files && !chargeFiles[selectedChargeForFiles]) {
      const existingFiles = charge.files.split(',').map((url: string, i: number) => {
        const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || `file-${i + 1}`);
        const type = name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        return { id: `exist-${i}`, name, url: url.trim(), type };
      });
      setChargeFiles(prev => ({ ...prev, [selectedChargeForFiles]: existingFiles }));
    }

    setOpenFileUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedChargeForFiles) return;

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

      setChargeFiles(prev => ({
        ...prev,
        [selectedChargeForFiles]: [...(prev[selectedChargeForFiles] || []), ...uploaded],
      }));

      toast('Files uploaded to Cloudinary!', { type: 'success' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast('Upload failed: ' + err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilesToBackend = async () => {
    if (!selectedChargeForFiles || !chargeFiles[selectedChargeForFiles]?.length) {
      toast('No files to save', { type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const urls = chargeFiles[selectedChargeForFiles].map(f => f.url).join(',');
      await updateChargesFiles({ id: selectedChargeForFiles, files: urls });
      toast('Files saved to charge successfully!', { type: 'success' });
      setOpenFileUploadModal(false);
      setSelectedChargeForFiles(null);
      await fetchCharges();
    } catch (err) {
      toast('Failed to save files', { type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (url: string) => window.open(url, '_blank');
  const handleRemoveFile = (chargeId: string, fileId: string) => {
    setChargeFiles(prev => ({
      ...prev,
      [chargeId]: prev[chargeId].filter(f => f.id !== fileId),
    }));
  };

  // --- REPORTING LOGIC ---
  const uniqueChargeTypes = useMemo(() => {
    // Build unique list of charge type IDs and their display names
    const typeMap = new Map<string, string>();
    charges.forEach(c => {
      (c.lines || []).forEach((l: any) => {
        if (l.charge) {
          const idStr = String(l.charge);
          if (!typeMap.has(idStr)) {
            typeMap.set(idStr, getChargeTypeName(idStr));
          }
        }
      });
    });
    // Return array of { id, name } sorted by name
    return Array.from(typeMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [charges, getChargeTypeName]);

  const uniqueOrderNos = useMemo(() => {
    const nos = new Set<string>();
    charges.forEach(c => {
      if (c.orderNo && c.orderNo !== '-') nos.add(c.orderNo);
    });
    return Array.from(nos).sort();
  }, [charges]);

  const handleExportReport = async (format: 'PDF' | 'EXCEL') => {
    let filteredRows: ChargeReportRow[] = [];
    const withinDate = (d: string) => {
      if (!reportStartDate && !reportEndDate) return true;
      const dt = new Date(d).getTime();
      const start = reportStartDate ? new Date(reportStartDate).getTime() : 0;
      const end = reportEndDate ? new Date(reportEndDate).getTime() : Infinity;
      return dt >= start && dt <= end;
    };

    if (reportFilterType === 'ChargeType') {
      charges.forEach(c => {
        (c.lines || []).forEach((l: any) => {
          if (withinDate(l.date) && (reportSelectedChargeType === 'All' || String(l.charge) === String(reportSelectedChargeType))) {
            filteredRows.push({
              chargeNo: c.chargeNo,
              chargeName: getChargeTypeName(l.charge),
              date: l.date ? new Date(l.date).toLocaleDateString('en-GB') : '-',
              orderNo: c.orderNo || '',
              vehicleNo: l.vehicle || '-',
              amount: Number(l.amount) || 0
            });
          }
        });
      });
    } else if (reportFilterType === 'OrderNo') {
      const orders = reportSelectedOrderNo === 'All' ? uniqueOrderNos : [reportSelectedOrderNo];
      orders.forEach(ono => {
        const orderCharges = charges.filter(c => c.orderNo === ono);
        orderCharges.forEach(c => {
          (c.lines || []).forEach((l: any, idx: number) => {
            if (withinDate(l.date)) {
              filteredRows.push({
                chargeNo: idx === 0 ? c.chargeNo : '', // Only show chargeNo on first line for order
                chargeName: getChargeTypeName(l.charge),
                date: l.date ? new Date(l.date).toLocaleDateString('en-GB') : '-',
                orderNo: idx === 0 ? (c.orderNo || '') : '', // Only show orderNo on first line
                vehicleNo: l.vehicle || '-',
                amount: Number(l.amount) || 0
              });
            }
          });
        });
      });
    } else {
      // All
      charges.forEach(c => {
        (c.lines || []).forEach((l: any) => {
          if (withinDate(l.date)) {
            filteredRows.push({
              chargeNo: c.chargeNo,
              chargeName: getChargeTypeName(l.charge),
              date: l.date ? new Date(l.date).toLocaleDateString('en-GB') : '-',
              orderNo: c.orderNo || '',
              vehicleNo: l.vehicle || '-',
              amount: Number(l.amount) || 0
            });
          }
        });
      });
    }

    if (filteredRows.length === 0) {
      toast.info('No data found for the selected criteria');
      return;
    }

    const typeLabel = reportFilterType === 'ChargeType' ? `CHarge (${reportSelectedChargeType})` : reportFilterType === 'OrderNo' ? `Order (${reportSelectedOrderNo})` : 'CHARGES';
    
    if (format === 'PDF') {
      await exportChargesReportToPDF(filteredRows, typeLabel, reportStartDate, reportEndDate);
    } else {
      await exportChargesReportToExcel(filteredRows, typeLabel, reportStartDate, reportEndDate);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!selectedChargeIds.length) {
      toast('Please select at least one charge', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      await Promise.all(selectedChargeIds.map(id => updateChargesStatus({ id, status: newStatus })));
      setSelectedBulkStatus(newStatus);
      setSelectedChargeIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setSelectedChargeForFiles(null);
      // Keep the current filter selection instead of auto-changing it
      toast('Status updated', { type: 'success' });
      await fetchCharges();
    } catch (err) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = async () => {
    const data = selectedChargeIds.length > 0
      ? filteredCharges.filter(c => selectedChargeIds.includes(c.id))
      : filteredCharges;

    if (!data.length) {
      toast('No data to export', { type: 'warning' });
      return;
    }

    const rows = data.map(c => ({
      'Charge No': c.chargeNo || '-',
      'Order No': c.orderNo || '-',
      'Amount': c.amount || '-',
      'Bilty No': c.biltyNo || '-',
      'Vehicle#': c.vehicleNo || '-',
      'Paid to': c.paidToPerson || '-',
      'Remarks': c.remarks || '-',
      'Status': c.status || '-',
      'Files': (chargeFiles[c.id] || []).map(f => f.name).join(', ') || '-',
    }));

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Charges');

      // Page setup
      ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } } as any;

      // Headers with Serial
      const headers = ['Serial','Charge No','Order No','Amount','Bilty No','Vehicle#','Paid to','Remarks','Status','Files'];
      const widths = [8,12,12,14,14,14,18,24,12,18];
      ws.columns = headers.map((h,i)=>({ header: h, key: `col${i}`, width: widths[i] }));

      // Title + Subtitle
      const title = 'AL-NASAR BASHEER LOGISTICS';
      const subtitle = 'Charges Report';
      ws.spliceRows(1,0,[title]);
      ws.spliceRows(2,0,[subtitle]);
      const totalCols = headers.length;
      ws.mergeCells(1,1,1,totalCols);
      ws.mergeCells(2,1,2,totalCols);
      const titleRow = ws.getRow(1); titleRow.font = { bold: true, size: 16 } as any; titleRow.alignment = { vertical: 'middle', horizontal: 'center' } as any; titleRow.height = 20;
      const subtitleRow = ws.getRow(2); subtitleRow.font = { bold: true, size: 12 } as any; subtitleRow.alignment = { vertical: 'middle', horizontal: 'center' } as any; subtitleRow.height = 18;

      // Header styling (row 3)
      const headerRow = ws.getRow(3);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FF000000' } } as any;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } as any;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EEF7' } } as any;
        cell.border = { top:{style:'thin',color:{argb:'FF9E9E9E'}}, left:{style:'thin',color:{argb:'FF9E9E9E'}}, bottom:{style:'thin',color:{argb:'FF9E9E9E'}}, right:{style:'thin',color:{argb:'FF9E9E9E'}} } as any;
      });
      headerRow.height = 18;
      ws.views = [{ state: 'frozen', ySplit: 3 }];

      // Data rows + totals
      let amountSum = 0;
      rows.forEach((r, idx) => {
        const dataArr = headers.map(h => h==='Serial'? idx+1 : (r as any)[h]);
        ws.addRow(dataArr);
        const amt = (r as any)['Amount'];
        const num = typeof amt === 'number' ? amt : parseFloat(String(amt ?? '').replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) amountSum += num;
      });

      // Body styling + zebra + number formats
      ws.eachRow((row, rowNum)=>{
        if (rowNum <= 3) return;
        const even = rowNum % 2 === 0;
        row.eachCell((cell, col)=>{
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } as any;
          cell.border = { top:{style:'thin',color:{argb:'FFDDDDDD'}}, left:{style:'thin',color:{argb:'FFDDDDDD'}}, bottom:{style:'thin',color:{argb:'FFDDDDDD'}}, right:{style:'thin',color:{argb:'FFDDDDDD'}} } as any;
          if (even) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F7' } } as any;
          // Amount right-align + number format
          if (col === 4) {
            const val = cell.value as any;
            const num = parseFloat(String(val ?? '').replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) { cell.value = num; (cell as any).numFmt = '#,##0.00'; cell.alignment = { vertical:'middle', horizontal:'right', wrapText:true } as any; }
          }
        });
      });

      // Totals row
      const totalsRow = ws.addRow(['','','','TOTAL','','','','','','']);
      totalsRow.getCell(4).value = 'TOTAL';
      ws.mergeCells(totalsRow.number, 4, totalsRow.number, 4);
      const amtCell = totalsRow.getCell(4+1); // place sum next to label if desired
      totalsRow.getCell(5).value = amountSum;
      (totalsRow.getCell(5) as any).numFmt = '#,##0.00';
      totalsRow.eachCell((cell, col)=>{
        cell.font = { bold: true } as any;
        cell.alignment = { vertical: 'middle', horizontal: col===5 ? 'right' : 'center' } as any;
        cell.border = { top:{style:'thin',color:{argb:'FF9E9E9E'}}, left:{style:'thin',color:{argb:'FF9E9E9E'}}, bottom:{style:'thin',color:{argb:'FF9E9E9E'}}, right:{style:'thin',color:{argb:'FF9E9E9E'}} } as any;
      });

      // AutoFilter on header row
      ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: headers.length } } as any;

      // Export
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Charges.xlsx'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('exceljs not available, falling back to basic XLSX export', err);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Charges');
      XLSX.writeFile(wb, 'Charges.xlsx');
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
          <button onClick={fetchCharges} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            Refresh
          </button>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setOpenReportModal(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded shadow-md transition-all">
            <FaFilePdf size={18} /> Reports
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-md transition-all">
            <FaFileExcel size={18} /> Download Excel
          </button>
        </div>
      </div>

      <DataTable
        columns={columns(handleDeleteOpen, handleCheckboxChange, selectedChargeIds)}
        data={filteredCharges}
        loading={loading}
        link="/charges/create"
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
          <h3 className="text-lg font-semibold text-[#3a614c] mb-3">Charge Details</h3>
          <OrderProgress orderNo={charges.find(c => c.id === selectedRowId)?.orderNo} bookingStatus={null} consignments={consignments} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 p-4">
        {statusOptionsConfig.map(opt => {
          const active = selectedBulkStatus === opt.name;
          return (
            <button
              key={opt.id}
              onClick={() => handleBulkStatusUpdate(opt.name)}
              disabled={updating || !selectedChargeIds.length}
              className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
                ${active ? `border-[${opt.color}] bg-gradient-to-r from-[${opt.color}]/10 text-[${opt.color}]` : 'border-gray-300 bg-white'}
                ${updating || !selectedChargeIds.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {opt.name}
              {active && <FaCheck className="ml-2 animate-bounce" />}
            </button>
          );
        })}
        <button
          onClick={handleFileUploadClick}
          disabled={!selectedChargeIds.length}
          className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
            ${selectedChargeIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:scale-105' : 'border-gray-300 bg-white opacity-50'}`}
        >
          Upload Files
          {selectedChargeIds.length && <FaFileUpload className="ml-2 animate-bounce" />}
        </button>
      </div>

      {openDelete && <DeleteConfirmModel handleDeleteclose={handleDeleteClose} handleDelete={handleDelete} isOpen={openDelete} />}

      {/* FILE UPLOAD MODAL */}
      {openFileUploadModal && selectedChargeForFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={(e) => e.target === e.currentTarget && setOpenFileUploadModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Files - Charge {charges.find(c => c.id === selectedChargeForFiles)?.chargeNo || ''}
              </h3>
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedChargeForFiles(null); }} className="text-3xl text-gray-500 hover:text-gray-800">&times;</button>
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {chargeFiles[selectedChargeForFiles]?.length > 0 ? (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Uploaded Files</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {chargeFiles[selectedChargeForFiles].map(file => (
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
                        <button onClick={() => handleRemoveFile(selectedChargeForFiles, file.id)} className="text-red-600 hover:text-red-800"><FaTrash size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-8 italic">No files uploaded yet.</p>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedChargeForFiles(null); }} className="px-5 py-2 border rounded hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add More Files
              </button>
              <button
                onClick={handleSaveFilesToBackend}
                disabled={!chargeFiles[selectedChargeForFiles]?.length || loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save to Charge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {openReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4" onClick={(e) => e.target === e.currentTarget && setOpenReportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-800">Generate Charges Report</h3>
              <button onClick={() => setOpenReportModal(false)} className="text-3xl text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                  <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                  <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Filter Type</label>
                <select 
                  value={reportFilterType} 
                  onChange={e => setReportFilterType(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em] transition-all"
                >
                  <option value="All">All Charges</option>
                  <option value="ChargeType">By Charge Type</option>
                  <option value="OrderNo">By Order Number</option>
                </select>
              </div>

              {reportFilterType === 'ChargeType' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Charge</label>
                  <select 
                    value={reportSelectedChargeType} 
                    onChange={e => setReportSelectedChargeType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                  >
                    <option value="All">All Types</option>
                    {uniqueChargeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              {reportFilterType === 'OrderNo' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Order No</label>
                  <select 
                    value={reportSelectedOrderNo} 
                    onChange={e => setReportSelectedOrderNo(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                  >
                    <option value="All">All Orders</option>
                    {uniqueOrderNos.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => handleExportReport('PDF')}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-rose-500/30 transition-all"
                >
                  <FaFilePdf size={20} /> Export PDF
                </button>
                <button 
                  onClick={() => handleExportReport('EXCEL')}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  <FaFileExcel size={20} /> Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargesList;