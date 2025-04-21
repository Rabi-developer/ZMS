
import React from 'react';
import { getAllBuyer, deleteBuyer } from '@/apis/buyer';
import { columns, Buyer } from '..//Buyer/columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const BuyerList = () => {
  const [Buyers, setBuyers] = React.useState<Buyer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      // Adjust API call as per your backend pagination
      const response = await getAllBuyer(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setBuyers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBuyers();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteBuyer(deleteId);
      setOpen(false);
      toast("Deleted Successfully", { type: "success" });
      fetchBuyers();
    } catch (error) {
      console.error('Failed to delete Buyer:', error);
      toast("Failed to delete Buyer", { type: "error" });
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
        data={Buyers} 
        loading={loading} 
        link={'/buyer/create'} 
        setPageIndex={setPageIndex} 
        pageIndex={pageIndex} 
        pageSize={pageSize} 
        setPageSize={setPageSize} 
      />
      {open && <DeleteConfirmModel handleDeleteclose={handleDeleteClose} handleDelete={handleDelete} isOpen={open} />}
    </div>
  );
};

export default BuyerList;
