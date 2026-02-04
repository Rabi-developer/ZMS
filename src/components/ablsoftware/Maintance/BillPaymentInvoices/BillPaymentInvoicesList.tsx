'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFilePdf, FaFileUpload, FaEye, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {
  getAllBiltyPaymentInvoice,
  deleteBiltyPaymentInvoice,
  updateBiltyPaymentInvoiceStatus,
  getSingleBiltyPaymentInvoice,
  updateBiltyPaymentInvoiceFiles, // ← Add this API function
} from '@/apis/biltypaymentnnvoice';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getSingleBrooker, getAllBrooker } from '@/apis/brooker';
import { columns, BillPaymentInvoice } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import { exportBiltyPaymentInvoicePdf } from '@/components/ablsoftware/Maintance/common/BiltyPaymentInvoicePdf';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface ApiBiltyPaymentInvoice {
  id: string;
  invoiceNo: string;
  paymentDate: string;
  createdBy: string | null;
  creationDate: string | null;
  updatedBy: string | null;
  updationDate: string | null;
  status: string | null;
  files?: string; // ← Add this if your backend returns comma-separated URLs
  lines: Array<{
    id: string;
    vehicleNo: string;
    orderNo: string;
    amount: number;
    munshayana: string;
    broker: string;
    dueDate: string;
    remarks: string;
    isAdditionalLine?: boolean;
    nameCharges?: string;
    amountCharges?: number;
    invoice?: any;
  }>;
  isActive: boolean;
  isDeleted: boolean;
  createdDateTime: string;
  modifiedDateTime: string | null;
  modifiedBy: string | null;
}

const transformBiltyPaymentInvoice = (apiData: ApiBiltyPaymentInvoice[]): BillPaymentInvoice[] => {
  return apiData.map((item) => {
    const firstLine = item.lines[0] || {};
    return {
      id: item.id,
      invoiceNo: item.invoiceNo,
      paymentDate: item.paymentDate,
      totalAmount: firstLine.amount?.toString() || '0',
      status: item.status || 'Prepared',
      vehicleNo: firstLine.vehicleNo || '',
      orderNo: firstLine.orderNo || '',
      amount: firstLine.amount?.toString() || '0',
      broker: firstLine.broker || '',
      files: item.files || '', // Preserve files field
    };
  });
};

