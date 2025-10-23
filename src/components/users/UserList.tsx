'use client';
import React from 'react';
import { getAllAccounts, deleteAccount } from '@/apis/users';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import UserForm from './UserForm';

export interface User {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  role: string; // This will be derived from the roles array
}

interface ApiUser {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  isActive: boolean;
  roles: string[];
}

const UserList = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [showForm, setShowForm] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllAccounts(pageIndex + 1, pageSize);
      // Extract the data array and map to match the User interface
      const apiUsers = response.data || [];
      const mappedUsers: User[] = apiUsers.map((apiUser: ApiUser) => ({
        id: apiUser.id,
        userName: apiUser.userName,
        email: apiUser.email,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        middleName: apiUser.middleName,
        role: apiUser.roles[0] || 'Unknown', // Take the first role or set a default
      }));
      setUsers(mappedUsers);
    } catch (error) {
      setUsers([]);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteAccount(deleteId);
      setOpen(false);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleFormClose = (refresh = false) => {
    setShowForm(false);
    setEditingUser(null);
    if (refresh) fetchUsers();
  };

  return (
    <div className="container mx-auto py-6">
      {showForm ? (
        <UserForm
          id={editingUser?.id}
          initialData={
            editingUser
              ? { ...editingUser, middleName: editingUser.middleName ?? undefined }
              : undefined
          }
          onClose={handleFormClose}
        />
      ) : (
        <>
            <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage application users</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] hover:from-[#1a5f3a]/90 hover:to-[#2a7f4a]/90 text-white rounded-xl transition-all duration-300 shadow-lg"
            >
              Create New User
            </Button>
          </div>          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-[#d4a017] overflow-hidden">
            <div className="p-6 border-b-2 border-[#d4a017] bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a]">
              <h2 className="text-xl font-semibold text-white">Users List</h2>
              <p className="text-white mt-1">
                {loading ? 'Loading users...' : `Showing ${users.length} user${users.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {loading ? (
              <div className="p-3 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                No users found. <Button variant="link" onClick={() => setShowForm(true)}>Create one now</Button>
              </div>
            ) : (
              <div className="divide-y divide-[#d4a017]">
                {users.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.userName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {user.email} | <span className="px-2 py-1 bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] text-white text-xs rounded">{user.role}</span>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {user.firstName} {user.middleName || ''} {user.lastName}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(user)}
                          className="border-[#1a5f3a] text-[#1a5f3a] hover:bg-[#1a5f3a] hover:text-white transition-all duration-300"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setOpen(true);
                            setDeleteId(user.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 transition-all duration-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t-2 border-[#d4a017] flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">Page {pageIndex + 1}</div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                  className="border-[#1a5f3a] text-[#1a5f3a] hover:bg-[#1a5f3a] hover:text-white transition-all duration-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPageIndex(pageIndex + 1)}
                  disabled={users.length < pageSize}
                  className="border-[#1a5f3a] text-[#1a5f3a] hover:bg-[#1a5f3a] hover:text-white transition-all duration-300"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-3 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;