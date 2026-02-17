'use client';
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type GraphDataset = {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  fill?: boolean;
};

type DeliveryGraphProps = {
  labels?: string[];
  datasets?: GraphDataset[];
  title?: string;
};

const DeliveryGraph = ({ labels, datasets, title }: DeliveryGraphProps) => {
  const graphLabels = labels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const graphDatasets = datasets ?? [
    {
      label: 'Deliveries',
      data: [200, 250, 300, 280, 320, 350],
      borderColor: '#1a5f3a',
      backgroundColor: 'rgba(26, 95, 58, 0.2)',
      pointBackgroundColor: '#d4a017',
      pointBorderColor: '#d4a017',
      fill: true,
    },
  ];

  const data = {
    labels: graphLabels,
    datasets: graphDatasets.map((set) => ({
      ...set,
      borderColor: set.borderColor ?? '#1a5f3a',
      backgroundColor: set.backgroundColor ?? 'rgba(26, 95, 58, 0.2)',
      pointBackgroundColor: set.pointBackgroundColor ?? '#d4a017',
      pointBorderColor: set.pointBorderColor ?? '#d4a017',
      fill: set.fill ?? true,
      tension: 0.25,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title ?? 'Monthly Deliveries' },
    },
  };

  return (
    <div className="h-72">
      <Line data={data} options={options} />
    </div>
  );
};

export default DeliveryGraph;
