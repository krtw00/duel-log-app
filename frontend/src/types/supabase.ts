export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          streamer_mode: boolean;
          theme_preference: string;
          is_admin: boolean;
          enable_screen_analysis: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email?: string | null;
          streamer_mode?: boolean;
          theme_preference?: string;
          is_admin?: boolean;
          enable_screen_analysis?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string | null;
          streamer_mode?: boolean;
          theme_preference?: string;
          is_admin?: boolean;
          enable_screen_analysis?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      decks: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          is_opponent: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          is_opponent?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          is_opponent?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      duels: {
        Row: {
          id: number;
          user_id: string;
          deck_id: number;
          opponent_deck_id: number;
          is_win: boolean;
          game_mode: string;
          rank: string | null;
          rate_value: number | null;
          dc_value: number | null;
          won_coin_toss: boolean | null;
          is_going_first: boolean | null;
          played_date: string;
          notes: string | null;
          create_date: string;
          update_date: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          deck_id: number;
          opponent_deck_id: number;
          is_win: boolean;
          game_mode: string;
          rank?: string | null;
          rate_value?: number | null;
          dc_value?: number | null;
          won_coin_toss?: boolean | null;
          is_going_first?: boolean | null;
          played_date?: string;
          notes?: string | null;
          create_date?: string;
          update_date?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          deck_id?: number;
          opponent_deck_id?: number;
          is_win?: boolean;
          game_mode?: string;
          rank?: string | null;
          rate_value?: number | null;
          dc_value?: number | null;
          won_coin_toss?: boolean | null;
          is_going_first?: boolean | null;
          played_date?: string;
          notes?: string | null;
          create_date?: string;
          update_date?: string;
        };
      };
      shared_statistics: {
        Row: {
          id: number;
          share_id: string;
          user_id: string;
          year: number | null;
          month: number | null;
          game_mode: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: number;
          share_id: string;
          user_id: string;
          year?: number | null;
          month?: number | null;
          game_mode?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: number;
          share_id?: string;
          user_id?: string;
          year?: number | null;
          month?: number | null;
          game_mode?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      shared_urls: {
        Row: {
          id: number;
          user_id: string;
          year_month: string;
          url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          year_month: string;
          url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          year_month?: string;
          url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
