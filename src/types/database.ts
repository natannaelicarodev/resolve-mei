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
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
