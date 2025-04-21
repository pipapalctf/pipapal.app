import { 
  users, type User, type InsertUser,
  collections, type Collection, type InsertCollection,
  impacts, type Impact, type InsertImpact,
  badges, type Badge, type InsertBadge,
  ecoTips, type EcoTip, type InsertEcoTip,
  activities, type Activity, type InsertActivity,
  materialListings, type MaterialListing, type InsertMaterialListing,
  materialBids, type MaterialBid, type InsertMaterialBid,
  CollectionStatus, MaterialStatus
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
  getAllCollections(): Promise<Collection[]>;
  getCollectionsByUser(userId: number): Promise<Collection[]>;
  getUpcomingCollectionsByUser(userId: number): Promise<Collection[]>;
  getCompletedCollectionsByCollector(collectorId: number): Promise<Collection[]>;
  getAllCompletedCollections(): Promise<Collection[]>;
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
  getTotalImpactByCollector(collectorId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }>;
  getTotalImpactByRecycler(recyclerId: number): Promise<{
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
  
  // Material Listings
  getMaterialListing(id: number): Promise<MaterialListing | undefined>;
  getMaterialListingsByCollector(collectorId: number): Promise<MaterialListing[]>;
  getAvailableMaterialListings(): Promise<MaterialListing[]>;
  createMaterialListing(listing: InsertMaterialListing): Promise<MaterialListing>;
  updateMaterialListing(id: number, updates: Partial<MaterialListing>): Promise<MaterialListing | undefined>;
  
  // Material Bids
  getMaterialBid(id: number): Promise<MaterialBid | undefined>;
  getMaterialBidsByMaterial(materialId: number): Promise<MaterialBid[]>;
  getMaterialBidsByRecycler(recyclerId: number): Promise<MaterialBid[]>;
  createMaterialBid(bid: InsertMaterialBid): Promise<MaterialBid>;
  updateMaterialBid(id: number, updates: Partial<MaterialBid>): Promise<MaterialBid | undefined>;
  
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
  private materialListings: Map<number, MaterialListing>;
  private materialBids: Map<number, MaterialBid>;
  sessionStore: any; // Using any for express-session store type
  currentUserId: number;
  currentCollectionId: number;
  currentImpactId: number;
  currentBadgeId: number;
  currentEcoTipId: number;
  currentActivityId: number;
  currentMaterialListingId: number;
  currentMaterialBidId: number;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.impacts = new Map();
    this.badges = new Map();
    this.ecoTips = new Map();
    this.activities = new Map();
    this.materialListings = new Map();
    this.materialBids = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentUserId = 1;
    this.currentCollectionId = 1;
    this.currentImpactId = 1;
    this.currentBadgeId = 1;
    this.currentEcoTipId = 1;
    this.currentActivityId = 1;
    this.currentMaterialListingId = 1;
    this.currentMaterialBidId = 1;
    
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
  
  async getAllCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
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
  
  async getCompletedCollectionsByCollector(collectorId: number): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => 
        collection.collectorId === collectorId && 
        collection.status === CollectionStatus.COMPLETED
      )
      .sort((a, b) => new Date(b.completedDate || b.scheduledDate).getTime() - new Date(a.completedDate || a.scheduledDate).getTime());
  }
  
  async getAllCompletedCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => collection.status === CollectionStatus.COMPLETED)
      .sort((a, b) => new Date(b.completedDate || b.scheduledDate).getTime() - new Date(a.completedDate || a.scheduledDate).getTime());
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

  async getTotalImpactByCollector(collectorId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }> {
    // Get all collections completed by this collector
    const collections = Array.from(this.collections.values())
      .filter(collection => 
        collection.collectorId === collectorId && 
        collection.status === 'completed' &&
        collection.wasteAmount !== null
      );
    
    // Calculate impact based on waste amount
    const impactFactors = {
      waterSaved: 50, // liters of water saved per kg
      co2Reduced: 2, // kg of CO2 reduced per kg of waste
      treesEquivalent: 0.01, // trees saved per kg
      energyConserved: 5 // kWh conserved per kg
    };
    
    return collections.reduce((totals, collection) => {
      const wasteAmount = collection.wasteAmount || 0;
      return {
        waterSaved: totals.waterSaved + (wasteAmount * impactFactors.waterSaved),
        co2Reduced: totals.co2Reduced + (wasteAmount * impactFactors.co2Reduced),
        treesEquivalent: totals.treesEquivalent + (wasteAmount * impactFactors.treesEquivalent),
        energyConserved: totals.energyConserved + (wasteAmount * impactFactors.energyConserved),
        wasteAmount: totals.wasteAmount + wasteAmount
      };
    }, {
      waterSaved: 0,
      co2Reduced: 0,
      treesEquivalent: 0,
      energyConserved: 0,
      wasteAmount: 0
    });
  }
  
  async getTotalImpactByRecycler(recyclerId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }> {
    // For recyclers, we calculate impact based on all completed collections
    // since they process all types of waste (in a real app, this would be filtered to materials they've purchased)
    const allCompletedCollections = Array.from(this.collections.values())
      .filter(collection => 
        collection.status === 'completed' &&
        collection.wasteAmount !== null
      );
    
    // Calculate impact based on waste amount
    const impactFactors = {
      waterSaved: 50, // liters of water saved per kg
      co2Reduced: 2, // kg of CO2 reduced per kg of waste
      treesEquivalent: 0.01, // trees saved per kg
      energyConserved: 5 // kWh conserved per kg
    };
    
    return allCompletedCollections.reduce((totals, collection) => {
      const wasteAmount = collection.wasteAmount || 0;
      return {
        waterSaved: totals.waterSaved + (wasteAmount * impactFactors.waterSaved),
        co2Reduced: totals.co2Reduced + (wasteAmount * impactFactors.co2Reduced),
        treesEquivalent: totals.treesEquivalent + (wasteAmount * impactFactors.treesEquivalent),
        energyConserved: totals.energyConserved + (wasteAmount * impactFactors.energyConserved),
        wasteAmount: totals.wasteAmount + wasteAmount
      };
    }, {
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
  
  // Material Listings
  async getMaterialListing(id: number): Promise<MaterialListing | undefined> {
    return this.materialListings.get(id);
  }
  
  async getMaterialListingsByCollector(collectorId: number): Promise<MaterialListing[]> {
    return Array.from(this.materialListings.values())
      .filter(listing => listing.collectorId === collectorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getAvailableMaterialListings(): Promise<MaterialListing[]> {
    return Array.from(this.materialListings.values())
      .filter(listing => listing.status === MaterialStatus.AVAILABLE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createMaterialListing(insertListing: InsertMaterialListing): Promise<MaterialListing> {
    const id = this.currentMaterialListingId++;
    const now = new Date();
    const listing: MaterialListing = {
      ...insertListing,
      id,
      status: insertListing.status || MaterialStatus.AVAILABLE,
      createdAt: now,
      updatedAt: now
    };
    this.materialListings.set(id, listing);
    
    // Create activity for the collector
    await this.createActivity({
      userId: listing.collectorId,
      activityType: 'material_listed',
      description: `Listed ${listing.quantity}kg of ${listing.materialType} for sale`
    });
    
    return listing;
  }
  
  async updateMaterialListing(id: number, updates: Partial<MaterialListing>): Promise<MaterialListing | undefined> {
    const listing = this.materialListings.get(id);
    if (!listing) return undefined;
    
    const now = new Date();
    const updatedListing = { 
      ...listing, 
      ...updates,
      updatedAt: now
    };
    this.materialListings.set(id, updatedListing);
    
    // If status changed to sold, create activity
    if (updates.status === MaterialStatus.SOLD && listing.status !== MaterialStatus.SOLD) {
      await this.createActivity({
        userId: listing.collectorId,
        activityType: 'material_sold',
        description: `Sold ${listing.quantity}kg of ${listing.materialType}`
      });
    }
    
    return updatedListing;
  }
  
  // Material Bids
  async getMaterialBid(id: number): Promise<MaterialBid | undefined> {
    return this.materialBids.get(id);
  }
  
  async getMaterialBidsByMaterial(materialId: number): Promise<MaterialBid[]> {
    return Array.from(this.materialBids.values())
      .filter(bid => bid.materialId === materialId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getMaterialBidsByRecycler(recyclerId: number): Promise<MaterialBid[]> {
    return Array.from(this.materialBids.values())
      .filter(bid => bid.recyclerId === recyclerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createMaterialBid(insertBid: InsertMaterialBid): Promise<MaterialBid> {
    const id = this.currentMaterialBidId++;
    const now = new Date();
    const bid: MaterialBid = {
      ...insertBid,
      id,
      status: insertBid.status || 'pending',
      createdAt: now,
      updatedAt: now
    };
    this.materialBids.set(id, bid);
    
    // Create activity for the recycler
    await this.createActivity({
      userId: bid.recyclerId,
      activityType: 'bid_placed',
      description: `Placed a bid of KES ${bid.amount} on a material listing`
    });
    
    // Also fetch the material listing and collector to notify them
    const listing = await this.getMaterialListing(bid.materialId);
    if (listing) {
      // Create activity for the collector
      await this.createActivity({
        userId: listing.collectorId,
        activityType: 'bid_received',
        description: `Received a bid of KES ${bid.amount} on your ${listing.materialType} listing`
      });
    }
    
    return bid;
  }
  
  async updateMaterialBid(id: number, updates: Partial<MaterialBid>): Promise<MaterialBid | undefined> {
    const bid = this.materialBids.get(id);
    if (!bid) return undefined;
    
    const now = new Date();
    const updatedBid = { 
      ...bid, 
      ...updates,
      updatedAt: now
    };
    this.materialBids.set(id, updatedBid);
    
    // If bid was accepted, update material listing status
    if (updates.status === 'accepted' && bid.status !== 'accepted') {
      const listing = await this.getMaterialListing(bid.materialId);
      if (listing) {
        await this.updateMaterialListing(listing.id, {
          status: MaterialStatus.SOLD
        });
        
        // Create activities for both parties
        await this.createActivity({
          userId: bid.recyclerId,
          activityType: 'bid_accepted',
          description: `Your bid was accepted for ${listing.materialType} material`
        });
        
        await this.createActivity({
          userId: listing.collectorId,
          activityType: 'bid_accepted',
          description: `You accepted a bid for your ${listing.materialType} material`
        });
      }
    }
    
    return updatedBid;
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
  
  async getAllCollections(): Promise<Collection[]> {
    return db.select().from(collections)
      .orderBy(desc(collections.scheduledDate));
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
  
  async getCompletedCollectionsByCollector(collectorId: number): Promise<Collection[]> {
    return db.select().from(collections)
      .where(and(
        eq(collections.collectorId, collectorId),
        eq(collections.status, CollectionStatus.COMPLETED)
      ))
      .orderBy(desc(collections.completedDate));
  }
  
  async getAllCompletedCollections(): Promise<Collection[]> {
    return db.select().from(collections)
      .where(eq(collections.status, CollectionStatus.COMPLETED))
      .orderBy(desc(collections.completedDate));
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
    
    // Use direct SQL for date handling to bypass any ORM serialization issues
    let query = db.update(collections).where(eq(collections.id, id));
    
    // Build the update clauses manually
    const setValues: Record<string, any> = {};
    
    // Handle regular fields
    if (updates.status !== undefined) setValues.status = updates.status;
    if (updates.notes !== undefined) setValues.notes = updates.notes;
    if (updates.wasteAmount !== undefined) setValues.waste_amount = updates.wasteAmount;
    if (updates.collectorId !== undefined) setValues.collector_id = updates.collectorId;
    
    // Handle completedDate separately
    if (updates.status === CollectionStatus.COMPLETED && !collection.completedDate) {
      setValues.completed_date = sql`NOW()`; // Use the database's NOW() function
    }
    
    // Execute the update
    const [updatedCollection] = await query.set(setValues).returning();
    
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
  
  async getTotalImpactByCollector(collectorId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }> {
    // Get all collections completed by this collector
    const collectorCollections = await db.select()
      .from(collections)
      .where(and(
        eq(collections.collectorId, collectorId),
        eq(collections.status, CollectionStatus.COMPLETED)
      ));
    
    // Calculate impact based on waste amount
    const impactFactors = {
      waterSaved: 50, // liters of water saved per kg
      co2Reduced: 2, // kg of CO2 reduced per kg of waste
      treesEquivalent: 0.01, // trees saved per kg
      energyConserved: 5 // kWh conserved per kg
    };
    
    return collectorCollections.reduce((totals, collection) => {
      const wasteAmount = collection.wasteAmount || 0;
      return {
        waterSaved: totals.waterSaved + (wasteAmount * impactFactors.waterSaved),
        co2Reduced: totals.co2Reduced + (wasteAmount * impactFactors.co2Reduced),
        treesEquivalent: totals.treesEquivalent + (wasteAmount * impactFactors.treesEquivalent),
        energyConserved: totals.energyConserved + (wasteAmount * impactFactors.energyConserved),
        wasteAmount: totals.wasteAmount + wasteAmount
      };
    }, {
      waterSaved: 0,
      co2Reduced: 0,
      treesEquivalent: 0,
      energyConserved: 0,
      wasteAmount: 0
    });
  }
  
  async getTotalImpactByRecycler(recyclerId: number): Promise<{
    waterSaved: number;
    co2Reduced: number;
    treesEquivalent: number;
    energyConserved: number;
    wasteAmount: number;
  }> {
    // For recyclers, we calculate impact based on all completed collections
    // In a real app, this would be filtered to materials they've processed
    const completedCollections = await db.select()
      .from(collections)
      .where(eq(collections.status, CollectionStatus.COMPLETED));
    
    // Calculate impact based on waste amount
    const impactFactors = {
      waterSaved: 50, // liters of water saved per kg
      co2Reduced: 2, // kg of CO2 reduced per kg of waste
      treesEquivalent: 0.01, // trees saved per kg
      energyConserved: 5 // kWh conserved per kg
    };
    
    return completedCollections.reduce((totals, collection) => {
      const wasteAmount = collection.wasteAmount || 0;
      return {
        waterSaved: totals.waterSaved + (wasteAmount * impactFactors.waterSaved),
        co2Reduced: totals.co2Reduced + (wasteAmount * impactFactors.co2Reduced),
        treesEquivalent: totals.treesEquivalent + (wasteAmount * impactFactors.treesEquivalent),
        energyConserved: totals.energyConserved + (wasteAmount * impactFactors.energyConserved),
        wasteAmount: totals.wasteAmount + wasteAmount
      };
    }, {
      waterSaved: 0,
      co2Reduced: 0,
      treesEquivalent: 0,
      energyConserved: 0,
      wasteAmount: 0
    });
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
  
  // Material Listings
  async getMaterialListing(id: number): Promise<MaterialListing | undefined> {
    const [listing] = await db.select().from(materialListings).where(eq(materialListings.id, id));
    return listing;
  }
  
  async getMaterialListingsByCollector(collectorId: number): Promise<MaterialListing[]> {
    return db.select().from(materialListings)
      .where(eq(materialListings.collectorId, collectorId))
      .orderBy(desc(materialListings.createdAt));
  }
  
  async getAvailableMaterialListings(): Promise<MaterialListing[]> {
    return db.select().from(materialListings)
      .where(eq(materialListings.status, MaterialStatus.AVAILABLE))
      .orderBy(desc(materialListings.createdAt));
  }
  
  async createMaterialListing(insertListing: InsertMaterialListing): Promise<MaterialListing> {
    const [listing] = await db.insert(materialListings)
      .values(insertListing)
      .returning();
    
    // Create activity for the collector
    await this.createActivity({
      userId: listing.collectorId,
      activityType: 'material_listed',
      description: `Listed ${listing.quantity}kg of ${listing.materialType} for sale`
    });
    
    return listing;
  }
  
  async updateMaterialListing(id: number, updates: Partial<MaterialListing>): Promise<MaterialListing | undefined> {
    const [listing] = await db.select().from(materialListings).where(eq(materialListings.id, id));
    if (!listing) return undefined;
    
    const [updatedListing] = await db.update(materialListings)
      .set(updates)
      .where(eq(materialListings.id, id))
      .returning();
    
    // If status changed to sold, create activity
    if (updates.status === MaterialStatus.SOLD && listing.status !== MaterialStatus.SOLD) {
      await this.createActivity({
        userId: listing.collectorId,
        activityType: 'material_sold',
        description: `Sold ${listing.quantity}kg of ${listing.materialType}`
      });
    }
    
    return updatedListing;
  }
  
  // Material Bids
  async getMaterialBid(id: number): Promise<MaterialBid | undefined> {
    const [bid] = await db.select().from(materialBids).where(eq(materialBids.id, id));
    return bid;
  }
  
  async getMaterialBidsByMaterial(materialId: number): Promise<MaterialBid[]> {
    return db.select().from(materialBids)
      .where(eq(materialBids.materialId, materialId))
      .orderBy(desc(materialBids.createdAt));
  }
  
  async getMaterialBidsByRecycler(recyclerId: number): Promise<MaterialBid[]> {
    return db.select().from(materialBids)
      .where(eq(materialBids.recyclerId, recyclerId))
      .orderBy(desc(materialBids.createdAt));
  }
  
  async createMaterialBid(insertBid: InsertMaterialBid): Promise<MaterialBid> {
    const [bid] = await db.insert(materialBids)
      .values(insertBid)
      .returning();
    
    // Create activity for the recycler
    await this.createActivity({
      userId: bid.recyclerId,
      activityType: 'bid_placed',
      description: `Placed a bid of KES ${bid.amount} on a material listing`
    });
    
    // Also fetch the material listing and collector to notify them
    const listing = await this.getMaterialListing(bid.materialId);
    if (listing) {
      // Create activity for the collector
      await this.createActivity({
        userId: listing.collectorId,
        activityType: 'bid_received',
        description: `Received a bid of KES ${bid.amount} on your ${listing.materialType} listing`
      });
    }
    
    return bid;
  }
  
  async updateMaterialBid(id: number, updates: Partial<MaterialBid>): Promise<MaterialBid | undefined> {
    const [bid] = await db.select().from(materialBids).where(eq(materialBids.id, id));
    if (!bid) return undefined;
    
    const [updatedBid] = await db.update(materialBids)
      .set(updates)
      .where(eq(materialBids.id, id))
      .returning();
    
    // If bid was accepted, update material listing status
    if (updates.status === 'accepted' && bid.status !== 'accepted') {
      const listing = await this.getMaterialListing(bid.materialId);
      if (listing) {
        await this.updateMaterialListing(listing.id, {
          status: MaterialStatus.SOLD
        });
        
        // Create activities for both parties
        await this.createActivity({
          userId: bid.recyclerId,
          activityType: 'bid_accepted',
          description: `Your bid was accepted for ${listing.materialType} material`
        });
        
        await this.createActivity({
          userId: listing.collectorId,
          activityType: 'bid_accepted',
          description: `You accepted a bid for your ${listing.materialType} material`
        });
      }
    }
    
    return updatedBid;
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
