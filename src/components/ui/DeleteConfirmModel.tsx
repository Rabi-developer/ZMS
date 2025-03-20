import React from 'react';
import { FaRegTrashAlt, FaTimes } from 'react-icons/fa';

interface DeleteConfirmModelProps {
  isOpen?: boolean;
  handleDeleteclose:any;
  handleDelete:any;
}

const DeleteConfirmModel: React.FC<DeleteConfirmModelProps> = ({ isOpen, handleDeleteclose,handleDelete }) => {
  if (!isOpen) return null;

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.id === 'deleteModal') {
      handleDeleteclose();
    }
  };

  return (
    <div
      id="deleteModal"
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-60 cursor-pointer"
      onClick={handleClose}
    >
      <div className="relative p-4 w-full max-w-md h-full md:h-auto flex flex-col justify-center">
        <div className="relative p-4 text-center bg-white rounded shadow sm:p-5">
          <button
            onClick={()=>handleDeleteclose()}
            type="button"
            className="transition-all duration-500 text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-black hover:text-white rounded-full text-sm p-1.5 ml-auto inline-flex items-center"
            data-modal-toggle="deleteModal"
          >
            <FaTimes className="w-5 h-5" size={14} />
            <span className="sr-only">Close modal</span>
          </button>
          <FaRegTrashAlt className="text-black opacity-40 w-11 h-11 mb-5 mx-auto" />
          <p className="mb-4 text-black">Are you sure you want to delete this item?</p>
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={()=>handleDeleteclose()}
              type="button"
              className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
            >
              No, cancel
            </button>
            <button
              onClick={()=>handleDelete()}
              type="button"
              className="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
            >
              Yes, I&apos;m sure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModel;
