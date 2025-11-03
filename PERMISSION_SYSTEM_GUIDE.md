# Permission-Based Access Control System

A comprehensive permission management system for the ZMS application that handles user authentication, authorization, and permission-based UI rendering with **SuperAdmin** support.

## Features

- ✅ **Authentication Management**: Login/logout with token management
- ✅ **Permission Context**: React context for global permission access
- ✅ **SuperAdmin Support**: Full access for SuperAdmin users
- ✅ **LocalStorage Integration**: Persistent permission storage
- ✅ **Sidebar Filtering**: Hide/show menu items based on permissions
- ✅ **Table Actions**: Permission-based CRUD buttons (View, Edit, Delete, Create)
- ✅ **Route Protection**: Prevent access to unauthorized routes
- ✅ **ABL Dashboard Integration**: Permission-based access to ABL features
- ✅ **Utility Functions**: Helper functions for permission checking
- ✅ **TypeScript Support**: Full type safety

## SuperAdmin Access

### SuperAdmin Login Response
```json
{
  "data": {
    "userId": "fc9544a9-4e5c-4032-a27f-3001b29364c5",
    "userName": "SuperAdmin",
    "email": "admin@ZMS.com",
    "fullName": "Super Admin",
    "roles": ["SuperAdmin"],
    "token": "jwt-token",
    "permissions": {
      "All": ["Create", "Read", "Update", "Delete", "Execute"]
    }
  },
  "statusCode": 200,
  "statusMessage": "Login successful"
}
```

### SuperAdmin Features
- **Full Access**: SuperAdmin users have access to ALL resources and actions
- **No Restrictions**: Bypasses all permission checks
- **All Menus Visible**: Shows all sidebar items regardless of specific permissions
- **All Actions Available**: Can perform Create, Read, Update, Delete on any resource

## Installation & Setup

### 1. Install Dependencies
```bash
npm install react-toastify
```

### 2. Update Layout
The `PermissionProvider` is already wrapped around your app in `src/app/layout.tsx`:

```tsx
import { PermissionProvider } from "@/contexts/PermissionContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PermissionProvider>
          {children}
        </PermissionProvider>
      </body>
    </html>
  );
}
```

### 3. Login Integration
The login component (`src/components/Singin.tsx`) automatically saves permissions to localStorage and initializes the permission context.

## Usage Examples

### 1. Using Permission Hooks

```tsx
import { usePermissions, useIsSuperAdmin } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const { 
    userData, 
    permissions, 
    hasPermission, 
    canRead, 
    canCreate, 
    canUpdate, 
    canDelete,
    isSuperAdmin 
  } = usePermissions();

  // Check if user is SuperAdmin
  const isSuper = useIsSuperAdmin();

  // SuperAdmin has access to everything
  if (isSuperAdmin) {
    console.log('User has full access to everything!');
  }

  // Check specific permission (SuperAdmin automatically passes)
  if (hasPermission('Company', 'Read')) {
    // User can read Company data (or is SuperAdmin)
  }

  // Check CRUD permissions (SuperAdmin automatically passes)
  const canViewCompanies = canRead('Company');
  const canCreateCompanies = canCreate('Company');
  const canEditCompanies = canUpdate('Company');
  const canDeleteCompanies = canDelete('Company');

  return (
    <div>
      {isSuperAdmin && <SuperAdminPanel />}
      {canViewCompanies && <CompanyList />}
      {canCreateCompanies && <CreateCompanyButton />}
    </div>
  );
};
```

### 2. Permission Components

#### WithPermission Component
```tsx
import { WithPermission } from '@/contexts/PermissionContext';

{/* SuperAdmin will see this regardless of specific permissions */}
<WithPermission resource="Company" action="Create">
  <button>Create Company</button>
</WithPermission>

<WithPermission resource="Branch" action="Read" fallback={<div>No access</div>}>
  <BranchList />
</WithPermission>
```

#### Table Actions
```tsx
import { PermissionTableActions } from '@/components/permissions/PermissionTableActions';

{/* SuperAdmin will see all actions */}
<PermissionTableActions
  resource="Company"
  onView={() => handleView(id)}
  onEdit={() => handleEdit(id)}
  onDelete={() => handleDelete(id)}
/>
```

