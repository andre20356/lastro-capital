# Lastro Capital - Design Guidelines

## App Overview
Lastro Capital is a billing and charges management mobile app that allows users to manage their receivables, track payments, maintain a client directory, and view payment history.

## Architecture Decisions

### Navigation
**Tab-Based Navigation** with Stack overlays
- Four main tabs: Dashboard, Cobranças, Clientes, Histórico
- Modal screens for forms (Add/Edit Charge, Add/Edit Client)
- Stack navigation within each tab for detail views

### Data Persistence
**AsyncStorage** for local data persistence
- Charges (cobranças): id, clientId, amount, dueDate, status, description, createdAt
- Clients: id, name, phone, email, notes, createdAt
- Payments: id, chargeId, amount, paidAt, notes

## Screen Specifications

### Dashboard Screen
**Purpose**: Overview of financial status

**Layout**:
- Summary cards showing:
  - Total pending amount
  - Total received this month
  - Overdue charges count
- Quick actions: Add new charge
- Upcoming due dates list (next 7 days)

### Charges Screen (Cobranças)
**Purpose**: Manage all charges

**Layout**:
- Filter tabs: All, Pending, Paid, Overdue
- List of charge cards with:
  - Client name
  - Amount
  - Due date
  - Status badge
- FAB button to add new charge

**Charge Form**:
- Client selector
- Amount input
- Due date picker
- Description (optional)
- Status selector

### Clients Screen
**Purpose**: Manage client directory

**Layout**:
- Search bar
- Alphabetically sorted client list
- Each card shows:
  - Client name
  - Contact info
  - Total pending amount
- FAB button to add new client

**Client Form**:
- Name (required)
- Phone
- Email
- Notes

### History Screen (Histórico)
**Purpose**: View payment history

**Layout**:
- Monthly grouped list of payments
- Each entry shows:
  - Client name
  - Amount received
  - Payment date
  - Original charge reference

## Design System

### Color Palette
**Primary Colors (Light Theme)**:
- Background Root: `#f8fafc` (Light slate)
- Background Default: `#ffffff` (White - cards)
- Background Secondary: `#f1f5f9` (Light gray)
- Background Tertiary: `#e2e8f0` (Dividers)
- Card Border: `#e2e8f0`

**Accent Colors**:
- Primary Accent: `#0d9488` (Teal - main actions)
- Secondary Accent: `#0891b2` (Cyan - secondary actions)

**Text Colors**:
- Primary Text: `#1f2937` (Dark gray)
- Secondary Text: `#64748b` (Medium gray)
- Tertiary Text: `#94a3b8` (Light gray)

**Status Colors**:
- Success/Paid: `#10b981` (Green)
- Warning/Pending: `#f59e0b` (Amber)
- Error/Overdue: `#ef4444` (Red)

### Typography
**Heading 1** (Screen titles):
- Color: Primary text
- Size: 22px
- Weight: 700 (Bold)

**Heading 2** (Section titles):
- Color: Primary text
- Size: 18px
- Weight: 600 (Semibold)

**Body Text**:
- Color: Secondary text
- Size: 14px

**Card Title**:
- Color: Primary text
- Size: 16px
- Weight: 600

### Components

**Cards**:
- Background: White (#ffffff)
- Border: 1px solid #e2e8f0
- Border radius: 12px
- Padding: 16px
- Shadow: subtle (elevation 1)

**Buttons - Primary**:
- Background: #0d9488 (Teal)
- Text color: White
- Padding: 14px vertical, 20px horizontal
- Border radius: 10px
- Font weight: 600

**Buttons - Secondary**:
- Background: transparent
- Border: 1px solid #0d9488
- Text color: #0d9488
- Padding: 14px vertical, 20px horizontal
- Border radius: 10px

**Status Badges**:
- Pending: Background #fef3c7, Text #92400e
- Paid: Background #d1fae5, Text #065f46
- Overdue: Background #fee2e2, Text #991b1b
- Border radius: 6px
- Padding: 4px 8px
- Font size: 12px, Weight: 600

**Text Inputs**:
- Background: White
- Border: 1px solid #d1d5db
- Border radius: 8px
- Padding: 14px
- Focus border: #0d9488

**FAB (Floating Action Button)**:
- Background: #0d9488
- Size: 56x56px
- Border radius: full
- Icon: Plus, white
- Position: Bottom right, above tab bar
- Shadow: elevation 4

### Tab Bar
- Background: White with subtle top border
- Active icon/label: Teal (#0d9488)
- Inactive icon/label: Gray (#9ca3af)
- Icons: Feather icons
  - Dashboard: home
  - Cobranças: file-text
  - Clientes: users
  - Histórico: clock

### Safe Area Considerations
- All screens use safe area insets
- FAB positioned with bottom inset + tab bar height + spacing
- Content padding: 16px horizontal
