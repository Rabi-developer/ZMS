# TODO: Fix OrderProgress.tsx to display one row per consignment

## Tasks
- [x] Modify tableData useMemo to create one row per consignment instead of combining into single row
- [x] Ensure booking order info (orderNo, orderDate, vehicleNo) is repeated in each row
- [x] Include consignment-specific data in each row
- [x] Handle order-level data (charges, payments, receipts) by repeating in each row
- [x] If no consignments, still show one row with booking and other data
- [ ] Test the changes to ensure correct display
