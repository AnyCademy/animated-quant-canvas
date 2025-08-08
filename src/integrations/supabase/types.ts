export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          price: number
          status: Database["public"]["Enums"]["course_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          price?: number
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          price?: number
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_code: string | null
          bank_name: string
          created_at: string
          id: string
          instructor_id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_code?: string | null
          bank_name: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      instructor_payment_settings: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean | null
          is_production: boolean | null
          midtrans_client_key: string | null
          midtrans_server_key: string | null
          migration_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean | null
          is_production?: boolean | null
          midtrans_client_key?: string | null
          midtrans_server_key?: string | null
          migration_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          is_production?: boolean | null
          midtrans_client_key?: string | null
          midtrans_server_key?: string | null
          migration_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          course_id: string
          created_at: string
          currency: string
          id: string
          instructor_share: number | null
          midtrans_order_id: string
          midtrans_transaction_id: string | null
          paid_at: string | null
          payment_method: string | null
          platform_fee: number | null
          platform_fee_percentage: number | null
          split_payment_enabled: boolean | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          course_id: string
          created_at?: string
          currency?: string
          id?: string
          instructor_share?: number | null
          midtrans_order_id: string
          midtrans_transaction_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          platform_fee_percentage?: number | null
          split_payment_enabled?: boolean | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string
          created_at?: string
          currency?: string
          id?: string
          instructor_share?: number | null
          midtrans_order_id?: string
          midtrans_transaction_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          platform_fee_percentage?: number | null
          split_payment_enabled?: boolean | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batch_items: {
        Row: {
          amount: number
          batch_id: string | null
          created_at: string
          id: string
          revenue_split_id: string | null
        }
        Insert: {
          amount: number
          batch_id?: string | null
          created_at?: string
          id?: string
          revenue_split_id?: string | null
        }
        Update: {
          amount?: number
          batch_id?: string | null
          created_at?: string
          id?: string
          revenue_split_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_revenue_split_id_fkey"
            columns: ["revenue_split_id"]
            isOneToOne: false
            referencedRelation: "revenue_splits"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          batch_reference: string | null
          created_at: string
          created_by: string | null
          id: string
          instructor_id: string | null
          notes: string | null
          payout_method: string | null
          processed_at: string | null
          scheduled_date: string | null
          status: string | null
          total_amount: number
          transaction_count: number
        }
        Insert: {
          batch_reference?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          payout_method?: string | null
          processed_at?: string | null
          scheduled_date?: string | null
          status?: string | null
          total_amount: number
          transaction_count?: number
        }
        Update: {
          batch_reference?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          payout_method?: string | null
          processed_at?: string | null
          scheduled_date?: string | null
          status?: string | null
          total_amount?: number
          transaction_count?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_splits: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          instructor_id: string | null
          instructor_share: number
          payment_id: string | null
          platform_fee_amount: number
          platform_fee_percentage: number
          status: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          instructor_id?: string | null
          instructor_share: number
          payment_id?: string | null
          platform_fee_amount: number
          platform_fee_percentage: number
          status?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          instructor_id?: string | null
          instructor_share?: number
          payment_id?: string | null
          platform_fee_amount?: number
          platform_fee_percentage?: number
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_splits_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_splits_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dashboard_data: {
        Row: {
          courses_completed: number | null
          created_at: string
          current_streak: number | null
          id: string
          last_activity_date: string | null
          learning_goals: string[] | null
          preferred_learning_schedule: string | null
          total_courses_enrolled: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          courses_completed?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          learning_goals?: string[] | null
          preferred_learning_schedule?: string | null
          total_courses_enrolled?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          courses_completed?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          learning_goals?: string[] | null
          preferred_learning_schedule?: string | null
          total_courses_enrolled?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_video_progress: {
        Row: {
          completed: boolean
          id: string
          last_watched_at: string
          progress_seconds: number
          user_id: string
          video_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          last_watched_at?: string
          progress_seconds?: number
          user_id: string
          video_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          last_watched_at?: string
          progress_seconds?: number
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          chapter_id: string
          created_at: string
          description: string | null
          duration: number | null
          id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      instructor_earnings_view: {
        Row: {
          avg_fee_percentage: number | null
          course_id: string | null
          course_title: string | null
          instructor_id: string | null
          total_course_revenue: number | null
          total_instructor_earnings: number | null
          total_platform_fees_paid: number | null
          total_sales: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_earnings_view: {
        Row: {
          avg_fee_percentage: number | null
          date: string | null
          total_instructor_payments: number | null
          total_platform_fees: number | null
          total_revenue: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_split_payment: {
        Args: {
          course_amount: number
          fee_percentage?: number
          fixed_fee?: number
        }
        Returns: {
          total_amount: number
          platform_fee: number
          instructor_share: number
        }[]
      }
    }
    Enums: {
      course_status: "draft" | "published" | "archived"
      payment_status: "pending" | "paid" | "failed" | "expired"
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
      course_status: ["draft", "published", "archived"],
      payment_status: ["pending", "paid", "failed", "expired"],
    },
  },
} as const
