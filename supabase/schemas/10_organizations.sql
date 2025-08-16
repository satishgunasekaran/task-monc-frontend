-- Organizations table and related objects (excluding policies)
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4 (),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  created_at timestamp
  with
    time zone default now () not null,
    updated_at timestamp
  with
    time zone default now () not null,
    created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_organizations_slug on public.organizations (slug);

-- Enable RLS (policies defined later once dependencies are available)
alter table public.organizations enable row level security;

-- Keep timestamps fresh
create trigger handle_updated_at_organizations before
update on public.organizations for each row execute procedure public.handle_updated_at ();

-- Grants
grant all on public.organizations to authenticated;

-- Comments
comment on table public.organizations is 'Organizations that users can belong to';

comment on column public.organizations.slug is 'URL-friendly unique identifier for the organization';

-- Note: RLS policies for organizations are defined in 60_organizations_policies.sql since they depend on other tables
