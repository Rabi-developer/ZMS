# Field Restrictions Test Results

## Consignment Form Restrictions (when fromBooking=true)

### ✅ ALLOWED FIELDS (Should be editable):
- Consignor (dropdown)
- Consignee (dropdown)

### ❌ RESTRICTED FIELDS (Should be disabled):
- All Basic Information fields (Consignment Mode, Receipt No, Order No, Bilty No, Date, Consignment No)
- All Shipping Information fields (Shipping Line, Container No, Port, Destination, Freight From)
- All Items Details fields (Item Desc, Qty, Qty Unit, Weight, Weight Unit)
- All Financial Information fields (Freight, SBR Tax, SPR Amount, Delivery Charges, etc.)
- Consignment Date, Receiver Name, Receiver Contact No

## Charges Form Restrictions (when fromBooking=true)

### ✅ ALLOWED FIELDS (Should be editable):
- Charges (dropdown in table)
- Amount (number input in table)

### ❌ RESTRICTED FIELDS (Should be disabled):
- All Basic Information fields (Charge No, Charge Date, Order No)
- All other table columns (Bilty No, Date, Vehicle#, Paid to Person, Contact#, Remarks)

## Implementation Status:
- ✅ Field restriction logic implemented
- ✅ Visual indicators added to section headers
- ✅ Informational banners added to both forms
- ✅ Proper URL parameters passed from BookingOrder buttons