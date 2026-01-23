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
      ai_assistant_config: {
        Row: {
          agent_name: string
          allow_reminders: boolean
          auto_create_contacts: boolean | null
          behavior_prompt: string | null
          communication_style: string
          company_description: string | null
          company_name: string | null
          created_at: string
          disable_group_messages: boolean | null
          elevenlabs_enabled: boolean | null
          elevenlabs_voice_id: string | null
          google_calendar_enabled: boolean | null
          google_calendar_id: string | null
          id: string
          inactivity_action: string | null
          inactivity_message: string | null
          inactivity_timeout_minutes: number | null
          is_active: boolean
          purpose: string
          response_delay_seconds: number | null
          restrict_topics: boolean
          show_recording_indicator: boolean | null
          show_typing_indicator: boolean | null
          sign_agent_name: boolean
          smart_training_search: boolean
          split_long_messages: boolean
          updated_at: string
          use_emojis: boolean
          user_id: string
          voice_response_enabled: boolean | null
          website_url: string | null
        }
        Insert: {
          agent_name?: string
          allow_reminders?: boolean
          auto_create_contacts?: boolean | null
          behavior_prompt?: string | null
          communication_style?: string
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          disable_group_messages?: boolean | null
          elevenlabs_enabled?: boolean | null
          elevenlabs_voice_id?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          id?: string
          inactivity_action?: string | null
          inactivity_message?: string | null
          inactivity_timeout_minutes?: number | null
          is_active?: boolean
          purpose?: string
          response_delay_seconds?: number | null
          restrict_topics?: boolean
          show_recording_indicator?: boolean | null
          show_typing_indicator?: boolean | null
          sign_agent_name?: boolean
          smart_training_search?: boolean
          split_long_messages?: boolean
          updated_at?: string
          use_emojis?: boolean
          user_id: string
          voice_response_enabled?: boolean | null
          website_url?: string | null
        }
        Update: {
          agent_name?: string
          allow_reminders?: boolean
          auto_create_contacts?: boolean | null
          behavior_prompt?: string | null
          communication_style?: string
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          disable_group_messages?: boolean | null
          elevenlabs_enabled?: boolean | null
          elevenlabs_voice_id?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          id?: string
          inactivity_action?: string | null
          inactivity_message?: string | null
          inactivity_timeout_minutes?: number | null
          is_active?: boolean
          purpose?: string
          response_delay_seconds?: number | null
          restrict_topics?: boolean
          show_recording_indicator?: boolean | null
          show_typing_indicator?: boolean | null
          sign_agent_name?: boolean
          smart_training_search?: boolean
          split_long_messages?: boolean
          updated_at?: string
          use_emojis?: boolean
          user_id?: string
          voice_response_enabled?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      ai_intents: {
        Row: {
          action_type: string
          action_value: string
          created_at: string
          description: string | null
          id: string
          intent_name: string
          is_active: boolean
          trigger_phrases: string[]
          user_id: string
        }
        Insert: {
          action_type?: string
          action_value: string
          created_at?: string
          description?: string | null
          id?: string
          intent_name: string
          is_active?: boolean
          trigger_phrases?: string[]
          user_id: string
        }
        Update: {
          action_type?: string
          action_value?: string
          created_at?: string
          description?: string | null
          id?: string
          intent_name?: string
          is_active?: boolean
          trigger_phrases?: string[]
          user_id?: string
        }
        Relationships: []
      }
      ai_training_documents: {
        Row: {
          content: string
          content_type: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      appstore_alert_settings: {
        Row: {
          alert_type: string
          created_at: string
          email_address: string | null
          email_enabled: boolean | null
          id: string
          is_active: boolean | null
          min_rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          min_rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          min_rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appstore_alerts_log: {
        Row: {
          alert_type: string
          created_at: string
          email_sent_to: string | null
          id: string
          message: string | null
          reference_id: string | null
          status: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          email_sent_to?: string | null
          id?: string
          message?: string | null
          reference_id?: string | null
          status?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          email_sent_to?: string | null
          id?: string
          message?: string | null
          reference_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      appstore_metrics: {
        Row: {
          active_devices: number | null
          crashes: number | null
          created_at: string
          date: string
          downloads: number | null
          id: string
          impressions: number | null
          page_views: number | null
          redownloads: number | null
          sessions: number | null
          updated_at: string
        }
        Insert: {
          active_devices?: number | null
          crashes?: number | null
          created_at?: string
          date: string
          downloads?: number | null
          id?: string
          impressions?: number | null
          page_views?: number | null
          redownloads?: number | null
          sessions?: number | null
          updated_at?: string
        }
        Update: {
          active_devices?: number | null
          crashes?: number | null
          created_at?: string
          date?: string
          downloads?: number | null
          id?: string
          impressions?: number | null
          page_views?: number | null
          redownloads?: number | null
          sessions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      appstore_review_responses: {
        Row: {
          apple_review_id: string | null
          created_at: string
          error_message: string | null
          id: string
          response_status: string | null
          response_text: string
          review_id: string | null
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          apple_review_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          response_status?: string | null
          response_text: string
          review_id?: string | null
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          apple_review_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          response_status?: string | null
          response_text?: string
          review_id?: string | null
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appstore_review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "appstore_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      appstore_reviews: {
        Row: {
          apple_id: string | null
          author_name: string | null
          body: string | null
          country_code: string | null
          created_at: string
          id: string
          rating: number | null
          responded: boolean | null
          response_text: string | null
          review_date: string | null
          title: string | null
        }
        Insert: {
          apple_id?: string | null
          author_name?: string | null
          body?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          responded?: boolean | null
          response_text?: string | null
          review_date?: string | null
          title?: string | null
        }
        Update: {
          apple_id?: string | null
          author_name?: string | null
          body?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          responded?: boolean | null
          response_text?: string | null
          review_date?: string | null
          title?: string | null
        }
        Relationships: []
      }
      appstore_sales: {
        Row: {
          country_code: string | null
          created_at: string
          currency: string | null
          date: string
          id: string
          proceeds: number | null
          product_name: string | null
          product_type: string | null
          units: number | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          currency?: string | null
          date: string
          id?: string
          proceeds?: number | null
          product_name?: string | null
          product_type?: string | null
          units?: number | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          id?: string
          proceeds?: number | null
          product_name?: string | null
          product_type?: string | null
          units?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      appstore_subscriptions: {
        Row: {
          app_account_token: string | null
          bundle_id: string | null
          created_at: string
          environment: string | null
          expires_date: string | null
          id: string
          last_transaction_id: string | null
          notes: string | null
          original_transaction_id: string
          product_id: string | null
          purchase_date: string | null
          renewal_info: Json | null
          status: string
          updated_at: string
          user_email: string | null
        }
        Insert: {
          app_account_token?: string | null
          bundle_id?: string | null
          created_at?: string
          environment?: string | null
          expires_date?: string | null
          id?: string
          last_transaction_id?: string | null
          notes?: string | null
          original_transaction_id: string
          product_id?: string | null
          purchase_date?: string | null
          renewal_info?: Json | null
          status?: string
          updated_at?: string
          user_email?: string | null
        }
        Update: {
          app_account_token?: string | null
          bundle_id?: string | null
          created_at?: string
          environment?: string | null
          expires_date?: string | null
          id?: string
          last_transaction_id?: string | null
          notes?: string | null
          original_transaction_id?: string
          product_id?: string | null
          purchase_date?: string | null
          renewal_info?: Json | null
          status?: string
          updated_at?: string
          user_email?: string | null
        }
        Relationships: []
      }
      appstore_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          records_synced: number | null
          status: string
          sync_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status: string
          sync_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      appstore_webhook_events: {
        Row: {
          bundle_id: string | null
          created_at: string
          decoded_payload: Json | null
          environment: string | null
          id: string
          notification_type: string
          notification_uuid: string | null
          original_transaction_id: string | null
          processed_at: string | null
          product_id: string | null
          raw_payload: Json | null
          signed_date: string | null
          subtype: string | null
          transaction_id: string | null
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string
          decoded_payload?: Json | null
          environment?: string | null
          id?: string
          notification_type: string
          notification_uuid?: string | null
          original_transaction_id?: string | null
          processed_at?: string | null
          product_id?: string | null
          raw_payload?: Json | null
          signed_date?: string | null
          subtype?: string | null
          transaction_id?: string | null
        }
        Update: {
          bundle_id?: string | null
          created_at?: string
          decoded_payload?: Json | null
          environment?: string | null
          id?: string
          notification_type?: string
          notification_uuid?: string | null
          original_transaction_id?: string | null
          processed_at?: string | null
          product_id?: string | null
          raw_payload?: Json | null
          signed_date?: string | null
          subtype?: string | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      bio_link_clicks: {
        Row: {
          category: string
          clicked_at: string
          id: string
          link_title: string
          link_url: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          category: string
          clicked_at?: string
          id?: string
          link_title: string
          link_url: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          category?: string
          clicked_at?: string
          id?: string
          link_title?: string
          link_url?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_page_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_reminder_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message_template: string
          template_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_template: string
          template_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string
          template_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_availability: {
        Row: {
          booked_by_email: string | null
          booked_by_name: string | null
          booked_by_phone: string | null
          booking_notes: string | null
          calendar_id: string | null
          created_at: string
          end_time: string
          id: string
          is_booked: boolean
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booked_by_email?: string | null
          booked_by_name?: string | null
          booked_by_phone?: string | null
          booking_notes?: string | null
          calendar_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booked_by_email?: string | null
          booked_by_name?: string | null
          booked_by_phone?: string | null
          booking_notes?: string | null
          calendar_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_filters: {
        Row: {
          campaign_id: string
          created_at: string
          filter_type: string
          filter_value: string | null
          id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          filter_type: string
          filter_value?: string | null
          id?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          filter_type?: string
          filter_value?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_filters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          opened_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_type: string
          completed_at: string | null
          content: string
          created_at: string
          description: string | null
          id: string
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type: string
          completed_at?: string | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string
          completed_at?: string | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      channel_configs: {
        Row: {
          access_token: string | null
          ai_enabled: boolean
          channel: Database["public"]["Enums"]["channel_type"]
          config: Json
          created_at: string
          id: string
          is_active: boolean
          page_id: string | null
          updated_at: string
          user_id: string
          webhook_verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          ai_enabled?: boolean
          channel: Database["public"]["Enums"]["channel_type"]
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          page_id?: string | null
          updated_at?: string
          user_id: string
          webhook_verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          ai_enabled?: boolean
          channel?: Database["public"]["Enums"]["channel_type"]
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          page_id?: string | null
          updated_at?: string
          user_id?: string
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      client_badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points: number | null
          requirement_type: string
          requirement_value: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points?: number | null
          requirement_type: string
          requirement_value?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number | null
          requirement_type?: string
          requirement_value?: number | null
        }
        Relationships: []
      }
      client_earned_badges: {
        Row: {
          badge_id: string
          client_id: string
          earned_at: string
          id: string
        }
        Insert: {
          badge_id: string
          client_id: string
          earned_at?: string
          id?: string
        }
        Update: {
          badge_id?: string
          client_id?: string
          earned_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_earned_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "client_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_earned_badges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consulting_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_form_fields: {
        Row: {
          created_at: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string | null
          id: string
          is_required: boolean | null
          order_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_meeting_notes: {
        Row: {
          client_user_id: string
          consultant_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_date: string
          next_steps: string | null
          notes: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_user_id: string
          consultant_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_date: string
          next_steps?: string | null
          notes?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_user_id?: string
          consultant_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_date?: string
          next_steps?: string | null
          notes?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_milestones: {
        Row: {
          category: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          order_index: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_milestones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          consultant_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_approved: boolean | null
          office_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          consultant_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_approved?: boolean | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          consultant_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_approved?: boolean | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_progress_feedback: {
        Row: {
          achievements: string | null
          ai_usage_frequency: string | null
          client_id: string
          created_at: string
          help_details: string | null
          id: string
          implementation_status: string
          main_challenges: string | null
          needs_help: boolean | null
          user_id: string
        }
        Insert: {
          achievements?: string | null
          ai_usage_frequency?: string | null
          client_id: string
          created_at?: string
          help_details?: string | null
          id?: string
          implementation_status: string
          main_challenges?: string | null
          needs_help?: boolean | null
          user_id: string
        }
        Update: {
          achievements?: string | null
          ai_usage_frequency?: string | null
          client_id?: string
          created_at?: string
          help_details?: string | null
          id?: string
          implementation_status?: string
          main_challenges?: string | null
          needs_help?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_progress_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consulting_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sessions: {
        Row: {
          client_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          next_steps: string | null
          notes: string | null
          session_date: string
          session_type: string | null
          status: string | null
          summary: string | null
          title: string
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          next_steps?: string | null
          notes?: string | null
          session_date: string
          session_type?: string | null
          status?: string | null
          summary?: string | null
          title: string
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          next_steps?: string | null
          notes?: string | null
          session_date?: string
          session_type?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_timeline: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          reference_id: string | null
          reference_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_timeline_events: {
        Row: {
          client_user_id: string
          consultant_id: string
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          is_visible_to_client: boolean
          metadata: Json | null
          title: string
        }
        Insert: {
          client_user_id: string
          consultant_id: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type: string
          id?: string
          is_visible_to_client?: boolean
          metadata?: Json | null
          title: string
        }
        Update: {
          client_user_id?: string
          consultant_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_visible_to_client?: boolean
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          ai_knowledge_level: string | null
          area_atuacao: string | null
          challenges: string | null
          cidade: string | null
          contract_end_date: string | null
          contract_start_date: string
          contract_value: number | null
          created_at: string
          email: string | null
          escritorio: string | null
          estado: string | null
          form_data: Json | null
          id: string
          lead_id: string | null
          name: string
          oab_number: string | null
          objectives: string | null
          payment_status: string | null
          phone: string | null
          product_type: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_knowledge_level?: string | null
          area_atuacao?: string | null
          challenges?: string | null
          cidade?: string | null
          contract_end_date?: string | null
          contract_start_date?: string
          contract_value?: number | null
          created_at?: string
          email?: string | null
          escritorio?: string | null
          estado?: string | null
          form_data?: Json | null
          id?: string
          lead_id?: string | null
          name: string
          oab_number?: string | null
          objectives?: string | null
          payment_status?: string | null
          phone?: string | null
          product_type: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_knowledge_level?: string | null
          area_atuacao?: string | null
          challenges?: string | null
          cidade?: string | null
          contract_end_date?: string | null
          contract_start_date?: string
          contract_value?: number | null
          created_at?: string
          email?: string | null
          escritorio?: string | null
          estado?: string | null
          form_data?: Json | null
          id?: string
          lead_id?: string | null
          name?: string
          oab_number?: string | null
          objectives?: string | null
          payment_status?: string | null
          phone?: string | null
          product_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      column_mappings: {
        Row: {
          created_at: string
          id: string
          mapping: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mapping: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mapping?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultant_notification_settings: {
        Row: {
          booking_email_notification: boolean | null
          consultant_email: string | null
          created_at: string
          diagnostic_email_notification: boolean | null
          from_email_address: string | null
          from_email_name: string | null
          id: string
          inactivity_reminder_days: number | null
          inactivity_reminder_enabled: boolean | null
          monthly_report_day: number | null
          monthly_report_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_email_notification?: boolean | null
          consultant_email?: string | null
          created_at?: string
          diagnostic_email_notification?: boolean | null
          from_email_address?: string | null
          from_email_name?: string | null
          id?: string
          inactivity_reminder_days?: number | null
          inactivity_reminder_enabled?: boolean | null
          monthly_report_day?: number | null
          monthly_report_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_email_notification?: boolean | null
          consultant_email?: string | null
          created_at?: string
          diagnostic_email_notification?: boolean | null
          from_email_address?: string | null
          from_email_name?: string | null
          id?: string
          inactivity_reminder_days?: number | null
          inactivity_reminder_enabled?: boolean | null
          monthly_report_day?: number | null
          monthly_report_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consulting_client_documents: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          document_type: string
          external_url: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          document_type?: string
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          document_type?: string
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consulting_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_client_reminders: {
        Row: {
          client_id: string
          created_at: string
          days_since_last_meeting: number | null
          id: string
          is_dismissed: boolean | null
          reminder_message: string
          reminder_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          days_since_last_meeting?: number | null
          id?: string
          is_dismissed?: boolean | null
          reminder_message: string
          reminder_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          days_since_last_meeting?: number | null
          id?: string
          is_dismissed?: boolean | null
          reminder_message?: string
          reminder_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_client_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consulting_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_clients: {
        Row: {
          address_complement: string | null
          address_number: string | null
          ai_difficulties: string | null
          ai_familiarity_level: string | null
          ai_tasks_used: string | null
          ai_tools_used: string | null
          ai_usage_frequency: string | null
          bairro: string | null
          case_management_flow: string | null
          case_management_other: string | null
          case_management_system: string | null
          cidade: string | null
          client_service_flow: string | null
          comfortable_with_tech: boolean | null
          cpf_cnpj: string | null
          created_at: string
          custom_features: string | null
          email: string
          email_lc: string | null
          estado: string | null
          expected_results: string[] | null
          expected_results_other: string | null
          feature_priorities: Json | null
          foundation_year: number | null
          fragmented_prompts: Json | null
          full_name: string
          generated_prompt: string | null
          has_chatgpt_app: boolean | null
          has_chatgpt_paid: boolean | null
          has_used_ai: boolean | null
          has_used_chatgpt: boolean | null
          id: string
          implementation_plan: Json | null
          last_reminder_sent_at: string | null
          lead_id: string | null
          logo_url: string | null
          lovable_project_url: string | null
          motivations: string[] | null
          motivations_other: string | null
          num_employees: number
          num_lawyers: number
          oab_number: string | null
          office_address: string
          office_name: string
          other_ai_tools: string | null
          phone: string
          practice_areas: string | null
          selected_features: number[] | null
          status: string | null
          tasks_to_automate: string | null
          total_points: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          ai_difficulties?: string | null
          ai_familiarity_level?: string | null
          ai_tasks_used?: string | null
          ai_tools_used?: string | null
          ai_usage_frequency?: string | null
          bairro?: string | null
          case_management_flow?: string | null
          case_management_other?: string | null
          case_management_system?: string | null
          cidade?: string | null
          client_service_flow?: string | null
          comfortable_with_tech?: boolean | null
          cpf_cnpj?: string | null
          created_at?: string
          custom_features?: string | null
          email: string
          email_lc?: string | null
          estado?: string | null
          expected_results?: string[] | null
          expected_results_other?: string | null
          feature_priorities?: Json | null
          foundation_year?: number | null
          fragmented_prompts?: Json | null
          full_name: string
          generated_prompt?: string | null
          has_chatgpt_app?: boolean | null
          has_chatgpt_paid?: boolean | null
          has_used_ai?: boolean | null
          has_used_chatgpt?: boolean | null
          id?: string
          implementation_plan?: Json | null
          last_reminder_sent_at?: string | null
          lead_id?: string | null
          logo_url?: string | null
          lovable_project_url?: string | null
          motivations?: string[] | null
          motivations_other?: string | null
          num_employees?: number
          num_lawyers?: number
          oab_number?: string | null
          office_address: string
          office_name: string
          other_ai_tools?: string | null
          phone: string
          practice_areas?: string | null
          selected_features?: number[] | null
          status?: string | null
          tasks_to_automate?: string | null
          total_points?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address_complement?: string | null
          address_number?: string | null
          ai_difficulties?: string | null
          ai_familiarity_level?: string | null
          ai_tasks_used?: string | null
          ai_tools_used?: string | null
          ai_usage_frequency?: string | null
          bairro?: string | null
          case_management_flow?: string | null
          case_management_other?: string | null
          case_management_system?: string | null
          cidade?: string | null
          client_service_flow?: string | null
          comfortable_with_tech?: boolean | null
          cpf_cnpj?: string | null
          created_at?: string
          custom_features?: string | null
          email?: string
          email_lc?: string | null
          estado?: string | null
          expected_results?: string[] | null
          expected_results_other?: string | null
          feature_priorities?: Json | null
          foundation_year?: number | null
          fragmented_prompts?: Json | null
          full_name?: string
          generated_prompt?: string | null
          has_chatgpt_app?: boolean | null
          has_chatgpt_paid?: boolean | null
          has_used_ai?: boolean | null
          has_used_chatgpt?: boolean | null
          id?: string
          implementation_plan?: Json | null
          last_reminder_sent_at?: string | null
          lead_id?: string | null
          logo_url?: string | null
          lovable_project_url?: string | null
          motivations?: string[] | null
          motivations_other?: string | null
          num_employees?: number
          num_lawyers?: number
          oab_number?: string | null
          office_address?: string
          office_name?: string
          other_ai_tools?: string | null
          phone?: string
          practice_areas?: string | null
          selected_features?: number[] | null
          status?: string | null
          tasks_to_automate?: string | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consulting_clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_message_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          name: string
          subject: string | null
          template_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          template_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          template_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consulting_sessions: {
        Row: {
          client_id: string
          created_at: string
          duration_minutes: number | null
          google_calendar_id: string | null
          google_event_id: string | null
          google_event_link: string | null
          id: string
          next_steps: string | null
          notes: string | null
          session_date: string
          session_type: string | null
          status: string | null
          summary: string | null
          title: string
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duration_minutes?: number | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_event_link?: string | null
          id?: string
          next_steps?: string | null
          notes?: string | null
          session_date: string
          session_type?: string | null
          status?: string | null
          summary?: string | null
          title: string
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duration_minutes?: number | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_event_link?: string | null
          id?: string
          next_steps?: string | null
          notes?: string | null
          session_date?: string
          session_type?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consulting_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_settings: {
        Row: {
          calendar_booking_url: string | null
          created_at: string
          email_notifications_enabled: boolean | null
          id: string
          updated_at: string
          user_id: string
          whatsapp_notifications_enabled: boolean | null
        }
        Insert: {
          calendar_booking_url?: string | null
          created_at?: string
          email_notifications_enabled?: boolean | null
          id?: string
          updated_at?: string
          user_id: string
          whatsapp_notifications_enabled?: boolean | null
        }
        Update: {
          calendar_booking_url?: string | null
          created_at?: string
          email_notifications_enabled?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string
          whatsapp_notifications_enabled?: boolean | null
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string
          conversation_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          conversation_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          conversation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_assignees_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_form_progress: {
        Row: {
          client_user_id: string
          consultant_id: string
          created_at: string
          current_step: number
          form_data: Json
          id: string
          is_completed: boolean
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          client_user_id: string
          consultant_id: string
          created_at?: string
          current_step?: number
          form_data?: Json
          id?: string
          is_completed?: boolean
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          client_user_id?: string
          consultant_id?: string
          created_at?: string
          current_step?: number
          form_data?: Json
          id?: string
          is_completed?: boolean
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ebook_captures: {
        Row: {
          created_at: string
          email: string
          email_sent: boolean | null
          event_source: string | null
          id: string
          lead_id: string | null
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          email_sent?: boolean | null
          event_source?: string | null
          id?: string
          lead_id?: string | null
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          email_sent?: boolean | null
          event_source?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_captures_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_opens: {
        Row: {
          campaign_id: string | null
          id: string
          ip_address: string | null
          lead_email: string
          opened_at: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip_address?: string | null
          lead_email: string
          opened_at?: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip_address?: string | null
          lead_email?: string
          opened_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          campaign_id: string | null
          email: string
          id: string
          ip_address: string | null
          reason: string | null
          unsubscribed_at: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          email: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          unsubscribed_at?: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          unsubscribed_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_logs: {
        Row: {
          error_message: string | null
          id: string
          lead_id: string
          notification_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          lead_id: string
          notification_type: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          lead_id?: string
          notification_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_settings: {
        Row: {
          created_at: string
          days_without_interaction: number
          id: string
          manychat_subscriber_id: string | null
          notify_in_app: boolean
          notify_whatsapp: boolean
          personal_whatsapp: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_without_interaction?: number
          id?: string
          manychat_subscriber_id?: string | null
          notify_in_app?: boolean
          notify_whatsapp?: boolean
          personal_whatsapp?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_without_interaction?: number
          id?: string
          manychat_subscriber_id?: string | null
          notify_in_app?: boolean
          notify_whatsapp?: boolean
          personal_whatsapp?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follow_up_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_days: number
          message_template: string
          min_days: number
          name: string
          priority: number | null
          product_filter: string[] | null
          status_filter: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_days?: number
          message_template: string
          min_days?: number
          name: string
          priority?: number | null
          product_filter?: string[] | null
          status_filter?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_days?: number
          message_template?: string
          min_days?: number
          name?: string
          priority?: number | null
          product_filter?: string[] | null
          status_filter?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          token_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          token_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          token_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          lead_id: string
          type: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          id?: string
          lead_id: string
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          lead_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignees_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_products: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          product: Database["public"]["Enums"]["product_type"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          product: Database["public"]["Enums"]["product_type"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          product?: Database["public"]["Enums"]["product_type"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_products_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          product: Database["public"]["Enums"]["product_type"] | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          product?: Database["public"]["Enums"]["product_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          product?: Database["public"]["Enums"]["product_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          lead_id: string
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          lead_id: string
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          lead_id?: string
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      progress_reports: {
        Row: {
          client_id: string | null
          created_at: string
          email_opened: boolean
          email_sent: boolean
          id: string
          metrics: Json
          opened_at: string | null
          report_type: string
          sent_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email_opened?: boolean
          email_sent?: boolean
          id?: string
          metrics?: Json
          opened_at?: string | null
          report_type: string
          sent_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email_opened?: boolean
          email_sent?: boolean
          id?: string
          metrics?: Json
          opened_at?: string | null
          report_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consulting_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_responses: {
        Row: {
          content: string
          created_at: string
          id: string
          shortcut: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          shortcut: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          shortcut?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_campaign_emails: {
        Row: {
          content: string
          created_at: string
          cta_text: string | null
          cta_url: string
          email_number: number
          failed_count: number | null
          id: string
          image_url: string | null
          recipients_count: number | null
          scheduled_date: string
          scheduled_time: string
          sent_at: string | null
          status: string
          subject: string
          success_count: number | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string
          email_number: number
          failed_count?: number | null
          id?: string
          image_url?: string | null
          recipients_count?: number | null
          scheduled_date: string
          scheduled_time?: string
          sent_at?: string | null
          status?: string
          subject: string
          success_count?: number | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string
          email_number?: number
          failed_count?: number | null
          id?: string
          image_url?: string | null
          recipients_count?: number | null
          scheduled_date?: string
          scheduled_time?: string
          sent_at?: string | null
          status?: string
          subject?: string
          success_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          contact_phone: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          contact_phone: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          contact_phone?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sent_emails_log: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      welcome_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message_template: string
          product_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_template: string
          product_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string
          product_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          bot_disabled: boolean | null
          created_at: string
          id: string
          lid: string | null
          name: string | null
          notes: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_disabled?: boolean | null
          created_at?: string
          id?: string
          lid?: string | null
          name?: string | null
          notes?: string | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_disabled?: boolean | null
          created_at?: string
          id?: string
          lid?: string | null
          name?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          ai_disabled: boolean
          channel: Database["public"]["Enums"]["channel_type"]
          channel_page_id: string | null
          channel_user_id: string | null
          contact_lid: string | null
          contact_name: string | null
          contact_phone: string
          created_at: string
          id: string
          last_message_at: string | null
          lead_id: string | null
          manychat_subscriber_id: string | null
          profile_picture_url: string | null
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_disabled?: boolean
          channel?: Database["public"]["Enums"]["channel_type"]
          channel_page_id?: string | null
          channel_user_id?: string | null
          contact_lid?: string | null
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          manychat_subscriber_id?: string | null
          profile_picture_url?: string | null
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_disabled?: boolean
          channel?: Database["public"]["Enums"]["channel_type"]
          channel_page_id?: string | null
          channel_user_id?: string | null
          contact_lid?: string | null
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          manychat_subscriber_id?: string | null
          profile_picture_url?: string | null
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          audio_url: string | null
          channel: Database["public"]["Enums"]["channel_type"]
          channel_message_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_ai_response: boolean
          is_from_contact: boolean
          message_type: string
          sent_by_user_id: string | null
          sent_by_user_name: string | null
          status: string
          user_id: string
          zapi_message_id: string | null
        }
        Insert: {
          audio_url?: string | null
          channel?: Database["public"]["Enums"]["channel_type"]
          channel_message_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
          is_from_contact?: boolean
          message_type?: string
          sent_by_user_id?: string | null
          sent_by_user_name?: string | null
          status?: string
          user_id: string
          zapi_message_id?: string | null
        }
        Update: {
          audio_url?: string | null
          channel?: Database["public"]["Enums"]["channel_type"]
          channel_message_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
          is_from_contact?: boolean
          message_type?: string
          sent_by_user_id?: string | null
          sent_by_user_name?: string | null
          status?: string
          user_id?: string
          zapi_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      channel_type:
        | "whatsapp"
        | "instagram"
        | "facebook"
        | "tiktok"
        | "email"
        | "telegram"
      lead_status:
        | "novo"
        | "em_contato"
        | "qualificado"
        | "proposta_enviada"
        | "negociacao"
        | "fechado_ganho"
        | "fechado_perdido"
      product_type:
        | "consultoria"
        | "mentoria_coletiva"
        | "mentoria_individual"
        | "curso_idea"
        | "guia_ia"
        | "codigo_prompts"
        | "combo_ebooks"
        | "ebook_unitario"
        | "imersao_idea"
        | "fraternidade_safe_black"
        | "clube_mqp"
        | "fraternidade_safe_pro"
        | "safe_skills"
        | "safe_experience"
        | "mentoria_marcello_safe"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      channel_type: [
        "whatsapp",
        "instagram",
        "facebook",
        "tiktok",
        "email",
        "telegram",
      ],
      lead_status: [
        "novo",
        "em_contato",
        "qualificado",
        "proposta_enviada",
        "negociacao",
        "fechado_ganho",
        "fechado_perdido",
      ],
      product_type: [
        "consultoria",
        "mentoria_coletiva",
        "mentoria_individual",
        "curso_idea",
        "guia_ia",
        "codigo_prompts",
        "combo_ebooks",
        "ebook_unitario",
        "imersao_idea",
        "fraternidade_safe_black",
        "clube_mqp",
        "fraternidade_safe_pro",
        "safe_skills",
        "safe_experience",
        "mentoria_marcello_safe",
      ],
    },
  },
} as const
