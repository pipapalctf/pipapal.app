import { FeedbackCategory } from "@shared/schema";

export const FEEDBACK_CATEGORY_LABELS: Record<string, string> = {
  [FeedbackCategory.FEATURE_REQUEST]: "Feature Request",
  [FeedbackCategory.BUG_REPORT]: "Bug Report",
  [FeedbackCategory.USABILITY]: "Usability Issue",
  [FeedbackCategory.SUGGESTION]: "Suggestion",
  [FeedbackCategory.GENERAL]: "General Feedback",
};

export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  "pending": "Pending Review",
  "in_review": "In Review",
  "implemented": "Implemented",
  "rejected": "Not Implemented",
  "completed": "Completed",
};

export type FeedbackFormData = {
  category: string;
  title: string;
  content: string;
  rating?: number;
  currentPage?: string;
};