const BillPaymentInvoicesList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billPaymentInvoices, setBillPaymentInvoices] = useState<BillPaymentInvoice[]>([]);
  const [filteredBillPaymentInvoices, setFilteredBillPaymentInvoices] = useState<BillPaymentInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedBillPaymentIds, setSelectedBillPaymentIds] = useState<string[]>([]);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<{ name: string; cnic: string; mobile: string; accountNumber: string; address: string } | null>(null);

  // File Upload States
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [selectedBillPaymentForFiles, setSelectedBillPaymentForFiles] = useState<string | null>(null);
  const [billPaymentFiles, setBillPaymentFiles] = useState<{ [billPaymentId: string]: UploadedFile[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'UnApproved', 'Closed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#3b82f6' },
    { id: 2, name: 'Approved', color: '#10b981' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'UnApproved', color: '#f59e0b' },
    { id: 5, name: 'Closed', color: '#6b7280' },
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

  const fetchBillPaymentInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const apiPageIndex = pageIndex + 1;
      const response = await getAllBiltyPaymentInvoice(apiPageIndex, pageSize);
      const transformedData = transformBiltyPaymentInvoice(response?.data || []);
      setBillPaymentInvoices(transformedData);
      setTotalRows(response.misc?.total || 0);
    } catch (error) {
      console.error('Failed to fetch bill payment invoices:', error);
      toast('Failed to fetch bill payment invoices', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => { fetchBillPaymentInvoices(); }, [fetchBillPaymentInvoices]);

  useEffect(() => {
    const filtered = selectedStatusFilter === 'All'
      ? billPaymentInvoices
      : billPaymentInvoices.filter(b => b.status === selectedStatusFilter);
    setFilteredBillPaymentInvoices(filtered);
  }, [billPaymentInvoices, selectedStatusFilter]);

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchBillPaymentInvoices();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    try {
      await deleteBiltyPaymentInvoice(deleteId);
      setOpenDelete(false);
      toast('Bill Payment Invoice Deleted Successfully', { type: 'success' });
      fetchBillPaymentInvoices();
    } catch (error) {
      toast('Failed to delete bill payment invoice', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => { setOpenDelete(true); setDeleteId(id); };
  const handleDeleteClose = () => { setOpenDelete(false); setDeleteId(''); };

  const handleRowClick = async (billPaymentId: string) => {
    // Don't override existing selections - only add if not already selected
    if (!selectedBillPaymentIds.includes(billPaymentId)) {
      setSelectedBillPaymentIds(prev => [...prev, billPaymentId]);
    }
    
    setSelectedRowId(billPaymentId);
    setSelectedBillPaymentForFiles(billPaymentId);

    const billPayment = billPaymentInvoices.find(b => b.id === billPaymentId);
    if (billPayment?.orderNo) {
      try {
        const consResponse = await getAllConsignment(1, 100, { orderNo: billPayment.orderNo });
        setConsignments(consResponse?.data || []);
        const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: billPayment.orderNo });
        const booking = bookingResponse?.data.find((b: any) => b.orderNo === billPayment.orderNo);
        setBookingStatus(booking?.status || null);
      } catch (error) {
        toast('Failed to fetch related data', { type: 'error' });
      }
    } else {
      setConsignments([]);
      setBookingStatus(null);
    }
    setSelectedBulkStatus(billPayment?.status || null);

    // Resolve broker details and show them in a table
    try {
      const payload = await preparePdfPayload(billPaymentId);
      if (payload?.broker) {
        setSelectedBroker({
          name: payload.broker.name || '',
          cnic: payload.broker.cnic || '',
          mobile: payload.broker.mobile || '',
          accountNumber: payload.broker.accountNumber || '',
          address: payload.broker.address || '',
        });
      } else {
        setSelectedBroker(null);
      }
    } catch {
      setSelectedBroker(null);
    }
  };

  const handleRowDoubleClick = () => {
    setSelectedBillPaymentIds([]);
    setSelectedRowId(null);
    setConsignments([]);
    setBookingStatus(null);
    setSelectedBulkStatus(null);
    setSelectedBillPaymentForFiles(null);
    setSelectedBroker(null);
  };

  const handleCheckboxChange = async (billPaymentId: string, checked: boolean) => {
    if (checked) {
      // Add to selection (support multiple selection)
      setSelectedBillPaymentIds(prev => [...prev, billPaymentId]);
      setSelectedRowId(billPaymentId);
      setSelectedBillPaymentForFiles(billPaymentId);

      const billPayment = billPaymentInvoices.find(b => b.id === billPaymentId);
      if (billPayment?.orderNo) {
        try {
          const consResponse = await getAllConsignment(1, 100, { orderNo: billPayment.orderNo });
          setConsignments(consResponse?.data || []);
          const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: billPayment.orderNo });
          const booking = bookingResponse?.data.find((b: any) => b.orderNo === billPayment.orderNo);
          setBookingStatus(booking?.status || null);
        } catch (error) {
          toast('Failed to fetch related data', { type: 'error' });
        }
      }
    } else {
      // Remove from selection
      const newSelection = selectedBillPaymentIds.filter(id => id !== billPaymentId);
      setSelectedBillPaymentIds(newSelection);
      
      // Clear everything if no items are selected
      if (newSelection.length === 0) {
        setSelectedRowId(null);
        setConsignments([]);
        setBookingStatus(null);
        setSelectedBillPaymentForFiles(null);
      }
    }
    setSelectedBulkStatus(checked ? billPaymentInvoices.find(b => b.id === billPaymentId)?.status || null : null);
  };

  // === FILE UPLOAD LOGIC (Same as BookingOrderList) ===
  const handleFileUploadClick = () => {
    if (!selectedBillPaymentForFiles) {
      toast('Please select a bill payment invoice first', { type: 'warning' });
      return;
    }

    const invoice = billPaymentInvoices.find(b => b.id === selectedBillPaymentForFiles);
    if (invoice?.files && !billPaymentFiles[selectedBillPaymentForFiles]) {
      const existingFiles = invoice.files.split(',').map((url: string, i: number) => {
        const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || `file-${i + 1}`);
        const type = name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        return { id: `exist-${i}`, name, url: url.trim(), type };
      });
      setBillPaymentFiles(prev => ({ ...prev, [selectedBillPaymentForFiles]: existingFiles }));
    }

    setOpenFileUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedBillPaymentForFiles) return;

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

      setBillPaymentFiles(prev => ({
        ...prev,
        [selectedBillPaymentForFiles]: [...(prev[selectedBillPaymentForFiles] || []), ...uploaded],
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
    if (!selectedBillPaymentForFiles || !billPaymentFiles[selectedBillPaymentForFiles]?.length) {
      toast('No files to save', { type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const urls = billPaymentFiles[selectedBillPaymentForFiles].map(f => f.url).join(',');
      await updateBiltyPaymentInvoiceFiles({ id: selectedBillPaymentForFiles, files: urls });
      toast('Files saved to invoice successfully!', { type: 'success' });
      setOpenFileUploadModal(false);
      setSelectedBillPaymentForFiles(null);
      await fetchBillPaymentInvoices();
    } catch (err) {
      toast('Failed to save files', { type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (url: string) => window.open(url, '_blank');
  const handleRemoveFile = (billPaymentId: string, fileId: string) => {
    setBillPaymentFiles(prev => ({
      ...prev,
      [billPaymentId]: prev[billPaymentId].filter(f => f.id !== fileId),
    }));
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (!selectedBillPaymentIds.length) {
      toast('Please select at least one invoice', { type: 'warning' });
      return;
    }
    try {
      setUpdating(true);
      await Promise.all(selectedBillPaymentIds.map(id => updateBiltyPaymentInvoiceStatus({ id, status: newStatus })));
      setSelectedBulkStatus(newStatus);
      setSelectedBillPaymentIds([]);
      setSelectedRowId(null);
      setConsignments([]);
      setBookingStatus(null);
      setSelectedBillPaymentForFiles(null);
      // Keep the current filter selection instead of auto-changing it
      toast('Status updated', { type: 'success' });
      await fetchBillPaymentInvoices();
    } catch (err) {
      toast('Failed to update status', { type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = async () => {
    const data = selectedBillPaymentIds.length > 0
      ? filteredBillPaymentInvoices.filter(b => selectedBillPaymentIds.includes(b.id))
      : filteredBillPaymentInvoices;

    if (!data.length) {
      toast('No data to export', { type: 'warning' });
      return;
    }

    const rows = data.map(b => ({
      'Invoice No': b.invoiceNo || '-',
      'Vehicle No': b.vehicleNo || '-',
      'Order No': b.orderNo || '-',
      'Amount': b.amount || '-',
      'Broker': b.broker || '-',
      'Payment Date': b.paymentDate || '-',
      'Status': b.status || '-',
      'Files': (billPaymentFiles[b.id] || []).map(f => f.name).join(', ') || '-',
    }));

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('BillPaymentInvoices');

      // Page setup
      ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } } as any;

      // Headers with Serial
      const headers = ['Serial','Invoice No','Vehicle No','Order No','Amount','Broker','Payment Date','Status','Files'];
      const widths = [8,14,14,12,14,16,14,12,18];
      ws.columns = headers.map((h,i)=>({ header: h, key: `col${i}`, width: widths[i] }));

      // Title + Subtitle
      const title = 'AL-NASAR BASHEER LOGISTICS';
      const subtitle = 'Bill Payment Invoices Report';
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
          if (col === 5) {
            const val = cell.value as any;
            const num = parseFloat(String(val ?? '').replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) { cell.value = num; (cell as any).numFmt = '#,##0.00'; cell.alignment = { vertical:'middle', horizontal:'right', wrapText:true } as any; }
          }
        });
      });

      // Totals row
      const totalsRow = ws.addRow(['','','','TOTAL','', '', '', '', '']);
      totalsRow.getCell(4).value = 'TOTAL';
      ws.mergeCells(totalsRow.number, 4, totalsRow.number, 4);
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
      a.href = url; a.download = 'BillPaymentInvoices.xlsx'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('exceljs not available, falling back to basic XLSX export', err);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BillPaymentInvoices');
      XLSX.writeFile(wb, 'BillPaymentInvoices.xlsx');
    }
  };

  const preparePdfPayload = async (invoiceId: string) => {
    try {
      const response = await getSingleBiltyPaymentInvoice(invoiceId);
      const detailedInvoice = response?.data || response;

      if (!detailedInvoice || !detailedInvoice.lines?.length) {
        toast('Invoice not found or has no lines', { type: 'error' });
        return null;
      }

      const firstLine = detailedInvoice.lines.find((l: any) => !l.isAdditionalLine) || detailedInvoice.lines[0];

      // Fetch broker details if broker exists
      let brokerDetails = { name: '', mobile: '', cnic: '', accountNumber: '', address: '' };
      
      if (firstLine?.broker) {
        try {
          // Check if broker is an ID (UUID format)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstLine.broker);
          
          if (isUUID) {
            // Fetch broker details by ID
            const brokerResponse = await getSingleBrooker(firstLine.broker);
            const broker = brokerResponse?.data || brokerResponse;
            
            if (broker) {
              // Parse the name field to extract name and CNIC
              let parsedName = broker.name || '';
              let parsedCnic = broker.cnic || '';
              
              // Check if CNIC is embedded in the name field
              const nameCnicMatch = parsedName.match(/^(.+?)\s+(\d{5}-\d{7}-\d)$/);
              if (nameCnicMatch) {
                parsedName = nameCnicMatch[1].trim();
                parsedCnic = nameCnicMatch[2];
              }
              
              // Parse the mobile field to extract phone and account number
              let parsedMobile = broker.mobile || '';
              let parsedAccount = broker.accountNumber || '';
              
              // Check if account is embedded in mobile field (format: "phone /bank account")
              const mobileAccountMatch = parsedMobile.match(/^(.+?)\s*\/\s*(.+)$/);
              if (mobileAccountMatch) {
                parsedMobile = mobileAccountMatch[1].trim();
                parsedAccount = mobileAccountMatch[2].trim();
              }
              
              brokerDetails = {
                name: parsedName,
                mobile: parsedMobile,
                cnic: parsedCnic,
                accountNumber: parsedAccount,
                address: broker.address || '',
              };
            }
          } else {
            // Broker is stored as a string (e.g., "Atta Ullah 38302-1094268-5")
            // Try to find broker by searching in the broker list
            const brokerStr = firstLine.broker || '';
            
            // Extract name from the string (remove CNIC if present)
            const cnicMatch = brokerStr.match(/(\d{5}-\d{7}-\d)/);
            let searchName = brokerStr;
            
            if (cnicMatch) {
              // Extract name (everything before CNIC)
              searchName = brokerStr.substring(0, cnicMatch.index).trim();
            }
            
            // Try to find broker in the database by name
            try {
              const brokersResponse = await getAllBrooker(1, 1000);
              const brokers = brokersResponse?.data || [];
              
              // Search for broker by name (case-insensitive partial match)
              const foundBroker = brokers.find((b: any) => 
                b.name && searchName && b.name.toLowerCase().includes(searchName.toLowerCase())
              );
              
              if (foundBroker) {
                // Parse the found broker's fields
                let parsedName = foundBroker.name || '';
                let parsedCnic = foundBroker.cnic || '';
                
                // Check if CNIC is embedded in the name field
                const nameCnicMatch = parsedName.match(/^(.+?)\s+(\d{5}-\d{7}-\d)$/);
                if (nameCnicMatch) {
                  parsedName = nameCnicMatch[1].trim();
                  parsedCnic = nameCnicMatch[2];
                }
                
                // Parse the mobile field to extract phone and account number
                let parsedMobile = foundBroker.mobile || '';
                let parsedAccount = foundBroker.accountNumber || '';
                
                // Check if account is embedded in mobile field (format: "phone /bank account")
                const mobileAccountMatch = parsedMobile.match(/^(.+?)\s*\/\s*(.+)$/);
                if (mobileAccountMatch) {
                  parsedMobile = mobileAccountMatch[1].trim();
                  parsedAccount = mobileAccountMatch[2].trim();
                }
                
                brokerDetails = {
                  name: parsedName,
                  mobile: parsedMobile,
                  cnic: parsedCnic,
                  accountNumber: parsedAccount,
                  address: foundBroker.address || '',
                };
              } else {
                // Broker not found in database, parse the string
                brokerDetails.name = searchName;
                if (cnicMatch) {
                  brokerDetails.cnic = cnicMatch[1];
                }
              }
            } catch (searchError) {
              console.warn('Failed to search brokers:', searchError);
              // Fallback: parse the string manually
              brokerDetails.name = searchName;
              if (cnicMatch) {
                brokerDetails.cnic = cnicMatch[1];
              }
            }
          }
        } catch (brokerError) {
          console.warn('Failed to fetch broker details:', brokerError);
          // Fallback to using the broker string as name
          brokerDetails.name = firstLine.broker;
        }
      }

      return {
        invoiceNo: detailedInvoice.invoiceNo || '',
        paymentDate: detailedInvoice.paymentDate || '',
        bookingDate: detailedInvoice.creationDate || detailedInvoice.createdDateTime || '',
        checkDate: detailedInvoice.updationDate || detailedInvoice.modifiedDateTime || '',
        lines: detailedInvoice.lines.map((line: any) => ({
          isAdditionalLine: line.isAdditionalLine || false,
          biltyNo: line.orderNo || '',
          vehicleNo: line.vehicleNo || '',
          orderNo: line.orderNo || '',
          amount: Number(line.amount) || 0,
          munshayana: Number(line.munshayana) || 0,
          nameCharges: line.nameCharges || '',
          amountCharges: Number(line.amountCharges) || 0,
        })),
        broker: brokerDetails,
      };
    } catch (error) {
      console.error('Failed to prepare PDF payload:', error);
      toast('Unable to fetch invoice details', { type: 'error' });
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedBillPaymentIds.length) {
      toast('Please select an invoice first', { type: 'warning' });
      return;
    }

    const invoiceId = selectedBillPaymentIds[0];
    const payload = await preparePdfPayload(invoiceId);
    if (payload) {
      await exportBiltyPaymentInvoicePdf(payload, `${payload.invoiceNo || invoiceId}.pdf`);
      toast('PDF downloaded successfully', { type: 'success' });
    }
  };

  return (
    <div className="container mx-auto mt-4 max-w-screen p-6">
      <div className="mb-6">
       <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Bill Payment Invoice</h1>
          </div>
      </div>
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
          <button onClick={fetchBillPaymentInvoices} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            Refresh
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            <FaFileExcel size={18} /> Excel
          </button>
          {selectedBillPaymentIds.length > 0 && (
            <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              <FaFilePdf size={18} /> PDF
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns(handleDeleteOpen, handleCheckboxChange, selectedBillPaymentIds)}
        data={filteredBillPaymentInvoices}
        loading={loading}
        link="/billpaymentinvoices/create"
        setPageIndex={handlePageIndexChange}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        totalRows={totalRows}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />

      {selectedBroker && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-[#3a614c] mb-3">Broker Detail</h3>
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CNIC</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Mobile No</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Account No</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-800">{selectedBroker.name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{selectedBroker.cnic || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{selectedBroker.mobile || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{selectedBroker.accountNumber || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{selectedBroker.address || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 p-4">
        {statusOptionsConfig.map(opt => {
          const active = selectedBulkStatus === opt.name;
          return (
            <button
              key={opt.id}
              onClick={() => handleBulkStatusUpdate(opt.name)}
              disabled={updating || !selectedBillPaymentIds.length}
              className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
                ${active ? `border-[${opt.color}] bg-gradient-to-r from-[${opt.color}]/10 text-[${opt.color}]` : 'border-gray-300 bg-white'}
                ${updating || !selectedBillPaymentIds.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {opt.name}
              {active && <FaCheck className="ml-2 animate-bounce" />}
            </button>
          );
        })}
        <button
          onClick={handleFileUploadClick}
          disabled={!selectedBillPaymentIds.length}
          className={`w-40 h-16 rounded-xl border-2 flex items-center justify-center font-semibold transition-all
            ${selectedBillPaymentIds.length ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:scale-105' : 'border-gray-300 bg-white opacity-50'}`}
        >
          Upload Files
          {selectedBillPaymentIds.length && <FaFileUpload className="ml-2 animate-bounce" />}
        </button>
      </div>

      {openDelete && <DeleteConfirmModel handleDeleteclose={handleDeleteClose} handleDelete={handleDelete} isOpen={openDelete} />}

      {/* FILE UPLOAD MODAL */}
      {openFileUploadModal && selectedBillPaymentForFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={(e) => e.target === e.currentTarget && setOpenFileUploadModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Files - Invoice {billPaymentInvoices.find(b => b.id === selectedBillPaymentForFiles)?.invoiceNo || ''}
              </h3>
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedBillPaymentForFiles(null); }} className="text-3xl text-gray-500 hover:text-gray-800">×</button>
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {billPaymentFiles[selectedBillPaymentForFiles]?.length > 0 ? (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Uploaded Files</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {billPaymentFiles[selectedBillPaymentForFiles].map(file => (
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
                        <button onClick={() => handleRemoveFile(selectedBillPaymentForFiles, file.id)} className="text-red-600 hover:text-red-800"><FaTrash size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-8 italic">No files uploaded yet.</p>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => { setOpenFileUploadModal(false); setSelectedBillPaymentForFiles(null); }} className="px-5 py-2 border rounded hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add More Files
              </button>
              <button
                onClick={handleSaveFilesToBackend}
                disabled={!billPaymentFiles[selectedBillPaymentForFiles]?.length || loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save to Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillPaymentInvoicesList;