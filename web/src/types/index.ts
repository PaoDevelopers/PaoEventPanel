export interface House {
  id: number;
  name: string;
  code: string;
  color: string;
}

export interface Student {
  id: number;
  student_id: string;
  name: string;
  house_id: number;
  house: House;
  lap_count: number;
}

export interface RankedStudent extends Student {
  rank: number;
  rankChange?: number;
}

export interface HouseRanking {
  house_id: number;
  name: string;
  code: string;
  color: string;
  total_laps: number;
  student_count: number;
}

export interface ActivitySettings {
  id: number;
  activity_name: string;
  logo_path: string;
  // Light mode background
  bg_mode: "solid" | "gradient" | "image";
  bg_color: string;
  bg_gradient_start: string;
  bg_gradient_end: string;
  bg_gradient_angle: number;
  bg_image_path: string;
  bg_blur: boolean;
  // Dark mode background
  dark_bg_mode: "solid" | "gradient" | "image";
  dark_bg_color: string;
  dark_bg_gradient_start: string;
  dark_bg_gradient_end: string;
  dark_bg_gradient_angle: number;
  dark_bg_image_path: string;
  dark_bg_blur: boolean;
  // Light mode colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  muted_color: string;
  // Dark mode colors
  dark_primary_color: string;
  dark_secondary_color: string;
  dark_accent_color: string;
  dark_muted_color: string;
  // Card glass effect
  card_opacity: number;
  card_blur: number;
  dark_card_opacity: number;
  dark_card_blur: number;
  // Weather
  weather_location: string;
}

export interface ThemePreset {
  id: number;
  name: string;
  bg_mode: string;
  bg_color: string;
  bg_gradient_start: string;
  bg_gradient_end: string;
  bg_gradient_angle: number;
  bg_blur: boolean;
  dark_bg_mode: string;
  dark_bg_color: string;
  dark_bg_gradient_start: string;
  dark_bg_gradient_end: string;
  dark_bg_gradient_angle: number;
  dark_bg_blur: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  muted_color: string;
  dark_primary_color: string;
  dark_secondary_color: string;
  dark_accent_color: string;
  dark_muted_color: string;
  card_opacity: number;
  card_blur: number;
  dark_card_opacity: number;
  dark_card_blur: number;
  created_at: string;
}

export interface BuiltinThemePreset {
  slug: string;
  name: string;
  is_builtin: true;
  primary_color: string;
  accent_color: string;
  dark_primary_color: string;
  dark_accent_color: string;
}

export interface User {
  role: "admin" | "super_admin";
}

export interface Stats {
  total_laps: number;
  total_participants: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}
