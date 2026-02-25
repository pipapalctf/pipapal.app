import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User roles
export const UserRole = {
  HOUSEHOLD: 'household',
  COLLECTOR: 'collector',
  RECYCLER: 'recycler',
  ORGANIZATION: 'organization',
  ADMIN: 'admin'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Collection status
export const CollectionStatus = {
  SCHEDULED: 'scheduled',
  PENDING: 'pending', 
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type CollectionStatusType = typeof CollectionStatus[keyof typeof CollectionStatus];

// Waste types
export const WasteType = {
  GENERAL: 'general',
  PLASTIC: 'plastic',
  PAPER: 'paper',
  GLASS: 'glass',
  METAL: 'metal',
  ELECTRONIC: 'electronic',
  ORGANIC: 'organic',
  HAZARDOUS: 'hazardous',
  CARDBOARD: 'cardboard'
} as const;

export type WasteTypeValue = typeof WasteType[keyof typeof WasteType];

// Badge types
export const BadgeType = {
  ECO_STARTER: 'eco_starter',
  WATER_SAVER: 'water_saver',
  ENERGY_PRO: 'energy_pro',
  RECYCLING_CHAMPION: 'recycling_champion',
  ZERO_WASTE_HERO: 'zero_waste_hero',
  COMMUNITY_LEADER: 'community_leader'
} as const;

export type BadgeTypeValue = typeof BadgeType[keyof typeof BadgeType];

// Feedback categories
export const FeedbackCategory = {
  FEATURE_REQUEST: 'feature_request',
  BUG_REPORT: 'bug_report',
  USABILITY: 'usability',
  SUGGESTION: 'suggestion',
  GENERAL: 'general'
} as const;

export type FeedbackCategoryType = typeof FeedbackCategory[keyof typeof FeedbackCategory];

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default(UserRole.HOUSEHOLD),
  address: text("address"),
  phone: text("phone"),
  sustainabilityScore: integer("sustainability_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Firebase authentication fields
  firebaseUid: text("firebase_uid").unique(), // Firebase User ID for authentication
  emailVerified: boolean("email_verified").default(false), // Whether the email has been verified
  
  // Role-specific fields - Organizations
  organizationType: text("organization_type"), // "business", "non-profit", "community_group", etc.
  organizationName: text("organization_name"), 
  contactPersonName: text("contact_person_name"), 
  contactPersonPosition: text("contact_person_position"), 
  contactPersonPhone: text("contact_person_phone"), 
  contactPersonEmail: text("contact_person_email"),
  
  // Role-specific fields - Collectors & Recyclers
  isCertified: boolean("is_certified"),
  certificationDetails: text("certification_details"),
  businessType: text("business_type"), // "individual" or "organization"
  businessName: text("business_name"), // Name of recycling/collection business
  wasteSpecialization: text("waste_specialization").array(), // Types of waste they specialize in
  serviceLocation: text("service_location"), // Where they operate
  serviceType: text("service_type"), // "pickup", "drop_off", or "both"
  operatingHours: text("operating_hours"), // Operating hours information
  
  // Consent fields (Kenya DPA 2019)
  consentPrivacyPolicy: boolean("consent_privacy_policy").default(false),
  consentTermsOfService: boolean("consent_terms_of_service").default(false),
  consentUserAgreement: boolean("consent_user_agreement").default(false),
  consentDate: timestamp("consent_date"),

  // Common
  onboardingCompleted: boolean("onboarding_completed").default(false),
});

// Waste collections table
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  collectorId: integer("collector_id"),
  wasteType: text("waste_type").notNull(),
  wasteDescription: text("waste_description"), // For specific waste details, e.g. "apple Organic"
  status: text("status").notNull().default(CollectionStatus.SCHEDULED),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  wasteAmount: real("waste_amount"),
  address: text("address").notNull(),
  city: text("city"), // Added city field to replace coordinates (nullable for existing data)
  location: json("location"), // Keeping for backward compatibility but no longer used
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Environment impact table
export const impacts = pgTable("impacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  collectionId: integer("collection_id"),
  waterSaved: real("water_saved").default(0),
  co2Reduced: real("co2_reduced").default(0),
  treesEquivalent: real("trees_equivalent").default(0),
  energyConserved: real("energy_conserved").default(0),
  wasteAmount: real("waste_amount").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeType: text("badge_type").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow(),
});

