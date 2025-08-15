-- Core extensions, enums, and global grants
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Organization role enum
create type public.organization_role as enum ('owner', 'admin', 'member');

-- Schema-level grants
grant usage on schema public to anon,
authenticated;

-- Sequences grants (idempotent)
grant usage,
select
  on all sequences in schema public to authenticated;
