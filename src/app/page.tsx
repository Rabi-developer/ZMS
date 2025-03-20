import Sidebar from "@/components/Sidebar/Sidebar";
import { Metadata } from "next";
import Dashboardlayout from "@/components/Dashboard/Dashboardlayout";
import MainLayout from "@/components/MainLayout/MainLayout";

export const metadata: Metadata = {
  title: "ZMS",
  description: "ZMS SOFTWARE",
};

export default function Home() {
  return (
    <>
     <MainLayout>
      <Dashboardlayout />
    </MainLayout>

    </>
  );
}
