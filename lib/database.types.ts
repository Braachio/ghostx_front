export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

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

      posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey'
            columns: ['author_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
  }
}

export type Post = Database['public']['Tables']['posts']['Row']
