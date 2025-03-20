"use client"
import React from 'react';
import { getAllDepartment, deleteDepartment } from '@/apis/departments';
import { columns, User } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const DepartmentList = () => {
  const [departments, setDepartments] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId,setDeleteId]=React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0); 
  const [pageSize, setPageSize] = React.useState(10); 

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await getAllDepartment(pageIndex == 0 ? 1 : pageIndex, pageSize);
      setDepartments(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDepartments();
  }, [pageIndex,pageSize]);

  const handleDelete = async () => {

    try {
      await deleteDepartment(deleteId);
      setOpen(false)
      toast("Deleted Successfully", {
        type: "success",
    });
      fetchDepartments();
    } catch (error) {
      console.error('Failed to delete Departments:', error);
    }
  };

  const handleDeleteOpen = async (id:any) => {
   setOpen(true)
   setDeleteId(id)
  };
  const handleDeleteclose = async () => {
    setOpen(false)
  };

  return (
    <div className='container bg-white rounded-md'>
      <DataTable columns={columns(handleDeleteOpen)} data={departments} loading={loading} link={"/department/create"} 
      setPageIndex={setPageIndex} pageIndex={pageIndex} pageSize={pageSize} setPageSize={setPageSize} />
      {
        open && 
        <DeleteConfirmModel
        handleDeleteclose={handleDeleteclose}
        handleDelete={handleDelete}
        isOpen={open}
        />
      }
    </div>
  );
};

export default DepartmentList;
