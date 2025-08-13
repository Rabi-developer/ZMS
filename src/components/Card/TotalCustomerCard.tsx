import React from "react";
import StatCard from "./StatCard";
import { UserPlus } from "lucide-react";

const TotalCustomerCard: React.FC = () => {
  return  <StatCard 
  label="Total Customer" 
  value="6,543" 
  icon={<UserPlus className="text-indigo-500" />} 
  />;
};

export default TotalCustomerCard;