#### Create Button
```tsx
import { PermissionCreateButton } from '@/components/permissions/PermissionTableActions';

{/* SuperAdmin will always see this */}
<PermissionCreateButton
  resource="Company"
  onClick={handleCreate}
  label="Create Company"
/>
```

### 3. ABL Dashboard Integration

The ABL Dashboard automatically checks permissions:

```tsx
// In ABLDashboardlayout.tsx
const { canRead, isSuperAdmin } = usePermissions();

// SuperAdmin or users with specific ABL permissions can access
const canAccessAblDashboard = isSuperAdmin || 
  canRead('AblDashboard') || 
  canRead('AblAssets') || 
  canRead('BookingOrder');
```

### 4. Table with Permission-Based Columns

```tsx
import { 
  WithTablePermission,
  PermissionTableHeader,
  PermissionTableColumn,
  PermissionTableActions,
  PermissionCreateButton
} from '@/components/permissions/PermissionTableActions';

const CompanyTable = () => {
  return (
    <WithTablePermission resource="Company">
      <div className="bg-white shadow rounded-lg">
        {/* Header with Create Button - SuperAdmin always sees this */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2>Company Management</h2>
          <PermissionCreateButton
            resource="Company"
            onClick={handleCreate}
            label="Create Company"
          />
        </div>

        {/* Table */}
        <table className="min-w-full">
          <PermissionTableHeader>
            <PermissionTableColumn>Name</PermissionTableColumn>
            <PermissionTableColumn>Status</PermissionTableColumn>
            <PermissionTableColumn>Actions</PermissionTableColumn>
          </PermissionTableHeader>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.status}</td>
                <td>
                  {/* SuperAdmin sees all actions */}
                  <PermissionTableActions
                    resource="Company"
                    onView={() => handleView(company.id)}
                    onEdit={() => handleEdit(company.id)}
                    onDelete={() => handleDelete(company.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WithTablePermission>
  );
};
```

### 5. Sidebar Integration
The sidebar (`src/components/Sidebar/SidebarMenu.tsx`) automatically filters menu items based on user permissions. **SuperAdmin users see ALL menu items.**

### 6. Route Protection
```tsx
import { usePermissions } from '@/contexts/PermissionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProtectedPage = () => {
  const { canRead, isSuperAdmin } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    // SuperAdmin can access everything
    if (!isSuperAdmin && !canRead('Company')) {
      router.push('/unauthorized');
    }
  }, [canRead, isSuperAdmin, router]);

  if (!isSuperAdmin && !canRead('Company')) {
    return <div>Access Denied</div>;
  }

  return <CompanyManagement />;
};
```

## Available Resources

Based on your login response, the following resources are available:

### ZMS Resources
- `Company`, `Branch`, `BranchSetting`, `Warehouse`, `Address`
- `ProjectTarget`, `Equality`, `Liabilities`, `Assets`, `Expense`, `Revenue`
- `BookingOrder`, `Consignment`, `Charges`, `BillPaymentInvoices`
- `Receipt`, `Payment`, `BookingOrderReport`

### ABL Resources  
- `AblAssets`, `AblExpense`, `AblLiabilities`, `AblRevenue`
- `AblDashboard`, `PaymentABL`

### SuperAdmin Resources
- `All` - Grants access to everything

## Permission Actions

Each resource can have the following permissions:
- `Read` - View/list data
- `Create` - Add new records
- `Update` - Edit existing records
- `Delete` - Remove records
- `Execute` - Special actions (SuperAdmin only)

## SuperAdmin Detection

The system detects SuperAdmin in two ways:

1. **Permission Check**: User has `"All": ["Create", "Read", "Update", "Delete", "Execute"]`
2. **Role Check**: User's roles include "SuperAdmin"

```tsx
// Check if user is SuperAdmin
const { isSuperAdmin } = usePermissions();

// Or use the utility function
import { isSuperAdmin } from '@/utils/permissions';
const isSuper = isSuperAdmin(permissions);
```

## Utility Functions

