export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_name: string
          id: string
          ip_hash: string | null
          page: string | null
          properties: Json | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_name: string
          id?: string
          ip_hash?: string | null
          page?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_name?: string
          id?: string
          ip_hash?: string | null
          page?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          campaign_name: string
          caption: string | null
          created_at: string | null
          goal: string | null
          hashtags: string[] | null
          id: string
          platforms: string[] | null
          product_id: string | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_name: string
          caption?: string | null
          created_at?: string | null
          goal?: string | null
          hashtags?: string[] | null
          id?: string
          platforms?: string[] | null
          product_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string
          caption?: string | null
          created_at?: string | null
          goal?: string | null
          hashtags?: string[] | null
          id?: string
          platforms?: string[] | null
          product_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          collection_id: string
          id?: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          collection_id?: string
          id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "product_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_hash: string | null
          product_link_id: string
          referrer: string | null
          source: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          product_link_id: string
          referrer?: string | null
          source?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          product_link_id?: string
          referrer?: string | null
          source?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_product_link_id_fkey"
            columns: ["product_link_id"]
            isOneToOne: false
            referencedRelation: "product_links"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          post_id: string
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          post_id: string
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          post_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean | null
          marketplace_url: string | null
          name: string
          slug: string
          updated_at: string
          user_id: string
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          marketplace_url?: string | null
          name: string
          slug: string
          updated_at?: string
          user_id: string
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          marketplace_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      product_links: {
        Row: {
          created_at: string
          id: string
          instagram_handle: string | null
          is_active: boolean | null
          marketplace_url: string | null
          product_id: string | null
          slug: string
          updated_at: string
          user_id: string
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          marketplace_url?: string | null
          product_id?: string | null
          slug: string
          updated_at?: string
          user_id: string
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          marketplace_url?: string | null
          product_id?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          enhanced_image_url: string | null
          enhanced_image_urls: string[] | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          long_description: string | null
          short_description: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          enhanced_image_url?: string | null
          enhanced_image_urls?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          long_description?: string | null
          short_description?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          enhanced_image_url?: string | null
          enhanced_image_urls?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          long_description?: string | null
          short_description?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          default_workflow: string | null
          full_name: string | null
          id: string
          language_preference: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_workflow?: string | null
          full_name?: string | null
          id: string
          language_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_workflow?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          campaign_id: string | null
          caption: string
          collection_id: string | null
          created_at: string
          goal: string | null
          hashtags: string[] | null
          id: string
          image_urls: string[] | null
          link_type: string | null
          link_url: string | null
          platforms: string[]
          product_id: string | null
          product_link_id: string | null
          publish_results: Json | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign_id?: string | null
          caption: string
          collection_id?: string | null
          created_at?: string
          goal?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          link_type?: string | null
          link_url?: string | null
          platforms?: string[]
          product_id?: string | null
          product_link_id?: string | null
          publish_results?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign_id?: string | null
          caption?: string
          collection_id?: string | null
          created_at?: string
          goal?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          link_type?: string | null
          link_url?: string | null
          platforms?: string[]
          product_id?: string | null
          product_link_id?: string | null
          publish_results?: Json | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "product_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_product_link_id_fkey"
            columns: ["product_link_id"]
            isOneToOne: false
            referencedRelation: "product_links"
            referencedColumns: ["id"]
          },
        ]
      }
      user_social_credentials: {
        Row: {
          created_at: string
          credential_key: string
          credential_value: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_key: string
          credential_value: string
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_key?: string
          credential_value?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
