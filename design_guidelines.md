# Design Guidelines: Equipment Rental Management System

## Design Approach
**Selected Aesthetic**: Golovsko Finance-inspired dark mode interface
**Rationale**: Professional financial app aesthetic with vibrant gradients creates the perfect balance for a utility-focused rental management system. Dark backgrounds reduce eye strain during extended use while purple/violet/teal accents provide visual energy and clear status differentiation.

## Core Design Elements

### Typography
- **Font Family**: Inter (Google Fonts)
- **Hierarchy**:
  - Page Titles: 2xl (24px), font-bold
  - Section Headers: lg (18px), font-semibold
  - Tab Labels: base (16px), font-medium
  - Table Headers: sm (14px), font-semibold, uppercase tracking-wider
  - Body/Data: sm (14px), font-normal
  - Helper Text: xs (12px), font-normal, text-gray-400

### Color Palette
- **Background**: #0A0E1A (deep navy-black)
- **Card Surfaces**: #141824 (elevated dark)
- **Borders**: #1F2937 (subtle separation)
- **Primary Gradient**: Purple to violet (#8B5CF6 → #A78BFA)
- **Secondary**: Vibrant teal (#14B8A6, #2DD4BF for highlights)
- **Accent**: Deep purple (#7C3AED)
- **Status Colors**: Green (#10B981), Yellow (#F59E0B), Red (#EF4444)
- **Text**: White (#FFFFFF), Gray-300 (#D1D5DB), Gray-400 (#9CA3AF)

### Layout System
**Spacing Primitives**: Tailwind units of 4, 6, and 8
- Card padding: p-6
- Section spacing: space-y-6
- Grid gaps: gap-6
- Form spacing: space-y-4
- Page container: max-w-7xl, px-8

### Component Library

**Navigation Tabs**
- Horizontal tabs with gradient underline on active state
- Active: Purple-violet gradient bottom border (3px), white text, font-semibold
- Inactive: Gray-400 text, hover to gray-200
- Background: #141824 card, rounded-t-2xl
- Positioned sticky at top with shadow-lg

**Cards**
- Background: #141824
- Border: 1px solid #1F2937
- Rounded-2xl corners
- Shadow: Soft glow using box-shadow with purple tint (0 8px 32px rgba(139, 92, 246, 0.12))
- Padding: p-6
- Hover: Border transitions to purple (#8B5CF6), shadow intensifies

**Data Tables**
- Container: Dark card (#141824) with rounded-2xl
- Header: Darker background (#0F1419), sticky positioning
- Rows: Subtle dividers (#1F2937), hover state adds purple-tinted background
- Cell padding: py-4 px-6
- Action buttons: Icon-only, circular, teal/purple on hover
- Pagination: Bottom-right, gradient buttons for active page

**Forms & Inputs**
- Input fields: #1F2937 background, #374151 border, rounded-xl
- Focus: Purple gradient border, subtle purple glow
- Labels: Gray-300, font-medium, above inputs
- Dropdowns: Dark overlay with teal accent on selected items
- Date pickers: Card overlay with purple accent on selected dates
- Error states: Red border with inline error message (text-red-400)

**Status Badges**
- Pill-shaped with rounded-full
- Disponible: Green background (#10B981 at 20% opacity), green text
- En location: Teal gradient, white text
- Maintenance: Yellow background (20% opacity), yellow text
- Font: xs, font-semibold, uppercase tracking-wide, px-3 py-1

**Buttons**
- Primary: Purple-violet gradient background, white text, font-semibold, rounded-xl, px-6 py-3
- Secondary: Teal (#14B8A6), white text
- Ghost: Transparent with border (#374151), gray-200 text, hover adds gradient
- Icon buttons: Rounded-full, p-2, hover adds colored background
- Disabled: Opacity 40%, no interaction

**Metric Cards** (for Disponibilité)
- 2-3 column grid layout
- Each card: Gradient top border (purple or teal based on status)
- Large number display: 3xl, font-bold, gradient text
- Label below: sm, gray-400
- Icon: Top-right, teal or purple colored
- Background pattern: Subtle grid or dots (very low opacity)

### Page Layouts

**Inventaire Tab**
- Top action bar: Dark card with "Filtrer par catégorie" dropdown (left), "Ajouter équipement" gradient button (right)
- Main table card: Full-width, rounded-2xl, with search bar embedded in header
- Columns: Photo placeholder, Nom, Catégorie, État (badge), Prix/jour, Stock, Actions
- Bottom: Export controls with icon buttons

**Commandes Tab**
- Split layout: Orders list (60%) | Order form (40%)
- List: Scrollable cards, each showing client, dates, status badge, total
- Form: Elevated card with sections (Client info, Equipment selection, Dates, Pricing)
- Submit button: Full-width gradient at bottom

**Disponibilité Tab**
- Hero metric cards row: Total équipements, Disponibles, En location (with gradient borders)
- Date range selector: Centered, dark card with purple accent on selected dates
- Equipment grid below: 3-column responsive cards showing availability percentage (circular progress with gradient), name, category badge
- Low stock items get teal highlight border

**Timeline Tab**
- Month navigation: Centered pill controls with gradient on current month
- Gantt-style visualization: Dark background grid
- Product rows: Left sidebar with names and category badges
- Rental bars: Colored blocks (client-based colors), gradient fills, semi-transparent
- Hover shows rental details in tooltip (dark card overlay)
- Conflict indicators: Red border glow on overlapping rentals

### Interactions
- Smooth transitions: 200ms ease-in-out for all state changes
- Button hover: Slight scale (1.02), shadow enhancement
- Card hover: Border color shift to purple, shadow deepens
- Loading states: Purple gradient shimmer animation
- Success actions: Brief green glow pulse
- Drag operations: Lifted shadow, subtle opacity change

### Accessibility
- Text contrast: Minimum 4.5:1 against dark backgrounds
- Focus indicators: 2px purple gradient ring
- Keyboard navigation: Visible focus states on all interactive elements
- Semantic HTML maintained despite visual styling
- Screen reader labels on icon-only buttons