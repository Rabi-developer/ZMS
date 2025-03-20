import React from "react";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <div
      className="p-4 h-[16vh] bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-lg flex items-center space-x-4 relative overflow-hidden rounded-full duration-300 ease-in-out transform hover:-translate-y-2 active:translate-y-0"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200 rounded-full opacity-30 transform translate-x-3 -translate-y-3"></div>
      <div className="icon text-3xl text-blue-500">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-800">{value}</div>
      </div>
    </div>
  );
};

export default StatCard;
