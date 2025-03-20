"use client"
import React from 'react';
import { columns } from './columns'; // Ensure correct import
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import {getAllAddress, deleteAddress } from '@/apis/address';
import { toast } from 'react-toastify';

const BranchList = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId,setDeleteId]=React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0); 
  const [pageSize, setPageSize] = React.useState(10); 

  const fetchAddress = async () => {
    try {
      setLoading(true);
      const response = await getAllAddress(pageIndex == 0 ? 1 : pageIndex, pageSize);
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAddress();
  }, [pageIndex,pageSize]);

  const handleDelete = async () => {

    try {
      await deleteAddress(deleteId);
      setOpen(false)
      toast("Deleted Successfully", {
        type: "success",
    });
      fetchAddress();
    } catch (error) {
      console.error('Failed to delete branchs:', error);
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
      <DataTable columns={columns(handleDeleteOpen)} data={data} loading={loading} link={"/address/create"}
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

export default BranchList;
