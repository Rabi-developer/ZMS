'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { columns, Payment } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { getAllPayment, deletePayment } from '@/apis/payment';
import { MdPayment } from 'react-icons/md';

const PaymentList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getAllPayment(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast('Failed to fetch payments', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deletePayment(deleteId);
      setOpenDelete(false);
      toast('Payment Deleted Successfully', { type: 'success' });
      fetchPayments();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast('Failed to delete payment', { type: 'error' });
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

  const handleViewOpen = (paymentId: string) => {
    const payment = payments.find((item) => item.id === paymentId);
    setSelectedPayment(payment || null);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setOpenView(false);
    setSelectedPayment(null);
  };

  const handleCheckboxChange = (paymentId: string, checked: boolean) => {
    setSelectedPaymentIds((prev) =>
      checked ? [...prev, paymentId] : prev.filter((id) => id !== paymentId)
    );
  };

  // Split payments into Payment and Advance types
  const paymentTypePayments = payments.filter((p) => p.paymentType === 'Payment');
  const advanceTypePayments = payments.filter((p) => p.paymentType === 'Advance');

  return (
    <div className="container bg-white rounded-md p-4 md:p-6">
      <DataTable
        columns={columns(handleDeleteOpen, handleViewOpen, handleCheckboxChange)}
        data={payments}
        loading={loading}
        link={'/payment/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {selectedPaymentIds.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold">Selected Payments</h2>
          <div className="border rounded p-4 mt-2">
            {selectedPaymentIds.map((id) => {
              const payment = payments.find((p) => p.id === id);
              if (!payment) return null;

              return (
                <div key={id} className="mb-4">
                  <h3 className="text-md md:text-lg font-semibold">Payment: {payment.paymentNumber}</h3>
                  {payment.paymentType === 'Payment' ? (
                    <table className="w-full text-left border-collapse text-sm md:text-base">
                      <thead>
                        <tr className="bg-[#06b6d4] text-white">
                          <th className="p-2 md:p-3 font-medium">Invoice #</th>
                          <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                          <th className="p-2 md:p-3 font-medium">Due Date</th>
                          <th className="p-2 md:p-3 font-medium">Received Amount</th>
                          <th className="p-2 md:p-3 font-medium">Invoice Amount</th>
                          <th className="p-2 md:p-3 font-medium">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payment.relatedInvoices?.length ? (
                          payment.relatedInvoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b hover:bg-gray-100">
                              <td className="p-2 md:p-3">{invoice.invoiceNumber || '-'}</td>
                              <td className="p-2 md:p-3">{invoice.invoiceDate || '-'}</td>
                              <td className="p-2 md:p-3">{invoice.dueDate || '-'}</td>
                              <td className="p-2 md:p-3">{invoice.receivedAmount || '0'}</td>
                              <td className="p-2 md:p-3">{invoice.totalAmount || '0'}</td>
                              <td className="p-2 md:p-3">{invoice.balance || '0'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-2 md:p-3 text-gray-500">
                              No related invoices found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm md:text-base">
                      <thead>
                        <tr className="bg-[#06b6d4] text-white">
                          <th className="p-2 md:p-3 font-medium">Received Amount</th>
                          <th className="p-2 md:p-3 font-medium">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-gray-100">
                          <td className="p-2 md:p-3">{payment.advanceReceived || '0'}</td>
                          <td className="p-2 md:p-3">{payment.remarks || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {openDelete && (
        <DeleteConfirmModel
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
          isOpen={openDelete}
        />
      )}

      {openView && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-5 flex justify-between items-center">
              <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Payment Details
              </h2>
              <button
                className="text-2xl text-white hover:text-red-200 focus:outline-none transition-colors duration-200 transform hover:scale-110"
                onClick={handleViewClose}
              >
                ×
              </button>
            </div>
            <div className="p-4 md:p-6 bg-gray-50">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Payment#
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.paymentNumber || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Payment Date
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.paymentDate || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Payment Type
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.paymentType || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Mode
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.mode || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Bank Name
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.bankName || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Cheque No
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.chequeNo || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Cheque Date
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.chequeDate || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Seller
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.seller || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Buyer
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.buyer || '-'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Paid Amount
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.paidAmount || '0'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Income Tax Amount
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.incomeTaxAmount || '0'}
                    </div>
                  </div>
                  <div className="group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Advance Received
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.advanceReceived || '0'}
                    </div>
                  </div>
                  <div className="group col-span-1 md:col-span-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 transition-colors group-hover:text-cyan-600">
                      Remarks
                    </span>
                    <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm text-gray-800 text-sm md:text-lg font-medium group-hover:border-cyan-300 transition-all duration-200">
                      {selectedPayment.remarks || '-'}
                    </div>
                  </div>
                </div>

                {selectedPayment.paymentType === 'Payment' && (
                  <div className="mt-4">
                    <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold">Related Invoices</h2>
                    <div className="border rounded p-4 mt-2">
                      {selectedPayment.relatedInvoices && selectedPayment.relatedInvoices.length > 0 ? (
                        <table className="w-full text-left border-collapse text-sm md:text-base">
                          <thead>
                            <tr className="bg-[#06b6d4] text-white">
                              <th className="p-2 md:p-3 font-medium">Invoice #</th>
                              <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                              <th className="p-2 md:p-3 font-medium">Due Date</th>
                              <th className="p-2 md:p-3 font-medium">Total Amount</th>
                              <th className="p-2 md:p-3 font-medium">Received Amount</th>
                              <th className="p-2 md:p-3 font-medium">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPayment.relatedInvoices.map((invoice) => (
                              <tr key={invoice.id} className="border-b hover:bg-gray-100">
                                <td className="p-2 md:p-3">{invoice.invoiceNumber || '-'}</td>
                                <td className="p-2 md:p-3">{invoice.invoiceDate || '-'}</td>
                                <td className="p-2 md:p-3">{invoice.dueDate || '-'}</td>
                                <td className="p-2 md:p-3">{invoice.totalAmount || '0'}</td>
                                <td className="p-2 md:p-3">{invoice.receivedAmount || '0'}</td>
                                <td className="p-2 md:p-3">{invoice.balance || '0'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 text-sm md:text-base">No related invoices found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-400 opacity-10 rounded-full -translate-x-12 -translate-y-12 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-400 opacity-10 rounded-full translate-x-12 translate-y-12 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold">Payments</h2>
        <div className="border rounded p-4 mt-2">
          {paymentTypePayments.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm md:text-base">
              <thead>
                <tr className="bg-[#06b6d4] text-white">
                  <th className="p-2 md:p-3 font-medium">Invoice #</th>
                  <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                  <th className="p-2 md:p-3 font-medium">Due Date</th>
                  <th className="p-2 md:p-3 font-medium">Received Amount</th>
                  <th className="p-2 md:p-3 font-medium">Invoice Amount</th>
                  <th className="p-2 md:p-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {paymentTypePayments.flatMap((payment) =>
                  payment.relatedInvoices?.map((invoice) => (
                    <tr key={`${payment.id}-${invoice.id}`} className="border-b hover:bg-gray-100">
                      <td className="p-2 md:p-3">{invoice.invoiceNumber || '-'}</td>
                      <td className="p-2 md:p-3">{invoice.invoiceDate || '-'}</td>
                      <td className="p-2 md:p-3">{invoice.dueDate || '-'}</td>
                      <td className="p-2 md:p-3">{invoice.receivedAmount || '0'}</td>
                      <td className="p-2 md:p-3">{invoice.totalAmount || '0'}</td>
                      <td className="p-2 md:p-3">{invoice.balance || '0'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm md:text-base">No payments of type 'Payment' found.</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold">Advances</h2>
        <div className="border rounded p-4 mt-2">
          {advanceTypePayments.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm md:text-base">
              <thead>
                <tr className="bg-[#06b6d4] text-white">
                  <th className="p-2 md:p-3 font-medium">Received Amount</th>
                  <th className="p-2 md:p-3 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {advanceTypePayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-100">
                    <td className="p-2 md:p-3">{payment.advanceReceived || '0'}</td>
                    <td className="p-2 md:p-3">{payment.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm md:text-base">No payments of type 'Advance' found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentList;