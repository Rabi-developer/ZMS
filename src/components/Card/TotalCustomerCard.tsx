import React from "react";
import StatCard from "./StatCard";
import { UserPlus } from "lucide-react";
type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const TotalCustomerCard: React.FC = () => {
  return  <StatCard 
  label="Total Customer" 
  value="6,543" 
  icon={<UserPlus className="text-indigo-500" />} 
  />;
};

export default TotalCustomerCard;