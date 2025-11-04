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
      announcement_views: {
        Row: {
          announcement_id: string
          id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          announcement_id: string
          id?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          announcement_id?: string
          id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          priority: string | null
          target_audience: string
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          target_audience?: string
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          target_audience?: string
          title?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          created_at: string | null
          feedback: string | null
          file_url: string | null
          grade: number | null
          id: string
          status: string | null
          student_id: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          status?: string | null
          student_id: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lesson_id: string | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          course_id: string
          created_at: string | null
          enrollment_id: string
          id: string
          rejection_reason: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["certificate_status"] | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          course_id: string
          created_at?: string | null
          enrollment_id: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["certificate_status"] | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          course_id?: string
          created_at?: string | null
          enrollment_id?: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["certificate_status"] | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          certificate_image_url: string
          course_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          certificate_image_url: string
          course_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          certificate_image_url?: string
          course_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          is_free: boolean | null
          module_id: string
          order_index: number
          title: string
          updated_at: string | null
          video_duration: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free?: boolean | null
          module_id: string
          order_index?: number
          title: string
          updated_at?: string | null
          video_duration?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free?: boolean | null
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
          video_duration?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          duration_minutes: number | null
          id: string
          instructor_id: string | null
          language: string | null
          price: number | null
          requirements: string | null
          short_description: string | null
          status: Database["public"]["Enums"]["course_status"] | null
          tags: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_duration: string | null
          video_url: string | null
          what_you_learn: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          language?: string | null
          price?: number | null
          requirements?: string | null
          short_description?: string | null
          status?: Database["public"]["Enums"]["course_status"] | null
          tags?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_duration?: string | null
          video_url?: string | null
          what_you_learn?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          language?: string | null
          price?: number | null
          requirements?: string | null
          short_description?: string | null
          status?: Database["public"]["Enums"]["course_status"] | null
          tags?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_duration?: string | null
          video_url?: string | null
          what_you_learn?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string | null
          id: string
          payment_verified: boolean | null
          progress: number | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string | null
          id?: string
          payment_verified?: boolean | null
          progress?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string | null
          id?: string
          payment_verified?: boolean | null
          progress?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string
          message: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link: string
          message: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          address: string | null
          amount: number
          city: string | null
          completed_at: string | null
          country: string
          course_id: string
          created_at: string | null
          currency: string
          email: string
          enrollment_id: string | null
          full_name: string
          id: string
          payment_method: string
          paystack_access_code: string | null
          paystack_reference: string | null
          phone: string
          postal_code: string | null
          state: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amount: number
          city?: string | null
          completed_at?: string | null
          country: string
          course_id: string
          created_at?: string | null
          currency?: string
          email: string
          enrollment_id?: string | null
          full_name: string
          id?: string
          payment_method: string
          paystack_access_code?: string | null
          paystack_reference?: string | null
          phone: string
          postal_code?: string | null
          state?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amount?: number
          city?: string | null
          completed_at?: string | null
          country?: string
          course_id?: string
          created_at?: string | null
          currency?: string
          email?: string
          enrollment_id?: string | null
          full_name?: string
          id?: string
          payment_method?: string
          paystack_access_code?: string | null
          paystack_reference?: string | null
          phone?: string
          postal_code?: string | null
          state?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name: string
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_submissions: {
        Row: {
          content: string | null
          feedback: string | null
          file_url: string | null
          grade: number | null
          id: string
          project_id: string
          status: string
          student_id: string
          submission_type: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          project_id: string
          status?: string
          student_id: string
          submission_type: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          project_id?: string
          status?: string
          student_id?: string
          submission_type?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "student" | "instructor"
      certificate_status: "pending" | "approved" | "rejected"
      course_status: "draft" | "published" | "archived"
      enrollment_status: "active" | "completed" | "dropped" | "pending"
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
      app_role: ["admin", "student", "instructor"],
      certificate_status: ["pending", "approved", "rejected"],
      course_status: ["draft", "published", "archived"],
      enrollment_status: ["active", "completed", "dropped", "pending"],
    },
  },
} as const
