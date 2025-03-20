import React from "react";
import StatCard from "./StatCard";
import { Users } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const TotalClientCard: React.FC = () => {
  return <StatCard 
      label="Total Client" 
      value="1,234" 
      icon={<Users className="text-purple-500" />} 
      />;
};
export default TotalClientCard;
