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
import { createAssets, updateAssets, getAllAssets, deleteAssets } from '@/apis/assets';

// Zod schema for form validation
const assetSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

type AssetFormData = z.infer<typeof assetSchema>;

type Asset = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Asset[];
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
const Assets = () => {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentIdForChild, setParentIdForChild] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string | null } | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [flatAssets, setFlatAssets] = useState<Asset[]>([]);

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
  });

  // Build hierarchical structure from flat data
  const buildHierarchy = (assets: Asset[]): Asset[] => {
    const map: Record<string, Asset> = {};
    assets.forEach((asset) => {
      map[asset.id] = { ...asset, children: [] };
    });

    const rootAssets: Asset[] = [];
    assets.forEach((asset) => {
      if (asset.parentAccountId === null) {
        rootAssets.push(map[asset.id]);
      } else {
        const parent = map[asset.parentAccountId];
        if (parent) {
          parent.children.push(map[asset.id]);
        }
      }
    });

    return rootAssets;
  };

  // Fetch assets
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Asset[]> = await getAllAssets(pageIndex === 0 ? 1 : pageIndex, pageSize);
      const hierarchicalAssets = buildHierarchy(response.data);
      setTotalPages(response.misc.totalPages); // Update total pages
      setAssets(hierarchicalAssets);
    } catch (error) {
      console.error(error);
      // toast.error('Failed to fetch assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [pageIndex, pageSize]);

  // Recursively find an asset by id
  const findAsset = (assets: Asset[], id: string): Asset | null => {
    for (const asset of assets) {
      if (asset.id === id) {
        return asset;
      } else if (asset.children) {
        const found = findAsset(asset.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Add a child asset
  const addChildAsset = (assets: Asset[], parentId: string, newAsset: Asset): Asset[] => {
    return assets.map((asset) => {
      if (asset.id === parentId) {
        return { ...asset, children: [...asset.children, newAsset] };
      } else if (asset.children) {
        return { ...asset, children: addChildAsset(asset.children, parentId, newAsset) };
      }
      return asset;
    });
  };

  // Update asset description
  const updateDescription = (assets: Asset[], id: string, description: string): Asset[] => {
    return assets.map((asset) => {
      if (asset.id === id) {
        return { ...asset, description };
      } else if (asset.children) {
        return { ...asset, children: updateDescription(asset.children, id, description) };
      }
      return asset;
    });
  };

  // Remove an asset
  const removeAsset = (assets: Asset[], id: string): Asset[] => {
    return assets.filter((asset) => {
      if (asset.id === id) {
        return false;
      } else if (asset.children) {
        asset.children = removeAsset(asset.children, id);
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
    // Check if the initial asset (ID: 3, Description: Assets) exists
    const initialAssetExists = assets.some(asset => asset.listid === '3');
    if (!initialAssetExists) {
      const initialAsset: Asset = {
        id: '',
        listid: '3', // Start ID from 3
        description: 'Assets',
        parentAccountId: null,
        children: [],
      };
      setAssets([initialAsset, ...assets]);
    }
  }, [assets]);

  // Handle form submission
  const onSubmit = async (data: AssetFormData) => {
    setLoading(true);
    try {
      let response: ApiResponse<Asset>;
      if (editingId) {
        // Find the asset being edited
        const assetToUpdate = findAsset(assets, editingId);
        if (assetToUpdate) {
          // Update existing asset
          const updateData = {
            ...data,
            parentAccountId: assetToUpdate.parentAccountId,
            listid: assetToUpdate.listid,
          };
          response = await updateAssets(editingId, updateData);
          setAssets((prevAssets) => updateDescription(prevAssets, editingId, data.description));
          setEditingId(null);
          toast.success('Asset updated successfully!');
        }
      } else if (parentIdForChild) {
        // Add a new child asset
        const newAsset: Omit<Asset, 'id'> = {
          listid: '', // Backend will generate this
          description: data.description,
          parentAccountId: parentIdForChild, // Use the correct GUID here
          children: [],
        };
        response = await createAssets(newAsset);
        setAssets((prevAssets) => addChildAsset(prevAssets, parentIdForChild, response.data));
        setParentIdForChild(null);
        toast.success('Child asset added successfully!');
      } else {
        // Add a new top-level asset
        const newAsset: Omit<Asset, 'id'> = {
          listid: '', // Backend will generate this
          description: data.description,
          parentAccountId: null,
          children: [],
        };
        response = await createAssets(newAsset);
        setAssets((prevAssets) => [...prevAssets, response.data]);
        toast.success('Asset added successfully!');
      }

      setShowForm(false);
      reset();
      fetchAssets();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle context menu actions
  const handleContextMenuAction = async (action: 'add' | 'addChild' | 'edit' | 'delete', id: string) => {
    setContextMenu(null);
    if (action === 'add') {
      setShowForm(true);
      reset({ id: '', description: '' });
    } else if (action === 'addChild') {
      setShowForm(true);
      const parentAsset = findAsset(assets, id);
      if (parentAsset) {
        setParentIdForChild(parentAsset.id); // Use the actual GUID here
      }
      reset({ id: '', description: '' });
    } else if (action === 'edit') {
      setEditingId(id);
      const asset = findAsset(assets, id);
      if (asset) {
        reset({ id: asset.id, description: asset.description });
      }
      setShowForm(true);
    } else if (action === 'delete') {
      try {
        await deleteAssets(id);
        setAssets((prevAssets) => removeAsset(prevAssets, id));
        toast.success('Asset deleted successfully!');
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const filteredAssets = assets.filter((asset) => {
    return (
      (asset.listid && asset.listid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); 
  };

  const paginatedAssets = filteredAssets.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const renderAssets = (assets: Asset[], level = 0) => {
    return (
      <ul className="list-none mt-4 bg-white dark:bg-[#030630] z-0">
        {assets.map((asset) => (
          <li key={`${asset.id}-${asset.listid}`} className="relative pl-4">
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
              onContextMenu={(e) => handleRightClick(e, asset.id)}
            >
              {/* Expand/Collapse Icon */}
              {asset.children && asset.children.length > 0 && (
                <button
                  onClick={() => toggleItem(asset.id)}
                  className="flex items-center justify-center w-5 h-5 rounded-full  bg-[#06b5d4] hover:bg-black transition-colors duration-200 shadow"
                >
                  {openItems[asset.id] ? (
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
              {/* Asset Details */}
              <div className="flex-1">
                <span className="font-bold text-white p-[3px] px-[6px] br bg-[#06b6d4] rounded-md">{asset.listid}</span>
                <span className="ml-2 font-semibold text-black ">{asset.description}</span>
              </div>
            </div>
            {/* Render sub-children if expanded */}
            {asset.children && openItems[asset.id] && (
              <div className="pl-6">{renderAssets(asset.children, level + 1)}</div>
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
                {loading ? 'Submitting...' : (editingId ? 'Update' : 'Create')} Asset
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

      {/* List of assets */}
      <div className="p-2 border-2 border-[#2aa0cd] shadow-2xl rounded">
        {/* Header */}
        <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf] mb-2 pt-2">
          <h1 className="text-base text-[24px] font-mono ml-10  pt-2 text-white flex gap-2">
            <FaRegListAlt size={30} />
            <span className="mt-1"> LIST OF ASSETS </span>
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

        <div>{renderAssets(paginatedAssets)}</div>
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

export default Assets;