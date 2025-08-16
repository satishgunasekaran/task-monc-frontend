## Pushing local db to cloud 
npx supabase db push

## Dump local data
npx supabase db dump --local --data-only --disable-triggers > supabase/seed.sql

# 3. Push the configuration
npx supabase config push
