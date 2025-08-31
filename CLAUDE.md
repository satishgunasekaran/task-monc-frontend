# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production 
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint checks
- `supabase start` - Start local Supabase instance
- `supabase db reset` - Reset database with migrations and seed data
- `pnpm dlx shadcn@latest add <component>` - Add new shadcn/ui components
- `pnpm dlx shadcn@latest` - Access shadcn CLI for component management

## Architecture Overview

This is a **Next.js 15 App Router** application built with **TypeScript** and **Supabase** for a task management system called "Task Monc". The app uses a multi-tenant organization model with role-based access control.

### Core Technology Stack
- **Next.js 15** with App Router and Server Components
- **Supabase** for authentication, database, and real-time features
- **TanStack Query** for client-side data fetching and caching
- **React Hook Form + Zod** for form validation
- **Radix UI + Tailwind CSS v4** for the design system
- **Jotai** for additional state management

### Database Schema Structure
The database uses a hierarchical multi-tenant model:
- `organizations` - Top-level tenant entities
- `organization_memberships` - User roles within organizations (owner/admin/member)
- `organization_invitations` - Pending invitations to join organizations
- `user_profiles` - Extended user data beyond Supabase auth
- `projects` - Organization-scoped project containers
- `tasks` - Project-scoped task items with status/priority/assignments

Schema files are located in `supabase/schemas/` and loaded in order via `supabase/config.toml`.

### Authentication & Authorization
- **Server-side auth**: Uses `utils/supabase/server.ts` with automatic session handling
- **Client-side auth**: Uses `utils/supabase/client.ts` for UI interactions
- **Middleware**: Global auth middleware at `/middleware.ts` redirects unauthenticated users
- **Row Level Security**: All database access is protected by RLS policies
- **Server Actions**: Authentication actions in `app/login/actions.ts`

### Organization Context System
The app maintains an "active organization" context:
- **Cookie-based**: `active_org_id` cookie tracks the current organization
- **Server utilities**: `utils/active-org/server.ts` for reading/setting in Server Components
- **Client utilities**: `utils/active-org/client.ts` for browser-side operations
- **React Context**: `AppProvider` exposes `useActiveOrg()` hook for components
- **Automatic validation**: Invalid active org selections are automatically cleared

### Data Fetching Patterns
- **Server Components**: Fetch data directly with Supabase server client (preferred for initial loads)
- **Client Components**: Use TanStack Query with custom hooks in `hooks/` directory
- **Mutations**: Server Actions return `ActionResult<T>` type for consistent error handling
- **Cache invalidation**: Query keys follow pattern: `['organizations']`, `['projects', orgId]`, `['tasks', orgId]`

### Key Application Routes
- `/` - Public landing or authenticated dashboard redirect  
- `/login` - Authentication forms
- `/(site)/*` - Authenticated routes requiring active organization:
  - `/projects` - Project management interface
  - `/tasks` - Task management with table and Kanban views  
  - `/settings` - Organization and user settings
  - `/profile` - User profile management

### Component Architecture
- **Design System**: `components/ui/*` contains reusable Radix UI + Tailwind components (managed via shadcn/ui)
- **Form Fields**: `components/ui/form-fields/*` provides consistent form inputs with validation
- **Feature Components**: Domain-specific components in `components/projects/*`, `components/tasks/*`
- **Layout Components**: App shell components in `components/layout/*`
- **Providers**: Context providers in `components/providers/*`
- **shadcn/ui Integration**: Use `pnpm dlx shadcn@latest add <component>` to add new UI components

### State Management Patterns
- **Server State**: TanStack Query for API data with automatic background refetching
- **Client State**: React hooks for component-local state
- **Global State**: AppProvider for active organization, Jotai atoms where needed
- **Form State**: React Hook Form with Zod schema validation

### Key Custom Hooks
- `useActiveOrg()` - Access active organization context
- `use-organization-mutations.ts` - Create/update/delete organizations
- `use-project-mutations.ts` - Project CRUD operations  
- `use-sidebar-data.ts` - Sidebar navigation data
- `use-breadcrumbs.tsx` - Dynamic breadcrumb generation

### Database Development Workflow
1. Create new schema files in `supabase/schemas/` following numbering convention
2. Add file paths to `schema_paths` array in `supabase/config.toml`
3. Run `supabase db reset` to apply changes locally
4. Generate TypeScript types: Database types are in `lib/database.types.ts`

### Important Conventions
- **Server Components**: Always call `createClient()` then immediately `auth.getUser()` - no logic in between
- **Active Org Changes**: Call `router.refresh()` after updating active organization to sync Server Components
- **Error Handling**: Use `ActionResult<T>` pattern for Server Actions with toast notifications
- **Form Validation**: All forms use React Hook Form + Zod with validation schemas in `lib/validations/`
- **RLS Enforcement**: Never bypass Row Level Security - use SECURITY DEFINER RPCs when cross-tenant access is needed

### Testing & Quality
- ESLint configuration includes Next.js rules
- Prettier for code formatting with SQL plugin
- TypeScript strict mode enabled
- All forms include proper validation and error states

## Development Environment Setup
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 
- `NEXT_PUBLIC_SITE_URL`

For local development, ensure Supabase CLI is installed and run `supabase start` to launch the local stack.