export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          company_name: string | null
          subscription_tier: 'free' | 'liftoff' | 'orbit' | 'galaxy'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          monthly_submissions_limit: number
          monthly_submissions_used: number
          limits_reset_at: string
          email_notifications: boolean
          weekly_report: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          subscription_tier?: 'free' | 'liftoff' | 'orbit' | 'galaxy'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_submissions_limit?: number
          monthly_submissions_used?: number
          limits_reset_at?: string
          email_notifications?: boolean
          weekly_report?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          subscription_tier?: 'free' | 'liftoff' | 'orbit' | 'galaxy'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_submissions_limit?: number
          monthly_submissions_used?: number
          limits_reset_at?: string
          email_notifications?: boolean
          weekly_report?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      websites: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          tagline: string | null
          description_short: string | null
          description_medium: string | null
          description_long: string | null
          industry: string | null
          category: string | null
          business_type: 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'saas' | 'ecommerce' | 'service' | 'content' | null
          target_audience: string | null
          keywords: string[] | null
          logo_url: string | null
          screenshot_url: string | null
          video_url: string | null
          twitter_url: string | null
          linkedin_url: string | null
          github_url: string | null
          producthunt_url: string | null
          contact_email: string | null
          founder_name: string | null
          founder_email: string | null
          founder_title: string | null
          competitors: string[] | null
          status: 'active' | 'paused' | 'archived'
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          tagline?: string | null
          description_short?: string | null
          description_medium?: string | null
          description_long?: string | null
          industry?: string | null
          category?: string | null
          business_type?: 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'saas' | 'ecommerce' | 'service' | 'content' | null
          target_audience?: string | null
          keywords?: string[] | null
          logo_url?: string | null
          screenshot_url?: string | null
          video_url?: string | null
          twitter_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          producthunt_url?: string | null
          contact_email?: string | null
          founder_name?: string | null
          founder_email?: string | null
          founder_title?: string | null
          competitors?: string[] | null
          status?: 'active' | 'paused' | 'archived'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          tagline?: string | null
          description_short?: string | null
          description_medium?: string | null
          description_long?: string | null
          industry?: string | null
          category?: string | null
          business_type?: 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'saas' | 'ecommerce' | 'service' | 'content' | null
          target_audience?: string | null
          keywords?: string[] | null
          logo_url?: string | null
          screenshot_url?: string | null
          video_url?: string | null
          twitter_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          producthunt_url?: string | null
          contact_email?: string | null
          founder_name?: string | null
          founder_email?: string | null
          founder_title?: string | null
          competitors?: string[] | null
          status?: 'active' | 'paused' | 'archived'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      directories: {
        Row: {
          id: string
          name: string
          url: string
          description: string | null
          logo_url: string | null
          type: 'directory' | 'social' | 'content' | 'review' | 'news' | 'podcast' | 'award' | 'press'
          categories: string[] | null
          industries: string[] | null
          business_types: string[] | null
          domain_authority: number | null
          monthly_traffic: number | null
          tier: 'basic' | 'premium' | 'elite'
          submission_type: 'api' | 'form' | 'email' | 'manual'
          submission_url: string | null
          requires_account: boolean
          is_free: boolean
          listing_fee: number | null
          review_time_days: number | null
          approval_rate: number | null
          adapter_name: string | null
          adapter_config: Json | null
          is_active: boolean
          last_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          description?: string | null
          logo_url?: string | null
          type: 'directory' | 'social' | 'content' | 'review' | 'news' | 'podcast' | 'award' | 'press'
          categories?: string[] | null
          industries?: string[] | null
          business_types?: string[] | null
          domain_authority?: number | null
          monthly_traffic?: number | null
          tier: 'basic' | 'premium' | 'elite'
          submission_type: 'api' | 'form' | 'email' | 'manual'
          submission_url?: string | null
          requires_account?: boolean
          is_free?: boolean
          listing_fee?: number | null
          review_time_days?: number | null
          approval_rate?: number | null
          adapter_name?: string | null
          adapter_config?: Json | null
          is_active?: boolean
          last_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          description?: string | null
          logo_url?: string | null
          type?: 'directory' | 'social' | 'content' | 'review' | 'news' | 'podcast' | 'award' | 'press'
          categories?: string[] | null
          industries?: string[] | null
          business_types?: string[] | null
          domain_authority?: number | null
          monthly_traffic?: number | null
          tier?: 'basic' | 'premium' | 'elite'
          submission_type?: 'api' | 'form' | 'email' | 'manual'
          submission_url?: string | null
          requires_account?: boolean
          is_free?: boolean
          listing_fee?: number | null
          review_time_days?: number | null
          approval_rate?: number | null
          adapter_name?: string | null
          adapter_config?: Json | null
          is_active?: boolean
          last_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          website_id: string
          directory_id: string
          user_id: string
          status: 'pending' | 'queued' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'needs_review' | 'failed' | 'expired'
          submitted_at: string | null
          listing_url: string | null
          title_used: string | null
          description_used: string | null
          error_message: string | null
          retry_count: number
          next_retry_at: string | null
          screenshot_url: string | null
          confirmation_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_id: string
          directory_id: string
          user_id: string
          status?: 'pending' | 'queued' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'needs_review' | 'failed' | 'expired'
          submitted_at?: string | null
          listing_url?: string | null
          title_used?: string | null
          description_used?: string | null
          error_message?: string | null
          retry_count?: number
          next_retry_at?: string | null
          screenshot_url?: string | null
          confirmation_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          directory_id?: string
          user_id?: string
          status?: 'pending' | 'queued' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'needs_review' | 'failed' | 'expired'
          submitted_at?: string | null
          listing_url?: string | null
          title_used?: string | null
          description_used?: string | null
          error_message?: string | null
          retry_count?: number
          next_retry_at?: string | null
          screenshot_url?: string | null
          confirmation_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          website_id: string
          user_id: string
          platform: 'twitter' | 'linkedin' | 'reddit' | 'facebook' | 'instagram' | 'producthunt' | 'indiehackers' | 'hackernews'
          content: string
          media_urls: string[] | null
          link_url: string | null
          scheduled_at: string
          posted_at: string | null
          status: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'canceled'
          post_url: string | null
          engagement_data: Json | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_id: string
          user_id: string
          platform: 'twitter' | 'linkedin' | 'reddit' | 'facebook' | 'instagram' | 'producthunt' | 'indiehackers' | 'hackernews'
          content: string
          media_urls?: string[] | null
          link_url?: string | null
          scheduled_at: string
          posted_at?: string | null
          status?: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'canceled'
          post_url?: string | null
          engagement_data?: Json | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          user_id?: string
          platform?: 'twitter' | 'linkedin' | 'reddit' | 'facebook' | 'instagram' | 'producthunt' | 'indiehackers' | 'hackernews'
          content?: string
          media_urls?: string[] | null
          link_url?: string | null
          scheduled_at?: string
          posted_at?: string | null
          status?: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'canceled'
          post_url?: string | null
          engagement_data?: Json | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for table rows
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Website = Database['public']['Tables']['websites']['Row']
export type Directory = Database['public']['Tables']['directories']['Row']
export type Submission = Database['public']['Tables']['submissions']['Row']
export type SocialPost = Database['public']['Tables']['social_posts']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type WebsiteInsert = Database['public']['Tables']['websites']['Insert']
export type DirectoryInsert = Database['public']['Tables']['directories']['Insert']
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert']
export type SocialPostInsert = Database['public']['Tables']['social_posts']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type WebsiteUpdate = Database['public']['Tables']['websites']['Update']
export type DirectoryUpdate = Database['public']['Tables']['directories']['Update']
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']
export type SocialPostUpdate = Database['public']['Tables']['social_posts']['Update']
