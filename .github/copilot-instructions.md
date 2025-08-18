# Copilot Instructions for Next.js + Supabase App

Be immediately productive in this Next.js + Supabase app by following these project-specific patterns.

## Big Picture

- **App Router (Next.js 15)** with Server Components by default. Client interactivity uses "use client" components.
- **Authentication**: Supabase Auth via SSR client in `utils/supabase/server.ts` and browser client in `utils/supabase/client.ts`. Middleware wrapper in `utils/supabase/middleware.ts` maintains cookie-based sessions and redirects unauthenticated users.
- **Layouts**: `app/layout.tsx` provides Theme and Toaster; `app/(site)/layout.tsx` is an authenticated shell with sidebar and header.
- **Data model**: Supabase SQL lives in `supabase/schemas/**`. Core domain: organizations, memberships, invitations, user profiles.
- **State management**: TanStack Query for client caching, AppProvider for active-organization state.

> **Note**: Chat UI expects `public.chats` and `public.chat_messages` tables (id/title/created_by; chat_id/role/content) even though schema files don't define them—create these tables locally to use chat features.

## Auth + Middleware Rules

- Global middleware (`/middleware.ts`) calls `updateSession()` and redirects non-authed users to `/login` except static assets and `/auth/*`.
- In Server Components, fetch the user early:
  ```ts
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  ```
- **Important**: Don't run extra logic between creating the server client and `auth.getUser()`.
- Login/Signup/Logout are server actions in `app/login/actions.ts` using Zod validations from `lib/validations/auth.ts`.
- Email confirmation is handled by `app/auth/confirm/route.ts`.

## Organizations & Active Org

- **DB**: `organizations`, `organization_memberships` (roles: owner|admin|member), and `organization_invitations`. RLS is enforced; use RPCs with `SECURITY DEFINER` when needed.
- **Active organization** is tracked by cookie: `active_org_id`.
  - Server helpers: `utils/active-org/server.ts` (read/set/clear).
  - Client helpers: `utils/active-org/client.ts` and `router.refresh()` after updates.
- **AppProvider**: Use `useActiveOrg()` hook instead of ad-hoc cookie reads. Exposes: `activeOrgId`, `activeOrg`, `setActiveOrganization`, `clearActiveOrg`, `validateActiveOrganization`.
- **Invites**: Use the `create_org_invitation` RPC; accept via `app/accept-invite/route.ts` which sets the active org cookie then redirects.

## Data Access Patterns

- **Server side** (preferred for protected data): use `utils/supabase/server.ts` in layouts/pages/actions.
- **Client side** (UI interactions): use `utils/supabase/client.ts` with `useMemo(() => createSupabaseBrowserClient(), [])`.
- **Respect RLS**. Examples:
  - Read memberships: `from('organization_memberships').select(...).eq('organization_id', orgId)`
  - Create invites via `rpc('create_org_invitation', { p_organization_id, p_email, p_role })`

## State & Caching Patterns (TanStack Query)

- **QueryProvider** is wired at the app root; prefer queries + mutations with clear queryKeys.
- **Common query keys**: `['organizations']`, `['projects', orgId]`, `['tasks', orgId]`
- **After mutations**, invalidate or remove queries:
  ```ts
  queryClient.invalidateQueries({ queryKey: ["organizations"] });
  queryClient.removeQueries({ queryKey: ["projects"] });
  ```
- When changing active org cookie/state, call `router.refresh()` (AppProvider handles this automatically).

## UI Patterns

- **Design system**: `components/ui/*` (shadcn/radix + Tailwind v4). Use the `cn` helper from `lib/utils.ts` for class composition.
- **Key components**:
  - Empty state: `components/ui/empty-state.tsx` for consistent empty UIs
  - Sidebar: `components/app-sidebar.tsx` (org switcher, nav, profile)
  - Header: `components/layout/header.tsx` (breadcrumbs, chat title lookup)
  - Forms: create-sheet pattern uses `components/ui/sheet` with form components
- **Chat pages**: `app/(site)/chat/**` use resizable layout (`components/ui/resizable.tsx`)

## Server Actions & Results

- Use `lib/action-result.ts` for consistent shape:
  ```ts
  ActionResult<T> = { success: true, data?: T } | { success: false, error: string }
  ```
- **Client usage pattern**: call action, check `res.success`, show `toast` on failure/success (Sonner is used app-wide).

## Key Files for Common Tasks

- **Auth/session**: `utils/supabase/server.ts`, `utils/supabase/client.ts`, `middleware.ts`
- **Active org**: `utils/active-org/*`, `components/providers/app-provider.tsx`, `components/app-sidebar.tsx`
- **Queries/mutations**: `hooks/*` (e.g., `use-organization-mutations.ts`, `use-sidebar-data.ts`)
- **UI patterns**: `components/ui/*`, `components/projects/*`, `components/tasks/*`

## Quick Copy-Paste Snippets

**Invalidate organizations after creating an org (client):**

```ts
await createOrgAction(...);
queryClient.invalidateQueries({ queryKey: ['organizations'] });
router.refresh();
```

**Clear active org cookie (client):**

```ts
import { setActiveOrgIdCookie } from "@/utils/active-org/client";
setActiveOrgIdCookie("", 0);
```

**Set active org cookie with max age:**

```ts
setActiveOrgIdCookie(orgId, maxAge);
```

## Development Workflow

- **Scripts**: `pnpm dev` (local dev), `pnpm build`, `pnpm start`, `pnpm lint`
- **Required env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`
- **Local Supabase**: Migrations live in `supabase/schemas/**`. When adding new SQL schema files, add their relative paths to the `schema_paths` array in `supabase/config.toml` under `[db.migrations]` section (e.g., `"./schemas/70_projects.sql"`).

## Important Conventions & Gotchas

- Don't add logic between `createClient()` and `auth.getUser()` in server components — middleware expects immediate retrieval.
- When updating active org cookie on client, call `router.refresh()` (or let AppProvider handle it) so Server Components pick up the new cookie.
- When switching active org while on an org-scoped page, AppProvider redirects to app root to avoid 404s.
- On org delete/leave: clear active org state, invalidate `['organizations']`, remove `['projects']` cache, and refresh or navigate to safe route.

## When You're Unsure

- Search for relevant patterns under `components/` and `hooks/`
- Prefer server helpers in `utils/` for SSR-safe behavior
- If behavior involves both server and client (auth, active org), inspect both the server utility and the AppProvider for the intended flow
