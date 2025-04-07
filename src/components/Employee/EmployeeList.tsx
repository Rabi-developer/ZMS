import React from 'react';
import { getAllEmployee, deleteEmployee } from '@/apis/employee';
import { columns, Employee } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const EmployeeList = () => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployee(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setEmployees(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteEmployee(deleteId);
      setOpen(false);
      toast("Deleted Successfully", { type: "success" });
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete Employee:', error);
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
      data={employees}
      loading={loading} 
      link={'/employee/create'} 
      setPageIndex={setPageIndex} pageIndex={pageIndex} pageSize={pageSize} setPageSize={setPageSize} />
      {open && 
      <DeleteConfirmModel
       handleDeleteclose={handleDeleteClose} 
       handleDelete={handleDelete} 
       isOpen={open}
        />
        }
    </div>
  );
};

export default EmployeeList;
