# Copilot instructions for this repo

Be immediately productive in this Next.js + Supabase app by following these project-specific patterns.

## Big picture

- App Router (Next.js 15) with Server Components by default. Client interactivity uses "use client" components.
- Authentication and session: Supabase Auth via SSR client in `utils/supabase/server.ts` and browser client in `utils/supabase/client.ts`. A middleware wrapper in `utils/supabase/middleware.ts` maintains cookie-based sessions and redirects unauthenticated users.
- Layouts: `app/layout.tsx` provides Theme and Toaster; `app/(site)/layout.tsx` is an authenticated shell with sidebar and header.
- Data model: Supabase SQL lives in `supabase/schemas/**`. Core domain: organizations, memberships, invitations, user profiles. Chat UI expects `public.chats` and `public.chat_messages` (id/title/created_by; chat_id/role/content) even though schema files don’t define them—create these tables locally to use chat features.

Note: when you add new SQL schema files under `supabase/schemas/`, also add their relative paths to the `schema_paths` array in `supabase/config.toml` under the `[db.migrations]` section (for example: `"./schemas/70_projects.sql"`). This ensures the local Supabase CLI includes your new schema when running migrations or resets.

## Auth + middleware rules

- Global middleware (`/middleware.ts`) calls `updateSession()` and redirects non-authed users to `/login` except static assets and `/auth/*`.
- In Server Components, fetch the user early: `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();`.
- Important: Don’t run extra logic between creating the server client and `auth.getUser()` (see comments in `utils/supabase/middleware.ts`).
- Login/Signup/Logout are server actions in `app/login/actions.ts` using Zod validations from `lib/validations/auth.ts`. Email confirmation is handled by `app/auth/confirm/route.ts`.

## Organizations & active org

- DB: `organizations`, `organization_memberships` (roles: owner|admin|member), and `organization_invitations`. RLS is enforced; use RPCs with `SECURITY DEFINER` when needed.
- Active organization is tracked by cookie: `active_org_id`.
  - Server helpers: `utils/active-org/server.ts` (read/set/clear).
  - Client helpers: `utils/active-org/client.ts` and `router.refresh()` after updates.
- Invites: Use the `create_org_invitation` RPC; accept via `app/accept-invite/route.ts` which sets the active org cookie then redirects.

## Data access patterns

- Server side (preferred for protected data): use `utils/supabase/server.ts` in layouts/pages/actions.
- Client side (UI interactions): use `utils/supabase/client.ts` with `useMemo(() => createSupabaseBrowserClient(), [])`.
- Respect RLS. Examples:
  - Read memberships: `from('organization_memberships').select(...).eq('organization_id', orgId)`.
  - Create invites via `rpc('create_org_invitation', { p_organization_id, p_email, p_role })`.

## UI patterns

- Design system in `components/ui/*` (shadcn/radix + Tailwind v4). Use the `cn` helper from `lib/utils.ts` to compose classes.
- Shell: `components/app-sidebar.tsx` (org switcher, nav, profile) and `components/layout/header.tsx` (breadcrumbs, chat title lookup).
- Chat pages under `app/(site)/chat/**` use a resizable layout (`components/ui/resizable.tsx`) and operate on `chats`/`chat_messages` with simulated assistant replies.

## Dev workflows

- Scripts (see `package.json`): `pnpm dev` (Turbopack), `pnpm build`, `pnpm start`, `pnpm lint`.
- Env vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (used in signup redirect).
- Local Supabase (via `supabase/config.toml`): API on 54321, Studio on 54323, Inbucket test email on 54324. Migrations are defined in `supabase/schemas/**`; run them so RLS and RPCs exist. Seed file is present but empty.

## Gotchas & conventions

- Preserve the header logic in `app/layout.tsx` that prevents redirect loops from `/login` when already authed.
- After changing the active org cookie on the client, call `router.refresh()` so Server Components observe the new cookie.
- When creating organizations, enforce slug rules client-side and validate uniqueness server-side (`app/(site)/profile/actions.ts`).
- For invitations, only admins/owners can create/update (enforced by RLS/policies). Use provided RPCs instead of direct table writes when required by policies.

## Using the workspace task manager and thinking tools

- For multi-step or complex tasks, use the todos tool (`manage_todo_list`) to plan, track, and report progress.
- When deeper reasoning, design trade-offs, or debugging hypotheses are required, use the `think` tool to record structured thoughts and plans. Keep entries concise and action-oriented so reviewers can follow the decision path.
