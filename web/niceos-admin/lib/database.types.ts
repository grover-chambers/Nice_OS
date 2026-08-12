// Hand-maintained types matching supabase/migrations/ 000001–000022 + 000001–000003.
// Regenerate later with: supabase gen types typescript --project-id zsprlozgdxzxeevvetmg

export type Json = string | number | boolean | null | { [key: string]: Json | Json[] } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_id: string | null;
          email: string | null;
          full_name: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          zone: string | null;
          territory_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          email?: string | null;
          full_name: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          zone?: string | null;
          territory_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          email?: string | null;
          full_name?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          zone?: string | null;
          territory_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      territories: {
        Row: {
          id: string;
          name: string;
          level: Database["public"]["Enums"]["territory_level"];
          parent_id: string | null;
          zone: string | null;
          geo_json: Json | null;
          rep_id: string | null;
          target_visits_per_week: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          level?: Database["public"]["Enums"]["territory_level"];
          parent_id?: string | null;
          zone?: string | null;
          geo_json?: Json | null;
          rep_id?: string | null;
          target_visits_per_week?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          level?: Database["public"]["Enums"]["territory_level"];
          parent_id?: string | null;
          zone?: string | null;
          geo_json?: Json | null;
          rep_id?: string | null;
          target_visits_per_week?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reps: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          color: string;
          zone: string;
          wards: string[];
          target_visits_month: number;
          actual_visits_month: number;
          on_route: boolean;
          last_sync_at: string | null;
          device: string | null;
          status: Database["public"]["Enums"]["rep_status"];
          manager_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          color?: string;
          zone?: string;
          wards?: string[];
          target_visits_month?: number;
          actual_visits_month?: number;
          on_route?: boolean;
          last_sync_at?: string | null;
          device?: string | null;
          status?: Database["public"]["Enums"]["rep_status"];
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          color?: string;
          zone?: string;
          wards?: string[];
          target_visits_month?: number;
          actual_visits_month?: number;
          on_route?: boolean;
          last_sync_at?: string | null;
          device?: string | null;
          status?: Database["public"]["Enums"]["rep_status"];
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      retailers: {
        Row: {
          id: string;
          name: string;
          owner_name: string | null;
          phone: string | null;
          business_type: Database["public"]["Enums"]["outlet_type"];
          business_size: string | null;
          tier: Database["public"]["Enums"]["retailer_tier"];
          status: Database["public"]["Enums"]["retailer_status"];
          ward: string | null;
          constituency: string | null;
          zone: string | null;
          address: string | null;
          location: Json | null;
          lat: number | null;
          lng: number | null;
          health_score: number;
          churn_risk: Database["public"]["Enums"]["churn_risk"];
          last_visit_at: string | null;
          visits30d: number;
          orders30d: number;
          avg_order_value: number;
          order_trend_pct: number;
          target_visit_frequency_days: number;
          rep_id: string | null;
          territory_id: string | null;
          created_by: string | null;
          competitor_presence: Json;
          shelf_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_name?: string | null;
          phone?: string | null;
          business_type?: Database["public"]["Enums"]["outlet_type"];
          business_size?: string | null;
          tier?: Database["public"]["Enums"]["retailer_tier"];
          status?: Database["public"]["Enums"]["retailer_status"];
          ward?: string | null;
          constituency?: string | null;
          zone?: string | null;
          address?: string | null;
          location?: Json | null;
          lat?: number | null;
          lng?: number | null;
          health_score?: number;
          churn_risk?: Database["public"]["Enums"]["churn_risk"];
          last_visit_at?: string | null;
          visits30d?: number;
          orders30d?: number;
          avg_order_value?: number;
          order_trend_pct?: number;
          target_visit_frequency_days?: number;
          rep_id?: string | null;
          territory_id?: string | null;
          created_by?: string | null;
          competitor_presence?: Json;
          shelf_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_name?: string | null;
          phone?: string | null;
          business_type?: Database["public"]["Enums"]["outlet_type"];
          business_size?: string | null;
          tier?: Database["public"]["Enums"]["retailer_tier"];
          status?: Database["public"]["Enums"]["retailer_status"];
          ward?: string | null;
          constituency?: string | null;
          zone?: string | null;
          address?: string | null;
          location?: Json | null;
          lat?: number | null;
          lng?: number | null;
          health_score?: number;
          churn_risk?: Database["public"]["Enums"]["churn_risk"];
          last_visit_at?: string | null;
          visits30d?: number;
          orders30d?: number;
          avg_order_value?: number;
          order_trend_pct?: number;
          target_visit_frequency_days?: number;
          rep_id?: string | null;
          territory_id?: string | null;
          created_by?: string | null;
          competitor_presence?: Json;
          shelf_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      routes: {
        Row: {
          id: string;
          date: string;
          rep_id: string;
          zone: string | null;
          status: Database["public"]["Enums"]["route_status"];
          total_km: number;
          total_travel_min: number;
          start_time: string | null;
          end_time: string | null;
          created_by: string | null;
          revised_by: string | null;
          revised_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          rep_id: string;
          zone?: string | null;
          status?: Database["public"]["Enums"]["route_status"];
          total_km?: number;
          total_travel_min?: number;
          start_time?: string | null;
          end_time?: string | null;
          created_by?: string | null;
          revised_by?: string | null;
          revised_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          rep_id?: string;
          zone?: string | null;
          status?: Database["public"]["Enums"]["route_status"];
          total_km?: number;
          total_travel_min?: number;
          start_time?: string | null;
          end_time?: string | null;
          created_by?: string | null;
          revised_by?: string | null;
          revised_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      route_stops: {
        Row: {
          id: string;
          route_id: string;
          retailer_id: string;
          position: number;
          planned_start: string | null;
          planned_end: string | null;
          visit_type: Database["public"]["Enums"]["visit_type"];
          km_from_prev: number;
          minutes_from_prev: number;
          visited: boolean;
          visited_at: string | null;
          priority: Database["public"]["Enums"]["route_priority"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          route_id: string;
          retailer_id: string;
          position: number;
          planned_start?: string | null;
          planned_end?: string | null;
          visit_type?: Database["public"]["Enums"]["visit_type"];
          km_from_prev?: number;
          minutes_from_prev?: number;
          visited?: boolean;
          visited_at?: string | null;
          priority?: Database["public"]["Enums"]["route_priority"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          route_id?: string;
          retailer_id?: string;
          position?: number;
          planned_start?: string | null;
          planned_end?: string | null;
          visit_type?: Database["public"]["Enums"]["visit_type"];
          km_from_prev?: number;
          minutes_from_prev?: number;
          visited?: boolean;
          visited_at?: string | null;
          priority?: Database["public"]["Enums"]["route_priority"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          retailer_id: string;
          rep_id: string | null;
          user_id: string | null;
          route_id: string | null;
          check_in_at: string;
          check_out_at: string | null;
          gps_lat: number;
          gps_lng: number;
          gps_accuracy: number | null;
          gps_verified: boolean;
          radius_m: number;
          status: Database["public"]["Enums"]["visit_status"];
          duration_min: number | null;
          stock_captured: boolean;
          photo_count: number;
          order_placed: boolean;
          order_value: number | null;
          outcome: Database["public"]["Enums"]["visit_status"];
          notes: string | null;
          verification_method: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          retailer_id: string;
          rep_id?: string | null;
          user_id?: string | null;
          route_id?: string | null;
          check_in_at?: string;
          check_out_at?: string | null;
          gps_lat: number;
          gps_lng: number;
          gps_accuracy?: number | null;
          gps_verified?: boolean;
          radius_m?: number;
          status?: Database["public"]["Enums"]["visit_status"];
          duration_min?: number | null;
          stock_captured?: boolean;
          photo_count?: number;
          order_placed?: boolean;
          order_value?: number | null;
          outcome?: Database["public"]["Enums"]["visit_status"];
          notes?: string | null;
          verification_method?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          retailer_id?: string;
          rep_id?: string | null;
          user_id?: string | null;
          route_id?: string | null;
          check_in_at?: string;
          check_out_at?: string | null;
          gps_lat?: number;
          gps_lng?: number;
          gps_accuracy?: number | null;
          gps_verified?: boolean;
          radius_m?: number;
          status?: Database["public"]["Enums"]["visit_status"];
          duration_min?: number | null;
          stock_captured?: boolean;
          photo_count?: number;
          order_placed?: boolean;
          order_value?: number | null;
          outcome?: Database["public"]["Enums"]["visit_status"];
          notes?: string | null;
          verification_method?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      visit_items: {
        Row: {
          id: string;
          visit_id: string;
          sku: string;
          name: string | null;
          qty: number;
          shelf: Database["public"]["Enums"]["shelf_level"] | null;
          price: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          visit_id: string;
          sku: string;
          name?: string | null;
          qty?: number;
          shelf?: Database["public"]["Enums"]["shelf_level"] | null;
          price?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          visit_id?: string;
          sku?: string;
          name?: string | null;
          qty?: number;
          shelf?: Database["public"]["Enums"]["shelf_level"] | null;
          price?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      order_intents: {
        Row: {
          id: string;
          retailer_id: string;
          rep_id: string | null;
          created_by: string | null;
          total: number;
          forward_status: Database["public"]["Enums"]["order_forward_status"];
          forwarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          retailer_id: string;
          rep_id?: string | null;
          created_by?: string | null;
          total?: number;
          forward_status?: Database["public"]["Enums"]["order_forward_status"];
          forwarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          retailer_id?: string;
          rep_id?: string | null;
          created_by?: string | null;
          total?: number;
          forward_status?: Database["public"]["Enums"]["order_forward_status"];
          forwarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_intent_items: {
        Row: {
          id: string;
          order_intent_id: string;
          sku: string;
          name: string | null;
          quantity: number;
          price: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          order_intent_id: string;
          sku: string;
          name?: string | null;
          quantity: number;
          price?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          order_intent_id?: string;
          sku?: string;
          name?: string | null;
          quantity?: number;
          price?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      competitor_observations: {
        Row: {
          id: string;
          retailer_id: string;
          rep_id: string | null;
          visit_id: string | null;
          brand: string;
          product_name: string | null;
          price: number | null;
          shelf_presence: string;
          activity: Database["public"]["Enums"]["competitor_activity"];
          promotion_active: boolean;
          note: string | null;
          at: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          retailer_id: string;
          rep_id?: string | null;
          visit_id?: string | null;
          brand: string;
          product_name?: string | null;
          price?: number | null;
          shelf_presence?: string;
          activity?: Database["public"]["Enums"]["competitor_activity"];
          promotion_active?: boolean;
          note?: string | null;
          at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          retailer_id?: string;
          rep_id?: string | null;
          visit_id?: string | null;
          brand?: string;
          product_name?: string | null;
          price?: number | null;
          shelf_presence?: string;
          activity?: Database["public"]["Enums"]["competitor_activity"];
          promotion_active?: boolean;
          note?: string | null;
          at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          severity: Database["public"]["Enums"]["alert_severity"];
          category: Database["public"]["Enums"]["alert_category"];
          title: string;
          message: string | null;
          retailer_id: string | null;
          rep_id: string | null;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          severity?: Database["public"]["Enums"]["alert_severity"];
          category?: Database["public"]["Enums"]["alert_category"];
          title: string;
          message?: string | null;
          retailer_id?: string | null;
          rep_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          severity?: Database["public"]["Enums"]["alert_severity"];
          category?: Database["public"]["Enums"]["alert_category"];
          title?: string;
          message?: string | null;
          retailer_id?: string | null;
          rep_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sku_catalog: {
        Row: {
          id: string;
          sku: string;
          name: string;
          category: string;
          default_price_kes: number | null;
          unit: string;
          pack_size: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          category?: string;
          default_price_kes?: number | null;
          unit?: string;
          pack_size?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          category?: string;
          default_price_kes?: number | null;
          unit?: string;
          pack_size?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      competitor_brands: {
        Row: {
          id: string;
          name: string;
          segment: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          segment?: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          segment?: string;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      health_scores: {
        Row: {
          id: string;
          retailer_id: string;
          score: number;
          churn_risk: string;
          factors: Json;
          computed_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          retailer_id: string;
          score: number;
          churn_risk?: string;
          factors?: Json;
          computed_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          retailer_id?: string;
          score?: number;
          churn_risk?: string;
          factors?: Json;
          computed_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      coverage_logs: {
        Row: {
          id: string;
          territory_id: string | null;
          ward: string | null;
          zone: string | null;
          rep_id: string | null;
          event_type: string;
          at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          territory_id?: string | null;
          ward?: string | null;
          zone?: string | null;
          rep_id?: string | null;
          event_type: string;
          at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          territory_id?: string | null;
          ward?: string | null;
          zone?: string | null;
          rep_id?: string | null;
          event_type?: string;
          at?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          retailer_id: string;
          type: Database["public"]["Enums"]["opportunity_type"];
          potential_monthly_kes: number;
          priority: string;
          status: string;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          retailer_id: string;
          type?: Database["public"]["Enums"]["opportunity_type"];
          potential_monthly_kes?: number;
          priority?: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          retailer_id?: string;
          type?: Database["public"]["Enums"]["opportunity_type"];
          potential_monthly_kes?: number;
          priority?: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_observations: {
        Row: {
          id: string;
          visit_id: string | null;
          retailer_id: string;
          rep_id: string | null;
          sku: string;
          name: string | null;
          qty: number;
          shelf: Database["public"]["Enums"]["shelf_level"] | null;
          price: number | null;
          captured_at: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          visit_id?: string | null;
          retailer_id: string;
          rep_id?: string | null;
          sku: string;
          name?: string | null;
          qty?: number;
          shelf?: Database["public"]["Enums"]["shelf_level"] | null;
          price?: number | null;
          captured_at?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          visit_id?: string | null;
          retailer_id?: string;
          rep_id?: string | null;
          sku?: string;
          name?: string | null;
          qty?: number;
          shelf?: Database["public"]["Enums"]["shelf_level"] | null;
          price?: number | null;
          captured_at?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      shelf_photos: {
        Row: {
          id: string;
          visit_id: string | null;
          retailer_id: string;
          rep_id: string | null;
          file_path: string;
          photo_type: string | null;
          lat: number | null;
          lng: number | null;
          accuracy: number | null;
          captured_at: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          visit_id?: string | null;
          retailer_id: string;
          rep_id?: string | null;
          file_path: string;
          photo_type?: string | null;
          lat?: number | null;
          lng?: number | null;
          accuracy?: number | null;
          captured_at?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          visit_id?: string | null;
          retailer_id?: string;
          rep_id?: string | null;
          file_path?: string;
          photo_type?: string | null;
          lat?: number | null;
          lng?: number | null;
          accuracy?: number | null;
          captured_at?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      auth_otp_challenges: {
        Row: {
          id: string;
          profile_id: string;
          code_hash: string;
          expires_at: string;
          attempts: number;
          consumed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          code_hash: string;
          expires_at: string;
          attempts?: number;
          consumed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          code_hash?: string;
          expires_at?: string;
          attempts?: number;
          consumed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      app_scope: {
        Args: Record<PropertyKey, never>;
        Returns: {
          uid: string;
          role: Database["public"]["Enums"]["user_role"];
          zones: string[] | null;
          rep_id: string | null;
        }[];
      };
      current_scope: {
        Args: Record<PropertyKey, never>;
        Returns: {
          uid: string;
          role: Database["public"]["Enums"]["user_role"];
          zones: string[] | null;
          rep_id: string | null;
        }[];
      };
      current_profile_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_territory_manager: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_sales_rep: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_ceo: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      zone_in_scope: {
        Args: { target: string };
        Returns: boolean;
      };
      manages_rep: {
        Args: { target_rep_id: string };
        Returns: boolean;
      };
      sync_entity_table: {
        Args: { p_entity: string };
        Returns: string;
      };
      sync_apply: {
        Args: { p_entity: string; p_rows: Json };
        Returns: Json;
      };
      verify_visit_photos: {
        Args: { p_visit_id: string };
        Returns: Json;
      };
    };
    Enums: {
      user_role: "admin" | "territory_manager" | "sales_rep" | "ceo";
      retailer_status: "active" | "prospect" | "at-risk" | "churned" | "blocked";
      outlet_type: "duka" | "kiosk" | "supermarket" | "wholesaler" | "restaurant" | "chemist";
      retailer_tier: "A" | "B" | "C";
      churn_risk: "low" | "medium" | "high";
      rep_status: "active" | "on-leave" | "inactive";
      territory_level: "region" | "county" | "subcounty" | "ward" | "sales_territory";
      route_status: "draft" | "submitted" | "approved" | "in-progress" | "completed" | "needs-revision";
      route_priority: "high" | "medium" | "low";
      visit_type: "retail" | "order-collection" | "stock-check" | "prospecting" | "complaint-resolution";
      visit_status: "completed" | "no-stock" | "closed" | "cancelled" | "missed";
      shelf_level: "full" | "low" | "out";
      order_forward_status: "pending" | "sent" | "failed" | "acknowledged";
      competitor_activity: "price-drop" | "promo" | "new-listing" | "stockout" | "shelf-share";
      alert_category: "churn" | "competitive" | "stock" | "expiry" | "visit" | "route" | "system";
      alert_severity: "critical" | "warning" | "info";
      opportunity_type: "reactivation" | "expansion" | "category-growth" | "promo-placement" | "stock-correct";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
