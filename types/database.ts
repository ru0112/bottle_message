export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string;
          user_id: string;
          recipient_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipient_id?: string | null;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      message_replies: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_random_message: {
        Args: {
          p_excluded_ids: string[];
        };
        Returns: Array<{
          id: string;
          content: string;
          created_at: string;
        }>;
      };
      create_message_reply: {
        Args: {
          p_message_id: string;
          p_content: string;
        };
        Returns: undefined;
      };
      get_message_thread: {
        Args: {
          p_message_id: string;
        };
        Returns: Array<{
          message_id: string;
          entry_id: string | null;
          content: string;
          created_at: string;
          speaker: "you" | "other";
        }>;
      };
      get_message_history: {
        Args: {
          p_direction: string;
        };
        Returns: Array<{
          message_id: string;
          content: string;
          created_at: string;
          updated_at: string;
          reply_count: number;
          latest_content: string;
          status: "waiting" | "reply_received" | "ended";
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
