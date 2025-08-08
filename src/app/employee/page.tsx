'use client'
import MainLayout from "@/components/MainLayout/MainLayout";
import Employee from "@/components/Employee/EmployeeForm"
import EmployeeList from "@/components/Employee/EmployeeList";
const page = () => {
  return (
    <div>
      <MainLayout activeInterface="ZMS">
          <EmployeeList/>
      </MainLayout>
    </div>
  );
}

export default page;
