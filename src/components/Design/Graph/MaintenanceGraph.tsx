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

const MaintenanceGraph = () => {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Maintenance Costs ($)',
        data: [1000, 1200, 1100, 1300, 1250, 1400],
        borderColor: '#1a5f3a',
        backgroundColor: 'rgba(26, 95, 58, 0.2)',
        pointBackgroundColor: '#d4a017',
        pointBorderColor: '#d4a017',
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Monthly Maintenance Costs' },
    },
  };

  return <Line data={data} options={options} />;
};

export default MaintenanceGraph;