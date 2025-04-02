'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import { Button } from '@/components/ui/button';
import { FaRegListAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { VscGoToSearch } from 'react-icons/vsc';
import Link from 'next/link';
import { createRevenue, updateRevenue, getAllRevenue, deleteRevenue } from '@/apis/revenue';

// Zod schema for form validation
const revenueSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

type Revenue = {
  id: string;
  listid: string;
  description: string;
 parentAccountId: string | null;
  children: Revenue[];
};

type ApiResponse<T> = {
  data: T;
  statusCode: number;
  statusMessage: string;
  misc: {
    totalPages: number;
    total: number;
    pageIndex: number;
    pageSize: number;
    refId: string | null;
    searchQuery: string | null;
  };
};

// Main component
const Revenues = () => {
  const [loading, setLoading] = useState(false);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentIdForChild, setParentIdForChild] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string | null } | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [flatRevenues, setFlatRevenues] = useState<Revenue[]>([]);

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
  });

  // Build hierarchical structure from flat data
  const buildHierarchy = (revenues: Revenue[]): Revenue[] => {
    const map: Record<string, Revenue> = {};
    revenues.forEach((revenue) => {
      map[revenue.id] = { ...revenue, children: [] };
    });

    const rootRevenues: Revenue[] = [];
    revenues.forEach((revenue) => {
      if (revenue.parentAccountId === null) {
        rootRevenues.push(map[revenue.id]);
      } else {
        const parent = map[revenue.parentAccountId];
        if (parent) {
          parent.children.push(map[revenue.id]);
        }
      }
    });

    return rootRevenues;
  };

  // Fetch revenues
  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Revenue[]> = await getAllRevenue(pageIndex === 0 ? 1 : pageIndex, pageSize);
      const hierarchicalRevenues = buildHierarchy(response.data);
      setTotalPages(response.misc.totalPages); // Update total pages
      setRevenues(hierarchicalRevenues);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenues();
  }, [pageIndex, pageSize]);

  const findRevenue = (revenues: Revenue[], id: string): Revenue | null => {
    for (const revenue of revenues) {
      if (revenue.id === id) {
        return revenue;
      } else if (revenue.children) {
        const found = findRevenue(revenue.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const addChildRevenue = (revenues: Revenue[], parentId: string, newRevenue: Revenue): Revenue[] => {
    return revenues.map((revenue) => {
      if (revenue.id === parentId) {
        return { ...revenue, children: [...revenue.children, newRevenue] };
      } else if (revenue.children) {
        return { ...revenue, children: addChildRevenue(revenue.children, parentId, newRevenue) };
      }
      return revenue;
    });
  };

  const updateDescription = (revenues: Revenue[], id: string, description: string): Revenue[] => {
    return revenues.map((revenue) => {
      if (revenue.id === id) {
        return { ...revenue, description };
      } else if (revenue.children) {
        return { ...revenue, children: updateDescription(revenue.children, id, description) };
      }
      return revenue;
    });
  };

  const removeRevenue = (revenues: Revenue[], id: string): Revenue[] => {
    return revenues.filter((revenue) => {
      if (revenue.id === id) {
        return false;
      } else if (revenue.children) {
        revenue.children = removeRevenue(revenue.children, id);
      }
      return true;
    });
  };

  const handleRightClick = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, id });
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const initialRevenueExists = revenues.some(revenue => revenue.listid === '5');
    if (!initialRevenueExists) {
      const initialRevenue: Revenue = {
        id: '',
        listid: '5',
        description: 'Revenue',
       parentAccountId: null,
        children: [],
      };
      setRevenues([initialRevenue, ...revenues]);
    }
  }, [revenues]);

  const onSubmit = async (data: RevenueFormData) => {
    setLoading(true);
    try {
      let response: ApiResponse<Revenue>;
      if (editingId) {
        const revenueToUpdate = findRevenue(revenues, editingId);
        if (revenueToUpdate) {
          const updateData = {
            ...data,
           parentAccountId: revenueToUpdate.parentAccountId,
            listid: revenueToUpdate.listid,
          };
          response = await updateRevenue(editingId, updateData);
          setRevenues((prevRevenues) => updateDescription(prevRevenues, editingId, data.description));
          setEditingId(null);
          toast.success('Revenue updated successfully!');
        }
      } else if (parentIdForChild) {
        const newRevenue: Omit<Revenue, 'id'> = {
          listid: '',
          description: data.description,
         parentAccountId: parentIdForChild, 
          children: [],
        };
        response = await createRevenue(newRevenue);
        setRevenues((prevRevenues) => addChildRevenue(prevRevenues, parentIdForChild, response.data));
        setParentIdForChild(null);
        toast.success('Child revenue added successfully!');
      } else {
        const newRevenue: Omit<Revenue, 'id'> = {
          listid: '',
          description: data.description,
         parentAccountId: null,
          children: [],
        };
        response = await createRevenue(newRevenue);
        setRevenues((prevRevenues) => [...prevRevenues, response.data]);
        toast.success('Revenue added successfully!');
      }

      setShowForm(false);
      reset();
      fetchRevenues();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContextMenuAction = async (action: 'add' | 'addChild' | 'edit' | 'delete', id: string) => {
    setContextMenu(null);
    if (action === 'add') {
      setShowForm(true);
      reset({ id: '', description: '' });
    } else if (action === 'addChild') {
      setShowForm(true);
      const parentRevenue = findRevenue(revenues, id);
      if (parentRevenue) {
        setParentIdForChild(parentRevenue.id); 
      }
      reset({ id: '', description: '' });
    } else if (action === 'edit') {
      setEditingId(id);
      const revenue = findRevenue(revenues, id);
      if (revenue) {
        reset({ id: revenue.id, description: revenue.description });
      }
      setShowForm(true);
    } else if (action === 'delete') {
      try {
        await deleteRevenue(id);
        setRevenues((prevRevenues) => removeRevenue(prevRevenues, id));
        toast.success('Revenue deleted successfully!');
      } catch (error) {
        console.error('Error deleting revenue:', error);
        toast.error('Failed to delete revenue. Please try again.');
      }
    }
  };

  const filteredRevenues = revenues.filter((revenue) => {
    return (
      (revenue.listid && revenue.listid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (revenue.description && revenue.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); 
  };

  const paginatedRevenues = filteredRevenues.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const renderRevenues = (revenues: Revenue[], level = 0) => {
    return (
      <ul className="list-none mt-4 bg-white dark:bg-[#030630] z-0">
        {revenues.map((revenue) => (
          <li key={`${revenue.id}-${revenue.listid}`} className="relative pl-4">
            {level > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600 z-0"
                style={{ height: '100%' }}
              />
            )}
            {level > 0 && (
              <div
                className="absolute left-0 top-1/2 w-4 h-px bg-gray-300 dark:bg-gray-600"
                style={{ transform: 'translateY(-50%)' }}
              />
            )}
            <div
              className="flex mb-4 items-center gap-3 p-2 bg-[#e6f8fb] border border-[#06b6d4]  text-black hover:bg-[#06b6d4] rounded-lg  transition-all duration-300"
              onContextMenu={(e) => handleRightClick(e, revenue.id)}
            >
              {/* Expand/Collapse Icon */}
              {revenue.children && revenue.children.length > 0 && (
                <button
                  onClick={() => toggleItem(revenue.id)}
                  className="flex items-center justify-center w-5 h-5 rounded-full  bg-[#06b5d4] hover:bg-black transition-colors duration-200 shadow"
                >
                  {openItems[revenue.id] ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )}
              {/* Revenue Details */}
              <div className="flex-1">
                <span className="font-bold text-white p-[3px] px-[6px] br bg-[#06b6d4] rounded-md">{revenue.listid}</span>
                <span className="ml-2 font-semibold text-black ">{revenue.description}</span>
              </div>
            </div>
            {/* Render sub-children if expanded */}
            {revenue.children && openItems[revenue.id] && (
              <div className="pl-6">{renderRevenues(revenue.children, level + 1)}</div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container mx-auto p-4 z-10 relative">
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded p-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full text-left p-1 hover:bg-gray-100"
            onClick={() => handleContextMenuAction('add', contextMenu.id!)}
          >
            Add
          </button>
          <button
            className="block w-full text-left p-1 hover:bg-gray-100"
            onClick={() => handleContextMenuAction('addChild', contextMenu.id!)}
          >
            Add Child
          </button>
          <button
            className="block w-full text-left p-1 hover:bg-gray-100"
            onClick={() => handleContextMenuAction('edit', contextMenu.id!)}
          >
            Edit
          </button>
          <button
            className="block w-full text-left p-1 hover:bg-gray-100 text-red-500"
            onClick={() => handleContextMenuAction('delete', contextMenu.id!)}
          >
            Delete
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="id"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    type="text"
                    placeholder="ID"
                    label="ID"
                    disabled
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    label="Description"
                    type="text"
                    placeholder="Description"
                    register={register}
                    {...register("description")}
                    error={errors.description?.message}
                  />
                )}
              />
            </div>
            <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
              <Button
                type="submit"
                className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
                disabled={loading}
              >
                {loading ? 'Submitting...' : (editingId ? 'Update' : 'Create')} Revenue
              </Button>
              <Button
                type="button"
                className="w-[160] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List of revenues */}
      <div className="p-2 border-2 border-[#2aa0cd] shadow-2xl rounded">
        {/* Header */}
        <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf] mb-2 pt-2">
          <h1 className="text-base text-[24px] font-mono ml-10  pt-2 text-white flex gap-2">
            <FaRegListAlt size={30} />
            <span className="mt-1"> LIST OF REVENUES </span>
          </h1>
        </div>

        {/* Search Input */}
        <div className="w-full flex justify-end">
          <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#0891b2]">
            <VscGoToSearch className="ml-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Anything....."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 outline-none"
            />
            <button className="bg-[#0891b2] text-white px-4 py-2 rounded-r-md hover:bg-[#07779d] transition">
              Search
            </button>
          </div>
        </div>

        <div>{renderRevenues(paginatedRevenues)}</div>
        <div className="flex justify-between py-2 mt-1 px-4 rounded-md items-center">
          {/* Page count (Start Section) */}
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Page {pageIndex + 1} of {totalPages}
            </span>
          </div>

          {/* Pagination controls (End Section) */}
          <div className="flex items-center space-x-3">
            {/* Rows per page selection */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-[#030630]"
              >
                {[50, 100, 1000, 2000, 5000, 10000].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenues;