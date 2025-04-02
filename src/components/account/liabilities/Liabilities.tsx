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
import { createLiabilities, updateLiabilities, getAllLiabilities, deleteLiabilities } from '@/apis/liabilities';

// Zod schema for form validation
const liabilitySchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

type LiabilityFormData = z.infer<typeof liabilitySchema>;

type Liability = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Liability[];
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
const Liabilities = () => {
  const [loading, setLoading] = useState(false);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentIdForChild, setParentIdForChild] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string | null } | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [flatLiabilities, setFlatLiabilities] = useState<Liability[]>([]);

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<LiabilityFormData>({
    resolver: zodResolver(liabilitySchema),
  });

  const buildHierarchy = (liabilities: Liability[]): Liability[] => {
    const map: Record<string, Liability> = {};
    const rootLiabilities: Liability[] = [];
  
    // Create a map of all liabilities
    liabilities.forEach((liability) => {
      map[liability.id] = { ...liability, children: [] };
    });
  
    // Build the hierarchy
    liabilities.forEach((liability) => {
      if (liability.parentAccountId === null) {
        rootLiabilities.push(map[liability.id]);
      } else {
        const parent = map[liability.parentAccountId];
        if (parent) {
          parent.children.push(map[liability.id]);
        }
      }
    });
  
    return rootLiabilities;
  };

  const fetchLiabilities = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Liability[]> = await getAllLiabilities(pageIndex === 0 ? 1 : pageIndex, pageSize);
      console.log('Hierarchical Liabilities:', liabilities);  
      // Ensure the response data is correctly structured
      const hierarchicalLiabilities = buildHierarchy(response.data);
      setTotalPages(response.misc.totalPages); // Update total pages
      setLiabilities(hierarchicalLiabilities);
    } catch (error) {
      console.error(error);
     // toast.error('Failed to fetch liabilities. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLiabilities();
  }, [pageIndex, pageSize]);

  // Recursively find a liability by id
  const findLiability = (liabilities: Liability[], id: string): Liability | null => {
    for (const liability of liabilities) {
      if (liability.id === id) {
        return liability;
      } else if (liability.children) {
        const found = findLiability(liability.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Add a child liability
  const addChildLiability = (liabilities: Liability[], parentId: string, newLiability: Liability): Liability[] => {
    return liabilities.map((liability) => {
      if (liability.id === parentId) {
        return { ...liability, children: [...liability.children, newLiability] };
      } else if (liability.children) {
        return { ...liability, children: addChildLiability(liability.children, parentId, newLiability) };
      }
      return liability;
    });
  };

  // Update account description
  const updateDescription = (accounts: Liability[], id: string, description: string): Liability[] => {
    return accounts.map((account) => {
      if (account.id === id) {
        return { ...account, description };
      } else if (account.children) {
        return { ...account, children: updateDescription(account.children, id, description) };
      }
      return account;
    });
  };

  // // Update liability description
  // const updateDescription = (liabilities: Liability[], id: string, description: string): Liability[] => {
  //   return liabilities.map((liability) => {
  //     if (liability.id === id) {
  //       return { ...liability, description };
  //     } else if (liability.children) {
  //       return { ...liability, children: updateDescription(liability.children, id, description) };
  //     }
  //     return liability;
  //   });
  // };

  // Remove a liability
  const removeLiability = (liabilities: Liability[], id: string): Liability[] => {
    return liabilities.filter((liability) => {
      if (liability.id === id) {
        return false;
      } else if (liability.children) {
        liability.children = removeLiability(liability.children, id);
      }
      return true;
    });
  };

  // Handle right-click for context menu
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

  // Close context menu on outside click
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
    const initialLiabilityExists = liabilities.some(liability => liability.listid === '2');
    if (!initialLiabilityExists) {
      const initialLiability: Liability = {
        id: '',
        listid: '2', 
        description: 'Liabilities',
        parentAccountId: null,
        children: [],
      };
      setLiabilities((prev) => [initialLiability, ...prev]);
    }
  }, [liabilities]);

  const onSubmit = async (data: LiabilityFormData) => {
    setLoading(true);
    try {
      let response: ApiResponse<Liability>;
      if (editingId) {
        const liabilityToUpdate = findLiability(liabilities, editingId);
        if (liabilityToUpdate) {
          const updateData = {
            ...data,
            parentAccountId: liabilityToUpdate.parentAccountId,
            listid: liabilityToUpdate.listid,
          };
          response = await updateLiabilities(editingId, updateData);
          setLiabilities((prevLiabilities) => updateDescription(prevLiabilities, editingId, data.description));
          setEditingId(null);
          toast.success('Liability updated successfully!');
        }
      } else if (parentIdForChild) {
        const newLiability: Omit<Liability, 'id'> = {
          listid: '', 
          description: data.description,
          parentAccountId: parentIdForChild, 
          children: [],
        };
        response = await createLiabilities(newLiability);
        setLiabilities((prevLiabilities) => addChildLiability(prevLiabilities, parentIdForChild, response.data));
        setParentIdForChild(null);
        toast.success('Child liability added successfully!');
      } else {
        // Add a new top-level liability
        const newLiability: Omit<Liability, 'id'> = {
          listid: '', // Backend will generate this
          description: data.description,
          parentAccountId: null,
          children: [],
        };
        response = await createLiabilities(newLiability);
        setLiabilities((prevLiabilities) => [...prevLiabilities, response.data]);
        toast.success('Liability added successfully!');
      }

      setShowForm(false);
      reset();
      fetchLiabilities();
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
      const parentLiability = findLiability(liabilities, id);
      if (parentLiability) {
        setParentIdForChild(parentLiability.id); 
      }
      reset({ id: '', description: '' });
    } else if (action === 'edit') {
      setEditingId(id);
      const liability = findLiability(liabilities, id);
      if (liability) {
        reset({ id: liability.id, description: liability.description });
      }
      setShowForm(true);
    } else if (action === 'delete') {
      try {
        await deleteLiabilities(id);
        setLiabilities((prevLiabilities) => removeLiability(prevLiabilities, id));
        toast.success('Liability deleted successfully!');
      } catch (error) {
        console.error('Error deleting liability:', error);
        toast.error('Failed to delete liability. Please try again.');
      }
    }
  };

  const filteredLiabilities = liabilities.filter((liability) => {
    return (
      (liability.listid && liability.listid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (liability.description && liability.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); 
  };

  const paginatedLiabilities = filteredLiabilities.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const renderLiabilities = (liabilities: Liability[], level = 0) => {
    return (
      
      <ul className="list-none mt-4 bg-white dark:bg-[#030630] z-0">
        {liabilities.map((liability) => (
          <li key={`${liability.id}-${liability.listid}`} className="relative pl-4">
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
              onContextMenu={(e) => handleRightClick(e, liability.id)}
            >
              {/* Expand/Collapse Icon */}
              {liability.children && liability.children.length > 0 && (
                <button
                  onClick={() => toggleItem(liability.id)}
                  className="flex items-center justify-center w-5 h-5 rounded-full  bg-[#06b5d4] hover:bg-black transition-colors duration-200 shadow"
                >
                  {openItems[liability.id] ? (
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
              {/* Liability Details */}
              <div className="flex-1">
                <span className="font-bold text-white p-[3px] px-[6px] br bg-[#06b6d4] rounded-md">{liability.listid}</span>
                <span className="ml-2 font-semibold text-black ">{liability.description}</span>
              </div>
            </div>
            {/* Render sub-children if expanded */}
            {liability.children && openItems[liability.id] && (
              <div className="pl-6">{renderLiabilities(liability.children, level + 1)}</div>
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
                {loading ? 'Submitting...' : (editingId ? 'Update' : 'Create')} Liability
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

      {/* List of liabilities */}
      <div className="p-2 border-2 border-[#2aa0cd] shadow-2xl rounded">
        {/* Header */}
        <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf] mb-2 pt-2">
          <h1 className="text-base text-[24px] font-mono ml-10  pt-2 text-white flex gap-2">
            <FaRegListAlt size={30} />
            <span className="mt-1"> LIST OF LIABILITIES </span>
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

        <div>{renderLiabilities(paginatedLiabilities)}</div>
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

export default Liabilities;