### Permission Checking
```tsx
import { 
  hasPermission, 
  canRead, 
  canCreate, 
  canUpdate, 
  canDelete, 
  hasAnyPermission,
  isSuperAdmin 
} from '@/utils/permissions';

// SuperAdmin automatically passes all checks
const canViewCompanies = hasPermission('Company', 'Read');
const canCreateBranch = canCreate('Branch');
const canEditAssets = canUpdate('Assets');
const canDeleteExpenses = canDelete('Expense');
const hasCompanyAccess = hasAnyPermission('Company');
const isSuper = isSuperAdmin();
```

### Data Management
```tsx
import { 
  saveUserData, 
  getUserData, 
  getUserPermissions, 
  clearUserData, 
  isAuthenticated 
} from '@/utils/permissions';

// Save user data (automatically called on login)
saveUserData(userData);

// Get current user data
const user = getUserData();

// Get permissions only
const permissions = getUserPermissions();

// Check if user is logged in
const loggedIn = isAuthenticated();

// Clear all data (logout)
clearUserData();
```

## Login Response Formats

### Regular User
```json
{
  "data": {
    "userId": "7ccdceb6-dc7f-4210-263f-08de1263d4af",
    "userName": "rabidev",
    "email": "rabidev@gmail.com",
    "fullName": "Rabail Waheed Zaman",
    "roles": ["TEst 2"],
    "token": "jwt-token",
    "permissions": {
      "Company": ["Read", "Create", "Update", "Delete"],
      "Branch": ["Read", "Create"],
      "Assets": ["Read", "Update"]
    }
  },
  "statusCode": 200,
  "statusMessage": "Login successful"
}
```

### SuperAdmin User
```json
{
  "data": {
    "userId": "fc9544a9-4e5c-4032-a27f-3001b29364c5",
    "userName": "SuperAdmin",
    "email": "admin@ZMS.com",
    "fullName": "Super Admin",
    "roles": ["SuperAdmin"],
    "token": "jwt-token",
    "permissions": {
      "All": ["Create", "Read", "Update", "Delete", "Execute"]
    }
  },
  "statusCode": 200,
  "statusMessage": "Login successful"
}
```

## Component Integration Examples

### Updated BookingOrder List
The BookingOrder list component now includes permission checks:

```tsx
// In BookingOrderList.tsx
const { canRead, canCreate, canUpdate, canDelete, isSuperAdmin } = usePermissions();

// SuperAdmin or users with BookingOrder read permission can access
const canAccessBookingOrders = isSuperAdmin || canRead('BookingOrder');

if (!canAccessBookingOrders) {
  return <AccessDenied />;
}

return (
  <WithTablePermission resource="BookingOrder">
    {/* Component content */}
  </WithTablePermission>
);
```

## Best Practices

1. **Always check SuperAdmin first** - SuperAdmin bypasses all permission checks
2. **Use permission hooks** instead of directly accessing localStorage
3. **Use WithPermission components** for conditional rendering
4. **Check permissions in useEffect** for route protection
5. **Use table action components** for consistent UI
6. **Handle loading states** when permissions are being initialized
7. **Provide fallback content** for denied access

## Troubleshooting

### Common Issues

1. **SuperAdmin not working**: Check if permissions include `"All": ["Create", "Read", "Update", "Delete", "Execute"]`
2. **Permissions not working**: Make sure `PermissionProvider` wraps your app
3. **Sidebar not filtering**: Check if resource names match exactly
4. **Table actions not showing**: Verify resource name spelling
5. **Route protection not working**: Use `useEffect` with dependency on permissions

### Debug Tips

```tsx
const { permissions, isLoading, isSuperAdmin } = usePermissions();

console.log('User permissions:', permissions);
console.log('Is SuperAdmin:', isSuperAdmin);
console.log('Is loading:', isLoading);
console.log('Can read Company:', hasPermission('Company', 'Read'));
```

## Integration Checklist

- ✅ **PermissionProvider** wrapped around app
- ✅ **Login component** updated to save permissions
- ✅ **Sidebar filtering** implemented  
- ✅ **ABL Dashboard** permission checks added
- ✅ **BookingOrder List** permission checks added
- ✅ **Table action components** created
- ✅ **SuperAdmin support** implemented
- ✅ **Route protection** available
- ✅ **Loading states** handled
- ✅ **Error handling** implemented

This system provides a complete solution for managing permissions throughout your ZMS application with full SuperAdmin support, ensuring both security and excellent user experience.