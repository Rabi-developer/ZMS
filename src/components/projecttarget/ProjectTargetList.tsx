import React from 'react';
import { getAllProjectTargets, deleteProjectTarget } from '@/apis/projecttarget';
import { columns, ProjectTarget } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const ProjectTargetList = () => {
  const [projectTargets, setProjectTargets] = React.useState<ProjectTarget[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const fetchProjectTargets = async () => {
    try {
      setLoading(true);
      const response = await getAllProjectTargets(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setProjectTargets(response.data);
    } catch (error) {
      console.error(error);zzzzzz
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProjectTargets();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteProjectTarget(deleteId);
      setOpen(false);
      toast("Deleted Successfully", { type: "success" });
      fetchProjectTargets();
    } catch (error) {
      console.error('Failed to delete Project Target:', error);
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
        data={projectTargets} 
        loading={loading} 
        link={'/projecttarget/create'} 
        setPageIndex={setPageIndex} 
        pageIndex={pageIndex} 
        pageSize={pageSize} 
        setPageSize={setPageSize} 
      />
      {open && <DeleteConfirmModel handleDeleteclose={handleDeleteClose} handleDelete={handleDelete} isOpen={open} />}
    </div>
  );
};

export default ProjectTargetList;