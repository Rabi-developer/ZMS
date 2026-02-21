# View Mode Implementation Guide

## Overview
This guide shows how to implement view-only mode for all forms in the application.

## Pattern to Follow

### 1. Add View Mode Detection (at component start)
```typescript
const YourFormComponent = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  
  // Add this view mode detection
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isViewMode = searchParams?.get('mode') === 'view';
  
  // ... rest of component
```

### 2. Disable All Input Fields
Add `disabled={isViewMode}` to all inputs:

```typescript
// Text inputs
<input 
  {...register('fieldName')} 
  disabled={isViewMode}
  className="... disabled:opacity-60 disabled:cursor-not-allowed"
/>

// Select dropdowns
<select 
  {...register('fieldName')} 
  disabled={isViewMode}
  className="... disabled:opacity-60 disabled:cursor-not-allowed"
>

// Date inputs
<ABLCustomInput 
  type="date" 
  {...register('fieldName')} 
  disabled={isViewMode}
/>

// Number inputs
<input 
  type="number" 
  {...register('fieldName')} 
  disabled={isViewMode}
  className="... disabled:opacity-60 disabled:cursor-not-allowed"
/>
```

### 3. Hide Action Buttons (Add Row, Delete)
```typescript
// Add Row Button - Hide completely
{!isViewMode && (
  <Button onClick={handleAddRow}>
    <FiPlus /> Add Row
  </Button>
)}

// Delete Button - Hide completely
{!isViewMode && fields.length > 1 && (
  <Button onClick={() => remove(index)}>
    <FiTrash2 />
  </Button>
)}
```

### 4. Replace Submit Button with Close Button
```typescript
{isViewMode ? (
  <Button
    type="button"
    onClick={() => router.back()}
    className="bg-gray-500 hover:bg-gray-600 text-white"
  >
    Close
  </Button>
) : (
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Save'}
  </Button>
)}
```

## Forms to Update

### ✅ Completed
1. AccountOpeningBalance
2. OpeningBalance

### 🔄 Pending Implementation
3. BookingOrder
4. Consignment
5. Charges
6. BillPaymentInvoices
7. Receipt
8. PaymentABL
9. EntryVoucher (if needed)

## Testing Checklist
For each form, verify:
- [ ] View button navigates to form with `?mode=view`
- [ ] All input fields are disabled
- [ ] All dropdowns are disabled
- [ ] Add Row button is hidden
- [ ] Delete buttons are hidden
- [ ] Submit button is replaced with Close button
- [ ] Close button returns to list
- [ ] Data displays correctly in read-only mode

## Common Patterns

### For Array Fields (useFieldArray)
```typescript
const { fields, append, remove } = useFieldArray({ control, name: 'items' });

// In render:
{fields.map((field, index) => (
  <tr key={field.id}>
    <td>
      <input {...register(`items.${index}.name`)} disabled={isViewMode} />
    </td>
    <td>
      {!isViewMode && fields.length > 1 && (
        <Button onClick={() => remove(index)}>Delete</Button>
      )}
    </td>
  </tr>
))}
```

### For Conditional Inputs
```typescript
// If input has existing disabled logic, combine with isViewMode
<input 
  disabled={existingCondition || isViewMode}
  className={`... ${existingCondition || isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
/>
```

### For Custom Components
Pass isViewMode as prop:
```typescript
<CustomDropdown 
  value={value}
  onChange={onChange}
  disabled={isViewMode}
/>
```

## Notes
- Always add `disabled:opacity-60 disabled:cursor-not-allowed` classes for visual feedback
- Use `router.back()` for Close button to return to previous page
- Test with both create and edit modes
- Ensure all nested components respect view mode
