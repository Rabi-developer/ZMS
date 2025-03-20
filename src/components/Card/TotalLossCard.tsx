import React from "react";
import StatCard from "./StatCard";
import { AlertTriangle } from "lucide-react";
type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const TotalLossCard: React.FC = () => {
  return  <StatCard 
  label="Total Loss" 
  value="345" 
  icon={<AlertTriangle className="text-red-500" />} 
  />;
};

export default TotalLossCard;