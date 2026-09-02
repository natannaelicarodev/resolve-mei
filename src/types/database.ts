export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          avatar_path?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          business_name: string;
          document_type: 'cpf' | 'cnpj';
          document_number: string | null;
          professional_phone: string;
          email: string;
          street: string;
          number: string;
          complement: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
          pix_key: string | null;
          logo_path: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          business_name: string;
          document_type: 'cpf' | 'cnpj';
          document_number?: string | null;
          professional_phone: string;
          email: string;
          street: string;
          number: string;
          complement?: string | null;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
          pix_key?: string | null;
          logo_path?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          business_id: string;
          type: 'person' | 'company';
          name: string;
          document: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          type: 'person' | 'company';
          name: string;
          document?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          price_cents: number;
          estimated_duration_minutes: number | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          price_cents: number;
          estimated_duration_minutes?: number | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          business_id: string;
          client_id: string;
          quote_number: number;
          status: 'draft' | 'sent' | 'approved' | 'rejected' | 'canceled';
          issued_on: string;
          valid_until: string;
          subtotal_cents: number;
          discount_cents: number;
          total_cents: number;
          notes: string | null;
          client_name_snapshot: string;
          client_document_snapshot: string | null;
          client_phone_snapshot: string | null;
          client_email_snapshot: string | null;
          created_at: string;
          updated_at: string;
          shared_version?: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          service_id: string | null;
          name_snapshot: string;
          description_snapshot: string | null;
          quantity: number;
          unit_price_cents: number;
          item_total_cents: number;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      service_orders: {
        Row: {
          id: string;
          quote_id: string;
          business_id: string;
          client_id: string;
          status:
            'pending' | 'in_progress' | 'paused' | 'completed' | 'canceled';
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          canceled_at: string | null;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      service_order_events: {
        Row: {
          id: number;
          service_order_id: string;
          business_id: string;
          event_type:
            | 'created'
            | 'started'
            | 'paused'
            | 'resumed'
            | 'completed'
            | 'reopened'
            | 'canceled'
            | 'note';
          from_status:
            | 'pending'
            | 'in_progress'
            | 'paused'
            | 'completed'
            | 'canceled'
            | null;
          to_status:
            | 'pending'
            | 'in_progress'
            | 'paused'
            | 'completed'
            | 'canceled'
            | null;
          note: string | null;
          actor_user_id: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      service_appointments: {
        Row: {
          id: string;
          service_order_id: string;
          business_id: string;
          client_id: string;
          scheduled_on: string;
          scheduled_time: string | null;
          status: 'scheduled' | 'completed' | 'rescheduled' | 'canceled';
          note: string | null;
          resolution_note: string | null;
          rescheduled_from_id: string | null;
          actor_user_id: string;
          resolved_by_user_id: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      service_order_evidence: {
        Row: {
          id: string;
          service_order_id: string;
          business_id: string;
          category: 'before' | 'during' | 'after';
          note: string | null;
          storage_path: string;
          status: 'pending' | 'active' | 'deleted';
          byte_size: number | null;
          locked_at: string | null;
          created_by: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      business_expenses: {
        Row: {
          id: string;
          business_id: string;
          quote_id: string | null;
          amount_cents: number;
          occurred_on: string;
          category:
            | 'material'
            | 'transporte'
            | 'ferramentas_equipamentos'
            | 'alimentacao'
            | 'taxas_impostos'
            | 'marketing'
            | 'outros';
          description: string | null;
          recurring: boolean;
          status: 'active' | 'deleted';
          created_by: string;
          updated_by: string;
          deleted_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      expense_receipts: {
        Row: {
          id: string;
          expense_id: string;
          business_id: string;
          storage_path: string;
          status: 'pending' | 'active' | 'deleted';
          byte_size: number | null;
          created_by: string;
          created_at: string;
          deleted_by: string | null;
          deleted_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      business_relationship_settings: {
        Row: { business_id:string; reconnect_after_days:number; updated_by:string; created_at:string; updated_at:string };
        Insert: never; Update: never; Relationships: [];
      };
      client_relationship_profiles: {
        Row: { client_id:string; business_id:string; recurring:boolean; priority:boolean; expected_return_days:number|null; updated_by:string; created_at:string; updated_at:string };
        Insert: never; Update: never; Relationships: [];
      };
      service_order_relationship_notes: {
        Row: { service_order_id:string; business_id:string; client_id:string; satisfaction:number|null; observation:string|null; created_by:string; updated_by:string; created_at:string; updated_at:string };
        Insert: never; Update: never; Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_home_dashboard: {
        Args: { p_business_id: string; p_period: string };
        Returns: Json;
      };
      save_quote: {
        Args: {
          p_business_id: string;
          p_client_id: string;
          p_valid_until: string;
          p_discount_cents: number;
          p_notes: string;
          p_status: string;
          p_items: Json;
          p_quote_id?: string | null;
        };
        Returns: Json;
      };
      transition_quote: {
        Args: { p_business_id: string; p_quote_id: string; p_status: string };
        Returns: Json;
      };
      duplicate_quote: {
        Args: { p_business_id: string; p_quote_id: string };
        Returns: Json;
      };
      issue_quote_public_link: {
        Args: { p_quote_id: string };
        Returns: Json;
      };
      revoke_quote_public_link: {
        Args: { p_quote_id: string };
        Returns: Json;
      };
      get_quote_public_link_state: {
        Args: { p_quote_id: string };
        Returns: Json;
      };
      resolve_public_quote: {
        Args: { p_token: string };
        Returns: Json;
      };
      respond_public_quote: {
        Args: {
          p_token: string;
          p_decision: string;
          p_responder_name: string;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      create_service_order: {
        Args: { p_business_id: string; p_quote_id: string };
        Returns: Json;
      };
      transition_service_order: {
        Args: {
          p_business_id: string;
          p_service_order_id: string;
          p_expected_status: string;
          p_status: string;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      add_service_order_note: {
        Args: {
          p_business_id: string;
          p_service_order_id: string;
          p_note: string;
        };
        Returns: Json;
      };
      get_quote_receivable: {
        Args: { p_business_id: string; p_quote_id: string };
        Returns: Json;
      };
      record_quote_financial_entry: {
        Args: {
          p_business_id: string;
          p_quote_id: string;
          p_entry_type: string;
          p_amount_cents: string;
          p_occurred_on: string;
          p_payment_method: string;
          p_note?: string | null;
          p_service_order_id?: string | null;
          p_original_entry_id?: string | null;
        };
        Returns: Json;
      };
      set_quote_receivable_due_on: {
        Args: {
          p_business_id: string;
          p_quote_id: string;
          p_due_on: string | null;
        };
        Returns: Json;
      };
      get_total_receivable: {
        Args: { p_business_id: string };
        Returns: string;
      };
      create_service_appointment: {
        Args: {
          p_business_id: string;
          p_service_order_id: string;
          p_scheduled_on: string;
          p_scheduled_time?: string | null;
          p_note?: string | null;
        };
        Returns: Json;
      };
      reschedule_service_appointment: {
        Args: {
          p_business_id: string;
          p_appointment_id: string;
          p_scheduled_on: string;
          p_scheduled_time?: string | null;
          p_note?: string | null;
        };
        Returns: Json;
      };
      resolve_service_appointment: {
        Args: {
          p_business_id: string;
          p_appointment_id: string;
          p_status: string;
          p_resolution_note?: string | null;
        };
        Returns: Json;
      };
      get_agenda_overview: {
        Args: { p_business_id: string };
        Returns: Json;
      };
      reserve_service_evidence: {
        Args: {
          p_business_id: string;
          p_service_order_id: string;
          p_category: string;
          p_note?: string | null;
        };
        Returns: Json;
      };
      finalize_service_evidence: {
        Args: { p_business_id: string; p_evidence_id: string };
        Returns: Json;
      };
      delete_service_evidence: {
        Args: {
          p_business_id: string;
          p_evidence_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      cancel_service_evidence_reservation: {
        Args: { p_business_id: string; p_evidence_id: string };
        Returns: undefined;
      };
      save_business_expense: {
        Args: {
          p_business_id: string;
          p_amount_cents: string;
          p_occurred_on: string;
          p_category: string;
          p_description?: string | null;
          p_quote_id?: string | null;
          p_recurring?: boolean;
          p_expense_id?: string | null;
        };
        Returns: Json;
      };
      delete_business_expense: {
        Args: { p_business_id: string; p_expense_id: string };
        Returns: Json;
      };
      get_business_expense: { Args:{p_business_id:string;p_expense_id:string}; Returns:Json };
      reserve_expense_receipt: {
        Args: { p_business_id: string; p_expense_id: string };
        Returns: Json;
      };
      finalize_expense_receipt: {
        Args: { p_business_id: string; p_receipt_id: string };
        Returns: Json;
      };
      delete_expense_receipt: {
        Args: { p_business_id: string; p_receipt_id: string };
        Returns: Json;
      };
      cancel_expense_receipt_reservation: {
        Args: { p_business_id: string; p_receipt_id: string };
        Returns: undefined;
      };
      get_expense_month: {
        Args: { p_business_id: string; p_month: string };
        Returns: Json;
      };
      get_quote_expense_margin: {
        Args: { p_business_id: string; p_quote_id: string };
        Returns: Json;
      };
      save_relationship_settings: { Args:{p_business_id:string;p_reconnect_after_days:number}; Returns:Json };
      save_client_relationship_profile: { Args:{p_business_id:string;p_client_id:string;p_recurring:boolean;p_priority:boolean}; Returns:Json };
      save_client_return_interval: { Args:{p_business_id:string;p_client_id:string;p_expected_return_days:number|null}; Returns:Json };
      save_service_order_relationship_note: { Args:{p_business_id:string;p_service_order_id:string;p_satisfaction:number|null;p_observation:string}; Returns:Json };
      get_reconnect_clients: { Args:{p_business_id:string}; Returns:Json };
      get_client_relationship_overview: { Args:{p_business_id:string;p_client_id:string}; Returns:Json };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
