## Pushing local db to cloud

npx supabase db push

## Dump local data

npx supabase db dump --local --data-only --disable-triggers > supabase/seed.sql

## Push the configuration

npx supabase config push

## Generate types

npx supabase gen types typescript --local > lib/database.types.ts

## Diffing the update schemas directory 

npx supabase db diff -f updated_task_fields