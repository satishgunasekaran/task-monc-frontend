-- Utility trigger to maintain updated_at columns
CREATE FUNCTION public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


