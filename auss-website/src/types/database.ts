export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'super_admin' | 'admin'
          status: 'active' | 'inactive'
          avatar_url: string | null
          created_at: string
          last_login: string | null
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['admins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admins']['Insert']>
      }
      organization_information: {
        Row: {
          id: string
          name: string
          tagline: string | null
          description: string | null
          mission: string | null
          vision: string | null
          history: string | null
          goals: string | null
          objectives: string | null
          core_values: string | null
          logo_url: string | null
          hero_image_url: string | null
          email: string | null
          phone: string | null
          address: string | null
          office_hours: string | null
          map_embed_url: string | null
          established_year: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organization_information']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organization_information']['Insert']>
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          image_url: string | null
          is_featured: boolean
          status: 'published' | 'draft'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          banner_url: string | null
          date: string
          time: string | null
          end_date: string | null
          venue: string
          organizer: string | null
          category: string
          registration_link: string | null
          registration_deadline: string | null
          registration_status: 'open' | 'closed' | 'coming_soon'
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          is_featured: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      event_gallery: {
        Row: {
          id: string
          event_id: string
          image_url: string
          caption: string | null
          order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_gallery']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['event_gallery']['Insert']>
      }
      officer_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['officer_categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['officer_categories']['Insert']>
      }
      officers: {
        Row: {
          id: string
          full_name: string
          position: string
          department: string | null
          course: string | null
          year_level: string | null
          avatar_url: string | null
          email: string | null
          bio: string | null
          order: number
          hierarchy_row: number
          category_id: string | null
          academic_year: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['officers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['officers']['Insert']>
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string | null
          date: string
          category: string
          awarded_by: string | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      feedback: {
        Row: {
          id: string
          name: string | null
          email: string | null
          course: string | null
          year_level: string | null
          student_number: string | null
          category: string
          rating: number | null
          message: string
          is_anonymous: boolean
          attachment_url: string | null
          status: 'unread' | 'read' | 'resolved'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['feedback']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>
      }
      inquiries: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          status: 'unread' | 'read' | 'replied'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['inquiries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>
      }
      social_media: {
        Row: {
          id: string
          platform: string
          url: string
          icon: string | null
          is_active: boolean
          order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['social_media']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['social_media']['Insert']>
      }
      activity_logs: {
        Row: {
          id: string
          admin_id: string | null
          admin_name: string
          action: string
          module: string
          details: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>
      }
      website_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          label: string
          group: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['website_settings']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['website_settings']['Insert']>
      }
      gallery: {
        Row: {
          id: string
          title: string | null
          description: string | null
          image_url: string
          category: string | null
          is_featured: boolean
          order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['gallery']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['gallery']['Insert']>
      }
    }
  }
}

// Convenience types
export type Admin = Database['public']['Tables']['admins']['Row']
export type OrgInfo = Database['public']['Tables']['organization_information']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventGallery = Database['public']['Tables']['event_gallery']['Row']
export type OfficerCategory = Database['public']['Tables']['officer_categories']['Row']
export type Officer = Database['public']['Tables']['officers']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type Inquiry = Database['public']['Tables']['inquiries']['Row']
export type SocialMedia = Database['public']['Tables']['social_media']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type WebsiteSetting = Database['public']['Tables']['website_settings']['Row']
export type GalleryItem = Database['public']['Tables']['gallery']['Row']
