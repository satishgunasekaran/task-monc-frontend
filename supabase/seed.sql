-- Seed data for TaskMonc application
-- This file contains sample data for testing and development

-- Note: This seed data assumes you have at least one user created through auth
-- You can run this after creating your first user account

-- Insert sample projects (replace the user_id with an actual user from auth.users)
-- insert into public.projects (organization_id, name, description, status, priority, created_by, assigned_to) 
-- values 
--   ((select id from public.organizations limit 1), 'Website Redesign', 'Complete redesign of company website with modern UI/UX', 'active', 'high', (select id from auth.users limit 1), (select id from auth.users limit 1)),
--   ((select id from public.organizations limit 1), 'Mobile App Development', 'Develop mobile application for iOS and Android', 'planning', 'medium', (select id from auth.users limit 1), (select id from auth.users limit 1)),
--   ((select id from public.organizations limit 1), 'Database Migration', 'Migrate legacy database to new system', 'completed', 'urgent', (select id from auth.users limit 1), (select id from auth.users limit 1));

-- Insert sample tasks
-- insert into public.tasks (organization_id, project_id, title, description, status, priority, created_by, assigned_to, tags)
-- values 
--   ((select id from public.organizations limit 1), (select id from public.projects where name = 'Website Redesign' limit 1), 'Create wireframes', 'Design wireframes for all main pages', 'completed', 'high', (select id from auth.users limit 1), (select id from auth.users limit 1), array['design', 'wireframes']),
--   ((select id from public.organizations limit 1), (select id from public.projects where name = 'Website Redesign' limit 1), 'Implement home page', 'Code the new home page based on approved designs', 'in_progress', 'high', (select id from auth.users limit 1), (select id from auth.users limit 1), array['frontend', 'development']),
--   ((select id from public.organizations limit 1), (select id from public.projects where name = 'Mobile App Development' limit 1), 'Research frameworks', 'Research and compare mobile development frameworks', 'todo', 'medium', (select id from auth.users limit 1), (select id from auth.users limit 1), array['research', 'mobile']);

-- Insert some subtasks
-- insert into public.tasks (organization_id, parent_task_id, title, description, status, priority, created_by, assigned_to, tags)
-- values 
--   ((select id from public.organizations limit 1), (select id from public.tasks where title = 'Implement home page' limit 1), 'Create header component', 'Build reusable header component', 'completed', 'medium', (select id from auth.users limit 1), (select id from auth.users limit 1), array['frontend', 'components']),
--   ((select id from public.organizations limit 1), (select id from public.tasks where title = 'Implement home page' limit 1), 'Add responsive design', 'Make home page responsive for mobile devices', 'in_progress', 'medium', (select id from auth.users limit 1), (select id from auth.users limit 1), array['frontend', 'responsive']);

-- Uncomment the above inserts after you have created your first organization and user
-- Remember to replace the user references with actual user IDs from your auth.users table