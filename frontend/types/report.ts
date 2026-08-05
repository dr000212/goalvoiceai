export type WeeklyReport = {
  id: string;
  user_id: string;
  goal_id?: string | null;
  week_start_date: string;
  week_end_date: string;
  overall_week_score: number;
  goal_progress: { goal_id: string; goal_title: string; weekly_score: number; summary: string }[];
  best_day: string;
  weakest_day: string;
  repeated_blockers: string[];
  positive_patterns: string[];
  summary: string;
  next_week_recommendations: string[];
  created_at?: string;
};
