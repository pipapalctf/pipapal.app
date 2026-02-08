import { FeedbackCategory } from "@shared/schema";

// Labels for feedback categories
export const FEEDBACK_CATEGORY_LABELS: Record<string, string> = {
  [FeedbackCategory.GENERAL]: "General",
  [FeedbackCategory.BUG_REPORT]: "Bug Report",
  [FeedbackCategory.FEATURE_REQUEST]: "Feature Request",
  [FeedbackCategory.USABILITY]: "Usability",
  [FeedbackCategory.SUGGESTION]: "Suggestion"
};

// Labels for feedback statuses (based on schema.ts comments)
export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  "pending": "Pending Review",
  "in_review": "In Review",
  "implemented": "Implemented",
  "rejected": "Rejected",
  "completed": "Completed"
};

// Feedback submission form data type
export type FeedbackFormData = {
  category: string;
  title: string;
  content: string;
  rating?: number;
  currentPage?: string;
};