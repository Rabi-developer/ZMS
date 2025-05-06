'use client';
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'react-toastify';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type ContractSummaryCardProps = {
  contractId?: string;
  initialData?: any;
};

const ContractSummaryCard = ({ contractId, initialData }: ContractSummaryCardProps) => {
  const [contractData, setContractData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData && contractId ? true : false);

  // Simulated API call to fetch contract data (replace with actual API)
  const fetchContractData = async (id: string) => {
    try {
      setLoading(true);
      // Replace with actual API call, e.g., await getSingleContract(id)
      const response = {
        data: {
          contractNumber: 'CON-001',
          seller: 'Seller Name',
          buyer: 'Buyer Name',
          deliveryDetails: {
            fabricValue: '10000',
            gstValue: '1800',
            totalAmount: '11800',
            sellerCommission: '500',
            buyerCommission: '300',
            commissionFrom: 'Both',
          },
        },
      };
      setContractData(response.data);
    } catch (error) {
      console.error('Error fetching contract data:', error);
      toast('Failed to fetch contract data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId && !initialData) {
      fetchContractData(contractId);
    }
  }, [contractId, initialData]);

  // Prepare data for Bar Chart
  const chartData = {
    labels: ['Fabric Value', 'GST Value', 'Total Amount', 'Seller Comm.', 'Buyer Comm.'],
    datasets: [
      {
        label: 'Amount (₹)',
        data: [
          parseFloat(contractData?.deliveryDetails?.fabricValue || '0'),
          parseFloat(contractData?.deliveryDetails?.gstValue || '0'),
          parseFloat(contractData?.deliveryDetails?.totalAmount || '0'),
          contractData?.deliveryDetails?.commissionFrom === 'Both'
            ? parseFloat(contractData?.deliveryDetails?.sellerCommission || '0')
            : 0,
          contractData?.deliveryDetails?.commissionFrom === 'Both'
            ? parseFloat(contractData?.deliveryDetails?.buyerCommission || '0')
            : 0,
        ],
        backgroundColor: [
          '#06b6d4', // Fabric Value
          '#0891b2', // GST Value
          '#0e7490', // Total Amount
          '#14b8a6', // Seller Commission
          '#2dd4bf', // Buyer Commission
        ],
        borderColor: [
          '#06b6d4',
          '#0891b2',
          '#0e7490',
          '#14b8a6',
          '#2dd4bf',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Contract Financial Summary',
        color: '#1f2937',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#030630] shadow-lg rounded-lg p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading contract data...</p>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="bg-white dark:bg-[#030630] shadow-lg rounded-lg p-6">
        <p className="text-gray-500 dark:text-gray-400">No contract data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#030630] shadow-lg rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white">
          Contract Summary: {contractData.contractNumber}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Details */}
        <div>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seller</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {contractData.seller}
            </p>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Buyer</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {contractData.buyer}
            </p>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              ₹{contractData.deliveryDetails.totalAmount}
            </p>
          </div>
          {contractData.deliveryDetails.commissionFrom === 'Both' && (
            <>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Seller Commission
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{contractData.deliveryDetails.sellerCommission}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Buyer Commission
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{contractData.deliveryDetails.buyerCommission}
                </p>
              </div>
            </>
          )}
        </div>
        {/* Bar Chart */}
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default ContractSummaryCard;