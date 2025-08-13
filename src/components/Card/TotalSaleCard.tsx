import React from "react";
import StatCard from "./StatCard";
import { ShoppingCart } from "lucide-react";


const TotalSaleCard: React.FC = () => {
  return <StatCard 
  label="Total Sale" 
  value="10,234" 
  icon={<ShoppingCart className="text-green-500" />}
   />;
};

export default TotalSaleCard;