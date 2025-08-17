import { Tables, TablesInsert, TablesUpdate, Enums } from './database.types';

// Common database types for easier importing
export type Database = Tables<never>;

// Table types
export type Organization = Tables<'organizations'>;
export type OrganizationMembership = Tables<'organization_memberships'>;
export type OrganizationInvitation = Tables<'organization_invitations'>;
export type Project = Tables<'projects'>;
export type Task = Tables<'tasks'>;
export type UserProfile = Tables<'user_profiles'>;

// Insert types
export type OrganizationInsert = TablesInsert<'organizations'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type UserProfileInsert = TablesInsert<'user_profiles'>;

// Update types
export type OrganizationUpdate = TablesUpdate<'organizations'>;
export type ProjectUpdate = TablesUpdate<'projects'>;
export type TaskUpdate = TablesUpdate<'tasks'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;

// Enum types
export type OrganizationRole = Enums<'organization_role'>;
export type ProjectStatus = Enums<'project_status'>;
export type ProjectPriority = Enums<'project_priority'>;
export type TaskStatus = Enums<'task_status'>;
export type TaskPriority = Enums<'task_priority'>;

// Extended types with relations for UI components
export type ProjectWithCreator = Project & {
    user_profiles?: {
        first_name: string | null;
        last_name: string | null;
    } | null;
};

export type TaskWithProfiles = Task & {
    created_by_profile?: {
        first_name: string | null;
        last_name: string | null;
    } | null;
    assigned_to_profile?: {
        first_name: string | null;
        last_name: string | null;
    } | null;
    project_name?: string | null;
};
