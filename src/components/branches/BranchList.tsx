"use client"
import React from 'react';
import { getAllBranch, deleteBranch } from '@/apis/branchs';
import { columns, User } from './columns'; 
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const BranchList = () => {
  const [branchs, setBranchs] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0); 
  const [pageSize, setPageSize] = React.useState(10); 

  const fetchBranchs = async () => {
    try {
      setLoading(true);
      const response = await getAllBranch(pageIndex == 0 ? 1 : pageIndex, pageSize);
      setBranchs(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBranchs();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {

    try {
      await deleteBranch(deleteId);
      setOpen(false)
      toast("Deleted Successfully", {
        type: "success",
      });
      fetchBranchs();
    } catch (error) {
      console.error('Failed to delete branchs:', error);
    }
  };

  const handleDeleteOpen = async (id: any) => {
    setOpen(true)
    setDeleteId(id)
  };
  const handleDeleteclose = async () => {
    setOpen(false)
  };

  return (
    <div className='container bg-white rounded-md'>
      <DataTable columns={columns(handleDeleteOpen)} data={branchs} loading={loading} link={"/branchs/create"}
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
