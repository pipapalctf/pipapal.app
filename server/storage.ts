import { 
  users, type User, type InsertUser,
  collections, type Collection, type InsertCollection,
  impacts, type Impact, type InsertImpact,
  badges, type Badge, type InsertBadge,
  ecoTips, type EcoTip, type InsertEcoTip,
  activities, type Activity, type InsertActivity,
  CollectionStatus
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { and, eq, desc, gte, ne, sql, sum } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Collections
  getCollection(id: number): Promise<Collection | undefined>;
  getCollectionsByUser(userId: number): Promise<Collection[]>;
  getUpcomingCollectionsByUser(userId: number): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined>;
  
  // Impact Data
  getImpactsByUser(userId: number): Promise<Impact[]>;
  getTotalImpactByUser(userId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }>;
  createImpact(impact: InsertImpact): Promise<Impact>;
  
  // Badges
  getBadgesByUser(userId: number): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // EcoTips
  getEcoTips(): Promise<EcoTip[]>;
  getEcoTip(id: number): Promise<EcoTip | undefined>;
  createEcoTip(ecoTip: InsertEcoTip): Promise<EcoTip>;
  
  // Activities
  getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collections: Map<number, Collection>;
  private impacts: Map<number, Impact>;
  private badges: Map<number, Badge>;
  private ecoTips: Map<number, EcoTip>;
  private activities: Map<number, Activity>;
  sessionStore: any; // Using any for express-session store type
  currentUserId: number;
  currentCollectionId: number;
  currentImpactId: number;
  currentBadgeId: number;
  currentEcoTipId: number;
  currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.impacts = new Map();
    this.badges = new Map();
    this.ecoTips = new Map();
    this.activities = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentUserId = 1;
    this.currentCollectionId = 1;
    this.currentImpactId = 1;
    this.currentBadgeId = 1;
    this.currentEcoTipId = 1;
    this.currentActivityId = 1;
    
    // Seed eco-tips
    this.seedEcoTips();
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      sustainabilityScore: 0,
      createdAt: now 
    };
    this.users.set(id, user);
    
    // Create initial impact record for user
    await this.createImpact({
      userId: id,
      waterSaved: 0,
      co2Reduced: 0,
      treesEquivalent: 0,
      energyConserved: 0,
      wasteAmount: 0,
    });
    
    // Award eco starter badge to new users
    await this.createBadge({
      userId: id,
      badgeType: 'eco_starter'
    });
    
    // Create welcome activity
    await this.createActivity({
      userId: id,
      activityType: 'registration',
      description: 'Joined PipaPal'
    });
    
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Collections
  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }
  
  async getCollectionsByUser(userId: number): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => collection.userId === userId)
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }
  
  async getUpcomingCollectionsByUser(userId: number): Promise<Collection[]> {
    const now = new Date();
    return Array.from(this.collections.values())
      .filter(collection => 
        collection.userId === userId && 
        new Date(collection.scheduledDate) >= now &&
        collection.status !== CollectionStatus.CANCELLED
      )
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }
  
  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.currentCollectionId++;
    const now = new Date();
    const collection: Collection = {
      ...insertCollection,
      id,
      collectorId: null,
      completedDate: null,
      wasteAmount: null,
      createdAt: now
    };
    this.collections.set(id, collection);
    
    // Create activity
    await this.createActivity({
      userId: collection.userId,
      activityType: 'collection_scheduled',
      description: `Scheduled a ${collection.wasteType} waste collection`
    });
    
    return collection;
  }
  
  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updatedCollection = { ...collection, ...updates };
    this.collections.set(id, updatedCollection);
    
    // If collection is completed, generate impact data
    if (updates.status === CollectionStatus.COMPLETED && updates.wasteAmount) {
      const wasteAmount = updates.wasteAmount;
      
      // Generate impact based on waste amount (simplified calculation)
      await this.createImpact({
        userId: collection.userId,
        collectionId: id,
        waterSaved: wasteAmount * 10, // 10 liters per kg
        co2Reduced: wasteAmount * 2.5, // 2.5 kg per kg waste
        treesEquivalent: wasteAmount * 0.1, // 0.1 trees per kg waste
        energyConserved: wasteAmount * 5, // 5 kWh per kg waste
        wasteAmount: wasteAmount
      });
      
      // Add activity
      await this.createActivity({
        userId: collection.userId,
        activityType: 'collection_completed',
        description: `Completed a ${collection.wasteType} waste collection`
      });
      
      // Update user's sustainability score
      const user = await this.getUser(collection.userId);
      if (user) {
        const scoreIncrease = Math.round(wasteAmount * 5);
        await this.updateUser(user.id, {
          sustainabilityScore: (user.sustainabilityScore || 0) + scoreIncrease
        });
        
        // Add score activity
        await this.createActivity({
          userId: user.id,
          activityType: 'score_increase',
          description: `Sustainability score increased by ${scoreIncrease} points`
        });
      }
    }
    
    return updatedCollection;
  }
  
  // Impact
  async getImpactsByUser(userId: number): Promise<Impact[]> {
    return Array.from(this.impacts.values())
      .filter(impact => impact.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getTotalImpactByUser(userId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }> {
    const impacts = await this.getImpactsByUser(userId);
    
    return impacts.reduce((totals, impact) => ({
      waterSaved: totals.waterSaved + (impact.waterSaved || 0),
      co2Reduced: totals.co2Reduced + (impact.co2Reduced || 0),
      treesEquivalent: totals.treesEquivalent + (impact.treesEquivalent || 0),
      energyConserved: totals.energyConserved + (impact.energyConserved || 0),
      wasteAmount: totals.wasteAmount + (impact.wasteAmount || 0)
    }), {
      waterSaved: 0,
      co2Reduced: 0,
      treesEquivalent: 0,
      energyConserved: 0,
      wasteAmount: 0
    });
  }
  
  async createImpact(insertImpact: InsertImpact): Promise<Impact> {
    const id = this.currentImpactId++;
    const now = new Date();
    const impact: Impact = {
      ...insertImpact,
      id,
      createdAt: now
    };
    this.impacts.set(id, impact);
    return impact;
  }
  
  // Badges
  async getBadgesByUser(userId: number): Promise<Badge[]> {
    return Array.from(this.badges.values())
      .filter(badge => badge.userId === userId)
      .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
  }
  
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = this.currentBadgeId++;
    const now = new Date();
    const badge: Badge = {
      ...insertBadge,
      id,
      awardedAt: now
    };
    this.badges.set(id, badge);
    
    // Create badge activity
    await this.createActivity({
      userId: insertBadge.userId,
      activityType: 'badge_earned',
      description: `Earned the ${insertBadge.badgeType} badge`
    });
    
    return badge;
  }
  
  // EcoTips
  async getEcoTips(): Promise<EcoTip[]> {
    return Array.from(this.ecoTips.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getEcoTip(id: number): Promise<EcoTip | undefined> {
    return this.ecoTips.get(id);
  }
  
  async createEcoTip(insertEcoTip: InsertEcoTip): Promise<EcoTip> {
    const id = this.currentEcoTipId++;
    const now = new Date();
    const ecoTip: EcoTip = {
      ...insertEcoTip,
      id,
      createdAt: now
    };
    this.ecoTips.set(id, ecoTip);
    return ecoTip;
  }
  
  // Activities
  async getActivitiesByUser(userId: number, limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: now
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Seed initial data
  private async seedEcoTips() {
    const tips = [
      {
        category: 'composting',
        title: 'Composting Kitchen Waste',
        content: 'Turn your kitchen scraps into nutrient-rich soil. Start with a small bin and add fruit and vegetable peels.',
        icon: 'lightbulb'
      },
      {
        category: 'water',
        title: 'Reduce Water Usage',
        content: 'Fix leaky faucets and install low-flow showerheads to save up to 2,700 gallons of water per year.',
        icon: 'tint'
      },
      {
        category: 'shopping',
        title: 'Reusable Shopping Bags',
        content: 'Keep reusable bags in your car or by the door to avoid using plastic bags when shopping.',
        icon: 'shopping-bag'
      },
      {
        category: 'energy',
        title: 'Unplug Electronics',
        content: 'Unplug chargers and appliances when not in use to prevent phantom energy consumption.',
        icon: 'bolt'
      },
      {
        category: 'recycling',
        title: 'Proper Recycling Sorting',
        content: 'Rinse containers before recycling and learn your local recycling guidelines to maximize effectiveness.',
        icon: 'recycle'
      }
    ];
    
    for (const tip of tips) {
      await this.createEcoTip(tip);
    }
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for express-session store type

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed eco-tips if none exist
    this.seedEcoTipsIfNoneExist();
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values({
        ...insertUser,
        sustainabilityScore: 0,
      })
      .returning();
    
    // Create initial impact record for user
    await this.createImpact({
      userId: user.id,
      waterSaved: 0,
      co2Reduced: 0,
      treesEquivalent: 0,
      energyConserved: 0,
      wasteAmount: 0,
    });
    
    // Award eco starter badge to new users
    await this.createBadge({
      userId: user.id,
      badgeType: 'eco_starter'
    });
    
    // Create welcome activity
    await this.createActivity({
      userId: user.id,
      activityType: 'registration',
      description: 'Joined PipaPal'
    });
    
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  // Collections
  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }
  
  async getCollectionsByUser(userId: number): Promise<Collection[]> {
    return db.select().from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.scheduledDate));
  }
  
  async getUpcomingCollectionsByUser(userId: number): Promise<Collection[]> {
    const now = new Date();
    return db.select().from(collections)
      .where(and(
        eq(collections.userId, userId),
        gte(collections.scheduledDate, now),
        ne(collections.status, CollectionStatus.CANCELLED)
      ))
      .orderBy(collections.scheduledDate);
  }
  
  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db.insert(collections)
      .values(insertCollection)
      .returning();
    
    // Create activity
    await this.createActivity({
      userId: collection.userId,
      activityType: 'collection_scheduled',
      description: `Scheduled a ${collection.wasteType} waste collection`
    });
    
    return collection;
  }
  
  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    if (!collection) return undefined;
    
    const [updatedCollection] = await db.update(collections)
      .set(updates)
      .where(eq(collections.id, id))
      .returning();
    
    // If collection is completed, generate impact data
    if (updates.status === CollectionStatus.COMPLETED && updates.wasteAmount) {
      const wasteAmount = updates.wasteAmount;
      
      // Generate impact based on waste amount (simplified calculation)
      await this.createImpact({
        userId: collection.userId,
        collectionId: id,
        waterSaved: wasteAmount * 10, // 10 liters per kg
        co2Reduced: wasteAmount * 2.5, // 2.5 kg per kg waste
        treesEquivalent: wasteAmount * 0.1, // 0.1 trees per kg waste
        energyConserved: wasteAmount * 5, // 5 kWh per kg waste
        wasteAmount: wasteAmount
      });
      
      // Add activity
      await this.createActivity({
        userId: collection.userId,
        activityType: 'collection_completed',
        description: `Completed a ${collection.wasteType} waste collection`
      });
      
      // Update user's sustainability score
      const user = await this.getUser(collection.userId);
      if (user) {
        const scoreIncrease = Math.round(wasteAmount * 5);
        await this.updateUser(user.id, {
          sustainabilityScore: (user.sustainabilityScore || 0) + scoreIncrease
        });
        
        // Add score activity
        await this.createActivity({
          userId: user.id,
          activityType: 'score_increase',
          description: `Sustainability score increased by ${scoreIncrease} points`
        });
      }
    }
    
    return updatedCollection;
  }
  
  // Impact
  async getImpactsByUser(userId: number): Promise<Impact[]> {
    return db.select().from(impacts)
      .where(eq(impacts.userId, userId))
      .orderBy(desc(impacts.createdAt));
  }
  
  async getTotalImpactByUser(userId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }> {
    // Query for the sum of impact values
    const [result] = await db.select({
      waterSaved: sql<number>`COALESCE(SUM(${impacts.waterSaved}), 0)`,
      co2Reduced: sql<number>`COALESCE(SUM(${impacts.co2Reduced}), 0)`,
      treesEquivalent: sql<number>`COALESCE(SUM(${impacts.treesEquivalent}), 0)`,
      energyConserved: sql<number>`COALESCE(SUM(${impacts.energyConserved}), 0)`,
      wasteAmount: sql<number>`COALESCE(SUM(${impacts.wasteAmount}), 0)`
    })
    .from(impacts)
    .where(eq(impacts.userId, userId));
    
    return {
      waterSaved: result.waterSaved || 0,
      co2Reduced: result.co2Reduced || 0,
      treesEquivalent: result.treesEquivalent || 0,
      energyConserved: result.energyConserved || 0,
      wasteAmount: result.wasteAmount || 0
    };
  }
  
  async createImpact(insertImpact: InsertImpact): Promise<Impact> {
    const [impact] = await db.insert(impacts)
      .values(insertImpact)
      .returning();
    
    return impact;
  }
  
  // Badges
  async getBadgesByUser(userId: number): Promise<Badge[]> {
    return db.select().from(badges)
      .where(eq(badges.userId, userId))
      .orderBy(desc(badges.awardedAt));
  }
  
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges)
      .values(insertBadge)
      .returning();
    
    // Create badge activity
    await this.createActivity({
      userId: insertBadge.userId,
      activityType: 'badge_earned',
      description: `Earned the ${insertBadge.badgeType} badge`
    });
    
    return badge;
  }
  
  // EcoTips
  async getEcoTips(): Promise<EcoTip[]> {
    return db.select().from(ecoTips)
      .orderBy(desc(ecoTips.createdAt));
  }
  
  async getEcoTip(id: number): Promise<EcoTip | undefined> {
    const [tip] = await db.select().from(ecoTips).where(eq(ecoTips.id, id));
    return tip;
  }
  
  async createEcoTip(insertEcoTip: InsertEcoTip): Promise<EcoTip> {
    const [ecoTip] = await db.insert(ecoTips)
      .values(insertEcoTip)
      .returning();
    
    return ecoTip;
  }
  
  // Activities
  async getActivitiesByUser(userId: number, limit: number = 10): Promise<Activity[]> {
    return db.select().from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities)
      .values(insertActivity)
      .returning();
    
    return activity;
  }
  
  // Seed initial data
  private async seedEcoTipsIfNoneExist() {
    const tips = await this.getEcoTips();
    if (tips.length === 0) {
      const seedTips = [
        {
          category: 'composting',
          title: 'Composting Kitchen Waste',
          content: 'Turn your kitchen scraps into nutrient-rich soil. Start with a small bin and add fruit and vegetable peels.',
          icon: 'lightbulb'
        },
        {
          category: 'water',
          title: 'Reduce Water Usage',
          content: 'Fix leaky faucets and install low-flow showerheads to save up to 2,700 gallons of water per year.',
          icon: 'tint'
        },
        {
          category: 'shopping',
          title: 'Reusable Shopping Bags',
          content: 'Keep reusable bags in your car or by the door to avoid using plastic bags when shopping.',
          icon: 'shopping-bag'
        },
        {
          category: 'energy',
          title: 'Unplug Electronics',
          content: 'Unplug chargers and appliances when not in use to prevent phantom energy consumption.',
          icon: 'bolt'
        },
        {
          category: 'recycling',
          title: 'Proper Recycling Sorting',
          content: 'Rinse containers before recycling and learn your local recycling guidelines to maximize effectiveness.',
          icon: 'recycle'
        }
      ];
      
      for (const tip of seedTips) {
        await this.createEcoTip(tip);
      }
    }
  }
}

export const storage = new DatabaseStorage();
