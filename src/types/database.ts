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
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
