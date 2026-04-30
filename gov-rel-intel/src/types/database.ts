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
      ai_outputs: {
        Row: {
          created_at: string;
          id: string;
          input_snapshot: Json | null;
          model: string | null;
          output_json: Json | null;
          output_text: string | null;
          output_type: string;
          prompt_version: string | null;
          related_entity_id: string;
          related_entity_type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          input_snapshot?: Json | null;
          model?: string | null;
          output_json?: Json | null;
          output_text?: string | null;
          output_type: string;
          prompt_version?: string | null;
          related_entity_id: string;
          related_entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_outputs"]["Insert"]>;
      };
      client_matches: {
        Row: {
          client_id: string;
          created_at: string;
          human_notes: string | null;
          id: string;
          matched_keywords: string[];
          matched_themes: string[];
          opportunity_level: string | null;
          recommended_action: string | null;
          relevance_explanation: string | null;
          relevance_score: number | null;
          risk_level: string | null;
          should_include_in_client_report: boolean;
          source_item_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          human_notes?: string | null;
          id?: string;
          matched_keywords?: string[];
          matched_themes?: string[];
          opportunity_level?: string | null;
          recommended_action?: string | null;
          relevance_explanation?: string | null;
          relevance_score?: number | null;
          risk_level?: string | null;
          should_include_in_client_report?: boolean;
          source_item_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_matches"]["Insert"]>;
      };
      client_watchlists: {
        Row: {
          category: string | null;
          client_id: string;
          created_at: string;
          id: string;
          keyword: string;
          weight: number;
        };
        Insert: {
          category?: string | null;
          client_id: string;
          created_at?: string;
          id?: string;
          keyword: string;
          weight?: number;
        };
        Update: Partial<Database["public"]["Tables"]["client_watchlists"]["Insert"]>;
      };
      clients: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          industry: string | null;
          name: string;
          primary_contact: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          industry?: string | null;
          name: string;
          primary_contact?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      interactions: {
        Row: {
          attendees: string | null;
          client_id: string | null;
          created_at: string;
          follow_up_deadline: string | null;
          follow_up_required: boolean;
          id: string;
          interaction_date: string;
          interaction_type: string;
          notes: string | null;
          outcome: string | null;
          source_item_id: string | null;
          stakeholder_id: string | null;
          summary: string | null;
          updated_at: string;
        };
        Insert: {
          attendees?: string | null;
          client_id?: string | null;
          created_at?: string;
          follow_up_deadline?: string | null;
          follow_up_required?: boolean;
          id?: string;
          interaction_date: string;
          interaction_type: string;
          notes?: string | null;
          outcome?: string | null;
          source_item_id?: string | null;
          stakeholder_id?: string | null;
          summary?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interactions"]["Insert"]>;
      };
      report_items: {
        Row: {
          client_match_id: string | null;
          created_at: string;
          custom_summary: string | null;
          id: string;
          report_id: string;
          sort_order: number;
          source_item_id: string | null;
        };
        Insert: {
          client_match_id?: string | null;
          created_at?: string;
          custom_summary?: string | null;
          id?: string;
          report_id: string;
          sort_order?: number;
          source_item_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["report_items"]["Insert"]>;
      };
      reports: {
        Row: {
          body: string | null;
          client_id: string | null;
          created_at: string;
          end_date: string | null;
          id: string;
          report_type: string;
          start_date: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body?: string | null;
          client_id?: string | null;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          report_type: string;
          start_date?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
      source_items: {
        Row: {
          clean_text: string | null;
          created_at: string;
          id: string;
          ministry: string | null;
          published_date: string | null;
          raw_text: string | null;
          source_name: string | null;
          source_type: string;
          summary: string | null;
          title: string;
          topic_tags: string[];
          updated_at: string;
          url: string | null;
        };
        Insert: {
          clean_text?: string | null;
          created_at?: string;
          id?: string;
          ministry?: string | null;
          published_date?: string | null;
          raw_text?: string | null;
          source_name?: string | null;
          source_type: string;
          summary?: string | null;
          title: string;
          topic_tags?: string[];
          updated_at?: string;
          url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["source_items"]["Insert"]>;
      };
      stakeholder_relationships: {
        Row: {
          client_id: string;
          created_at: string;
          engagement_angle: string | null;
          id: string;
          known_interests: string | null;
          known_sensitivities: string | null;
          last_contact_date: string | null;
          next_follow_up_date: string | null;
          notes: string | null;
          position_on_issue: string;
          relationship_owner: string | null;
          relationship_strength: string;
          stakeholder_id: string;
          strategic_value: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          engagement_angle?: string | null;
          id?: string;
          known_interests?: string | null;
          known_sensitivities?: string | null;
          last_contact_date?: string | null;
          next_follow_up_date?: string | null;
          notes?: string | null;
          position_on_issue?: string;
          relationship_owner?: string | null;
          relationship_strength?: string;
          stakeholder_id: string;
          strategic_value?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stakeholder_relationships"]["Insert"]>;
      };
      stakeholders: {
        Row: {
          active: boolean;
          bio: string | null;
          created_at: string;
          email: string | null;
          first_name: string | null;
          full_name: string;
          id: string;
          last_name: string | null;
          linkedin_url: string | null;
          ministry: string | null;
          notes: string | null;
          organization: string | null;
          phone: string | null;
          riding: string | null;
          stakeholder_type: string | null;
          title: string | null;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          active?: boolean;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          full_name: string;
          id?: string;
          last_name?: string | null;
          linkedin_url?: string | null;
          ministry?: string | null;
          notes?: string | null;
          organization?: string | null;
          phone?: string | null;
          riding?: string | null;
          stakeholder_type?: string | null;
          title?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["stakeholders"]["Insert"]>;
      };
      tasks: {
        Row: {
          client_id: string | null;
          completed_at: string | null;
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          owner: string | null;
          priority: string;
          source_item_id: string | null;
          stakeholder_id: string | null;
          status: string;
          title: string;
        };
        Insert: {
          client_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          owner?: string | null;
          priority?: string;
          source_item_id?: string | null;
          stakeholder_id?: string | null;
          status?: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
