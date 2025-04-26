import { FeedbackCategory } from "@shared/schema";

export interface Feedback {
  id: number;
  userId: number;
  category: string;
  title: string;
  content: string;
  rating?: number | null;
  currentPage?: string | null;
  status: string;
  createdAt: Date;
}

export interface FeedbackFormValues {
  category: string;
  title: string;
  content: string;
  rating?: number;
  currentPage?: string;
}

export interface FeedbackSubmitResponse {
  feedback: Feedback;
  pointsAwarded: number;
  message: string;
}

export const FEEDBACK_CATEGORY_LABELS: Record<string, string> = {
  [FeedbackCategory.FEATURE_REQUEST]: "Feature Request",
  [FeedbackCategory.BUG_REPORT]: "Bug Report",
  [FeedbackCategory.USABILITY]: "Usability Feedback",
  [FeedbackCategory.SUGGESTION]: "Suggestion",
  [FeedbackCategory.GENERAL]: "General Feedback"
};

export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  implemented: "Implemented",
  rejected: "Rejected",
  completed: "Completed"
};