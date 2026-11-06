# PROJECT PHASE 2 — PRODUCTION MANAGEMENT SYSTEM
## MASTER SPECIFICATION DOCUMENTATION ONLY

Act as a senior Business Analyst, Enterprise Software Architect, ERP Consultant, Database Architect, and Professional UI/UX Designer.

We have completed the design of an existing website for the Textile Industries Cooperative Association for Ma'awiz and Spinning in Al-Rawdah, Shabwah, Yemen.

We are now starting Phase 2: designing and developing a separate Production Management System for the association.

# CRITICAL: PROTECT THE EXISTING WEBSITE

The existing public website is FINAL and APPROVED.

You are strictly prohibited from modifying any part of its existing design or functionality.

DO NOT change:
- Existing colors or color palette.
- Existing typography or fonts.
- Existing font sizes or weights.
- Existing spacing, margins, or padding.
- Existing component sizes or dimensions.
- Existing layouts or page structures.
- Existing images, logo, or visual identity.
- Existing navigation or page content.
- Existing responsive behavior.
- Existing animations or interactions.
- Existing routes or functionality.
- Existing shopping cart, products, WhatsApp ordering, or language switching.

Do not refactor, reorganize, or replace existing website components.

The ONLY permitted change to the public website is adding one discreet and professionally integrated entry point to the Production Management System, such as a button or navigation link labeled:

"دخول نظام إدارة الإنتاج"

This entry point must not disturb the existing design.

The Production Management System must be isolated from the public website in its own route, layout, components, styles, and application logic.

Prefer an isolated route such as:

/production

Use a completely separate dashboard layout and scoped styles. Do not introduce global CSS rules that can affect the public website.

# YOUR TASK IN THIS PHASE

DO NOT IMPLEMENT THE SYSTEM YET.

DO NOT WRITE APPLICATION CODE.

DO NOT CREATE DATABASE TABLES.

DO NOT CHANGE EXISTING WEBSITE FILES.

Your task is to analyze the production management requirements already discussed in this conversation and create a complete technical and functional specification document.

Create this file:

docs/PRODUCTION_SYSTEM_MASTER_SPEC.md

This document will be the permanent reference for all future development phases.

# 1. BUSINESS OVERVIEW

The system is intended to manage the association's textile manufacturing operations, especially the production of traditional Yemeni Ma'awiz.

The system must support piece-rate manufacturing, where workers receive materials, perform specific operations, return completed production and remaining materials, and earn wages based on accepted production.

Production moves between workers and departments through documented handover and receipt vouchers.

The system must track the entire production lifecycle from raw material issuance to finished goods inventory.

# 2. REQUIRED SYSTEM MODULES

Document the requirements, responsibilities, screens, data, and relationships for these modules:

1. Executive Dashboard.
2. Raw Materials Management.
3. Warehouses and Inventory.
4. Workers Management.
5. Departments Management.
6. Production Operations Management.
7. Production Orders.
8. Worker Assignments.
9. Material Issue and Return Vouchers.
10. Production Receipt Vouchers.
11. Defects and Waste Management.
12. Interdepartmental Transfers.
13. Worker Wage Entitlements.
14. Wage Payments.
15. Industrial Cost Management.
16. Work In Process (WIP).
17. Products and Product Specifications.
18. Finished Goods Inventory.
19. Reports and Analytics.
20. Users, Roles, and Permissions.
21. Audit Logs.
22. System Settings.

# 3. MANUFACTURING WORKFLOW

Document the complete workflow:

- Create a production order.
- Define the product and required quantity.
- Define the production stages.
- Assign workers to departments and operations.
- Issue raw materials to workers using approved vouchers.
- Record completed production.
- Record returned materials.
- Record waste, defective products, and incomplete production.
- Calculate accepted production quantities.
- Calculate worker wage entitlements based on approved piece rates.
- Transfer production to the next department using documented vouchers.
- Track quantities and costs at each stage.
- Receive finished products into finished goods inventory.

The production stages must be configurable. Example stages include:

- Sewing.
- Embroidery.
- Dyeing.
- Washing.
- Ironing and finishing.
- Final inspection.
- Finished goods receipt.

Do not assume that every product follows the same sequence.

# 4. DOCUMENT AND VOUCHER MANAGEMENT

Specify the fields, statuses, approval workflows, validation rules, and relationships for:

- Raw Material Receipt Voucher.
- Raw Material Issue Voucher.
- Worker Handover Voucher.
- Production Receipt Voucher.
- Material Return Voucher.
- Waste Voucher.
- Defective Product Voucher.
- Wage Entitlement Voucher.
- Wage Payment Voucher.
- Department Transfer Voucher.
- Finished Goods Receipt Voucher.
- Inventory Adjustment Voucher.
- Production Return and Rework Voucher.

Every voucher must have:
- Unique automatically generated number.
- Date.
- Related production order when applicable.
- Related department and worker when applicable.
- Created-by user.
- Approval status.
- Approved-by user.
- Detailed line items.
- Print-friendly document format.
- Audit history.

Approved vouchers must not be silently deleted or modified.

# 5. COST ACCOUNTING

Document a cost accounting model that supports:

- Direct materials.
- Direct labor.
- Auxiliary materials.
- Manufacturing overhead.
- Other production expenses.
- Department-level costs.
- Production-order costs.
- Product-level costs.
- Unit manufacturing cost.
- Cost allocation methods.
- Raw material costing.
- Finished goods costing.
- Work in Process valuation.

