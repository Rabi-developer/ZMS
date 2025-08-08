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

const DeliveryGraph = () => {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Deliveries',
        data: [200, 250, 300, 280, 320, 350],
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
      title: { display: true, text: 'Monthly Deliveries' },
    },
  };

  return <Line data={data} options={options} />;
};

export default DeliveryGraph;