import React from "react";
import StatCard from "@/components/Card/StatCard";
import { LineChart } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const TotalStockCard: React.FC = () => {
  return <StatCard
   label="Total Stock"
   value="12,345" 
   icon={<LineChart className="text-blue-500" />} 
   />;
};

export default TotalStockCard;