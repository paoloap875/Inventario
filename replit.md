# Equipment Rental Management System

## Overview

This is an equipment rental management application (Gestion Location Matériel) built for tracking inventory, orders, availability, and timeline visualization of rental equipment. The application is a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for data persistence.

The system allows users to:
- Manage inventory with categories, subcategories, and products
- Create and track rental orders with date ranges
- Check equipment availability for specific periods
- View a timeline/Gantt-style visualization of all rentals

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

The frontend follows a tab-based navigation pattern with four main views:
1. Inventaire (Inventory) - Product and category management
2. Commandes (Orders) - Order creation and management
3. Disponibilité (Availability) - Date-based availability checking
4. Timeline - Visual calendar view of rentals

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Validation**: Zod with drizzle-zod for type-safe schemas
- **API Pattern**: RESTful endpoints under `/api/*` prefix

The backend uses a storage abstraction layer (`IStorage` interface) that currently implements in-memory storage (`MemStorage`) with the database schema ready for PostgreSQL migration.

### Data Model
The schema defines these core entities:
- **Users**: Authentication (username/password)
- **Categories**: Top-level equipment groupings
- **Subcategories**: Nested under categories
- **Products**: Equipment items with quantity tracking
- **Orders**: Rental orders with client info and date ranges
- **OrderItems**: Junction table linking orders to products with quantities

### Design System
Material Design influenced with Carbon Design elements for data tables. Uses Inter/Roboto fonts, consistent spacing primitives (2, 4, 6, 8 units), and a neutral color palette with CSS custom properties for light/dark theming.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations and schema push (`db:push` script)

### Key Libraries
- **@tanstack/react-query**: Server state management and caching
- **date-fns**: Date manipulation for availability and timeline features
- **drizzle-orm**: Type-safe database queries
- **zod**: Runtime schema validation
- **Radix UI**: Accessible component primitives (dialog, select, tabs, etc.)

### Development
- **Vite**: Frontend build and dev server with HMR
- **esbuild**: Production server bundling
- **tsx**: TypeScript execution for development

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling integration