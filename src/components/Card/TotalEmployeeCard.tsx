import React from "react";
import StatCard from "./StatCard";
import { User } from "lucide-react";
type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const TotalEmployeeCard: React.FC = () => {
  return <StatCard 
   label="Total Employee" 
   value="789" 
   icon={<User className="text-teal-500" />} 
   />;
};

export default TotalEmployeeCard;