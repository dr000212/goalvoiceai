export type DailyAnalysis = {
  id: string;
  check_in_id: string;
  user_id: string;
  mood: string;
  energy_level: number;
  completed_actions: { action: string; related_goal: string; evidence: string }[];
  missed_actions: { action: string; related_goal: string; reason_if_known?: string }[];
  blockers: { blocker: string; evidence: string }[];
  goal_scores: { goal_id: string; goal_title: string; score: number; reason: string }[];
  overall_score: number;
  insight: string;
  tomorrow_action: string;
  created_at?: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  goal_id?: string | null;
  transcript: string;
  input_type: "text" | "voice";
  check_in_date?: string;
  created_at?: string;
  analysis?: DailyAnalysis | null;
};
