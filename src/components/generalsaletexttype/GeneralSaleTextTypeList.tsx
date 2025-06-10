"use client";
import React from 'react';
import { getAllGeneralSaleTextTypes, deleteGeneralSaleTextType } from '@/apis/generalSaleTextType';
import { columns, GeneralSaleTextType } from '@/components/generalsaletexttype/columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const GeneralSaleTextTypeList = () => {
  const [gstTypes, setGstTypes] = React.useState<GeneralSaleTextType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const fetchGeneralSaleTextTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllGeneralSaleTextTypes(pageIndex == 0 ? 1 : pageIndex, pageSize);
      setGstTypes(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGeneralSaleTextTypes();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteGeneralSaleTextType(deleteId);
      setOpen(false);
      toast("Deleted Successfully", {
        type: "success",
      });
      fetchGeneralSaleTextTypes();
    } catch (error) {
      console.error('Failed to delete GST Type:', error);
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
      <DataTable
        columns={columns(handleDeleteOpen)}
        data={gstTypes}
        loading={loading}
        link={"/generalsaletexttype/create"}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
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
export default GeneralSaleTextTypeList;