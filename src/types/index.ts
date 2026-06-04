// ============================================================
//  VM-STUDIO — TypeScript Types
//  Auto-maps to Supabase schema
// ============================================================

// ── Base ─────────────────────────────────────────────────────
export type UUID = string;
export type ISODate = string;
export type UserRole = 'super_admin' | 'manager' | 'vm';
export type TaskPriority = 'high' | 'medium' | 'low';
export type SubmissionStatus = 'pending' | 'approved' | 'revision';
export type PhotoType = 'before' | 'after';
export type ChatRoom = 'team' | 'managers';
export type FileType = 'doc' | 'pdf' | 'img';

// ── Company ──────────────────────────────────────────────────
export interface Company {
  id:            UUID;
  name:          string;
  slug:          string;
  logo_url:      string | null;
  primary_color: string;
  accent_color:  string;
  is_active:     boolean;
  created_at:    ISODate;
  updated_at:    ISODate;
}

// ── Company Settings ─────────────────────────────────────────
export interface CompanySettings {
  id:                   UUID;
  company_id:           UUID;
  enable_reports:       boolean;
  enable_chat:          boolean;
  enable_notifications: boolean;
  enable_attachments:   boolean;
  enable_leaderboard:   boolean;
  enable_guidelines:    boolean;
  max_photo_upload:     number;
  created_at:           ISODate;
  updated_at:           ISODate;
}

// ── Branch ───────────────────────────────────────────────────
export interface Branch {
  id:         UUID;
  company_id: UUID;
  name:       string;
  city:       string | null;
  is_active:  boolean;
  sort_order: number;
  created_at: ISODate;
}

// ── Profile ──────────────────────────────────────────────────
export interface Profile {
  id:               UUID;
  company_id:       UUID | null;
  branch_id:        UUID | null;
  full_name:        string;
  avatar_initials:  string | null;
  role:             UserRole;
  employee_id:      string | null;
  is_active:        boolean;
  created_at:       ISODate;
  updated_at:       ISODate;
  // joined
  company?:         Company;
  branch?:          Branch;
}

// ── Category ─────────────────────────────────────────────────
export interface Category {
  id:           UUID;
  company_id:   UUID;
  name:         string;
  icon:         string;
  sort_order:   number;
  is_active:    boolean;
  created_at:   ISODate;
  updated_at:   ISODate;
  // joined
  subcategories?: Subcategory[];
}

// ── Subcategory ──────────────────────────────────────────────
export interface Subcategory {
  id:           UUID;
  company_id:   UUID;
  category_id:  UUID;
  name:         string;
  sort_order:   number;
  is_active:    boolean;
  created_at:   ISODate;
}

// ── Task ─────────────────────────────────────────────────────
export interface Task {
  id:             UUID;
  company_id:     UUID;
  category_id:    UUID | null;
  subcategory_id: UUID | null;
  created_by:     UUID;
  assigned_to:    string;    // 'all' | profile UUID
  title:          string;
  priority:       TaskPriority;
  due_label:      string;
  is_done:        boolean;
  created_at:     ISODate;
  updated_at:     ISODate;
  // joined
  category?:      Category;
  subcategory?:   Subcategory;
  creator?:       Profile;
}

// ── Submission ───────────────────────────────────────────────
export interface Submission {
  id:             UUID;
  company_id:     UUID;
  submitted_by:   UUID;
  branch_id:      UUID | null;
  category_id:    UUID | null;
  subcategory_id: UUID | null;
  task_id:        UUID | null;
  status:         SubmissionStatus;
  note:           string | null;
  score:          number | null;
  reviewed_by:    UUID | null;
  reviewed_at:    ISODate | null;
  created_at:     ISODate;
  updated_at:     ISODate;
  // joined
  submitter?:     Profile;
  branch?:        Branch;
  category?:      Category;
  subcategory?:   Subcategory;
  photos?:        SubmissionPhoto[];
}

// ── Submission Photo ─────────────────────────────────────────
export interface SubmissionPhoto {
  id:            UUID;
  submission_id: UUID;
  storage_path:  string;
  photo_type:    PhotoType;
  created_at:    ISODate;
  // UI only
  url?:          string;
}

// ── Guideline ────────────────────────────────────────────────
export interface Guideline {
  id:           UUID;
  company_id:   UUID;
  uploaded_by:  UUID;
  title:        string;
  category:     string;
  storage_path: string | null;
  file_type:    FileType;
  page_count:   number | null;
  is_active:    boolean;
  created_at:   ISODate;
  // UI only
  file_url?:    string;
  preview_url?: string;
}

// ── Chat Message ─────────────────────────────────────────────
export interface ChatMessage {
  id:         UUID;
  company_id: UUID;
  sender_id:  UUID;
  room:       ChatRoom;
  body:       string;
  created_at: ISODate;
  // joined
  sender?:    Profile;
}

// ── Activity Log ─────────────────────────────────────────────
export interface ActivityLog {
  id:         UUID;
  company_id: UUID;
  user_id:    UUID;
  action:     string;
  detail:     string | null;
  created_at: ISODate;
  // joined
  user?:      Profile;
}

// ── App Context (loaded on login) ────────────────────────────
export interface AppSession {
  profile:    Profile;
  company:    Company;
  settings:   CompanySettings;
  categories: Category[];
  branches:   Branch[];
}

// ── Super Admin ──────────────────────────────────────────────
export interface CreateCompanyPayload {
  name:          string;
  slug:          string;
  primary_color: string;
  accent_color:  string;
  logo_url?:     string;
}

export interface CreateCategoryPayload {
  company_id: UUID;
  name:       string;
  icon:       string;
  sort_order: number;
}

export interface UpdateSettingsPayload {
  company_id:           UUID;
  enable_reports?:      boolean;
  enable_chat?:         boolean;
  enable_notifications?:boolean;
  enable_attachments?:  boolean;
  enable_leaderboard?:  boolean;
  enable_guidelines?:   boolean;
  max_photo_upload?:    number;
}
