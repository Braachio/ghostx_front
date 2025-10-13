export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Profiles = {
  id: string
  nickname: string
  has_uploaded_data: boolean | null
  agreed_terms: boolean | null  // ✅ 이용약관 동의
  agreed_privacy: boolean | null  // ✅ 개인정보처리방침 동의
}


export type Database = {
  public: {
    Tables: {
      Profiles: {
        Row: Profiles
        Insert: Partial<Profiles>
        Update: Partial<Profiles>
      }
      analysis_results: {
        Row: {
          avg_brake: number | null
          avg_lap_time: number | null
          avg_speed: number | null
          avg_throttle: number | null
          best_lap_time: number | null
          created_at: string | null
          file_url: string
          id: string
          num_laps: number | null
          sector1_avg: number | null
          sector2_avg: number | null
          sector3_avg: number | null
          user_id: string | null
        }
        Insert: {
          avg_brake?: number | null
          avg_lap_time?: number | null
          avg_speed?: number | null
          avg_throttle?: number | null
          best_lap_time?: number | null
          created_at?: string | null
          file_url: string
          id?: string
          num_laps?: number | null
          sector1_avg?: number | null
          sector2_avg?: number | null
          sector3_avg?: number | null
          user_id?: string | null
        }
        Update: {
          avg_brake?: number | null
          avg_lap_time?: number | null
          avg_speed?: number | null
          avg_throttle?: number | null
          best_lap_time?: number | null
          created_at?: string | null
          file_url?: string
          id?: string
          num_laps?: number | null
          sector1_avg?: number | null
          sector2_avg?: number | null
          sector3_avg?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_posters: {
        Row: {
          created_at: string | null
          id: string
          nickname: string
          password_hash: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nickname: string
          password_hash: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nickname?: string
          password_hash?: string
        }
        Relationships: []
      }
      corner_analysis: {
        Row: {
          brake_slope: number | null
          corner_index: number | null
          end_time: number | null
          id: string
          lap_id: string | null
          start_time: number | null
          style: string | null
          throttle_slope: number | null
          user_id: string | null
        }
        Insert: {
          brake_slope?: number | null
          corner_index?: number | null
          end_time?: number | null
          id: string
          lap_id?: string | null
          start_time?: number | null
          style?: string | null
          throttle_slope?: number | null
          user_id?: string | null
        }
        Update: {
          brake_slope?: number | null
          corner_index?: number | null
          end_time?: number | null
          id?: string
          lap_id?: string | null
          start_time?: number | null
          style?: string | null
          throttle_slope?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      corner_zones: {
        Row: {
          corner_number: number
          created_at: string | null
          end_distance: number | null
          end_time: number
          entry_speed: number | null
          exit_speed: number | null
          feedback: string | null
          id: string
          ideal_exit_speed: number | null
          label: string | null
          lap_id: string | null
          min_speed: number | null
          notes: string | null
          start_distance: number | null
          start_time: number
          style: string | null
          track_name: string
          user_id: string | null
        }
        Insert: {
          corner_number: number
          created_at?: string | null
          end_distance?: number | null
          end_time: number
          entry_speed?: number | null
          exit_speed?: number | null
          feedback?: string | null
          id?: string
          ideal_exit_speed?: number | null
          label?: string | null
          lap_id?: string | null
          min_speed?: number | null
          notes?: string | null
          start_distance?: number | null
          start_time: number
          style?: string | null
          track_name: string
          user_id?: string | null
        }
        Update: {
          corner_number?: number
          created_at?: string | null
          end_distance?: number | null
          end_time?: number
          entry_speed?: number | null
          exit_speed?: number | null
          feedback?: string | null
          id?: string
          ideal_exit_speed?: number | null
          label?: string | null
          lap_id?: string | null
          min_speed?: number | null
          notes?: string | null
          start_distance?: number | null
          start_time?: number
          style?: string | null
          track_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corner_zones_lap_id_fkey"
            columns: ["lap_id"]
            isOneToOne: false
            referencedRelation: "lap_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      regular_event_schedules: {
        Row: {
          car_class: string
          created_at: string | null
          duration_hours: number
          id: string
          is_active: boolean | null
          regular_event_id: string | null
          start_time: string
          track: string
          updated_at: string | null
          week_number: number
          year: number
        }
        Insert: {
          car_class: string
          created_at?: string | null
          duration_hours: number
          id?: string
          is_active?: boolean | null
          regular_event_id?: string | null
          start_time: string
          track: string
          updated_at?: string | null
          week_number: number
          year: number
        }
        Update: {
          car_class?: string
          created_at?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean | null
          regular_event_id?: string | null
          start_time?: string
          track?: string
          updated_at?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "regular_event_schedules_regular_event_id_fkey"
            columns: ["regular_event_id"]
            isOneToOne: false
            referencedRelation: "multis"
            referencedColumns: ["id"]
          },
        ]
      }
      regular_event_votes: {
        Row: {
          car_class_option: string
          created_at: string | null
          id: string
          regular_event_id: string | null
          track_option: string
          voter_id: string | null
          week_number: number
          year: number
        }
        Insert: {
          car_class_option: string
          created_at?: string | null
          id?: string
          regular_event_id?: string | null
          track_option: string
          voter_id?: string | null
          week_number: number
          year: number
        }
        Update: {
          car_class_option?: string
          created_at?: string | null
          id?: string
          regular_event_id?: string | null
          track_option?: string
          voter_id?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "regular_event_votes_regular_event_id_fkey"
            columns: ["regular_event_id"]
            isOneToOne: false
            referencedRelation: "multis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regular_event_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      regular_event_vote_options: {
        Row: {
          created_at: string | null
          id: string
          option_type: string
          option_value: string
          regular_event_id: string | null
          votes_count: number | null
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_type: string
          option_value: string
          regular_event_id?: string | null
          votes_count?: number | null
          week_number: number
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          option_type?: string
          option_value?: string
          regular_event_id?: string | null
          votes_count?: number | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "regular_event_vote_options_regular_event_id_fkey"
            columns: ["regular_event_id"]
            isOneToOne: false
            referencedRelation: "multis"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          message: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      game_notices: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          game: string
          id: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          game: string
          id?: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          game?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      lap_controls: {
        Row: {
          brake: number | null
          distance: number | null
          gear: number | null
          id: number
          lap_id: string | null
          rpm: number | null
          rpms: number | null
          speed: number | null
          steerangle: number | null
          steering: number | null
          throttle: number | null
          time: number | null
        }
        Insert: {
          brake?: number | null
          distance?: number | null
          gear?: number | null
          id?: number
          lap_id?: string | null
          rpm?: number | null
          rpms?: number | null
          speed?: number | null
          steerangle?: number | null
          steering?: number | null
          throttle?: number | null
          time?: number | null
        }
        Update: {
          brake?: number | null
          distance?: number | null
          gear?: number | null
          id?: number
          lap_id?: string | null
          rpm?: number | null
          rpms?: number | null
          speed?: number | null
          steerangle?: number | null
          steering?: number | null
          throttle?: number | null
          time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lap_controls_lap_id_fkey"
            columns: ["lap_id"]
            isOneToOne: false
            referencedRelation: "lap_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      lap_data: {
        Row: {
          abs: number | null
          air_temp: number | null
          brake: number | null
          brake_temp_lf: number | null
          brake_temp_lr: number | null
          brake_temp_rf: number | null
          brake_temp_rr: number | null
          bump_force_lf: number | null
          bump_force_lr: number | null
          bump_force_rf: number | null
          bump_force_rr: number | null
          bumpodn_ride_lf: number | null
          bumpodn_ride_lr: number | null
          bumpodn_ride_rf: number | null
          bumpodn_ride_rr: number | null
          bumpopup_ride_lf: number | null
          bumpopup_ride_lr: number | null
          bumpopup_ride_rf: number | null
          bumpopup_ride_rr: number | null
          car: string | null
          clutch: number | null
          created_at: string | null
          data: Json | null
          en_ap: number | null
          en_dy: number | null
          en_et: number | null
          en_gr: number | null
          en_tb: number | null
          en_td: number | null
          en_tl: number | null
          en_tw: number | null
          en_w: number | null
          g_lat: number | null
          g_lon: number | null
          gear: number | null
          id: string
          lap_beacon: number | null
          roty: number | null
          rpms: number | null
          speed: number | null
          steerangle: number | null
          sus_travel_lf: number | null
          sus_travel_lr: number | null
          sus_travel_rf: number | null
          sus_travel_rr: number | null
          tc: number | null
          throttle: number | null
          time: number | null
          track: string | null
          track_temp: number | null
          tyre_press_lf: number | null
          tyre_press_lr: number | null
          tyre_press_rf: number | null
          tyre_press_rr: number | null
          tyre_tair_lf: number | null
          tyre_tair_lr: number | null
          tyre_tair_rf: number | null
          tyre_tair_rr: number | null
          user_id: string | null
          weather: string | null
          wheel_speed_lf: number | null
          wheel_speed_lr: number | null
          wheel_speed_rf: number | null
          wheel_speed_rr: number | null
        }
        Insert: {
          abs?: number | null
          air_temp?: number | null
          brake?: number | null
          brake_temp_lf?: number | null
          brake_temp_lr?: number | null
          brake_temp_rf?: number | null
          brake_temp_rr?: number | null
          bump_force_lf?: number | null
          bump_force_lr?: number | null
          bump_force_rf?: number | null
          bump_force_rr?: number | null
          bumpodn_ride_lf?: number | null
          bumpodn_ride_lr?: number | null
          bumpodn_ride_rf?: number | null
          bumpodn_ride_rr?: number | null
          bumpopup_ride_lf?: number | null
          bumpopup_ride_lr?: number | null
          bumpopup_ride_rf?: number | null
          bumpopup_ride_rr?: number | null
          car?: string | null
          clutch?: number | null
          created_at?: string | null
          data?: Json | null
          en_ap?: number | null
          en_dy?: number | null
          en_et?: number | null
          en_gr?: number | null
          en_tb?: number | null
          en_td?: number | null
          en_tl?: number | null
          en_tw?: number | null
          en_w?: number | null
          g_lat?: number | null
          g_lon?: number | null
          gear?: number | null
          id?: string
          lap_beacon?: number | null
          roty?: number | null
          rpms?: number | null
          speed?: number | null
          steerangle?: number | null
          sus_travel_lf?: number | null
          sus_travel_lr?: number | null
          sus_travel_rf?: number | null
          sus_travel_rr?: number | null
          tc?: number | null
          throttle?: number | null
          time?: number | null
          track?: string | null
          track_temp?: number | null
          tyre_press_lf?: number | null
          tyre_press_lr?: number | null
          tyre_press_rf?: number | null
          tyre_press_rr?: number | null
          tyre_tair_lf?: number | null
          tyre_tair_lr?: number | null
          tyre_tair_rf?: number | null
          tyre_tair_rr?: number | null
          user_id?: string | null
          weather?: string | null
          wheel_speed_lf?: number | null
          wheel_speed_lr?: number | null
          wheel_speed_rf?: number | null
          wheel_speed_rr?: number | null
        }
        Update: {
          abs?: number | null
          air_temp?: number | null
          brake?: number | null
          brake_temp_lf?: number | null
          brake_temp_lr?: number | null
          brake_temp_rf?: number | null
          brake_temp_rr?: number | null
          bump_force_lf?: number | null
          bump_force_lr?: number | null
          bump_force_rf?: number | null
          bump_force_rr?: number | null
          bumpodn_ride_lf?: number | null
          bumpodn_ride_lr?: number | null
          bumpodn_ride_rf?: number | null
          bumpodn_ride_rr?: number | null
          bumpopup_ride_lf?: number | null
          bumpopup_ride_lr?: number | null
          bumpopup_ride_rf?: number | null
          bumpopup_ride_rr?: number | null
          car?: string | null
          clutch?: number | null
          created_at?: string | null
          data?: Json | null
          en_ap?: number | null
          en_dy?: number | null
          en_et?: number | null
          en_gr?: number | null
          en_tb?: number | null
          en_td?: number | null
          en_tl?: number | null
          en_tw?: number | null
          en_w?: number | null
          g_lat?: number | null
          g_lon?: number | null
          gear?: number | null
          id?: string
          lap_beacon?: number | null
          roty?: number | null
          rpms?: number | null
          speed?: number | null
          steerangle?: number | null
          sus_travel_lf?: number | null
          sus_travel_lr?: number | null
          sus_travel_rf?: number | null
          sus_travel_rr?: number | null
          tc?: number | null
          throttle?: number | null
          time?: number | null
          track?: string | null
          track_temp?: number | null
          tyre_press_lf?: number | null
          tyre_press_lr?: number | null
          tyre_press_rf?: number | null
          tyre_press_rr?: number | null
          tyre_tair_lf?: number | null
          tyre_tair_lr?: number | null
          tyre_tair_rf?: number | null
          tyre_tair_rr?: number | null
          user_id?: string | null
          weather?: string | null
          wheel_speed_lf?: number | null
          wheel_speed_lr?: number | null
          wheel_speed_rf?: number | null
          wheel_speed_rr?: number | null
        }
        Relationships: []
      }
      lap_meta: {
        Row: {
          air_temp: number | null
          car: string | null
          created_at: string | null
          id: string
          track: string | null
          track_temp: number | null
          user_id: string
          weather: string | null
        }
        Insert: {
          air_temp?: number | null
          car?: string | null
          created_at?: string | null
          id?: string
          track?: string | null
          track_temp?: number | null
          user_id: string
          weather?: string | null
        }
        Update: {
          air_temp?: number | null
          car?: string | null
          created_at?: string | null
          id?: string
          track?: string | null
          track_temp?: number | null
          user_id?: string
          weather?: string | null
        }
        Relationships: []
      }
      lap_raw: {
        Row: {
          chunk_index: number | null
          data: Json | null
          id: string
          lap_id: string | null
        }
        Insert: {
          chunk_index?: number | null
          data?: Json | null
          id?: string
          lap_id?: string | null
        }
        Update: {
          chunk_index?: number | null
          data?: Json | null
          id?: string
          lap_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lap_raw_lap_id_fkey"
            columns: ["lap_id"]
            isOneToOne: false
            referencedRelation: "lap_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      lap_vehicle_status: {
        Row: {
          abs: number | null
          brake_temp_lf: number | null
          brake_temp_lr: number | null
          brake_temp_rf: number | null
          brake_temp_rr: number | null
          bumpstop_force_lf: number | null
          bumpstop_force_lr: number | null
          bumpstop_force_rf: number | null
          bumpstop_force_rr: number | null
          bumpstopdn_ride_lf: number | null
          bumpstopdn_ride_lr: number | null
          bumpstopdn_ride_rf: number | null
          bumpstopdn_ride_rr: number | null
          bumpstopup_ride_lf: number | null
          bumpstopup_ride_lr: number | null
          bumpstopup_ride_rf: number | null
          bumpstopup_ride_rr: number | null
          clutch: number | null
          distance: number | null
          en_ap: number | null
          en_dy: number | null
          en_et: number | null
          en_gr: number | null
          en_tb: number | null
          en_td: number | null
          en_tl: number | null
          en_tw: number | null
          en_w: number | null
          g_lat: number | null
          g_lon: number | null
          id: number
          lap_beacon: number | null
          lap_id: string | null
          roty: number | null
          sus_travel_lf: number | null
          sus_travel_lr: number | null
          sus_travel_rf: number | null
          sus_travel_rr: number | null
          tc: number | null
          time: number | null
          tyre_press_lf: number | null
          tyre_press_lr: number | null
          tyre_press_rf: number | null
          tyre_press_rr: number | null
          tyre_tair_lf: number | null
          tyre_tair_lr: number | null
          tyre_tair_rf: number | null
          tyre_tair_rr: number | null
          wheel_speed_lf: number | null
          wheel_speed_lr: number | null
          wheel_speed_rf: number | null
          wheel_speed_rr: number | null
        }
        Insert: {
          abs?: number | null
          brake_temp_lf?: number | null
          brake_temp_lr?: number | null
          brake_temp_rf?: number | null
          brake_temp_rr?: number | null
          bumpstop_force_lf?: number | null
          bumpstop_force_lr?: number | null
          bumpstop_force_rf?: number | null
          bumpstop_force_rr?: number | null
          bumpstopdn_ride_lf?: number | null
          bumpstopdn_ride_lr?: number | null
          bumpstopdn_ride_rf?: number | null
          bumpstopdn_ride_rr?: number | null
          bumpstopup_ride_lf?: number | null
          bumpstopup_ride_lr?: number | null
          bumpstopup_ride_rf?: number | null
          bumpstopup_ride_rr?: number | null
          clutch?: number | null
          distance?: number | null
          en_ap?: number | null
          en_dy?: number | null
          en_et?: number | null
          en_gr?: number | null
          en_tb?: number | null
          en_td?: number | null
          en_tl?: number | null
          en_tw?: number | null
          en_w?: number | null
          g_lat?: number | null
          g_lon?: number | null
          id?: number
          lap_beacon?: number | null
          lap_id?: string | null
          roty?: number | null
          sus_travel_lf?: number | null
          sus_travel_lr?: number | null
          sus_travel_rf?: number | null
          sus_travel_rr?: number | null
          tc?: number | null
          time?: number | null
          tyre_press_lf?: number | null
          tyre_press_lr?: number | null
          tyre_press_rf?: number | null
          tyre_press_rr?: number | null
          tyre_tair_lf?: number | null
          tyre_tair_lr?: number | null
          tyre_tair_rf?: number | null
          tyre_tair_rr?: number | null
          wheel_speed_lf?: number | null
          wheel_speed_lr?: number | null
          wheel_speed_rf?: number | null
          wheel_speed_rr?: number | null
        }
        Update: {
          abs?: number | null
          brake_temp_lf?: number | null
          brake_temp_lr?: number | null
          brake_temp_rf?: number | null
          brake_temp_rr?: number | null
          bumpstop_force_lf?: number | null
          bumpstop_force_lr?: number | null
          bumpstop_force_rf?: number | null
          bumpstop_force_rr?: number | null
          bumpstopdn_ride_lf?: number | null
          bumpstopdn_ride_lr?: number | null
          bumpstopdn_ride_rf?: number | null
          bumpstopdn_ride_rr?: number | null
          bumpstopup_ride_lf?: number | null
          bumpstopup_ride_lr?: number | null
          bumpstopup_ride_rf?: number | null
          bumpstopup_ride_rr?: number | null
          clutch?: number | null
          distance?: number | null
          en_ap?: number | null
          en_dy?: number | null
          en_et?: number | null
          en_gr?: number | null
          en_tb?: number | null
          en_td?: number | null
          en_tl?: number | null
          en_tw?: number | null
          en_w?: number | null
          g_lat?: number | null
          g_lon?: number | null
          id?: number
          lap_beacon?: number | null
          lap_id?: string | null
          roty?: number | null
          sus_travel_lf?: number | null
          sus_travel_lr?: number | null
          sus_travel_rf?: number | null
          sus_travel_rr?: number | null
          tc?: number | null
          time?: number | null
          tyre_press_lf?: number | null
          tyre_press_lr?: number | null
          tyre_press_rf?: number | null
          tyre_press_rr?: number | null
          tyre_tair_lf?: number | null
          tyre_tair_lr?: number | null
          tyre_tair_rf?: number | null
          tyre_tair_rr?: number | null
          wheel_speed_lf?: number | null
          wheel_speed_lr?: number | null
          wheel_speed_rf?: number | null
          wheel_speed_rr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lap_vehicle_status_lap_id_fkey"
            columns: ["lap_id"]
            isOneToOne: false
            referencedRelation: "lap_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      multis: {
        Row: {
          anonymous_nickname: string | null
          anonymous_password: string | null
          author_id: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          event_date: string | null
          event_type: string
          game: string
          game_track: string
          id: string
          is_open: boolean | null
          is_template_based: boolean | null
          link: string | null
          max_participants: number | null
          multi_class: string
          multi_day: string[]
          multi_race: string | null
          multi_time: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          week: number | null
          year: number | null
        }
        Insert: {
          anonymous_nickname?: string | null
          anonymous_password?: string | null
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          event_date?: string | null
          event_type?: string | null
          game: string
          game_track: string
          id?: string
          is_open?: boolean | null
          is_template_based?: boolean | null
          link?: string | null
          max_participants?: number | null
          multi_class: string
          multi_day: string[]
          multi_race?: string | null
          multi_time?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          week?: number | null
          year?: number | null
        }
        Update: {
          anonymous_nickname?: string | null
          anonymous_password?: string | null
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          event_date?: string | null
          event_type?: string | null
          game?: string
          game_track?: string
          id?: string
          is_open?: boolean | null
          is_template_based?: boolean | null
          link?: string | null
          max_participants?: number | null
          multi_class?: string
          multi_day?: string[]
          multi_race?: string | null
          multi_time?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          week?: number | null
          year?: number | null
        }
        Relationships: []
      }
      event_templates: {
        Row: {
          class: string
          created_at: string | null
          days: string[]
          description: string | null
          game: string
          id: string
          is_active: boolean | null
          time: string
          track: string
          type: string
          updated_at: string | null
        }
        Insert: {
          class: string
          created_at?: string | null
          days: string[]
          description?: string | null
          game: string
          id?: string
          is_active?: boolean | null
          time: string
          track: string
          type: string
          updated_at?: string | null
        }
        Update: {
          class?: string
          created_at?: string | null
          days?: string[]
          description?: string | null
          game?: string
          id?: string
          is_active?: boolean | null
          time?: string
          track?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          page_name: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          id?: string
          page_name: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          id?: string
          page_name?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nickname: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nickname?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nickname?: string | null
          role?: string | null
        }
        Relationships: []
      }
      records: {
        Row: {
          event_id: string | null
          id: string
          lap_time: number | null
          nickname: string | null
          proof_link: string | null
          submitted_at: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          lap_time?: number | null
          nickname?: string | null
          proof_link?: string | null
          submitted_at?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          lap_time?: number | null
          nickname?: string | null
          proof_link?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_results: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          lap_id: string | null
          sector_end: number
          sector_index: number
          sector_number: number | null
          sector_start: number
          sector_time: number
          track: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          lap_id?: string | null
          sector_end: number
          sector_index: number
          sector_number?: number | null
          sector_start: number
          sector_time: number
          track?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          lap_id?: string | null
          sector_end?: number
          sector_index?: number
          sector_number?: number | null
          sector_start?: number
          sector_time?: number
          track?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sector_results_lap_id_fkey"
            columns: ["lap_id"]
            isOneToOne: false
            referencedRelation: "lap_meta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sector_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_home_views: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
