import { 
  users, type User, type InsertUser,
  collections, type Collection, type InsertCollection,
  impacts, type Impact, type InsertImpact,
  recyclingCenters, type RecyclingCenter, type InsertRecyclingCenter,
  badges, type Badge, type InsertBadge,
  ecoTips, type EcoTip, type InsertEcoTip,
  activities, type Activity, type InsertActivity,
  materialInterests, type MaterialInterest, type InsertMaterialInterest,
  chatMessages, type ChatMessage, type InsertChatMessage,
  feedback, type Feedback, type InsertFeedback,
  CollectionStatus
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { and, eq, desc, gte, ne, sql, sum, inArray, or, isNotNull } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Collections
  getCollection(id: number): Promise<Collection | undefined>;
  getAllCollections(): Promise<Collection[]>;
  getCollectionsByUser(userId: number): Promise<Collection[]>;
  getUpcomingCollectionsByUser(userId: number): Promise<Collection[]>;
  getCompletedCollectionsByCollector(collectorId: number): Promise<Collection[]>;
  getActiveCollectionsByCollector(collectorId: number): Promise<Collection[]>;
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
  
  // Material Interests
  createMaterialInterest(interest: InsertMaterialInterest): Promise<MaterialInterest>;
  getMaterialInterestsByUser(userId: number): Promise<MaterialInterest[]>;
  getMaterialInterestsByCollections(collectionIds: number[]): Promise<MaterialInterest[]>;
  
  // Recycling Centers
  getAllRecyclingCenters(): Promise<RecyclingCenter[]>;
  getRecyclingCentersByCity(city: string): Promise<RecyclingCenter[]>;
  getRecyclingCentersByWasteType(wasteType: string): Promise<RecyclingCenter[]>;
  getRecyclingCenterById(id: number): Promise<RecyclingCenter | undefined>;
  createRecyclingCenter(center: InsertRecyclingCenter): Promise<RecyclingCenter>;
  
  // Chat Messages
  getChatMessages(userId1: number, userId2: number, limit?: number): Promise<ChatMessage[]>;
  getUsersWithChats(userId: number): Promise<User[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  sendChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  
  // Feedback
  getAllFeedback(): Promise<Feedback[]>;
  getFeedbackByUser(userId: number): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined>;
  
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
  private materialInterests: Map<number, MaterialInterest>;
  private recyclingCenters: Map<number, RecyclingCenter>;
  private chatMessages: Map<number, ChatMessage>;
  private feedback: Map<number, Feedback>;
  sessionStore: any; // Using any for express-session store type
  currentUserId: number;
  currentCollectionId: number;
  currentImpactId: number;
  currentBadgeId: number;
  currentEcoTipId: number;
  currentActivityId: number;
  currentMaterialInterestId: number;
  currentRecyclingCenterId: number;
  currentChatMessageId: number;
  currentFeedbackId: number;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.impacts = new Map();
    this.badges = new Map();
    this.ecoTips = new Map();
    this.activities = new Map();
    this.materialInterests = new Map();
    this.recyclingCenters = new Map();
    this.chatMessages = new Map();
    this.feedback = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentUserId = 1;
    this.currentCollectionId = 1;
    this.currentImpactId = 1;
    this.currentBadgeId = 1;
    this.currentEcoTipId = 1;
    this.currentActivityId = 1;
    this.currentMaterialInterestId = 1;
    this.currentRecyclingCenterId = 1;
    this.currentChatMessageId = 1;
    this.currentFeedbackId = 1;
    
    // Seed eco-tips
    this.seedEcoTips();
    
    // Seed some test collections for the recycler materials page
    this.seedTestCollections();
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
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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
  
  async getActiveCollectionsByCollector(collectorId: number): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => 
        collection.collectorId === collectorId && 
        (collection.status === CollectionStatus.COMPLETED || collection.status === CollectionStatus.IN_PROGRESS)
      )
      .sort((a, b) => new Date(b.completedDate || b.scheduledDate).getTime() - new Date(a.completedDate || a.scheduledDate).getTime());
  }
  
  async getAllCompletedCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => 
        // Include both completed collections and in-progress collections with a collector assigned
        collection.status === CollectionStatus.COMPLETED ||
        (collection.status === CollectionStatus.IN_PROGRESS && collection.collectorId)
      )
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
  
  // Material Interests
  async createMaterialInterest(insertInterest: InsertMaterialInterest): Promise<MaterialInterest> {
    const id = this.currentMaterialInterestId++;
    const now = new Date();
    const interest: MaterialInterest = {
      ...insertInterest,
      id,
      timestamp: now
    };
    this.materialInterests.set(id, interest);
    
    // Create activity for the recycler
    await this.createActivity({
      userId: insertInterest.userId,
      activityType: 'interest_expressed',
      description: `Expressed interest in materials from collection #${insertInterest.collectionId}`
    });
    
    return interest;
  }
  
  async getMaterialInterestsByUser(userId: number): Promise<MaterialInterest[]> {
    return Array.from(this.materialInterests.values())
      .filter(interest => interest.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getMaterialInterestsByCollections(collectionIds: number[]): Promise<MaterialInterest[]> {
    return Array.from(this.materialInterests.values())
      .filter(interest => collectionIds.includes(interest.collectionId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getMaterialInterest(id: number): Promise<MaterialInterest | undefined> {
    return this.materialInterests.get(id);
  }
  
  async updateMaterialInterest(id: number, updates: Partial<MaterialInterest>): Promise<MaterialInterest | undefined> {
    const interest = this.materialInterests.get(id);
    if (!interest) return undefined;
    
    const updatedInterest = { ...interest, ...updates };
    this.materialInterests.set(id, updatedInterest);
    return updatedInterest;
  }
  
  // Recycling Centers
  async getAllRecyclingCenters(): Promise<RecyclingCenter[]> {
    return Array.from(this.recyclingCenters.values());
  }
  
  async getRecyclingCentersByCity(city: string): Promise<RecyclingCenter[]> {
    return Array.from(this.recyclingCenters.values())
      .filter(center => center.city.toLowerCase() === city.toLowerCase());
  }
  
  async getRecyclingCentersByWasteType(wasteType: string): Promise<RecyclingCenter[]> {
    return Array.from(this.recyclingCenters.values())
      .filter(center => {
        if (!center.wasteTypes) return false;
        return center.wasteTypes.some(type => type.toLowerCase().includes(wasteType.toLowerCase()));
      });
  }
  
  async getRecyclingCenterById(id: number): Promise<RecyclingCenter | undefined> {
    return this.recyclingCenters.get(id);
  }
  
  async createRecyclingCenter(insertCenter: InsertRecyclingCenter): Promise<RecyclingCenter> {
    const id = this.currentRecyclingCenterId++;
    const now = new Date();
    
    const recyclingCenter: RecyclingCenter = {
      id,
      createdAt: now,
      ...insertCenter
    };
    
    this.recyclingCenters.set(id, recyclingCenter);
    return recyclingCenter;
  }
  
  // Chat functionality
  async getChatMessages(userId1: number, userId2: number, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) || 
        (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }
  
  async getUsersWithChats(userId: number): Promise<User[]> {
    // Get all unique user IDs that have exchanged messages with this user
    const userIds = new Set<number>();
    
    Array.from(this.chatMessages.values()).forEach(message => {
      if (message.senderId === userId) {
        userIds.add(message.receiverId);
      } else if (message.receiverId === userId) {
        userIds.add(message.senderId);
      }
    });
    
    // Get user objects for those IDs
    const users: User[] = [];
    for (const id of userIds) {
      const user = await this.getUser(id);
      if (user) {
        users.push(user);
      }
    }
    
    return users;
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.receiverId === userId && !message.read)
      .length;
  }
  
  async sendChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const now = new Date();
    
    const chatMessage: ChatMessage = {
      ...message,
      id,
      timestamp: now,
      read: false
    };
    
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
  
  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    // Find all unread messages from senderId to receiverId
    Array.from(this.chatMessages.values())
      .filter(message => 
        message.senderId === senderId && 
        message.receiverId === receiverId && 
        !message.read
      )
      .forEach(message => {
        // Update each message to mark it as read
        this.chatMessages.set(message.id, {
          ...message,
          read: true
        });
      });
  }
  
  // Feedback
  async getAllFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .filter(feedback => feedback.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentFeedbackId++;
    const now = new Date();
    const feedback: Feedback = {
      ...insertFeedback,
      id,
      status: "pending",
      createdAt: now
    };
    this.feedback.set(id, feedback);
    
    // Create activity record for submitting feedback
    await this.createActivity({
      userId: feedback.userId,
      activityType: 'feedback_submitted',
      description: `Submitted feedback: ${feedback.title}`
    });
    
    return feedback;
  }

  async updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined> {
    const feedback = this.feedback.get(id);
    if (!feedback) return undefined;
    
    const updatedFeedback = { ...feedback, status };
    this.feedback.set(id, updatedFeedback);
    return updatedFeedback;
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
  
  // This is just a helper method to debug collection filtering
  private async logCollectionCount() {
    try {
      // Get all collections
      const allCollections = await this.getAllCollections();
      
      // Count collections by status
      const statusCounts = allCollections.reduce((acc, collection) => {
        const status = collection.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Log counts
      console.log('Collection counts by status:', statusCounts);
      console.log(`Total collections: ${allCollections.length}`);
      
      // Count collections that are COMPLETED or IN_PROGRESS with a collector
      const filteredForRecycler = allCollections.filter(collection => 
        collection.status === CollectionStatus.COMPLETED || 
        (collection.status === CollectionStatus.IN_PROGRESS && collection.collectorId)
      );
      
      console.log(`Collections available for recyclers: ${filteredForRecycler.length}`);
      
      return allCollections;
    } catch (error) {
      console.error('Error logging collection count:', error);
      return [];
    }
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
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
  
  async getActiveCollectionsByCollector(collectorId: number): Promise<Collection[]> {
    return db.select().from(collections)
      .where(and(
        eq(collections.collectorId, collectorId),
        or(
          eq(collections.status, CollectionStatus.COMPLETED),
          eq(collections.status, CollectionStatus.IN_PROGRESS)
        )
      ))
      .orderBy(desc(collections.completedDate));
  }
  
  async getAllCompletedCollections(): Promise<Collection[]> {
    return db.select().from(collections)
      .where(
        or(
          eq(collections.status, CollectionStatus.COMPLETED),
          and(
            eq(collections.status, CollectionStatus.IN_PROGRESS),
            isNotNull(collections.collectorId)
          )
        )
      )
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
    
    // Create a single update object with all fields that need to be updated
    const updateValues: any = {};
    
    if (updates.status !== undefined) {
      updateValues.status = updates.status;
    }
    
    if (updates.notes !== undefined) {
      updateValues.notes = updates.notes;
    }
    
    if (updates.wasteAmount !== undefined) {
      updateValues.wasteAmount = updates.wasteAmount;
    }
    
    if (updates.collectorId !== undefined) {
      updateValues.collectorId = updates.collectorId;
    }
    
    // Handle completedDate separately
    if (updates.status === CollectionStatus.COMPLETED && !collection.completedDate) {
      updateValues.completedDate = sql`NOW()`; // Use the database's NOW() function
    }
    
    // Execute the update with all fields at once
    const [updatedCollection] = await db.update(collections)
      .set(updateValues)
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
  
  // Material Interests
  async createMaterialInterest(insertInterest: InsertMaterialInterest): Promise<MaterialInterest> {
    const [interest] = await db.insert(materialInterests)
      .values(insertInterest)
      .returning();
    
    // Create activity for the recycler
    await this.createActivity({
      userId: insertInterest.userId,
      activityType: 'interest_expressed',
      description: `Expressed interest in materials from collection #${insertInterest.collectionId}`
    });
    
    return interest;
  }
  
  async getMaterialInterestsByUser(userId: number): Promise<MaterialInterest[]> {
    return db.select().from(materialInterests)
      .where(eq(materialInterests.userId, userId))
      .orderBy(desc(materialInterests.timestamp));
  }
  
  async getMaterialInterestsByCollections(collectionIds: number[]): Promise<MaterialInterest[]> {
    if (collectionIds.length === 0) return [];
    
    // Use SQL IN operator with parameterized query to avoid SQL injection
    return db.select().from(materialInterests)
      .where(inArray(materialInterests.collectionId, collectionIds))
      .orderBy(desc(materialInterests.timestamp));
  }
  
  async getMaterialInterest(id: number): Promise<MaterialInterest | undefined> {
    try {
      const [interest] = await db.select()
        .from(materialInterests)
        .where(eq(materialInterests.id, id));
      return interest;
    } catch (error) {
      console.error('Error getting material interest:', error);
      return undefined;
    }
  }
  
  async updateMaterialInterest(id: number, updates: Partial<MaterialInterest>): Promise<MaterialInterest | undefined> {
    try {
      const [updatedInterest] = await db.update(materialInterests)
        .set(updates)
        .where(eq(materialInterests.id, id))
        .returning();
      return updatedInterest;
    } catch (error) {
      console.error('Error updating material interest:', error);
      return undefined;
    }
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
  
  // Chat Messages
  async getChatMessages(userId1: number, userId2: number, limit: number = 50): Promise<ChatMessage[]> {
    try {
      return await db.select()
        .from(chatMessages)
        .where(
          or(
            and(
              eq(chatMessages.senderId, userId1),
              eq(chatMessages.receiverId, userId2)
            ),
            and(
              eq(chatMessages.senderId, userId2),
              eq(chatMessages.receiverId, userId1)
            )
          )
        )
        .orderBy(chatMessages.timestamp)
        .limit(limit);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }
  
  async getUsersWithChats(userId: number): Promise<User[]> {
    try {
      // Get all unique user IDs that have exchanged messages with this user
      const senderIds = await db.select({ id: chatMessages.senderId })
        .from(chatMessages)
        .where(eq(chatMessages.receiverId, userId))
        .groupBy(chatMessages.senderId);
      
      const receiverIds = await db.select({ id: chatMessages.receiverId })
        .from(chatMessages)
        .where(eq(chatMessages.senderId, userId))
        .groupBy(chatMessages.receiverId);
      
      // Combine the IDs and remove duplicates
      const userIds = [...senderIds, ...receiverIds]
        .map(row => row.id)
        .filter((id, index, self) => self.indexOf(id) === index);
      
      if (userIds.length === 0) {
        return [];
      }
      
      // Get user objects for those IDs
      return await db.select()
        .from(users)
        .where(inArray(users.id, userIds));
    } catch (error) {
      console.error('Error fetching users with chats:', error);
      return [];
    }
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.receiverId, userId),
            eq(chatMessages.read, false)
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }
  
  async sendChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    try {
      const [chatMessage] = await db.insert(chatMessages)
        .values({
          ...message,
          read: false
        })
        .returning();
      
      return chatMessage;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw new Error('Failed to send message');
    }
  }
  
  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    try {
      await db.update(chatMessages)
        .set({ read: true })
        .where(
          and(
            eq(chatMessages.senderId, senderId),
            eq(chatMessages.receiverId, receiverId),
            eq(chatMessages.read, false)
          )
        );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Feedback
  async getAllFeedback(): Promise<Feedback[]> {
    try {
      return db.select().from(feedback)
        .orderBy(desc(feedback.createdAt));
    } catch (error) {
      console.error('Error getting all feedback:', error);
      return [];
    }
  }

  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
    try {
      return db.select().from(feedback)
        .where(eq(feedback.userId, userId))
        .orderBy(desc(feedback.createdAt));
    } catch (error) {
      console.error('Error getting feedback by user:', error);
      return [];
    }
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    try {
      const [feedbackEntry] = await db.insert(feedback)
        .values({
          ...insertFeedback,
          status: "pending"
        })
        .returning();
      
      // Create activity record for submitting feedback
      await this.createActivity({
        userId: feedbackEntry.userId,
        activityType: 'feedback_submitted',
        description: `Submitted feedback: ${feedbackEntry.title}`
      });
      
      return feedbackEntry;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  async updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined> {
    try {
      const [updatedFeedback] = await db.update(feedback)
        .set({ status })
        .where(eq(feedback.id, id))
        .returning();
      
      return updatedFeedback;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
