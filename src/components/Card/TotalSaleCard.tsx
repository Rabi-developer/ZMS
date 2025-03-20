import React from "react";
import StatCard from "./StatCard";
import { ShoppingCart } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const TotalSaleCard: React.FC = () => {
  return <StatCard 
  label="Total Sale" 
  value="10,234" 
  icon={<ShoppingCart className="text-green-500" />}
   />;
};

export default TotalSaleCard;