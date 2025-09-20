'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaFileExcel, FaCheck, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DataTable } from '@/components/ui/CommissionTable';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllBookingOrder, deleteBookingOrder, updateBookingOrderStatus } from '@/apis/bookingorder';
import { getAllConsignment, deleteConsignment } from '@/apis/consignment';
import { Edit, Trash } from 'lucide-react';
import { columns, getStatusStyles, BookingOrder } from './columns';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { exportBiltiesReceivableToPDF } from '@/components/ablsoftware/Maintance/common/BiltiesReceivablePdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Consignment {
  orderNo: any;
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
}

const BookingOrderList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingOrders, setBookingOrders] = useState<ExtendedBookingOrder[]>([]);
  const [filteredBookingOrders, setFilteredBookingOrders] = useState<ExtendedBookingOrder[]>([]);
  const [consignments, setConsignments] = useState<{ [orderId: string]: Consignment[] }>({});
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

  // PDF modal state
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState<string>('');
  const [pdfEndDate, setPdfEndDate] = useState<string>('');

  const statusOptions = ['All', 'Prepared', 'Approved', 'Canceled', 'UnApproved' , 'Closed'];
  const statusOptionsConfig = [
    { id: 1, name: 'Prepared', color: '#3b82f6' },
    { id: 2, name: 'Approved', color: '#10b981' },
    { id: 3, name: 'Canceled', color: '#ef4444' },
    { id: 4, name: 'UnApproved', color: '#f59e0b' },
    { id: 5, name: 'Closed', color: '#6b7280' },
  ];

  const fetchBookingOrdersAndConsignments = async () => {
    try {
      setLoading(true);
      const response = await getAllBookingOrder(pageIndex + 1, pageSize);
      const orders = response?.data || [];
      setBookingOrders(orders);

      const consignmentsMap: { [orderId: string]: Consignment[] } = {};
      for (const order of orders) {
        const consRes = await getAllConsignment(1, 100, { orderNo: order.orderNo });
        consignmentsMap[order.id] = consRes?.data.filter((c: Consignment) => c.orderNo === order.orderNo) || [];
      }
      setConsignments(consignmentsMap);
    } catch (error) {
      toast('Failed to fetch data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchConsignments = async (orderId: string) => {
    try {
      const order = bookingOrders.find((o) => o.id === orderId);
      if (!order) return;

      setFetchingConsignments((prev) => ({ ...prev, [orderId]: true }));
      const response = await getAllConsignment(1, 100, { orderNo: order.orderNo });
      const notes = response?.data.filter((c: Consignment) => c.orderNo === order.orderNo) || [];
      setConsignments((prev) => ({ ...prev, [orderId]: notes }));
      setBookingOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, relatedConsignments: notes } : o))
      );
    } catch (error) {
      toast('Failed to fetch consignments', { type: 'error' });
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

  const handleViewOpen = async (orderId: string) => {
    setSelectedRowId((prev) => (prev === orderId ? null : orderId));
    await fetchConsignments(orderId);
  };

  const handleCheckboxChange = async (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds((prev) => [...prev, orderId]);
      await fetchConsignments(orderId);
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    }

    setTimeout(() => {
      const selected = bookingOrders.filter((order) => selectedOrderIds.includes(order.id));
      const statuses = selected.map((order) => order.status).filter((status, index, self) => self.indexOf(status) === index);
      setSelectedBulkStatus(statuses.length === 1 ? statuses[0] : null);
    }, 100);
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
      setSelectedStatusFilter(newStatus);
      setPageIndex(0);
      toast('Booking Order Status Updated Successfully', { type: 'success' });
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
          'Order Status': order.status || 'Pending',
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
        }];
      }

      return cons.map((c, index) => ({
        'Order No': index === 0 ? order.orderNo || '-' : '',
        'Order Date': index === 0 ? order.orderDate || '-' : '',
        'Company': index === 0 ? order.company || '-' : '',
        'Branch': index === 0 ? order.branch || '-' : '',
        'Order Status': index === 0 ? order.status || 'Pending' : '',
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
      // Filter: Only booking orders without any consignment having a biltyNo
      const targetOrders = filteredBookingOrders.filter((o) => {
        const cons = consignments[o.id] || [];
        // Include if there is NO consignment with non-empty biltyNo
        return cons.every((c) => !c.biltyNo || c.biltyNo.trim() === '');
      });

      if (targetOrders.length === 0) {
        toast('No receivable entries found (all have Bilty No)', { type: 'info' });
        return;
      }

      const rows = targetOrders.map((o) => ({
        orderNo: o.orderNo,
        orderDate: o.orderDate,
        vehicleNo: (o as any).vehicleNo,
        consignor: (o as any).consignor,
        consignee: (o as any).consignee,
        carrier: (o as any).transporter || (o as any).carrier,
        vendor: (o as any).vendor,
        departure: (o as any).fromLocation,
        destination: (o as any).toLocation,
        vehicleType: (o as any).vehicleType,
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

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('AL NASAR BASHEER LOGISTICS', pageWidth / 2, 42, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Booking Orders (All)', pageWidth / 2, 70, { align: 'center' });

      // Date line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const startText = `Start From: ${pdfStartDate || '-'}`;
      const toText = `To Date: ${pdfEndDate || '-'}`;
      const nowText = `Report: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      doc.text(startText, 40, 96, { align: 'left' });
      doc.text(toText, pageWidth / 2, 96, { align: 'center' });
      doc.text(nowText, pageWidth - 40, 96, { align: 'right' });

      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(40, 108, pageWidth - 40, 108);

      const head = [[
        'Order No',
        'Order Date',
        'Company',
        'Branch',
        'Status',
        'Vehicle No',
        'Transporter',
        'Vendor',
        'From',
        'To',
      ]];
      const body = pageData.map((o) => [
        o.orderNo || '-',
        o.orderDate || '-',
        (o as any).company || '-',
        (o as any).branch || '-',
        o.status || '-',
        (o as any).vehicleNo || '-',
        (o as any).transporter || (o as any).carrier || '-',
        (o as any).vendor || '-',
        (o as any).fromLocation || '-',
        (o as any).toLocation || '-',
      ]);

      autoTable(doc, {
        startY: 120,
        head,
        body,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, lineColor: [220,220,220], lineWidth: 0.5, textColor: [30,30,30] },
        headStyles: { fillColor: [200,200,200], textColor: [0,0,0], fontStyle: 'bold', fontSize: 10, halign: 'center' },
        alternateRowStyles: { fillColor: [245,245,245] },
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
    <div className="container   mt-4  p-6 h-[110vh]">
      <div className='h-full w-full flex flex-col'>
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
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-all duration-200"
            title="Bilties Receivable"
          >
            <FaFilePdf size={18} />
            PDF
          </button>
        </div>
      </div>
      <div>
        <DataTable
          columns={columns(handleDeleteOpen)}
          data={filteredBookingOrders}
          loading={loading}
          link="/bookingorder/create"
          setPageIndex={setPageIndex}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
          onRowClick={handleViewOpen}
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
      {selectedOrderIds.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[#06b6d4]">Selected Orders and Consignments</h3>
          {selectedOrderIds.map((orderId) => {
            const order = bookingOrders.find((o) => o.id === orderId);
            const cons = consignments[orderId] || [];

            return (
              <div key={orderId} className="mt-4">
                <h4 className="text-md font-medium">Order: {order?.orderNo || '-'}</h4>
                <OrderProgress
                  orderNo={order?.orderNo}
                  bookingStatus={order?.status}
                  consignments={cons}
                  hideBookingOrderInfo
                />
                <table className="w-full text-left border-collapse text-sm md:text-base mt-2">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-3">Bilty No</th>
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Consignor</th>
                      <th className="p-3">Consignee</th>
                      <th className="p-3">Item</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Recv. Amount</th>
                      <th className="p-3">Del. Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetchingConsignments[orderId] ? (
                      <tr>
                        <td colSpan={10} className="p-3 text-center text-gray-500">
                          Loading consignments...
                        </td>
                      </tr>
                    ) : cons.length > 0 ? (
                      cons.map((c) => (
                        <tr key={c.id} className="border-b">
                          <td className="p-3">{c.biltyNo || '-'}</td>
                          <td className="p-3">{c.receiptNo || '-'}</td>
                          <td className="p-3">{c.consignor || '-'}</td>
                          <td className="p-3">{c.consignee || '-'}</td>
                          <td className="p-3">{c.item || '-'}</td>
                          <td className="p-3">{c.qty || '-'}</td>
                          <td className="p-3">{c.totalAmount || '-'}</td>
                          <td className="p-3">{c.receivedAmount || '-'}</td>
                          <td className="p-3">{c.deliveryDate || '-'}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(c.status || 'Pending')}`}>
                              {c.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-3 text-gray-500">No consignments for this order</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 space-y-2 h-[18vh]">
        <div className="flex flex-wrap p-3 gap-3">
          {statusOptionsConfig.map((option) => {
            const isSelected = selectedBulkStatus === option.name;
            return (
              <button
                key={option.id}
                onClick={() => handleBulkStatusUpdate(option.name)}
                disabled={updating}
                className={`relative w-40 h-16 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
                  ${isSelected ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] text-[${option.color}]` : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}
                  ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-semibold text-center">{option.name}</span>
                {isSelected && <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />}
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

      {/* PDF Modal */}
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

      </div>
    </div>
  );
};

export default BookingOrderList;