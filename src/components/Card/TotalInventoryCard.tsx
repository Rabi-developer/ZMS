import React from "react";
import StatCard from "./StatCard";
import { Package } from "lucide-react";



const TotalInventoryCard: React.FC = () => {
  return <StatCard
    label="Total Inventory"
    value="8,765" 
    icon={< Package  className="text-yellow-500" />} 
     />;
};

export default TotalInventoryCard;