'use client';

import React, { useState } from 'react';
import { usePermissions, WithPermission } from '@/contexts/PermissionContext';
import { 
  PermissionTableActions, 
  PermissionCreateButton, 
  WithTablePermission,
  PermissionTableHeader,
  PermissionTableColumn,
  useTablePermissions 
} from '@/components/permissions/PermissionTableActions';
import { FiPlus, FiUsers, FiSettings } from 'react-icons/fi';

// Example usage component showing how to implement permission-based features
const ExampleUsagePage: React.FC = () => {
  const { userData, permissions, hasPermission, canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [selectedResource, setSelectedResource] = useState('Company');
  
  // Get table permissions for the selected resource
  const tablePermissions = useTablePermissions(selectedResource);

  // Example data
  const exampleData = [
    { id: '1', name: 'Main Office', status: 'Active', createdDate: '2024-01-01' },
    { id: '2', name: 'Branch Office', status: 'Inactive', createdDate: '2024-01-02' },
    { id: '3', name: 'Remote Office', status: 'Active', createdDate: '2024-01-03' },
  ];

  // Resource list from your login response
  const availableResources = Object.keys(permissions);

  const handleView = (id: string) => {
    console.log(`Viewing ${selectedResource} with ID: ${id}`);
  };

  const handleEdit = (id: string) => {
    console.log(`Editing ${selectedResource} with ID: ${id}`);
  };

  const handleDelete = (id: string) => {
    console.log(`Deleting ${selectedResource} with ID: ${id}`);
  };

  const handleCreate = () => {
    console.log(`Creating new ${selectedResource}`);
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in to continue</h2>
          <p className="text-gray-600">You need to be authenticated to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* User Info Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Permission System Demo</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">User Info</h3>
            <p><strong>Name:</strong> {userData.fullName}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Username:</strong> {userData.userName}</p>
            <p><strong>Roles:</strong> {userData.roles.join(', ')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Available Resources</h3>
            <div className="max-h-32 overflow-y-auto">
              {availableResources.map(resource => (
                <div key={resource} className="text-sm">
                  <strong>{resource}:</strong> {permissions[resource].join(', ')}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Resource Selector</h3>
            <select 
              value={selectedResource} 
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {availableResources.map(resource => (
                <option key={resource} value={resource}>{resource}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permission Check Examples */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Permission Checks for: {selectedResource}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded ${tablePermissions.canView ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>Read:</strong> {tablePermissions.canView ? '✅ Allowed' : '❌ Denied'}
          </div>
          <div className={`p-3 rounded ${tablePermissions.canCreate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>Create:</strong> {tablePermissions.canCreate ? '✅ Allowed' : '❌ Denied'}
          </div>
          <div className={`p-3 rounded ${tablePermissions.canEdit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>Update:</strong> {tablePermissions.canEdit ? '✅ Allowed' : '❌ Denied'}
          </div>
          <div className={`p-3 rounded ${tablePermissions.canDelete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>Delete:</strong> {tablePermissions.canDelete ? '✅ Allowed' : '❌ Denied'}
          </div>
        </div>
      </div>

      {/* Table with Permission-Based Actions */}
      <WithTablePermission resource={selectedResource}>
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg">
          {/* Header with Create Button */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedResource} Management</h2>
            <PermissionCreateButton
              resource={selectedResource}
              onClick={handleCreate}
              label={`Create ${selectedResource}`}
              icon={<FiPlus className="w-4 h-4" />}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <PermissionTableHeader>
                <PermissionTableColumn>Name</PermissionTableColumn>
                <PermissionTableColumn>Status</PermissionTableColumn>
                <PermissionTableColumn>Created Date</PermissionTableColumn>
                <PermissionTableColumn>Actions</PermissionTableColumn>
              </PermissionTableHeader>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {exampleData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.createdDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <PermissionTableActions
                        resource={selectedResource}
                        onView={() => handleView(item.id)}
                        onEdit={() => handleEdit(item.id)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </WithTablePermission>

      {/* Individual Permission Components Examples */}
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Individual Permission Components</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">WithPermission Component Examples:</h3>
            <div className="flex flex-wrap gap-2">
              <WithPermission resource={selectedResource} action="Read">
                <button className="px-3 py-2 bg-blue-500 text-white rounded">
                  Read {selectedResource}
                </button>
              </WithPermission>
              
              <WithPermission resource={selectedResource} action="Create">
                <button className="px-3 py-2 bg-green-500 text-white rounded">
                  Create {selectedResource}
                </button>
              </WithPermission>
              
              <WithPermission resource={selectedResource} action="Update">
                <button className="px-3 py-2 bg-yellow-500 text-white rounded">
                  Update {selectedResource}
                </button>
              </WithPermission>
              
              <WithPermission resource={selectedResource} action="Delete">
                <button className="px-3 py-2 bg-red-500 text-white rounded">
                  Delete {selectedResource}
                </button>
              </WithPermission>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Conditional Rendering Examples:</h3>
            <div className="space-y-2">
              {canRead(selectedResource) && (
                <p className="text-green-600">✅ You can read {selectedResource} data</p>
              )}
              {canCreate(selectedResource) && (
                <p className="text-green-600">✅ You can create new {selectedResource} records</p>
              )}
              {canUpdate(selectedResource) && (
                <p className="text-green-600">✅ You can update {selectedResource} records</p>
              )}
              {canDelete(selectedResource) && (
                <p className="text-green-600">✅ You can delete {selectedResource} records</p>
              )}
              
              {!hasPermission(selectedResource, 'Read') && (
                <p className="text-red-600">❌ You cannot read {selectedResource} data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleUsagePage;