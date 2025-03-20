"use client"
import React from 'react';
import { getAllOrganization, deleteOrganization } from '@/apis/organization';
import { columns, User } from './columns'; 
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const OrganizationList = () => {
  const [organizations, setOrganizations] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId,setDeleteId]=React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0); 
  const [pageSize, setPageSize] = React.useState(10); 

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await getAllOrganization(pageIndex == 0 ? 1 : pageIndex, pageSize);
      setOrganizations(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrganizations();
  }, [pageIndex,pageSize]);

  const handleDelete = async () => {

    try {
      await deleteOrganization(deleteId);
      setOpen(false)
      toast("Deleted Successfully", {
        type: "success",
    });
      fetchOrganizations();
    } catch (error) {
      console.error('Failed to delete organization:', error);
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
      <DataTable columns={columns(handleDeleteOpen)} data={organizations} loading={loading} link={"/organization/create"}
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

export default OrganizationList;
