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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          created_at: string
          id: string
          invite_url: string | null
          key: string
          label: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_url?: string | null
          key: string
          label: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_url?: string | null
          key?: string
          label?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      executives: {
        Row: {
          created_at: string
          display_order: number
          full_name: string
          handover_document_url: string | null
          id: string
          is_active: boolean
          phone: string | null
          photo_url: string | null
          position: string
          profile_id: string | null
          tenure_end: string | null
          tenure_start: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          full_name: string
          handover_document_url?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          photo_url?: string | null
          position: string
          profile_id?: string | null
          tenure_end?: string | null
          tenure_start: string
        }
        Update: {
          created_at?: string
          display_order?: number
          full_name?: string
          handover_document_url?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          photo_url?: string | null
          position?: string
          profile_id?: string | null
          tenure_end?: string | null
          tenure_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "executives_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      income_expenditure_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          payment_id: string | null
          receipt_url: string | null
          recorded_by: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type: string
          id?: string
          payment_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          payment_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_expenditure_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_expenditure_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlords: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          id_document_url: string | null
          ownership_proof_url: string | null
          phone: string | null
          profile_id: string | null
          property_id: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          ownership_proof_url?: string | null
          phone?: string | null
          profile_id?: string | null
          property_id: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          ownership_proof_url?: string | null
          phone?: string | null
          profile_id?: string | null
          property_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landlords_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlords_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          listing_id: string
          message: string | null
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          listing_id: string
          message?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          listing_id?: string
          message?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          is_published: boolean
          report_month: string
          summary: string | null
          total_collected: number
          total_expenditure: number
          total_income: number
          total_outstanding: number
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          is_published?: boolean
          report_month: string
          summary?: string | null
          total_collected?: number
          total_expenditure?: number
          total_income?: number
          total_outstanding?: number
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          is_published?: boolean
          report_month?: string
          summary?: string | null
          total_collected?: number
          total_expenditure?: number
          total_income?: number
          total_outstanding?: number
        }
        Relationships: []
      }
      occupancy_history: {
        Row: {
          created_at: string
          end_date: string
          full_name: string
          id: string
          property_id: string
          relationship: Database["public"]["Enums"]["resident_relationship"]
          resident_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string
          full_name: string
          id?: string
          property_id: string
          relationship: Database["public"]["Enums"]["resident_relationship"]
          resident_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          full_name?: string
          id?: string
          property_id?: string
          relationship?: Database["public"]["Enums"]["resident_relationship"]
          resident_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancy_history_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          covers_end: string | null
          covers_start: string | null
          id: string
          landlord_id: string | null
          landlord_name: string | null
          method: string
          paid_at: string
          payer_type: string | null
          period: string | null
          plot_count: number | null
          property_id: string | null
          reference: string | null
          resident_id: string | null
          resident_name: string | null
          structure_id: string | null
        }
        Insert: {
          amount: number
          covers_end?: string | null
          covers_start?: string | null
          id?: string
          landlord_id?: string | null
          landlord_name?: string | null
          method?: string
          paid_at?: string
          payer_type?: string | null
          period?: string | null
          plot_count?: number | null
          property_id?: string | null
          reference?: string | null
          resident_id?: string | null
          resident_name?: string | null
          structure_id?: string | null
        }
        Update: {
          amount?: number
          covers_end?: string | null
          covers_start?: string | null
          id?: string
          landlord_id?: string | null
          landlord_name?: string | null
          method?: string
          paid_at?: string
          payer_type?: string | null
          period?: string | null
          plot_count?: number | null
          property_id?: string | null
          reference?: string | null
          resident_id?: string | null
          resident_name?: string | null
          structure_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "service_charge_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      properties: {
        Row: {
          apartment_type: string | null
          block: string | null
          created_at: string
          house_number: string
          id: string
          resident_count: number
          status: string
          street_name: string
          type: Database["public"]["Enums"]["property_type"]
        }
        Insert: {
          apartment_type?: string | null
          block?: string | null
          created_at?: string
          house_number: string
          id?: string
          resident_count?: number
          status?: string
          street_name: string
          type?: Database["public"]["Enums"]["property_type"]
        }
        Update: {
          apartment_type?: string | null
          block?: string | null
          created_at?: string
          house_number?: string
          id?: string
          resident_count?: number
          status?: string
          street_name?: string
          type?: Database["public"]["Enums"]["property_type"]
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          image_urls: string[]
          is_published: boolean
          listing_type: string
          price: number | null
          property_id: string
          size: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_published?: boolean
          listing_type: string
          price?: number | null
          property_id: string
          size?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_published?: boolean
          listing_type?: string
          price?: number | null
          property_id?: string
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      residents: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          move_in_date: string | null
          move_out_date: string | null
          phone: string | null
          profile_id: string | null
          property_id: string
          relationship: Database["public"]["Enums"]["resident_relationship"]
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          phone?: string | null
          profile_id?: string | null
          property_id: string
          relationship?: Database["public"]["Enums"]["resident_relationship"]
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          phone?: string | null
          profile_id?: string | null
          property_id?: string
          relationship?: Database["public"]["Enums"]["resident_relationship"]
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      service_charge_structures: {
        Row: {
          amount: number
          applies_to_apartment_type: string | null
          charge_category: string
          created_at: string
          frequency: string
          id: string
          name: string
        }
        Insert: {
          amount: number
          applies_to_apartment_type?: string | null
          charge_category?: string
          created_at?: string
          frequency?: string
          id?: string
          name: string
        }
        Update: {
          amount?: number
          applies_to_apartment_type?: string | null
          charge_category?: string
          created_at?: string
          frequency?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      estate_public_stats: {
        Args: never
        Returns: {
          active_executives: number
          available_properties: number
          landlord_count: number
          resident_count: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "executive_current"
        | "executive_past"
        | "landlord"
        | "resident"
        | "accountant"
      property_type: "rent" | "sale" | "occupied" | "both"
      resident_relationship: "owner-occupier" | "tenant" | "family"
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
      app_role: [
        "super_admin",
        "executive_current",
        "executive_past",
        "landlord",
        "resident",
        "accountant",
      ],
      property_type: ["rent", "sale", "occupied", "both"],
      resident_relationship: ["owner-occupier", "tenant", "family"],
    },
  },
} as const
