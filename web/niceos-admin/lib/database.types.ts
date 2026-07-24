export type Json = string | number | boolean | null | { [key: string]: Json | Json[] } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "territory_manager" | "sales_rep" | "client_viewer";
          territory_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: "admin" | "territory_manager" | "sales_rep" | "client_viewer";
          territory_id?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: string;
          territory_id?: string | null;
        };
      };
      territories: {
        Row: {
          id: string;
          name: string;
          level: "region" | "county" | "subcounty" | "ward" | "sales_territory";
          parent_id: string | null;
          geo_json: Json | null;
          rep_id: string | null;
          target_visits_per_week: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          level: "region" | "county" | "subcounty" | "ward" | "sales_territory";
          parent_id?: string | null;
          geo_json?: Json | null;
          rep_id?: string | null;
          target_visits_per_week?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          parent_id?: string | null;
          geo_json?: Json | null;
          rep_id?: string | null;
          target_visits_per_week?: number;
        };
      };
      retailers: {
        Row: {
          id: string;
          name: string;
          owner_name: string | null;
          phone: string | null;
          location: { type: string; coordinates: number[] };
          business_type: string | null;
          business_size: string | null;
          status: "active" | "prospect" | "inactive" | "competitor_only";
          territory_id: string;
          target_visit_frequency_days: number;
          last_visit_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_name?: string | null;
          phone?: string | null;
          location: { type: string; coordinates: number[] };
          business_type?: string | null;
          business_size?: string | null;
          status?: "active" | "prospect" | "inactive" | "competitor_only";
          territory_id: string;
          target_visit_frequency_days?: number;
          last_visit_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          owner_name?: string | null;
          phone?: string | null;
          location?: { type: string; coordinates: number[] };
          business_type?: string | null;
          business_size?: string | null;
          status?: string;
          territory_id?: string;
          target_visit_frequency_days?: number;
          last_visit_at?: string | null;
        };
      };
      visits: {
        Row: {
          id: string;
          retailer_id: string;
          user_id: string;
          check_in_at: string;
          check_out_at: string | null;
          gps_lat: number;
          gps_lng: number;
          gps_accuracy: number | null;
          outcome: "completed" | "no_stock" | "not_interested" | "closed";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          retailer_id: string;
          user_id: string;
          check_in_at: string;
          check_out_at?: string | null;
          gps_lat: number;
          gps_lng: number;
          gps_accuracy?: number | null;
          outcome?: "completed" | "no_stock" | "not_interested" | "closed";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          check_out_at?: string | null;
          outcome?: string;
          notes?: string | null;
        };
      };
      stock_observations: {
        Row: {
          id: string;
          visit_id: string;
          sku: string;
          sku_name: string | null;
          stock_level: number;
          shelf_facing: number | null;
          expiry_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          sku: string;
          sku_name?: string | null;
          stock_level: number;
          shelf_facing?: number | null;
          expiry_date?: string | null;
          created_at?: string;
        };
      };
      competitor_observations: {
        Row: {
          id: string;
          visit_id: string;
          competitor_brand: string;
          product_name: string | null;
          price: number | null;
          shelf_presence: "full_facing" | "half_facing" | "shelf_edge" | "none";
          promotion_active: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          competitor_brand: string;
          product_name?: string | null;
          price?: number | null;
          shelf_presence?: string;
          promotion_active?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
      order_intents: {
        Row: {
          id: string;
          visit_id: string;
          retailer_id: string;
          sku: string;
          sku_name: string | null;
          quantity: number;
          forwarded: boolean;
          forwarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          retailer_id: string;
          sku: string;
          sku_name?: string | null;
          quantity: number;
          forwarded?: boolean;
          forwarded_at?: string | null;
          created_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          status: "draft" | "approved" | "in_progress" | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          status?: "draft" | "approved" | "in_progress" | "completed";
          created_at?: string;
        };
      };
      route_stops: {
        Row: {
          id: string;
          route_id: string;
          retailer_id: string;
          sequence: number;
          priority: "high" | "medium" | "low";
          visited: boolean;
          visited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          retailer_id: string;
          sequence: number;
          priority?: "high" | "medium" | "low";
          visited?: boolean;
          visited_at?: string | null;
          created_at?: string;
        };
      };
      shelf_photos: {
        Row: {
          id: string;
          visit_id: string;
          file_path: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          file_path: string;
          caption?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: "admin" | "territory_manager" | "sales_rep" | "client_viewer";
      retailer_status: "active" | "prospect" | "inactive" | "competitor_only";
      visit_outcome: "completed" | "no_stock" | "not_interested" | "closed";
      shelf_presence: "full_facing" | "half_facing" | "shelf_edge" | "none";
      route_priority: "high" | "medium" | "low";
      route_status: "draft" | "approved" | "in_progress" | "completed";
    };
  };
}