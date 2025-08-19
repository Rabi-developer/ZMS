'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getAllPaymentABL, deletePaymentABL, updatePaymentABLStatus } from '@/apis/paymentABL';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdPayment, MdEdit, MdDelete, MdAdd, MdSearch, MdFilterList } from 'react-icons/md';
import { FaMoneyBillWave, FaEye } from 'react-icons/fa';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBookingOrder } from '@/apis/bookingorder';

interface PaymentABL {
  id: string;
  paymentNo: string;
  paymentDate: string;
  orderNo: string;
  vehicleNo: string;
  chargeNo: string;
  expenseAmount: number;
  paidAmount: number;
  balance: number;
  paymentMethod: string;
  status: string;
  remarks?: string;
}

const PaymentABLList = () => {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentABL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null); // Track selected row

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    fetchPayments();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await getAllPaymentABL(currentPage, pageSize);
      setPayments(response.data);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await deletePaymentABL(id);
        toast.success('Payment deleted successfully');
        fetchPayments();
      } catch (error) {
        toast.error('Failed to delete payment');
      }
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updatePaymentABLStatus({ id, status: newStatus });
      toast.success('Status updated successfully');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleViewOpen = async (paymentId: string) => {
    setSelectedRowId((prev) => (prev === paymentId ? null : paymentId));
    const payment = payments.find((item) => item.id === paymentId);
    if (payment?.orderNo) {
      try {
        const consResponse = await getAllConsignment(1, 100, { orderNo: payment.orderNo });
        setConsignments(consResponse?.data || []);
        const bookingResponse = await getAllBookingOrder(1, 100, { orderNo: payment.orderNo });
        const booking = bookingResponse?.data.find((b: any) => b.orderNo === payment.orderNo);
        setBookingStatus(booking?.status || null);
      } catch (error) {
        toast('Failed to fetch related data', { type: 'error' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdPayment className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Payment Management</h1>
                  <p className="text-white/90 mt-1 text-sm">Manage all payment records</p>
                </div>
              </div>
              <Link href="/paymentABL/create">
                <Button className="bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm px-4 py-2 shadow-lg hover:shadow-xl">
                  <FiPlus className="mr-2" /> Add New Payment
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by payment no, order no, or vehicle no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3a614c] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <MdFilterList className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3a614c] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-[#3a614c] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 dark:text-gray-400">Loading payments...</span>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vehicle No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Charge No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expense Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaMoneyBillWave className="text-[#3a614c] mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.paymentNo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {payment.orderNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {payment.vehicleNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {payment.chargeNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${payment.expenseAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        ${payment.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={payment.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                          ${Math.abs(payment.balance).toFixed(2)} {payment.balance > 0 ? '(Due)' : '(Paid)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={payment.status}
                          onChange={(e) => handleStatusUpdate(payment.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(payment.status)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleViewOpen(payment.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
                          >
                            <FaEye className="mr-1" /> View
                          </Button>
                          <Link href={`/paymentABL/edit/${payment.id}`}>
                            <Button
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 text-xs"
                            >
                              <MdEdit className="mr-1" /> Edit
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(payment.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
                          >
                            <MdDelete className="mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        {selectedRowId && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[#3a614c]">Order Progress</h3>
            <OrderProgress
              orderNo={payments.find((p) => p.id === selectedRowId)?.orderNo}
              bookingStatus={bookingStatus}
              consignments={consignments}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentABLList;