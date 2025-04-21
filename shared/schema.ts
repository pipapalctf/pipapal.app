import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User roles
export const UserRole = {
  HOUSEHOLD: 'household',
  COLLECTOR: 'collector',
  RECYCLER: 'recycler',
  ORGANIZATION: 'organization'
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

// Material listing status
export const MaterialStatus = {
  AVAILABLE: 'available',
  PENDING_SALE: 'pending_sale',
  SOLD: 'sold',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn'
} as const;

export type MaterialStatusType = typeof MaterialStatus[keyof typeof MaterialStatus];

export type BadgeTypeValue = typeof BadgeType[keyof typeof BadgeType];

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
  location: json("location"), // { lat: number, lng: number }
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

// Material listings table
export const materialListings = pgTable("material_listings", {
  id: serial("id").primaryKey(),
  collectorId: integer("collector_id").notNull(),
  collectionId: integer("collection_id").notNull(),
  materialType: text("material_type").notNull(),
  quantity: real("quantity").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  status: text("status").notNull().default(MaterialStatus.AVAILABLE),
  price: real("price"), // Optional price per kg
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Material bids table
export const materialBids = pgTable("material_bids", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull(),
  recyclerId: integer("recycler_id").notNull(),
  amount: real("amount").notNull(), // Bid amount in KES
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
    location: true,
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

export const insertMaterialListingSchema = createInsertSchema(materialListings)
  .pick({
    collectorId: true,
    collectionId: true,
    materialType: true,
    quantity: true,
    description: true,
    location: true,
    status: true,
    price: true,
  });

export const insertMaterialBidSchema = createInsertSchema(materialBids)
  .pick({
    materialId: true,
    recyclerId: true,
    amount: true,
    message: true,
    status: true,
  });

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  impacts: many(impacts),
  badges: many(badges),
  activities: many(activities),
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

export const materialListingsRelations = relations(materialListings, ({ one, many }) => ({
  collector: one(users, {
    fields: [materialListings.collectorId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [materialListings.collectionId],
    references: [collections.id],
  }),
  bids: many(materialBids),
}));

export const materialBidsRelations = relations(materialBids, ({ one }) => ({
  material: one(materialListings, {
    fields: [materialBids.materialId],
    references: [materialListings.id],
  }),
  recycler: one(users, {
    fields: [materialBids.recyclerId],
    references: [users.id],
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

export type InsertMaterialListing = z.infer<typeof insertMaterialListingSchema>;
export type MaterialListing = typeof materialListings.$inferSelect;

export type InsertMaterialBid = z.infer<typeof insertMaterialBidSchema>;
export type MaterialBid = typeof materialBids.$inferSelect;
