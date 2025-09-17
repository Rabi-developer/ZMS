'use client';
import React, { useState, useEffect } from 'react';
import { getAllProjectTargets, deleteProjectTarget } from '@/apis/projecttarget';
import { columns, ProjectTarget } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ProjectTargetList = () => {
  const [projectTargets, setProjectTargets] = useState<ProjectTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [progressFilter, setProgressFilter] = useState<string>('');

  const fetchProjectTargets = async () => {
    try {
      setLoading(true);
      const response = await getAllProjectTargets(pageIndex === 0 ? 1 : pageIndex, pageSize);
      // Filter targets based on progress
      const filteredTargets = response.data.filter((target: ProjectTarget) => {
        const progressMatch = progressFilter ? target.targetPeriod === progressFilter : true;
        return progressMatch;
      });
      setProjectTargets(filteredTargets);
    } catch (error) {
      console.error(error);
      toast('Failed to fetch project targets', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectTargets();
  }, [pageIndex, pageSize, progressFilter]);

  const handleDelete = async () => {
    try {
      await deleteProjectTarget(deleteId);
      setOpen(false);
      toast('Deleted Successfully', { type: 'success' });
      fetchProjectTargets();
    } catch (error) {
      console.error('Failed to delete Project Target:', error);
      toast('Failed to delete project target', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => {
    setOpen(true);
    setDeleteId(id);
  };

  const handleDeleteClose = () => {
    setOpen(false);
  };

  const periodOptions = [
    { id: 1, name: 'Daily' },
    { id: 2, name: 'Weekly' },
    { id: 3, name: '15 Days' },
    { id: 4, name: 'Monthly' },
  ];

  return (
    <div className="container bg-white rounded-md dark:bg-gray-900 ">
      <div className="container mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div className="relative">
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                className="w-full md:w-48 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600 transition-all duration-300 appearance-none"
              >
                <option value="">All Progress Periods</option>
                {periodOptions.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              <label
                className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Progress Filter
              </label>
            </div>
          </div>
        </div>

        {/* Data Table */}
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
        {open && (
          <DeleteConfirmModel
            handleDeleteclose={handleDeleteClose}
            handleDelete={handleDelete}
            isOpen={open}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectTargetList;