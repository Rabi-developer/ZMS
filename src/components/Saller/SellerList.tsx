
import React from 'react';
import { getAllSellers, deleteSeller } from '@/apis/seller';
import { columns, Seller } from '..//Saller/columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const SellerList = () => {
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      // Adjust API call as per your backend pagination
      const response = await getAllSellers(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setSellers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSellers();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteSeller(deleteId);
      setOpen(false);
      toast("Deleted Successfully", { type: "success" });
      fetchSellers();
    } catch (error) {
      console.error('Failed to delete Seller:', error);
      toast("Failed to delete Seller", { type: "error" });
    }
  };

  const handleDeleteOpen = (id: string) => {
    setOpen(true);
    setDeleteId(id);
  };

  const handleDeleteClose = () => {
    setOpen(false);
  };

  return (
    <div className='container bg-white rounded-md'>
      <DataTable 
        columns={columns(handleDeleteOpen)} 
        data={sellers} 
        loading={loading} 
        link={'/saller/create'} 
        setPageIndex={setPageIndex} 
        pageIndex={pageIndex} 
        pageSize={pageSize} 
        setPageSize={setPageSize} 
      />
      {open && <DeleteConfirmModel handleDeleteclose={handleDeleteClose} handleDelete={handleDelete} isOpen={open} />}
    </div>
  );
};

export default SellerList;
