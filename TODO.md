# TODO - Opening Balance Debit/Credit Balance Fix

## Task
Add validation/restriction to prevent saving Opening Balance when Debit and Credit are not equal (unbalanced).

## Plan
- [ ] Add validation in the onSubmit function to check if totals are balanced
- [ ] Show error message if debit ≠ credit
- [ ] Disable the submit button when totals are unbalanced

## File to Edit
- `src/components/ablsoftware/voucher/OpeningBalance/OpeningBalance.tsx`

## Changes Needed
1. Add a check in onSubmit to validate that total debit === total credit
2. Add a state variable to track validation error
3. Show error message when unbalanced
4. Disable the submit button when unbalanced (optional but recommended)
