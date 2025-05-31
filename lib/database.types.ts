export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string
          track_name: string
          car_class: string
          event_date: string
          start_date: string
          end_date: string
          max_point: number
        }
        Insert: {
          id?: string
          title: string
          description: string
          track_name: string
          car_class: string
          event_date: string
          start_date: string
          end_date: string
          max_point: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          track_name?: string
          car_class?: string
          event_date?: string
          start_date?: string
          end_date?: string
          max_point?: number
        }
        Relationships: []
      }

      records: {
        Row: {
          id: string
          nickname: string
          lap_time: number
          proof_link: string
          event_id: string
        }
        Insert: {
          id?: string
          nickname: string
          lap_time: number
          proof_link: string
          event_id: string
        }
        Update: {
          id?: string
          nickname?: string
          lap_time?: number
          proof_link?: string
          event_id?: string
        }
        Relationships: []
      }
    }
  }
}
