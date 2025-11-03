'use client';

import React from 'react';
import { FiEdit2, FiTrash2, FiEye, FiPlus } from 'react-icons/fi';
import { usePermissions, WithPermission } from '@/contexts/PermissionContext';

interface TableActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const TableActionButton: React.FC<TableActionButtonProps> = ({
  onClick,
  icon,
  label,
  variant = 'secondary',
  size = 'sm',
  className = '',
  disabled = false,
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
};

interface PermissionTableActionsProps {
  resource: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const PermissionTableActions: React.FC<PermissionTableActionsProps> = ({
  resource,
  onView,
  onEdit,
  onDelete,
  viewLabel = 'View',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  className = '',
  size = 'sm',
  showLabels = false,
}) => {
  const { hasPermission } = usePermissions();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* View Action */}
      {onView && (
        <WithPermission resource={resource} action="Read">
          <TableActionButton
            onClick={onView}
            icon={<FiEye className="w-4 h-4" />}
            label={viewLabel}
            variant="secondary"
            size={size}
          />
          {showLabels && <span className="ml-1 text-xs">{viewLabel}</span>}
        </WithPermission>
      )}

      {/* Edit Action */}
      {onEdit && (
        <WithPermission resource={resource} action="Update">
          <TableActionButton
            onClick={onEdit}
            icon={<FiEdit2 className="w-4 h-4" />}
            label={editLabel}
            variant="primary"
            size={size}
          />
          {showLabels && <span className="ml-1 text-xs">{editLabel}</span>}
        </WithPermission>
      )}

      {/* Delete Action */}
      {onDelete && (
        <WithPermission resource={resource} action="Delete">
          <TableActionButton
            onClick={onDelete}
            icon={<FiTrash2 className="w-4 h-4" />}
            label={deleteLabel}
            variant="danger"
            size={size}
          />
          {showLabels && <span className="ml-1 text-xs">{deleteLabel}</span>}
        </WithPermission>
      )}
    </div>
  );
};

interface PermissionCreateButtonProps {
  resource: string;
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
}

export const PermissionCreateButton: React.FC<PermissionCreateButtonProps> = (props) => {
  const {
    resource,
    onClick,
    label = 'Create',
    icon = <FiPlus className="w-4 h-4" />,
    variant = 'primary',
    size = 'md',
    className = '',
    fullWidth = false,
  } = props;

  const handleClick = () => {
    onClick();
  };

  return (
    <WithPermission resource={resource} action="Create">
      <TableActionButton
        onClick={handleClick}
        icon={icon}
        label={label}
        variant={variant}
        size={size}
        className={`${fullWidth ? 'w-full' : ''} ${className}`}
      />
      <span className="ml-2">{label}</span>
    </WithPermission>
  );
};

// Hook for checking table permissions
export const useTablePermissions = (resource: string) => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(resource, 'Read'),
    canCreate: hasPermission(resource, 'Create'),
    canEdit: hasPermission(resource, 'Update'),
    canDelete: hasPermission(resource, 'Delete'),
  };
};

// Compound component for table headers with permission-based columns
interface PermissionTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const PermissionTableHeader: React.FC<PermissionTableHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800 ${className}`}>
      <tr>{children}</tr>
    </thead>
  );
};

interface PermissionTableColumnProps {
  resource?: string;
  action?: 'Read' | 'Create' | 'Update' | 'Delete';
  children: React.ReactNode;
  className?: string;
}

export const PermissionTableColumn: React.FC<PermissionTableColumnProps> = ({
  resource,
  action,
  children,
  className = '',
}) => {
  if (resource && action) {
    return (
      <WithPermission resource={resource} action={action}>
        <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
          {children}
        </th>
      </WithPermission>
    );
  }

  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

// Higher-order component for wrapping entire tables with permission checks
interface WithTablePermissionProps {
  resource: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const WithTablePermission: React.FC<WithTablePermissionProps> = ({
  resource,
  fallback = (
    <div className="text-center py-8">
      <p className="text-gray-500 dark:text-gray-400">You don't have permission to view this resource.</p>
    </div>
  ),
  children,
}) => {
  return (
    <WithPermission resource={resource} action="Read" fallback={fallback}>
      {children}
    </WithPermission>
  );
};

// Example usage component for demonstration
export const ExampleTableWithPermissions: React.FC<{ resource: string }> = ({ resource }) => {
  const { canView, canCreate, canEdit, canDelete } = useTablePermissions(resource);

  const handleView = (id: string) => {
    console.log(`Viewing ${resource} with ID: ${id}`);
  };

  const handleEdit = (id: string) => {
    console.log(`Editing ${resource} with ID: ${id}`);
  };

  const handleDelete = (id: string) => {
    console.log(`Deleting ${resource} with ID: ${id}`);
  };

  const handleCreate = () => {
    console.log(`Creating new ${resource}`);
  };

  return (
    <WithTablePermission resource={resource}>
      <div className="bg-white dark:bg-gray-900 shadow rounded-lg">
        {/* Header with Create Button */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{resource} Management</h2>
          <PermissionCreateButton
            resource={resource}
            onClick={handleCreate}
            label={`Create ${resource}`}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <PermissionTableHeader>
              <PermissionTableColumn>Name</PermissionTableColumn>
              <PermissionTableColumn>Status</PermissionTableColumn>
              <PermissionTableColumn>Created Date</PermissionTableColumn>
              <PermissionTableColumn resource={resource} action="Read">Actions</PermissionTableColumn>
            </PermissionTableHeader>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Sample Item</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Active</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">2024-01-01</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <PermissionTableActions
                    resource={resource}
                    onView={() => handleView('1')}
                    onEdit={() => handleEdit('1')}
                    onDelete={() => handleDelete('1')}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </WithTablePermission>
  );
};