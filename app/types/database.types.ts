export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      confirmation_emails: {
        Row: {
          created_at: string
          error_message: string | null
          id: number
          metadata: Json | null
          provider_message_id: string | null
          recipient_email: string
          rsvp_id: number
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: never
          metadata?: Json | null
          provider_message_id?: string | null
          recipient_email: string
          rsvp_id: number
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: never
          metadata?: Json | null
          provider_message_id?: string | null
          recipient_email?: string
          rsvp_id?: number
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'confirmation_emails_rsvp_id_fkey'
            columns: ['rsvp_id']
            isOneToOne: false
            referencedRelation: 'rsvps'
            referencedColumns: ['id']
          },
        ]
      }
      event_payment_settings: {
        Row: {
          admin_fee_fixed_cents: number
          admin_fee_mode: string
          admin_fee_percent: number
          created_at: string
          enabled: boolean
          event_id: number
          id: string
          refund_default_cents: number | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          admin_fee_fixed_cents?: number
          admin_fee_mode?: string
          admin_fee_percent?: number
          created_at?: string
          enabled?: boolean
          event_id: number
          id?: string
          refund_default_cents?: number | null
          updated_at?: string
        }
        Update: {
          admin_fee_fixed_cents?: number
          admin_fee_mode?: string
          admin_fee_percent?: number
          created_at?: string
          enabled?: boolean
          event_id?: number
          id?: string
          refund_default_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_payment_settings_event_id_fkey'
            columns: ['event_id']
            isOneToOne: true
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          id: number
          image_url: string | null
          location: string | null
          registration_limit: number | null
          slug: string
          starts_at: string | null
          title: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          registration_limit?: number | null
          slug: string
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          registration_limit?: number | null
          slug?: string
          starts_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          attendee_data: NonNullable<Json>
          created_at: string
          id: number
          order_id: string | null
          qty: number
          ticket_type_id: number
          total: number
          unit_price: number
        }
        ComputedFields: never
        Insert: {
          attendee_data: NonNullable<Json>
          created_at?: string
          id?: number
          order_id?: string | null
          qty?: number
          ticket_type_id: number
          total: number
          unit_price?: number
        }
        Update: {
          attendee_data?: NonNullable<Json>
          created_at?: string
          id?: number
          order_id?: string | null
          qty?: number
          ticket_type_id?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_ticket_type_id_fkey'
            columns: ['ticket_type_id']
            isOneToOne: false
            referencedRelation: 'ticket_types'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          admin_fee: number
          checkout_url: string
          created_at: string
          event_id: number
          expires_at: string
          id: string
          metadata: Json | null
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_status: Database['public']['Enums']['payment_status']
          refund_amount: number | null
          refunded_at: string | null
          status: Database['public']['Enums']['order_status']
          subtotal: string
          token: string
          total: number | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          admin_fee?: number
          checkout_url: string
          created_at?: string
          event_id: number
          expires_at: string
          id?: string
          metadata?: Json | null
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database['public']['Enums']['payment_status']
          refund_amount?: number | null
          refunded_at?: string | null
          status?: Database['public']['Enums']['order_status']
          subtotal: string
          token: string
          total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_fee?: number
          checkout_url?: string
          created_at?: string
          event_id?: number
          expires_at?: string
          id?: string
          metadata?: Json | null
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database['public']['Enums']['payment_status']
          refund_amount?: number | null
          refunded_at?: string | null
          status?: Database['public']['Enums']['order_status']
          subtotal?: string
          token?: string
          total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          order_id: string | null
          payload: NonNullable<Json>
          processed: boolean
          processed_at: string | null
          signature_valid: boolean | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          order_id?: string | null
          payload: NonNullable<Json>
          processed?: boolean
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          order_id?: string | null
          payload?: NonNullable<Json>
          processed?: boolean
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'payment_events_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          email: string | null
          event_id: number | null
          id: number
          is_attending: boolean
          name: string
          organization: string | null
          token: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          email?: string | null
          event_id?: number | null
          id?: number
          is_attending?: boolean
          name: string
          organization?: string | null
          token: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: number | null
          id?: number
          is_attending?: boolean
          name?: string
          organization?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rsvps_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      ticket_types: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          event_id: number
          id: number
          is_active: boolean
          kind: Database['public']['Enums']['ticket_type_kind']
          max_qty: number
          min_qty: number
          multiple_of: number
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id: number
          id?: number
          is_active?: boolean
          kind?: Database['public']['Enums']['ticket_type_kind']
          max_qty: number
          min_qty?: number
          multiple_of?: number
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id?: number
          id?: number
          is_active?: boolean
          kind?: Database['public']['Enums']['ticket_type_kind']
          max_qty?: number
          min_qty?: number
          multiple_of?: number
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_types_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      tickets: {
        Row: {
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          checkin_at: string | null
          checkin_by: string
          created_at: string
          fields: Json | null
          id: number
          order_id: string
          ticket_type_id: number
          token: string
        }
        ComputedFields: never
        Insert: {
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          checkin_at?: string | null
          checkin_by: string
          created_at?: string
          fields?: Json | null
          id?: number
          order_id: string
          ticket_type_id: number
          token?: string
        }
        Update: {
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          checkin_at?: string | null
          checkin_by?: string
          created_at?: string
          fields?: Json | null
          id?: number
          order_id?: string
          ticket_type_id?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_checkin_by_fkey'
            columns: ['checkin_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_ticket_type_id_fkey'
            columns: ['ticket_type_id']
            isOneToOne: false
            referencedRelation: 'ticket_types'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database['public']['Enums']['user_role']
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          role?: Database['public']['Enums']['user_role']
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database['public']['Enums']['user_role']
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      order_status:
        | 'draft'
        | 'pending'
        | 'paid'
        | 'cancelled'
        | 'expired'
        | 'refunded'
        | 'partial_refund'
        | 'failed'
      payment_status:
        | 'pending'
        | 'awaiting_payment'
        | 'settled'
        | 'paid'
        | 'cancelled'
        | 'expired'
        | 'failed'
        | 'refunded'
        | 'partial_refund'
      ticket_type_kind: 'single' | 'couple' | 'berempat'
      user_role: 'user' | 'admin' | 'super_admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: [
        'draft',
        'pending',
        'paid',
        'cancelled',
        'expired',
        'refunded',
        'partial_refund',
        'failed',
      ],
      payment_status: [
        'pending',
        'awaiting_payment',
        'settled',
        'paid',
        'cancelled',
        'expired',
        'failed',
        'refunded',
        'partial_refund',
      ],
      ticket_type_kind: ['single', 'couple', 'berempat'],
      user_role: ['user', 'admin', 'super_admin'],
    },
  },
} as const
