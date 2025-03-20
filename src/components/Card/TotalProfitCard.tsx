import React from "react";
import StatCard from "./StatCard";
import { DollarSign } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const TotalProfitCard: React.FC = () => {
  return <StatCard 
  label="Total Profit" 
  value="25,678" 
  icon={<DollarSign className="text-green-600" />} 
  />;
};

export default TotalProfitCard;