Clearly distinguish wage entitlement from actual wage payment.

Do not invent accounting policies. Mark decisions that require management approval as OPEN BUSINESS DECISIONS.

# 6. WORK IN PROCESS (WIP)

This is a critical requirement.

The system must track the quantity and accumulated cost of products at every production stage.

It must distinguish between:
- Completed production.
- Production awaiting the next department.
- Production currently assigned to workers.
- Defective production.
- Production requiring rework.
- Finished goods.

Prevent duplicate cost recognition and incorrect finished goods quantities.

# 7. WORKERS AND PIECE-RATE PAYMENTS

Specify worker profiles, department assignments, operations, piece rates, accepted production, wage entitlements, deductions, payment records, and worker performance reports.

The system must calculate entitlements from approved accepted quantities and applicable piece rates.

# 8. USER ROLES AND PERMISSIONS

Define an extensible role and permission model.

Include examples:
- System Administrator.
- Factory Manager.
- Production Manager.
- Department Supervisor.
- Warehouse Keeper.
- Accountant.
- Management Viewer.

Permissions must be configurable and should cover viewing, creating, editing, approving, printing, and canceling transactions.

# 9. DATABASE AND TECHNICAL ARCHITECTURE

Propose:
- Main database entities.
- Entity relationships.
- Primary and foreign keys.
- Transactional data structure.
- Inventory movement architecture.
- Production order architecture.
- Voucher architecture.
- Cost accounting relationships.
- Audit logging.
- Data validation and integrity rules.

Include a preliminary ERD description.

Do not create actual database tables in this phase.

# 10. USER INTERFACE SPECIFICATION

Describe the dashboard design and all major screens.

The system interface must be:
- Professional.
- Modern.
- Clear and practical.
- Suitable for daily factory operations.
- Arabic-first and RTL.
- Responsive.
- Easy to use for supervisors and administrative staff.

The Production Management System must have its own independent visual identity and dashboard layout.

It must not change or inherit unintended styling from the public website.

For every major screen, specify:
- Screen purpose.
- Main components.
- Data displayed.
- Search and filters.
- Actions and buttons.
- Tables and columns.
- Forms and validation.
- Status indicators.
- User permissions.

# 11. REPORTS

Specify reports for:
- Daily, monthly, and annual production.
- Production by department.
- Production by worker.
- Material consumption.
- Material waste.
- Defective products.
- Worker wage entitlements.
- Actual wage payments.
- Production order costs.
- Cost per product.
- Department costs.
- Work in Process.
- Finished goods inventory.
- Inventory movements.
- Productivity and quality.

# 12. BUSINESS RULES

Document all important business rules, including:
- No material issue without an approved voucher.
- Every worker assignment must be linked to a production order and operation.
- Accepted production determines wage entitlement.
- Production transfers require documented handover and receipt.
- Material balances must be reconciled.
- Waste and defects must be recorded.
- Finished goods require final approval.
- Every inventory movement must affect stock balances.
- Approved documents must have controlled correction or reversal procedures.
- Every important operation must be associated with a registered user.

Give each rule a unique identifier.

# 13. OPEN BUSINESS DECISIONS

Create a dedicated section for questions that require confirmation from association management.

Do not invent answers.

Examples:
- Exact production sequence for each product type.
- Actual units of measurement for raw materials.
- Piece-rate rules for each operation.
- Approval hierarchy.
- Cost allocation methods.
- Warehouse structure.
- Inventory costing policy.
- Rework and defective-product treatment.
- Whether multiple workers can work on the same production batch.

# 14. IMPLEMENTATION ROADMAP

Divide development into independent, controlled phases:

Phase 0: Requirements and master documentation.
Phase 1: Production system dashboard shell and navigation.
Phase 2: User authentication and permissions.
Phase 3: Basic configuration and master data.
Phase 4: Warehouses and raw materials.
Phase 5: Production orders and production stages.
Phase 6: Worker assignments and production vouchers.
Phase 7: Wage entitlements and payments.
Phase 8: Cost accounting and WIP.
Phase 9: Finished goods inventory.
Phase 10: Reports and analytics.
Phase 11: Testing, validation, security, and deployment.

Each phase must have:
- Scope.
- Screens.
- Components.
- Data requirements.
- Dependencies.
- Acceptance criteria.
- Explicit out-of-scope items.

# 15. DOCUMENTATION QUALITY

The document must be comprehensive and professionally structured.

Use Arabic for business explanations and interface labels, while retaining standard English technical terminology where useful.

Include tables, workflows, screen inventories, business rules, and technical diagrams where appropriate.

Clearly distinguish:
- Confirmed requirements.
- Proposed recommendations.
- Open questions.
- Future enhancements.

Do not silently invent business facts.

# FINAL INSTRUCTIONS

Create only:

docs/PRODUCTION_SYSTEM_MASTER_SPEC.md

Do not modify the public website.

Do not implement any functionality.

Do not create database migrations.

Do not change the existing visual design.

When finished, provide:
1. The exact path of the created document.
2. A concise summary of its contents.
3. Any unresolved business questions.
4. Confirmation that the existing public website files and design were not modified.

This document must become the mandatory reference for every subsequent implementation phase.