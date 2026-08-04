export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  current_focus: string;
  likes: string;
  dislikes: string;
  personal_context: string;
  created_at?: string;
  updated_at?: string;
};

export type ProfileInput = Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">;
