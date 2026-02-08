import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instances
let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// Client-side Supabase (anon key) - Singleton
export function createBrowserClient() {
    if (!browserClient) {
        browserClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return browserClient;
}

// Server-side Supabase (service role key - full access) - Singleton
export function createServerClient() {
    if (!serverClient) {
        serverClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );
    }
    return serverClient;
}

// Types for database tables
export type AppType = 'HudzSender' | 'HudzLink' | 'ALL';

export interface ActivationCode {
    id: string;
    code: string;
    max_devices: number;
    duration_days: number | null; // null = lifetime
    created_at: string;
    is_active: boolean;
    note: string | null;
    first_activated_at: string | null; // Tracks when code was first activated
    // New fields for multi-app support
    app_type: AppType;
    max_groups: number;
    max_broadcasts_daily: number;
    max_subscribers: number;
    max_whatsapp_profiles: number;
    features_enabled: string[];
}

export interface DeviceSession {
    id: string;
    activation_code_id: string;
    device_id: string;
    activated_at: string;
    expires_at: string;
    last_check: string;
    device_info: Record<string, unknown> | null;
}

// Typed Supabase client helper
export interface UserProfile {
    id: string;
    activation_code_id: string;
    profile_name: string;
    config: Record<string, unknown>;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface LinkStats {
    id: string;
    activation_code_id: string;
    total_scraped: number;
    total_generated: number;
    total_exported: number;
    last_activity: string;
}

export type Database = {
    public: {
        Tables: {
            activation_codes: {
                Row: ActivationCode;
                Insert: Omit<ActivationCode, 'id' | 'created_at'>;
                Update: Partial<Omit<ActivationCode, 'id'>>;
            };
            device_sessions: {
                Row: DeviceSession;
                Insert: Omit<DeviceSession, 'id' | 'activated_at' | 'last_check'>;
                Update: Partial<Omit<DeviceSession, 'id'>>;
            };
            user_profiles: {
                Row: UserProfile;
                Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<UserProfile, 'id'>>;
            };
            link_stats: {
                Row: LinkStats;
                Insert: Omit<LinkStats, 'id' | 'created_at' | 'updated_at' | 'last_activity'>;
                Update: Partial<Omit<LinkStats, 'id'>>;
            };
        };
    };
};
