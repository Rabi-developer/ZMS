import React from "react";
import StatCard from "./StatCard";
import { AlertTriangle } from "lucide-react";



const TotalLossCard: React.FC = () => {
  return  <StatCard 
  label="Total Loss" 
  value="345" 
  icon={<AlertTriangle className="text-red-500" />} 
  />;
};

export default TotalLossCard;