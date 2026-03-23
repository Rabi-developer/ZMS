# Full SDD workflow

## Workflow Steps

### [x] Step: Requirements

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

### [x] Step: Technical Specification

Create a technical specification based on the PRD.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

### [x] Step: Planning

Create a detailed implementation plan based on the specification.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps

### [x] Step: Implementation

- [x] Update imports in Receipt.tsx
- [x] Add Account type and helper functions to Receipt.tsx
- [x] Implement HierarchicalDropdown component in Receipt.tsx
- [x] Fetch hierarchical accounts in ReceiptForm useEffect
- [x] Replace bankName dropdown with HierarchicalDropdown in ReceiptForm
- [x] Style HierarchicalDropdown list items to match requested design
- [x] Implement hierarchical account search for bankName in PaymentABL.tsx
- [x] Resolve bankName account IDs to simple text descriptions in Receipt and PaymentABL lists
