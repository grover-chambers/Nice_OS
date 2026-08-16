export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          category: Database["public"]["Enums"]["alert_category"]
          created_at: string
          id: string
          message: string | null
          read: boolean
          rep_id: string | null
          retailer_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          rep_id?: string | null
          retailer_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          rep_id?: string | null
          retailer_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      app_versions: {
        Row: {
          apk_url: string
          created_at: string
          id: string
          is_latest: boolean
          notes: string | null
          version_code: number
          version_name: string
        }
        Insert: {
          apk_url: string
          created_at?: string
          id?: string
          is_latest?: boolean
          notes?: string | null
          version_code: number
          version_name: string
        }
        Update: {
          apk_url?: string
          created_at?: string
          id?: string
          is_latest?: boolean
          notes?: string | null
          version_code?: number
          version_name?: string
        }
        Relationships: []
      }
      auth_otp_challenges: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          profile_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          profile_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_otp_challenges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      back_checks: {
        Row: {
          business_matches: boolean
          created_at: string
          discrepancy: string | null
          enumerator_id: string | null
          gps_lat: number
          gps_lng: number
          id: string
          open_for_business: boolean
          outlet_id: string | null
          revisited_at: string
          status: string
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          business_matches?: boolean
          created_at?: string
          discrepancy?: string | null
          enumerator_id?: string | null
          gps_lat: number
          gps_lng: number
          id?: string
          open_for_business?: boolean
          outlet_id?: string | null
          revisited_at?: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          business_matches?: boolean
          created_at?: string
          discrepancy?: string | null
          enumerator_id?: string | null
          gps_lat?: number
          gps_lng?: number
          id?: string
          open_for_business?: boolean
          outlet_id?: string | null
          revisited_at?: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "back_checks_enumerator_id_fkey"
            columns: ["enumerator_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "back_checks_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "back_checks_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      category_observations: {
        Row: {
          brands_present: Json
          category: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          fastest_moving_brand: string | null
          id: string
          other_brands: string | null
          outlet_id: string | null
          pack_sizes_present: Json
          price_observed: number | null
          rep_id: string | null
          shelf_facings: number
          stock_units_on_hand: number | null
          stocked_now: boolean
          stockout_last_7_days: boolean
          updated_at: string
          visit_id: string | null
          why_fastest: string | null
        }
        Insert: {
          brands_present?: Json
          category: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          fastest_moving_brand?: string | null
          id?: string
          other_brands?: string | null
          outlet_id?: string | null
          pack_sizes_present?: Json
          price_observed?: number | null
          rep_id?: string | null
          shelf_facings?: number
          stock_units_on_hand?: number | null
          stocked_now?: boolean
          stockout_last_7_days?: boolean
          updated_at?: string
          visit_id?: string | null
          why_fastest?: string | null
        }
        Update: {
          brands_present?: Json
          category?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          fastest_moving_brand?: string | null
          id?: string
          other_brands?: string | null
          outlet_id?: string | null
          pack_sizes_present?: Json
          price_observed?: number | null
          rep_id?: string | null
          shelf_facings?: number
          stock_units_on_hand?: number | null
          stocked_now?: boolean
          stockout_last_7_days?: boolean
          updated_at?: string
          visit_id?: string | null
          why_fastest?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_observations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_observations_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_observations_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_observations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_brands: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          segment: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          segment?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          segment?: string
        }
        Relationships: []
      }
      competitor_observations: {
        Row: {
          activity: Database["public"]["Enums"]["competitor_activity"]
          at: string
          brand: string
          created_at: string
          deleted_at: string | null
          id: string
          note: string | null
          price: number | null
          product_name: string | null
          promotion_active: boolean
          rep_id: string | null
          retailer_id: string
          shelf_presence: string | null
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          activity?: Database["public"]["Enums"]["competitor_activity"]
          at?: string
          brand: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note?: string | null
          price?: number | null
          product_name?: string | null
          promotion_active?: boolean
          rep_id?: string | null
          retailer_id: string
          shelf_presence?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          activity?: Database["public"]["Enums"]["competitor_activity"]
          at?: string
          brand?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note?: string | null
          price?: number | null
          product_name?: string | null
          promotion_active?: boolean
          rep_id?: string | null
          retailer_id?: string
          shelf_presence?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_observations_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_observations_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_observations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consented_at: string
          deleted_at: string | null
          enumerator_id: string | null
          gps_lat: number
          gps_lng: number
          id: string
          respondent_ref: string | null
          reuse_agreed: boolean
          script_version: string
          updated_at: string
          voluntary_and_withdrawable: boolean
          withdrawal_phone: string | null
        }
        Insert: {
          consented_at?: string
          deleted_at?: string | null
          enumerator_id?: string | null
          gps_lat: number
          gps_lng: number
          id?: string
          respondent_ref?: string | null
          reuse_agreed?: boolean
          script_version?: string
          updated_at?: string
          voluntary_and_withdrawable?: boolean
          withdrawal_phone?: string | null
        }
        Update: {
          consented_at?: string
          deleted_at?: string | null
          enumerator_id?: string | null
          gps_lat?: number
          gps_lng?: number
          id?: string
          respondent_ref?: string | null
          reuse_agreed?: boolean
          script_version?: string
          updated_at?: string
          voluntary_and_withdrawable?: boolean
          withdrawal_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_enumerator_id_fkey"
            columns: ["enumerator_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_intercepts: {
        Row: {
          aided_brands_aware: Json
          captured_at: string
          categories_bought_weekly: Json
          channel_context: string
          consent_id: string | null
          deleted_at: string | null
          enumerator_id: string | null
          flour_brand_used_now: string | null
          household_size_band: string | null
          id: string
          max_acceptable_price: number | null
          milk_brand_used_now: string | null
          pack_size_preferred: string | null
          price_paid_last: number | null
          purchase_frequency: string | null
          shopper_role: string | null
          switch_trigger: string | null
          unaided_brands_aware: Json
          updated_at: string
          ward: string
          where_they_buy: string | null
          would_try_new_brand: string | null
        }
        Insert: {
          aided_brands_aware?: Json
          captured_at?: string
          categories_bought_weekly?: Json
          channel_context?: string
          consent_id?: string | null
          deleted_at?: string | null
          enumerator_id?: string | null
          flour_brand_used_now?: string | null
          household_size_band?: string | null
          id?: string
          max_acceptable_price?: number | null
          milk_brand_used_now?: string | null
          pack_size_preferred?: string | null
          price_paid_last?: number | null
          purchase_frequency?: string | null
          shopper_role?: string | null
          switch_trigger?: string | null
          unaided_brands_aware?: Json
          updated_at?: string
          ward?: string
          where_they_buy?: string | null
          would_try_new_brand?: string | null
        }
        Update: {
          aided_brands_aware?: Json
          captured_at?: string
          categories_bought_weekly?: Json
          channel_context?: string
          consent_id?: string | null
          deleted_at?: string | null
          enumerator_id?: string | null
          flour_brand_used_now?: string | null
          household_size_band?: string | null
          id?: string
          max_acceptable_price?: number | null
          milk_brand_used_now?: string | null
          pack_size_preferred?: string | null
          price_paid_last?: number | null
          purchase_frequency?: string | null
          shopper_role?: string | null
          switch_trigger?: string | null
          unaided_brands_aware?: Json
          updated_at?: string
          ward?: string
          where_they_buy?: string | null
          would_try_new_brand?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_intercepts_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "consent_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_intercepts_enumerator_id_fkey"
            columns: ["enumerator_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_logs: {
        Row: {
          at: string
          event_type: string
          id: string
          note: string | null
          rep_id: string | null
          territory_id: string | null
          ward: string | null
          zone: string | null
        }
        Insert: {
          at?: string
          event_type: string
          id?: string
          note?: string | null
          rep_id?: string | null
          territory_id?: string | null
          ward?: string | null
          zone?: string | null
        }
        Update: {
          at?: string
          event_type?: string
          id?: string
          note?: string | null
          rep_id?: string | null
          territory_id?: string | null
          ward?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_logs_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_logs_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_submissions: {
        Row: {
          approved_at: string | null
          created_at: string
          enumerator_id: string | null
          id: string
          intercept_count: number
          outlet_count: number
          quality_flags: Json
          status: string
          submission_date: string
          supervisor_note: string | null
          updated_at: string
          visit_count: number
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          enumerator_id?: string | null
          id?: string
          intercept_count?: number
          outlet_count?: number
          quality_flags?: Json
          status?: string
          submission_date: string
          supervisor_note?: string | null
          updated_at?: string
          visit_count?: number
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          enumerator_id?: string | null
          id?: string
          intercept_count?: number
          outlet_count?: number
          quality_flags?: Json
          status?: string
          submission_date?: string
          supervisor_note?: string | null
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_submissions_enumerator_id_fkey"
            columns: ["enumerator_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
        ]
      }
      health_scores: {
        Row: {
          churn_risk: string
          computed_at: string
          deleted_at: string | null
          factors: Json
          id: string
          retailer_id: string
          score: number
          updated_at: string
        }
        Insert: {
          churn_risk?: string
          computed_at?: string
          deleted_at?: string | null
          factors?: Json
          id?: string
          retailer_id: string
          score: number
          updated_at?: string
        }
        Update: {
          churn_risk?: string
          computed_at?: string
          deleted_at?: string | null
          factors?: Json
          id?: string
          retailer_id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_scores_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string
          id: string
          potential_monthly_kes: number
          priority: string
          reason: string | null
          retailer_id: string
          status: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          potential_monthly_kes?: number
          priority?: string
          reason?: string | null
          retailer_id: string
          status?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          potential_monthly_kes?: number
          priority?: string
          reason?: string | null
          retailer_id?: string
          status?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_intent_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string | null
          order_intent_id: string
          price: number
          quantity: number
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          order_intent_id: string
          price?: number
          quantity: number
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          order_intent_id?: string
          price?: number
          quantity?: number
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_intent_items_order_intent_id_fkey"
            columns: ["order_intent_id"]
            isOneToOne: false
            referencedRelation: "order_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      order_intents: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          forward_status: Database["public"]["Enums"]["order_forward_status"]
          forwarded_at: string | null
          id: string
          rep_id: string | null
          retailer_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          forward_status?: Database["public"]["Enums"]["order_forward_status"]
          forwarded_at?: string | null
          id?: string
          rep_id?: string | null
          retailer_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          forward_status?: Database["public"]["Enums"]["order_forward_status"]
          forwarded_at?: string | null
          id?: string
          rep_id?: string | null
          retailer_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_intents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_intents_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_intents_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      outlet_client_links: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          note: string | null
          outlet_id: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          note?: string | null
          outlet_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          note?: string | null
          outlet_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlet_client_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlet_client_links_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      outlet_contacts: {
        Row: {
          consent_id: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_decision_maker: boolean
          outlet_id: string
          phone_alt: string | null
          phone_primary: string | null
          preferred_language: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          consent_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_decision_maker?: boolean
          outlet_id: string
          phone_alt?: string | null
          phone_primary?: string | null
          preferred_language?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          consent_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_decision_maker?: boolean
          outlet_id?: string
          phone_alt?: string | null
          phone_primary?: string | null
          preferred_language?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlet_contacts_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "consent_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlet_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlet_contacts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          accepts_mpesa: boolean
          beat: string
          building_or_stall_no: string | null
          business_name: string
          business_permit_no: string | null
          channel: string
          constituency: string
          county: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          delivery_or_collect: string | null
          distance_to_supplier: string | null
          est_daily_customers: string | null
          extension: Json | null
          gps_accuracy_m: number | null
          gps_lat: number
          gps_lng: number
          has_freezer: boolean
          has_fridge: boolean
          id: string
          landmark: string | null
          opening_hours: string | null
          operating_days: Json
          outlet_type: string
          primary_supply_source: string | null
          purchase_frequency: string | null
          sells_on_credit: boolean
          shelf_facing_metres: number | null
          size_tier: string | null
          staff_count: number | null
          storage_capacity: string | null
          storefront_photo_path: string | null
          street: string | null
          supplier_name: string | null
          till_paybill_no: string | null
          updated_at: string
          ward: string
          year_established: number | null
        }
        Insert: {
          accepts_mpesa?: boolean
          beat?: string
          building_or_stall_no?: string | null
          business_name: string
          business_permit_no?: string | null
          channel: string
          constituency?: string
          county?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_or_collect?: string | null
          distance_to_supplier?: string | null
          est_daily_customers?: string | null
          extension?: Json | null
          gps_accuracy_m?: number | null
          gps_lat: number
          gps_lng: number
          has_freezer?: boolean
          has_fridge?: boolean
          id?: string
          landmark?: string | null
          opening_hours?: string | null
          operating_days?: Json
          outlet_type: string
          primary_supply_source?: string | null
          purchase_frequency?: string | null
          sells_on_credit?: boolean
          shelf_facing_metres?: number | null
          size_tier?: string | null
          staff_count?: number | null
          storage_capacity?: string | null
          storefront_photo_path?: string | null
          street?: string | null
          supplier_name?: string | null
          till_paybill_no?: string | null
          updated_at?: string
          ward?: string
          year_established?: number | null
        }
        Update: {
          accepts_mpesa?: boolean
          beat?: string
          building_or_stall_no?: string | null
          business_name?: string
          business_permit_no?: string | null
          channel?: string
          constituency?: string
          county?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_or_collect?: string | null
          distance_to_supplier?: string | null
          est_daily_customers?: string | null
          extension?: Json | null
          gps_accuracy_m?: number | null
          gps_lat?: number
          gps_lng?: number
          has_freezer?: boolean
          has_fridge?: boolean
          id?: string
          landmark?: string | null
          opening_hours?: string | null
          operating_days?: Json
          outlet_type?: string
          primary_supply_source?: string | null
          purchase_frequency?: string | null
          sells_on_credit?: boolean
          shelf_facing_metres?: number | null
          size_tier?: string | null
          staff_count?: number | null
          storage_capacity?: string | null
          storefront_photo_path?: string | null
          street?: string | null
          supplier_name?: string | null
          till_paybill_no?: string | null
          updated_at?: string
          ward?: string
          year_established?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outlets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          territory_id: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          territory_id?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          territory_id?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      reps: {
        Row: {
          actual_visits_month: number
          color: string
          created_at: string
          device: string | null
          email: string | null
          id: string
          last_sync_at: string | null
          manager_id: string | null
          name: string
          on_route: boolean
          phone: string | null
          status: Database["public"]["Enums"]["rep_status"]
          target_visits_month: number
          updated_at: string
          wards: string[]
          zone: string
        }
        Insert: {
          actual_visits_month?: number
          color?: string
          created_at?: string
          device?: string | null
          email?: string | null
          id: string
          last_sync_at?: string | null
          manager_id?: string | null
          name: string
          on_route?: boolean
          phone?: string | null
          status?: Database["public"]["Enums"]["rep_status"]
          target_visits_month?: number
          updated_at?: string
          wards?: string[]
          zone?: string
        }
        Update: {
          actual_visits_month?: number
          color?: string
          created_at?: string
          device?: string | null
          email?: string | null
          id?: string
          last_sync_at?: string | null
          manager_id?: string | null
          name?: string
          on_route?: boolean
          phone?: string | null
          status?: Database["public"]["Enums"]["rep_status"]
          target_visits_month?: number
          updated_at?: string
          wards?: string[]
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "reps_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reps_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retailers: {
        Row: {
          address: string | null
          avg_order_value: number
          business_size: string | null
          business_type: Database["public"]["Enums"]["outlet_type"]
          churn_risk: Database["public"]["Enums"]["churn_risk"]
          competitor_presence: Json
          constituency: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          health_score: number
          id: string
          last_visit_at: string | null
          lat: number | null
          lng: number | null
          location: unknown
          name: string
          order_trend_pct: number
          orders30d: number
          owner_name: string | null
          phone: string | null
          rep_id: string | null
          shelf_note: string | null
          status: Database["public"]["Enums"]["retailer_status"]
          target_visit_frequency_days: number
          territory_id: string | null
          tier: Database["public"]["Enums"]["retailer_tier"]
          updated_at: string
          visits30d: number
          ward: string | null
          zone: string | null
        }
        Insert: {
          address?: string | null
          avg_order_value?: number
          business_size?: string | null
          business_type?: Database["public"]["Enums"]["outlet_type"]
          churn_risk?: Database["public"]["Enums"]["churn_risk"]
          competitor_presence?: Json
          constituency?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          health_score?: number
          id?: string
          last_visit_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: unknown
          name: string
          order_trend_pct?: number
          orders30d?: number
          owner_name?: string | null
          phone?: string | null
          rep_id?: string | null
          shelf_note?: string | null
          status?: Database["public"]["Enums"]["retailer_status"]
          target_visit_frequency_days?: number
          territory_id?: string | null
          tier?: Database["public"]["Enums"]["retailer_tier"]
          updated_at?: string
          visits30d?: number
          ward?: string | null
          zone?: string | null
        }
        Update: {
          address?: string | null
          avg_order_value?: number
          business_size?: string | null
          business_type?: Database["public"]["Enums"]["outlet_type"]
          churn_risk?: Database["public"]["Enums"]["churn_risk"]
          competitor_presence?: Json
          constituency?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          health_score?: number
          id?: string
          last_visit_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: unknown
          name?: string
          order_trend_pct?: number
          orders30d?: number
          owner_name?: string | null
          phone?: string | null
          rep_id?: string | null
          shelf_note?: string | null
          status?: Database["public"]["Enums"]["retailer_status"]
          target_visit_frequency_days?: number
          territory_id?: string | null
          tier?: Database["public"]["Enums"]["retailer_tier"]
          updated_at?: string
          visits30d?: number
          ward?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailers_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailers_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          km_from_prev: number
          minutes_from_prev: number
          planned_end: string | null
          planned_start: string | null
          position: number
          priority: Database["public"]["Enums"]["route_priority"]
          retailer_id: string
          route_id: string
          updated_at: string
          visit_type: Database["public"]["Enums"]["visit_type"]
          visited: boolean
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          km_from_prev?: number
          minutes_from_prev?: number
          planned_end?: string | null
          planned_start?: string | null
          position: number
          priority?: Database["public"]["Enums"]["route_priority"]
          retailer_id: string
          route_id: string
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          visited?: boolean
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          km_from_prev?: number
          minutes_from_prev?: number
          planned_end?: string | null
          planned_start?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["route_priority"]
          retailer_id?: string
          route_id?: string
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
          visited?: boolean
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          deleted_at: string | null
          end_time: string | null
          id: string
          rep_id: string
          revised_by: string | null
          revised_reason: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["route_status"]
          total_km: number
          total_travel_min: number
          updated_at: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          deleted_at?: string | null
          end_time?: string | null
          id?: string
          rep_id: string
          revised_by?: string | null
          revised_reason?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          total_km?: number
          total_travel_min?: number
          updated_at?: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          end_time?: string | null
          id?: string
          rep_id?: string
          revised_by?: string | null
          revised_reason?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          total_km?: number
          total_travel_min?: number
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_revised_by_fkey"
            columns: ["revised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shelf_photos: {
        Row: {
          accuracy: number | null
          captured_at: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          file_path: string
          id: string
          lat: number | null
          lng: number | null
          photo_type: string | null
          rep_id: string | null
          retailer_id: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          accuracy?: number | null
          captured_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          file_path: string
          id?: string
          lat?: number | null
          lng?: number | null
          photo_type?: string | null
          rep_id?: string | null
          retailer_id: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          accuracy?: number | null
          captured_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          file_path?: string
          id?: string
          lat?: number | null
          lng?: number | null
          photo_type?: string | null
          rep_id?: string | null
          retailer_id?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shelf_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shelf_photos_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shelf_photos_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shelf_photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_catalog: {
        Row: {
          active: boolean
          category: string
          created_at: string
          default_price_kes: number | null
          id: string
          name: string
          pack_size: string | null
          sku: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          default_price_kes?: number | null
          id?: string
          name: string
          pack_size?: string | null
          sku: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          default_price_kes?: number | null
          id?: string
          name?: string
          pack_size?: string | null
          sku?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stock_observations: {
        Row: {
          captured_at: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string | null
          price: number | null
          qty: number
          rep_id: string | null
          retailer_id: string
          shelf: Database["public"]["Enums"]["shelf_level"] | null
          sku: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          captured_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string | null
          price?: number | null
          qty?: number
          rep_id?: string | null
          retailer_id: string
          shelf?: Database["public"]["Enums"]["shelf_level"] | null
          sku: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          captured_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string | null
          price?: number | null
          qty?: number
          rep_id?: string | null
          retailer_id?: string
          shelf?: Database["public"]["Enums"]["shelf_level"] | null
          sku?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_observations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_observations_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_observations_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_observations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          created_at: string
          geo_json: Json | null
          id: string
          level: Database["public"]["Enums"]["territory_level"]
          name: string
          parent_id: string | null
          rep_id: string | null
          target_visits_per_week: number
          updated_at: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          geo_json?: Json | null
          id?: string
          level?: Database["public"]["Enums"]["territory_level"]
          name: string
          parent_id?: string | null
          rep_id?: string | null
          target_visits_per_week?: number
          updated_at?: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          geo_json?: Json | null
          id?: string
          level?: Database["public"]["Enums"]["territory_level"]
          name?: string
          parent_id?: string | null
          rep_id?: string | null
          target_visits_per_week?: number
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "territories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territories_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string | null
          price: number | null
          qty: number
          shelf: Database["public"]["Enums"]["shelf_level"] | null
          sku: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          price?: number | null
          qty?: number
          shelf?: Database["public"]["Enums"]["shelf_level"] | null
          sku: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          price?: number | null
          qty?: number
          shelf?: Database["public"]["Enums"]["shelf_level"] | null
          sku?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_items_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          check_in_at: string
          check_out_at: string | null
          created_at: string
          deleted_at: string | null
          duration_min: number | null
          gps_accuracy: number | null
          gps_lat: number
          gps_lng: number
          gps_verified: boolean
          id: string
          notes: string | null
          order_placed: boolean
          order_value: number | null
          outcome: Database["public"]["Enums"]["visit_status"]
          photo_count: number
          radius_m: number
          rep_id: string | null
          retailer_id: string
          route_id: string | null
          status: Database["public"]["Enums"]["visit_status"]
          stock_captured: boolean
          updated_at: string
          user_id: string | null
          verification_method: string | null
        }
        Insert: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_min?: number | null
          gps_accuracy?: number | null
          gps_lat: number
          gps_lng: number
          gps_verified?: boolean
          id?: string
          notes?: string | null
          order_placed?: boolean
          order_value?: number | null
          outcome?: Database["public"]["Enums"]["visit_status"]
          photo_count?: number
          radius_m?: number
          rep_id?: string | null
          retailer_id: string
          route_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          stock_captured?: boolean
          updated_at?: string
          user_id?: string | null
          verification_method?: string | null
        }
        Update: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_min?: number | null
          gps_accuracy?: number | null
          gps_lat?: number
          gps_lng?: number
          gps_verified?: boolean
          id?: string
          notes?: string | null
          order_placed?: boolean
          order_value?: number | null
          outcome?: Database["public"]["Enums"]["visit_status"]
          photo_count?: number
          radius_m?: number
          rep_id?: string | null
          retailer_id?: string
          route_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          stock_captured?: boolean
          updated_at?: string
          user_id?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      app_scope: {
        Args: never
        Returns: {
          rep_id: string
          role: Database["public"]["Enums"]["user_role"]
          uid: string
          zones: string[]
        }[]
      }
      can_see_alert: {
        Args: { a: Database["public"]["Tables"]["alerts"]["Row"] }
        Returns: boolean
      }
      can_see_competitor_observation: {
        Args: {
          c: Database["public"]["Tables"]["competitor_observations"]["Row"]
        }
        Returns: boolean
      }
      can_see_order_intent: {
        Args: { o: Database["public"]["Tables"]["order_intents"]["Row"] }
        Returns: boolean
      }
      can_see_rep: {
        Args: { r: Database["public"]["Tables"]["reps"]["Row"] }
        Returns: boolean
      }
      can_see_retailer: {
        Args: { r: Database["public"]["Tables"]["retailers"]["Row"] }
        Returns: boolean
      }
      can_see_route: {
        Args: { r: Database["public"]["Tables"]["routes"]["Row"] }
        Returns: boolean
      }
      can_see_visit: {
        Args: { v: Database["public"]["Tables"]["visits"]["Row"] }
        Returns: boolean
      }
      current_profile_id: { Args: never; Returns: string }
      current_scope: {
        Args: never
        Returns: {
          rep_id: string
          role: Database["public"]["Enums"]["user_role"]
          uid: string
          zones: string[]
        }[]
      }
      current_storage_owner: { Args: never; Returns: string }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      is_admin: { Args: never; Returns: boolean }
      is_ceo: { Args: never; Returns: boolean }
      is_ceo_role: { Args: never; Returns: boolean }
      is_sales_rep: { Args: never; Returns: boolean }
      is_storage_manager: { Args: never; Returns: boolean }
      is_territory_manager: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      manages_rep: { Args: { target_rep_id: string }; Returns: boolean }
      owns_outlet: { Args: { p_id: string }; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      sync_apply: { Args: { p_entity: string; p_rows: Json }; Returns: Json }
      sync_entity_table: { Args: { p_entity: string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      verify_visit_photos: { Args: { p_visit_id: string }; Returns: Json }
      zone_in_scope: { Args: { target: string }; Returns: boolean }
    }
    Enums: {
      alert_category:
        | "churn"
        | "competitive"
        | "stock"
        | "expiry"
        | "visit"
        | "route"
        | "system"
      alert_severity: "critical" | "warning" | "info"
      churn_risk: "low" | "medium" | "high"
      competitor_activity:
        | "price-drop"
        | "promo"
        | "new-listing"
        | "stockout"
        | "shelf-share"
      opportunity_type:
        | "reactivation"
        | "expansion"
        | "category-growth"
        | "promo-placement"
        | "stock-correct"
      order_forward_status: "pending" | "sent" | "failed" | "acknowledged"
      outlet_type:
        | "duka"
        | "kiosk"
        | "supermarket"
        | "wholesaler"
        | "restaurant"
        | "chemist"
      rep_status: "active" | "on-leave" | "inactive"
      retailer_status: "active" | "prospect" | "at-risk" | "churned" | "blocked"
      retailer_tier: "A" | "B" | "C"
      route_priority: "high" | "medium" | "low"
      route_status:
        | "draft"
        | "submitted"
        | "approved"
        | "in-progress"
        | "completed"
        | "needs-revision"
      shelf_level: "full" | "low" | "out"
      territory_level:
        | "region"
        | "county"
        | "subcounty"
        | "ward"
        | "sales_territory"
      user_role: "admin" | "territory_manager" | "sales_rep" | "ceo"
      visit_status: "completed" | "no-stock" | "closed" | "cancelled" | "missed"
      visit_type:
        | "retail"
        | "order-collection"
        | "stock-check"
        | "prospecting"
        | "complaint-resolution"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      alert_category: [
        "churn",
        "competitive",
        "stock",
        "expiry",
        "visit",
        "route",
        "system",
      ],
      alert_severity: ["critical", "warning", "info"],
      churn_risk: ["low", "medium", "high"],
      competitor_activity: [
        "price-drop",
        "promo",
        "new-listing",
        "stockout",
        "shelf-share",
      ],
      opportunity_type: [
        "reactivation",
        "expansion",
        "category-growth",
        "promo-placement",
        "stock-correct",
      ],
      order_forward_status: ["pending", "sent", "failed", "acknowledged"],
      outlet_type: [
        "duka",
        "kiosk",
        "supermarket",
        "wholesaler",
        "restaurant",
        "chemist",
      ],
      rep_status: ["active", "on-leave", "inactive"],
      retailer_status: ["active", "prospect", "at-risk", "churned", "blocked"],
      retailer_tier: ["A", "B", "C"],
      route_priority: ["high", "medium", "low"],
      route_status: [
        "draft",
        "submitted",
        "approved",
        "in-progress",
        "completed",
        "needs-revision",
      ],
      shelf_level: ["full", "low", "out"],
      territory_level: [
        "region",
        "county",
        "subcounty",
        "ward",
        "sales_territory",
      ],
      user_role: ["admin", "territory_manager", "sales_rep", "ceo"],
      visit_status: ["completed", "no-stock", "closed", "cancelled", "missed"],
      visit_type: [
        "retail",
        "order-collection",
        "stock-check",
        "prospecting",
        "complaint-resolution",
      ],
    },
  },
}

