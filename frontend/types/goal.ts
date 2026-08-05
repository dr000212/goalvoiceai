export type Goal = {
  id: string;
  user_id: string;
  title: string;
  category?: string | null;
  description?: string | null;
  target_date?: string | null;
  weekly_target?: string | null;
  daily_target?: string | null;
  importance: "low" | "medium" | "high";
  status: "active" | "completed" | "archived";
  created_at?: string;
  updated_at?: string;
};
