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
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          product: Database["public"]["Enums"]["product_type"]
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
          product: Database["public"]["Enums"]["product_type"]
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
          product?: Database["public"]["Enums"]["product_type"]
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
          value?: number | null
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
          contact_name: string | null
          contact_phone: string
          created_at: string
          id: string
          last_message_at: string | null
          lead_id: string | null
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
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
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_ai_response: boolean
          is_from_contact: boolean
          message_type: string
          status: string
          user_id: string
          zapi_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
          is_from_contact?: boolean
          message_type?: string
          status?: string
          user_id: string
          zapi_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
          is_from_contact?: boolean
          message_type?: string
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
      ],
    },
  },
} as const