// AI EcoTips table
export const ecoTips = pgTable("eco_tips", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User activity table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  points: integer("points"),
  timestamp: timestamp("timestamp"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Material interest table for tracking recycler interest in materials
export const materialInterests = pgTable("material_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // The recycler expressing interest
  collectionId: integer("collection_id").notNull().references(() => collections.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, completed
  message: text("message"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    fullName: true,
    email: true,
    role: true,
    address: true,
    phone: true,
    // Firebase fields
    firebaseUid: true,
    emailVerified: true,
    // Organization fields
    organizationType: true,
    organizationName: true, 
    contactPersonName: true,
    contactPersonPosition: true,
    contactPersonPhone: true,
    contactPersonEmail: true,
    // Collector/Recycler fields
    isCertified: true,
    certificationDetails: true,
    businessType: true,
    businessName: true,
    wasteSpecialization: true,
    serviceLocation: true,
    serviceType: true,
    operatingHours: true,
    // Consent fields
    consentPrivacyPolicy: true,
    consentTermsOfService: true,
    consentUserAgreement: true,
    consentDate: true,
    // Common fields
    onboardingCompleted: true,
  });

export const insertCollectionSchema = createInsertSchema(collections, {
  scheduledDate: z.union([z.string(), z.date()]).transform(val => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  wasteAmount: z.coerce.number().min(1).default(10),
})
  .pick({
    userId: true,
    wasteType: true,
    wasteDescription: true,
    wasteAmount: true,
    status: true,
    scheduledDate: true,
    address: true,
    city: true, // Added city field
    location: true, // Kept for backward compatibility
    notes: true,
  });

export const insertImpactSchema = createInsertSchema(impacts)
  .pick({
    userId: true,
    collectionId: true,
    waterSaved: true,
    co2Reduced: true,
    treesEquivalent: true,
    energyConserved: true,
    wasteAmount: true,
  });

export const insertBadgeSchema = createInsertSchema(badges)
  .pick({
    userId: true,
    badgeType: true,
  });

export const insertEcoTipSchema = createInsertSchema(ecoTips)
  .pick({
    category: true,
    title: true,
    content: true,
    icon: true,
  });

export const insertActivitySchema = createInsertSchema(activities)
  .pick({
    userId: true,
    activityType: true,
    description: true,
    points: true,
    timestamp: true,
  });

export const insertMaterialInterestSchema = createInsertSchema(materialInterests)
  .pick({
    userId: true,
    collectionId: true,
    status: true,
    message: true,
  });

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  impacts: many(impacts),
  badges: many(badges),
  activities: many(activities),
  feedback: many(feedback),
}));

export const collectionsRelations = relations(collections, ({ one }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  collector: one(users, {
    fields: [collections.collectorId],
    references: [users.id],
  }),
}));

export const impactsRelations = relations(impacts, ({ one }) => ({
  user: one(users, {
    fields: [impacts.userId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [impacts.collectionId],
    references: [collections.id],
  }),
}));

export const badgesRelations = relations(badges, ({ one }) => ({
  user: one(users, {
    fields: [badges.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const materialInterestsRelations = relations(materialInterests, ({ one }) => ({
  user: one(users, {
    fields: [materialInterests.userId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [materialInterests.collectionId],
    references: [collections.id],
  }),
}));

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export type InsertImpact = z.infer<typeof insertImpactSchema>;
export type Impact = typeof impacts.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertEcoTip = z.infer<typeof insertEcoTipSchema>;
export type EcoTip = typeof ecoTips.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertMaterialInterest = z.infer<typeof insertMaterialInterestSchema>;
export type MaterialInterest = typeof materialInterests.$inferSelect;

// Recycling Centers
export const recyclingCenters = pgTable("recycling_centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  operator: text("operator"),
  location: text("location").notNull(),
  facilityType: text("facility_type"),
  wasteTypes: text("waste_types").array(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  county: text("county").notNull(),
  poBox: text("po_box"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

// User feedback table
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(), // feature_request, bug_report, usability, suggestion, general
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending"), // pending, in_review, implemented, rejected
  rating: integer("rating"), // Optional rating 1-5
  currentPage: text("current_page"), // The page from which feedback was submitted
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [chatMessages.receiverId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const insertChatMessageSchema = createInsertSchema(chatMessages, {
  id: z.number().optional(),
  timestamp: z.date().optional(),
});

export const insertFeedbackSchema = createInsertSchema(feedback)
  .pick({
    userId: true,
    category: true,
    title: true,
    content: true,
    rating: true,
    currentPage: true,
  });

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export const insertRecyclingCenterSchema = createInsertSchema(recyclingCenters)
  .pick({
    name: true,
    operator: true,
    location: true,
    facilityType: true,
    wasteTypes: true,
    address: true,
    city: true,
    county: true,
    poBox: true,
    latitude: true,
    longitude: true,
  });

export type InsertRecyclingCenter = z.infer<typeof insertRecyclingCenterSchema>;
export type RecyclingCenter = typeof recyclingCenters.$inferSelect;

// User-to-user ratings table
export const userRatings = pgTable("user_ratings", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => collections.id),
  raterId: integer("rater_id").notNull().references(() => users.id),
  rateeId: integer("ratee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRatingsRelations = relations(userRatings, ({ one }) => ({
  rater: one(users, {
    fields: [userRatings.raterId],
    references: [users.id],
  }),
  ratee: one(users, {
    fields: [userRatings.rateeId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [userRatings.collectionId],
    references: [collections.id],
  }),
}));

export const insertUserRatingSchema = createInsertSchema(userRatings)
  .pick({
    collectionId: true,
    raterId: true,
    rateeId: true,
    rating: true,
    comment: true,
  });

export type InsertUserRating = z.infer<typeof insertUserRatingSchema>;
export type UserRating = typeof userRatings.$inferSelect;

export const PaymentStatus = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  collectionId: integer("collection_id").references(() => collections.id),
  amount: real("amount").notNull(),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull().default(PaymentStatus.PENDING),
  merchantRequestId: text("merchant_request_id"),
  checkoutRequestId: text("checkout_request_id"),
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  resultCode: integer("result_code"),
  resultDesc: text("result_desc"),
  transactionDate: text("transaction_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [payments.collectionId],
    references: [collections.id],
  }),
}));

export const insertPaymentSchema = createInsertSchema(payments)
  .pick({
    userId: true,
    collectionId: true,
    amount: true,
    phoneNumber: true,
    status: true,
    merchantRequestId: true,
    checkoutRequestId: true,
  });

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
