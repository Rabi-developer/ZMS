'use client';
import React from 'react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type GraphDataset = {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
};

type FuelUsageGraphProps = {
  labels?: string[];
  datasets?: GraphDataset[];
  title?: string;
};

const FuelUsageGraph = ({ labels, datasets, title }: FuelUsageGraphProps) => {
  const graphLabels = labels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const graphDatasets = datasets ?? [
    {
      label: 'Fuel Usage (Liters)',
      data: [5000, 5200, 4800, 5100, 5300, 5500],
      backgroundColor: '#1a5f3a',
      borderColor: '#d4a017',
      borderWidth: 1,
    },
  ];

  const data = {
    labels: graphLabels,
    datasets: graphDatasets.map((set) => ({
      ...set,
      backgroundColor: set.backgroundColor ?? '#1a5f3a',
      borderColor: set.borderColor ?? '#d4a017',
      borderWidth: set.borderWidth ?? 1,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title ?? 'Monthly Fuel Usage' },
    },
  };

  return (
    <div className="h-72">
      <Bar data={data} options={options} />
    </div>
  );
};

export default FuelUsageGraph;
