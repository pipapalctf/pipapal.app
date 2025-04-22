import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCollectionSchema, 
  insertEcoTipSchema, 
  insertMaterialInterestSchema,
  insertChatMessageSchema,
  insertActivitySchema,
  CollectionStatus,
  Collection,
  UserRole,
  ChatMessage
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateEcoTip } from "./openai";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  Permissions, 
  requirePermission, 
  requireRole, 
  requireOwnership,
  hasPermission 
} from "./permissions";

// Schema for material interest expression
const materialInterestSchema = z.object({
  collectionId: z.number(),
  amountRequested: z.number().min(0.1).optional(),
  pricePerKg: z.number().min(0).optional(),
  message: z.string().optional(),
});

// Schema for chat messages
const chatMessageSchema = z.object({
  receiverId: z.number(),
  content: z.string().min(1).max(1000),
});

// Simple middleware to require authentication
const requireAuthentication = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // User routes
  app.patch('/api/users/:id', requireAuthentication, async (req, res) => {
    try {
      // Only allow users to update their own profile
      if (req.user?.id !== parseInt(req.params.id)) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
      }
      
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Update user in database
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Create activity for completing onboarding if applicable
      if (updates.onboardingCompleted) {
        await storage.createActivity({
          userId,
          activityType: 'profile_update',
          description: 'Completed account setup',
          points: 10,
          timestamp: new Date()
        });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Collections
  app.get("/api/collections", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      // For collectors, we need to include collections they can claim
      if (req.user.role === UserRole.COLLECTOR) {
        const allCollections = await storage.getAllCollections();
        // Filter collections to include:
        // 1. Collections assigned to this collector
        // 2. Unassigned SCHEDULED collections available for pickup
        const collectorCollections = allCollections.filter(collection => 
          collection.collectorId === req.user!.id || 
          (!collection.collectorId && collection.status === CollectionStatus.SCHEDULED)
        );
        return res.json(collectorCollections);
      }
      
      // For recyclers, we need all completed and in-progress collections
      if (req.user.role === UserRole.RECYCLER) {
        // Access the diagnostic method if available (only in DatabaseStorage)
        if (typeof (storage as any).logCollectionCount === 'function') {
          await (storage as any).logCollectionCount();
        }
        
        const allCollections = await storage.getAllCollections();
        console.log('All collections count:', allCollections.length);
        
        // Filter collections to include:
        // 1. Collections that are COMPLETED
        // 2. Collections that are IN_PROGRESS with a collector assigned
        const recyclerCollections = allCollections.filter(collection => {
          // Debug each collection's status
          console.log(`Collection ${collection.id}: status=${collection.status}, collectorId=${collection.collectorId}`);
          
          // Check for COMPLETED collections (use the actual string values from the constants)
          if (collection.status === 'completed') {
            console.log(`Collection ${collection.id} matched COMPLETED status`);
            return true;
          }
          
          // Check for IN_PROGRESS collections with a collector assigned
          if (collection.status === 'in_progress' && collection.collectorId) {
            console.log(`Collection ${collection.id} matched IN_PROGRESS with collector ${collection.collectorId}`);
            return true;
          }
          
          return false;
        });
        
        console.log(`Found ${recyclerCollections.length} collections for recycler`);
        
        // TEMPORARY FOR TESTING: Include ALL collections if none match the filter
        if (recyclerCollections.length === 0) {
          console.log('No matching collections found - for testing, returning all completed collections');
          // Try to get all completed collections directly from storage
          const completedCollections = await storage.getAllCompletedCollections();
          console.log(`Found ${completedCollections.length} completed collections from direct query`);
          
          if (completedCollections.length > 0) {
            return res.json(completedCollections);
          }
        }
        
        return res.json(recyclerCollections);
      }
      
      // For other users, just return their own collections
      const collections = await storage.getCollectionsByUser(req.user.id);
      res.json(collections);
    }
  );
  
  app.get("/api/collections/upcoming", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      const collections = await storage.getUpcomingCollectionsByUser(req.user.id);
      res.json(collections);
    }
  );
  
  app.get("/api/collections/:id", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).send("Invalid ID format");
      
      const collection = await storage.getCollection(id);
      if (!collection) return res.status(404).send("Collection not found");
      
      // Check appropriate viewing rights
      const isOwner = collection.userId === req.user.id;
      const isCollector = req.user.role === UserRole.COLLECTOR && 
                         (collection.collectorId === req.user.id || !collection.collectorId);
      // Allow recyclers to view completed collections with material amount
      const isRecycler = req.user.role === UserRole.RECYCLER && 
                        (collection.status === CollectionStatus.COMPLETED && (collection.wasteAmount || 0) > 0 ||
                         collection.status === CollectionStatus.IN_PROGRESS && collection.collectorId);
      
      if (!isOwner && !isCollector && !isRecycler) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to view this collection'
        });
      }
      
      res.json(collection);
    }
  );
  
  app.post("/api/collections", 
    requirePermission(Permissions.REQUEST_PICKUP),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        console.log("Received collection data:", JSON.stringify(req.body));
        
        const collectionData = insertCollectionSchema.parse({
          ...req.body,
          userId: req.user.id
        });
        
        console.log("Parsed collection data:", JSON.stringify(collectionData));
        
        const collection = await storage.createCollection(collectionData);
        
        // Award points based on the waste type and amount (matching client configuration)
        const pointsPerKgMap: Record<string, number> = {
          'general': 0.5,    // 5 pts per 10kg
          'plastic': 1.0,    // 10 pts per 10kg
          'paper': 0.8,      // 8 pts per 10kg
          'glass': 1.0,      // 10 pts per 10kg
          'metal': 1.2,      // 12 pts per 10kg
          'electronic': 1.5, // 15 pts per 10kg
          'organic': 0.8,    // 8 pts per 10kg
          'hazardous': 2.0,  // 20 pts per 10kg
          'cardboard': 0.8   // 8 pts per 10kg
        };
        
        // Get the waste amount or default to 10kg
        const wasteAmount = collectionData.wasteAmount || 10;
        
        // Calculate points based on waste type and amount
        const pointsPerKg = pointsPerKgMap[collectionData.wasteType as string] || 0.5;
        const pointsToAward = Math.round(pointsPerKg * wasteAmount);
        
        // Update user's sustainability score
        const updatedUser = await storage.updateUser(req.user.id, {
          sustainabilityScore: (req.user.sustainabilityScore || 0) + pointsToAward
        });
        
        // Create activity for points earned
        await storage.createActivity({
          userId: req.user.id,
          activityType: 'points_earned',
          description: `Earned ${pointsToAward} points for scheduling a ${collectionData.wasteType} waste collection`,
          points: pointsToAward,
          timestamp: new Date()
        });
        
        // Calculate environmental impact based on waste type and weight
        const impactFactors = {
          waterSaved: 50, // liters of water saved per kg
          co2Reduced: 2, // kg of CO2 reduced per kg of waste
          treesEquivalent: 0.01, // trees saved per kg
          energyConserved: 5 // kWh conserved per kg
        };
        
        await storage.createImpact({
          userId: req.user.id,
          waterSaved: wasteAmount * impactFactors.waterSaved,
          co2Reduced: wasteAmount * impactFactors.co2Reduced,
          treesEquivalent: wasteAmount * impactFactors.treesEquivalent,
          energyConserved: wasteAmount * impactFactors.energyConserved,
          wasteAmount: wasteAmount,
          collectionId: collection.id
        });
        
        // Broadcast the new collection to all collectors
        try {
          // Get all users
          const allUsers = await storage.getAllUsers();
          
          // Filter for collectors
          const collectors = allUsers.filter(user => user.role === UserRole.COLLECTOR);
          
          // New collection notification for collectors
          const collectorNotification = {
            type: 'new_collection',
            collectionId: collection.id,
            message: `New ${collection.wasteType} collection available at ${collection.address}!`,
            collection: {
              id: collection.id,
              wasteType: collection.wasteType,
              wasteAmount: collection.wasteAmount,
              address: collection.address,
              status: collection.status,
              scheduledDate: collection.scheduledDate
            }
          };
          
          // Send to all collectors
          console.log(`Broadcasting new collection notification to ${collectors.length} collectors`);
          collectors.forEach(collector => {
            const collectorClients = clients.get(collector.id) || [];
            console.log(`Found ${collectorClients.length} WebSocket clients for collector ${collector.id}`);
            
            collectorClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                console.log(`Sending new collection notification to collector ${collector.id}`);
                client.send(JSON.stringify(collectorNotification));
              } else {
                console.log(`Client for collector ${collector.id} not in OPEN state (readyState: ${client.readyState})`);
              }
            });
          });
          
          // Also add an update to the user who created the collection
          const userClients = clients.get(req.user.id) || [];
          const userNotification = {
            type: 'collection_update',
            collectionId: collection.id,
            message: `Your ${collection.wasteType} collection has been scheduled successfully! You will receive updates when a collector claims and completes your collection.`,
            status: collection.status
          };
          
          userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(userNotification));
            }
          });
        } catch (err) {
          console.error('Error sending WebSocket notification about new collection:', err);
          // Continue even if notification fails
        }
        
        res.status(201).json({
          ...collection,
          pointsEarned: pointsToAward,
          newTotalPoints: updatedUser?.sustainabilityScore
        });
      } catch (error) {
        console.error("Collection creation error:", error);
        if (error instanceof z.ZodError) {
          console.error("Zod validation errors:", JSON.stringify(error.format()));
          return res.status(400).json({ errors: error.format() });
        }
        res.status(500).send("Failed to create collection");
      }
    }
  );
  
  // Collections update route - implemented in a way to avoid middleware issues
  app.patch("/api/collections/:id", async (req: any, res: any) => {
    try {
      // Authentication check
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).send("Invalid ID format");
      
      const collection = await storage.getCollection(id);
      if (!collection) return res.status(404).send("Collection not found");
      
      const isCollector = req.user.role === UserRole.COLLECTOR;
      const isOwner = collection.userId === req.user.id;
      
      // Different permissions based on role:
      // - Collectors can update status or claim collections (MARK_JOB_COMPLETE permission)
      // - Owners can update other details (their own collections)
      if (!(isCollector || isOwner)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You are not authorized to update this collection'
        });
      }
      
      // Collectors can only update status or claim collections
      if (isCollector && !isOwner && Object.keys(req.body).some(key => 
        key !== 'status' && 
        key !== 'collectorId' && 
        key !== 'notes' && 
        key !== 'wasteAmount' && 
        key !== 'completedDate')) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Collectors can only update status, claim collections, or add notes'
        });
      }
      
      const updates = { ...req.body };
      
      const updatedCollection = await storage.updateCollection(id, updates);
      
      // Send notification if the status was updated or collection is claimed
      if ((updates.status || updates.collectorId) && updatedCollection) {
        try {
          // Send notification to the user
          const userClients = clients.get(collection.userId) || [];
          
          if (userClients.length > 0) {
            const statusConfig = {
              [CollectionStatus.PENDING]: 'scheduled',
              [CollectionStatus.CONFIRMED]: 'confirmed',
              [CollectionStatus.IN_PROGRESS]: 'in progress',
              [CollectionStatus.COMPLETED]: 'completed',
              [CollectionStatus.CANCELLED]: 'cancelled'
            };
            
            let notificationMessage = '';
            
            // If collection was claimed (collectorId was added)
            if (updates.collectorId && !collection.collectorId) {
              // Get collector info
              const collector = await storage.getUser(updates.collectorId);
              const collectorName = collector ? (collector.fullName || collector.username) : 'A collector';
              notificationMessage = `Your ${collection.wasteType} collection has been claimed by ${collectorName}`;
            } 
            // Status was updated
            else if (updates.status) {
              const statusText = statusConfig[updates.status as keyof typeof statusConfig] || 'updated';
              
              if (updates.status === CollectionStatus.COMPLETED) {
                notificationMessage = `Your ${collection.wasteType} collection has been completed successfully`;
              } else {
                notificationMessage = `Your ${collection.wasteType} collection is now ${statusText}`;
              }
            }
            
            const notification = {
              type: 'collection_update',
              collectionId: collection.id,
              status: updates.status || collection.status,
              message: notificationMessage
            };
            
            userClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(notification));
              }
            });
          }
        } catch (err) {
          console.error('Error sending WebSocket notification:', err);
          // Continue even if notification fails
        }
      }
      
      res.json(updatedCollection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).send("Failed to update collection");
    }
  }
  );
  
  // Environmental Impact - Role-specific impact data
  app.get("/api/impact", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      let impact;
      
      // Return role-specific impact statistics
      switch(req.user.role) {
        case UserRole.COLLECTOR:
          impact = await storage.getTotalImpactByCollector(req.user.id);
          break;
        case UserRole.RECYCLER:
          impact = await storage.getTotalImpactByRecycler(req.user.id);
          break;
        case UserRole.HOUSEHOLD:
        case UserRole.ORGANIZATION:
        default:
          impact = await storage.getTotalImpactByUser(req.user.id);
          break;
      }
      
      res.json(impact);
    }
  );
  
  // Monthly Collection and Impact Data - Role-specific
  app.get("/api/impact/monthly", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        let collectionsData;
        
        // Get role-specific collections
        switch(req.user.role) {
          case UserRole.COLLECTOR:
            // For collectors, get collections they've collected
            collectionsData = await storage.getCompletedCollectionsByCollector(req.user.id);
            break;
          case UserRole.RECYCLER:
            // For recyclers, get all completed collections
            collectionsData = await storage.getAllCompletedCollections();
            break;
          case UserRole.HOUSEHOLD:
          case UserRole.ORGANIZATION:
          default:
            // For households and organizations, get their scheduled collections
            collectionsData = await storage.getCollectionsByUser(req.user.id);
            break;
        }
        
        // Group by month
        const monthlyData = new Map();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        collectionsData.forEach(collection => {
          // Use collection date (completed date if available, otherwise scheduled date)
          const collectionDate = new Date(collection.completedDate || collection.scheduledDate);
          const monthIndex = collectionDate.getMonth();
          const monthName = months[monthIndex];
          
          if (!monthlyData.has(monthName)) {
            monthlyData.set(monthName, {
              name: monthName,
              wasteCollected: 0,
              co2Reduced: 0,
              waterSaved: 0,
              treesEquivalent: 0,
              energyConserved: 0
            });
          }
          
          // Only count waste amount for completed collections
          if (collection.status === CollectionStatus.COMPLETED) {
            // Use waste amount or default to 10kg
            const wasteAmount = collection.wasteAmount || 10;
            
            // Impact factors based on the same calculations used when creating impact records
            const impactFactors = {
              waterSaved: 50, // liters of water saved per kg
              co2Reduced: 2, // kg of CO2 reduced per kg of waste
              treesEquivalent: 0.01, // trees saved per kg
              energyConserved: 5 // kWh conserved per kg
            };
            
            // Update monthly data
            const monthData = monthlyData.get(monthName);
            monthData.wasteCollected += wasteAmount;
            monthData.co2Reduced += wasteAmount * impactFactors.co2Reduced;
            monthData.waterSaved += wasteAmount * impactFactors.waterSaved;
            monthData.treesEquivalent += wasteAmount * impactFactors.treesEquivalent;
            monthData.energyConserved += wasteAmount * impactFactors.energyConserved;
          }
        });
        
        // Convert to array and sort by month
        const result = Array.from(monthlyData.values());
        
        // Sort by month
        result.sort((a, b) => {
          return months.indexOf(a.name) - months.indexOf(b.name);
        });
        
        res.json(result);
      } catch (error) {
        console.error("Error fetching monthly impact data:", error);
        res.status(500).send("Failed to fetch monthly impact data");
      }
    }
  );
  
  // Waste Type Distribution - Role-specific
  app.get("/api/impact/waste-types", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        let collectionsData;
        
        // Get role-specific collections
        switch(req.user.role) {
          case UserRole.COLLECTOR:
            // For collectors, get collections they've collected
            collectionsData = await storage.getCompletedCollectionsByCollector(req.user.id);
            break;
          case UserRole.RECYCLER:
            // For recyclers, get all completed collections
            collectionsData = await storage.getAllCompletedCollections();
            break;
          case UserRole.HOUSEHOLD:
          case UserRole.ORGANIZATION:
          default:
            // For households and organizations, get their scheduled collections
            collectionsData = await storage.getCollectionsByUser(req.user.id);
            break;
        }
        
        // Group by waste type
        const wasteTypeData = new Map();
        
        collectionsData.forEach(collection => {
          // Only consider collections with waste amount
          if (collection.status === CollectionStatus.COMPLETED && collection.wasteAmount) {
            const wasteType = collection.wasteType || 'general';
            const wasteAmount = collection.wasteAmount;
            
            if (!wasteTypeData.has(wasteType)) {
              wasteTypeData.set(wasteType, {
                name: wasteType.charAt(0).toUpperCase() + wasteType.slice(1),
                value: 0
              });
            }
            
            // Update waste type data
            const typeData = wasteTypeData.get(wasteType);
            typeData.value += wasteAmount;
          }
        });
        
        // Convert to array
        const result = Array.from(wasteTypeData.values());
        
        // If no collections, provide some default data
        if (result.length === 0) {
          result.push({ name: 'No completed collections yet', value: 100 });
        }
        
        res.json(result);
      } catch (error) {
        console.error("Error fetching waste type data:", error);
        res.status(500).send("Failed to fetch waste type data");
      }
    }
  );
  
  // User Badges - Available to all authenticated users
  app.get("/api/badges", 
    (req, res, next) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    },
    async (req, res) => {
      const badges = await storage.getBadgesByUser(req.user!.id);
      res.json(badges);
    }
  );
  
  // EcoTips - Public content, no authentication required
  app.get("/api/ecotips", async (req, res) => {
    const ecoTips = await storage.getEcoTips();
    res.json(ecoTips);
  });
  
  app.get("/api/ecotips/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID format");
    
    const ecoTip = await storage.getEcoTip(id);
    if (!ecoTip) return res.status(404).send("EcoTip not found");
    
    res.json(ecoTip);
  });
  
  // Generate AI EcoTip - Available to all authenticated users
  app.post("/api/ecotips/generate", 
    (req, res, next) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    },
    async (req, res) => {
      try {
        const { category, customPrompt } = req.body;
        if (!category) return res.status(400).send("Category is required");
        
        const aiTip = await generateEcoTip(category, customPrompt);
        
        try {
          const ecoTip = insertEcoTipSchema.parse({
            category,
            title: aiTip.title,
            content: aiTip.content,
            icon: aiTip.icon
          });
          
          const savedTip = await storage.createEcoTip(ecoTip);
          res.status(201).json(savedTip);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.format() });
          }
          res.status(500).send("Failed to save generated tip");
        }
      } catch (error) {
        res.status(500).send("Failed to generate EcoTip");
      }
    }
  );
  
  // User Activities - Available to all authenticated users
  app.get("/api/activities", 
    (req, res, next) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    },
    async (req, res) => {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivitiesByUser(req.user!.id, limit);
      res.json(activities);
    }
  );
  
  // Create activity endpoint (only for development/testing)
  app.post("/api/activities/create", 
    async (req, res) => {
      try {
        const activityData = insertActivitySchema.parse(req.body);
        const activity = await storage.createActivity(activityData);
        res.status(201).json(activity);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.format() });
        }
        console.error("Error creating activity:", error);
        res.status(500).send("Failed to create activity");
      }
    }
  );
  
  // Express interest in recycling materials
  // Add a route to get all users
  app.get("/api/users", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      // Get all users (using only for directory purposes)
      const users = await storage.getAllUsers();
      
      // For security reasons, only return non-sensitive user information
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        sustainabilityScore: user.sustainabilityScore
      }));
      
      res.json(safeUsers);
    }
  );
  
  // Add a route to get user details by ID
  app.get("/api/users/:id", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      // Parse the ID from the URL
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).send("Invalid ID format");
      
      // Get the user by ID
      const user = await storage.getUser(id);
      if (!user) return res.status(404).send("User not found");
      
      // For security reasons, only return non-sensitive user information
      // especially for collectors that recyclers need to contact
      const safeUserData = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        sustainabilityScore: user.sustainabilityScore
      };
      
      console.log('Returning user data for ID:', id, safeUserData);
      res.json(safeUserData);
    }
  );
  
  app.post("/api/materials/express-interest", 
    requirePermission(Permissions.BUY_RECYCLABLES),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        const { collectionId, message, amountRequested, pricePerKg } = materialInterestSchema.parse(req.body);
        
        // Get the collection
        const collection = await storage.getCollection(collectionId);
        if (!collection) {
          return res.status(404).json({ error: 'Collection not found' });
        }
        
        // Make sure collection is either completed or in progress with a collector assigned
        const isValidStatus = collection.status === CollectionStatus.COMPLETED || 
                            (collection.status === CollectionStatus.IN_PROGRESS && collection.collectorId);
        
        // Make sure collection has waste amount for completed collections
        // For in-progress collections, we may not have waste amount yet
        const hasWasteAmount = collection.status === CollectionStatus.COMPLETED ? 
                             (collection.wasteAmount && collection.wasteAmount > 0) : true;
        
        if (!isValidStatus || !hasWasteAmount) {
          return res.status(400).json({ 
            error: 'Invalid collection status', 
            message: collection.status === CollectionStatus.IN_PROGRESS && !collection.collectorId ?
                    'This collection has no assigned collector yet' :
                    'This collection is not ready for recycling' 
          });
        }
        
        // Make sure requested amount doesn't exceed available amount
        if (amountRequested && collection.wasteAmount && amountRequested > collection.wasteAmount) {
          return res.status(400).json({
            error: 'Invalid amount',
            message: `The requested amount (${amountRequested}kg) exceeds the available amount (${collection.wasteAmount}kg)`
          });
        }
        
        // Create a more detailed message if price or amount was provided
        let detailedMessage = message || '';
        if (amountRequested || pricePerKg) {
          detailedMessage += (detailedMessage ? '\n\n' : '');
          
          if (amountRequested) {
            detailedMessage += `Amount requested: ${amountRequested}kg of ${collection.wasteAmount}kg available\n`;
          }
          
          if (pricePerKg) {
            detailedMessage += `Offered price: KSh ${pricePerKg.toFixed(2)} per kg\n`;
            
            // Calculate total if both amount and price are provided
            if (amountRequested) {
              const totalValue = (pricePerKg * amountRequested).toFixed(2);
              detailedMessage += `Total offer: KSh ${totalValue} for ${amountRequested}kg\n`;
            }
          }
        }
        
        // Create an activity for the recycler
        await storage.createActivity({
          userId: req.user.id,
          activityType: 'express_interest',
          description: `Expressed interest in ${collection.wasteType} materials (${amountRequested || collection.wasteAmount}kg)`,
          timestamp: new Date()
        });
        
        // Create the material interest record
        await storage.createMaterialInterest({
          userId: req.user.id,
          collectionId: collection.id,
          status: 'pending',
          message: detailedMessage || null
        });
        
        // Get recycler info for the notification
        const recyclerName = req.user.fullName || req.user.username;
        
        // Notify the collection owner with recycler info
        const ownerClients = clients.get(collection.userId) || [];
        const ownerNotification = {
          type: 'notification',
          message: `${recyclerName} (Recycler) has expressed interest in your ${collection.wasteType} materials (${collection.wasteAmount || 0}kg)`,
          collectionId: collection.id
        };
        
        ownerClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(ownerNotification));
          }
        });
        
        // Notify the collector if assigned with more detailed information
        if (collection.collectorId) {
          const collectorClients = clients.get(collection.collectorId) || [];
          const collectorNotification = {
            type: 'notification',
            message: `${recyclerName} (Recycler) wants to purchase ${collection.wasteType} materials (${collection.wasteAmount || 0}kg) that you collected from ${collection.address}`,
            collectionId: collection.id
          };
          
          collectorClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(collectorNotification));
            }
          });
        }
        
        res.status(200).json({ 
          success: true, 
          message: 'Interest expressed successfully'
        });
        
      } catch (error) {
        console.error("Error expressing interest in materials:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.format() });
        }
        res.status(500).send("Failed to express interest in materials");
      }
    }
  );
  
  // Get material interests for a user (recycler)
  app.get("/api/materials/interests", 
    requirePermission(Permissions.BUY_RECYCLABLES),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        const interests = await storage.getMaterialInterestsByUser(req.user.id);
        
        // Enhance the interests with collection details
        const enhancedInterests = await Promise.all(
          interests.map(async interest => {
            const collection = await storage.getCollection(interest.collectionId);
            return {
              ...interest,
              collection: collection || null
            };
          })
        );
        
        res.json(enhancedInterests);
      } catch (error) {
        console.error("Error retrieving material interests:", error);
        res.status(500).send("Failed to retrieve material interests");
      }
    }
  );
  
  // Get material interests for collections (for collectors to see which recyclers are interested)
  app.get("/api/collections/:id/interests", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) return res.status(400).send("Invalid collection ID");
      
      try {
        // Check if the user has access to this collection
        const collection = await storage.getCollection(collectionId);
        if (!collection) {
          return res.status(404).json({ error: 'Collection not found' });
        }
        
        // Check permissions - must be either the collection owner or the assigned collector
        const hasAccess = collection.userId === req.user.id || 
                        (req.user.role === UserRole.COLLECTOR && collection.collectorId === req.user.id);
        
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Access denied', 
            message: 'You do not have permission to view interests for this collection' 
          });
        }
        
        // Get interests for this collection
        const interests = await storage.getMaterialInterestsByCollections([collectionId]);
        
        // Enhance with recycler details (without sensitive info)
        const enhancedInterests = await Promise.all(
          interests.map(async interest => {
            const recycler = await storage.getUser(interest.userId);
            return {
              ...interest,
              recycler: recycler ? {
                id: recycler.id,
                username: recycler.username,
                fullName: recycler.fullName,
                email: recycler.email,
                phone: recycler.phone
              } : null
            };
          })
        );
        
        res.json(enhancedInterests);
      } catch (error) {
        console.error("Error retrieving collection interests:", error);
        res.status(500).send("Failed to retrieve collection interests");
      }
    }
  );

  // Get all material interests for a specific collector
  app.get("/api/material-interests/collector/:collectorId", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      // Check if user is the collector
      const collectorId = parseInt(req.params.collectorId);
      if (req.user.id !== collectorId) {
        return res.status(403).json({ error: 'You do not have permission to view these interests' });
      }
      
      try {
        // Get all active collections (both completed and in-progress) for this collector
        const activeCollections = await storage.getActiveCollectionsByCollector(collectorId);
        console.log(`Found ${activeCollections.length} active collections for collector ${collectorId}`);
        activeCollections.forEach(collection => {
          console.log(`Collection ${collection.id} - status: ${collection.status}, wasteType: ${collection.wasteType}, wasteAmount: ${collection.wasteAmount}kg`);
        });
        
        if (activeCollections.length === 0) {
          return res.status(200).json([]);
        }
        
        // Get collection IDs
        const collectionIds = activeCollections.map(collection => collection.id);
        console.log(`Collection IDs: ${collectionIds.join(', ')}`);
        
        // Get material interests for these collections
        const interests = await storage.getMaterialInterestsByCollections(collectionIds);
        console.log(`Found ${interests.length} material interests for collections`);
        interests.forEach(interest => {
          console.log(`Interest ${interest.id} - userId: ${interest.userId}, collectionId: ${interest.collectionId}, status: ${interest.status}`);
        });
        
        // Enhance with recycler details (without sensitive info)
        const enhancedInterests = await Promise.all(
          interests.map(async interest => {
            const recycler = await storage.getUser(interest.userId);
            const collection = await storage.getCollection(interest.collectionId);
            return {
              ...interest,
              recycler: recycler ? {
                id: recycler.id,
                username: recycler.username,
                fullName: recycler.fullName,
                email: recycler.email,
                phone: recycler.phone
              } : null,
              collection: collection ? {
                id: collection.id,
                wasteType: collection.wasteType,
                wasteAmount: collection.wasteAmount,
                address: collection.address,
                status: collection.status
              } : null
            };
          })
        );
        
        res.status(200).json(enhancedInterests);
      } catch (error) {
        console.error("Error fetching material interests for collector:", error);
        res.status(500).send("Failed to fetch material interests");
      }
    }
  );
  
  // Get completed collections for a specific collector
  app.get("/api/collections/collector/:collectorId/completed", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      // Check if user is the collector
      const collectorId = parseInt(req.params.collectorId);
      if (req.user.id !== collectorId) {
        return res.status(403).json({ error: 'You do not have permission to view these collections' });
      }
      
      try {
        // Get all completed collections for this collector
        const completedCollections = await storage.getCompletedCollectionsByCollector(collectorId);
        res.status(200).json(completedCollections);
      } catch (error) {
        console.error("Error fetching completed collections for collector:", error);
        res.status(500).send("Failed to fetch completed collections");
      }
    }
  );
  
  // Get all active collections (both completed and in-progress) for a specific collector
  app.get("/api/collections/collector/:collectorId/active", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      // Check if user is the collector
      const collectorId = parseInt(req.params.collectorId);
      if (req.user.id !== collectorId) {
        return res.status(403).json({ error: 'You do not have permission to view these collections' });
      }
      
      try {
        // Get all active collections for this collector
        const activeCollections = await storage.getActiveCollectionsByCollector(collectorId);
        res.status(200).json(activeCollections);
      } catch (error) {
        console.error("Error fetching active collections for collector:", error);
        res.status(500).send("Failed to fetch active collections");
      }
    }
  );
  
  // Update material interest status (accept or reject)
  app.patch("/api/material-interests/:interestId/status", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      const interestId = parseInt(req.params.interestId);
      if (isNaN(interestId)) return res.status(400).send("Invalid interest ID");
      
      const { status } = req.body;
      if (!status || !["accepted", "rejected", "completed"].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "accepted", "rejected", or "completed"' });
      }
      
      try {
        // Get the interest
        const interest = await storage.getMaterialInterest(interestId);
        if (!interest) {
          return res.status(404).json({ error: 'Material interest not found' });
        }
        
        // Get the collection
        const collection = await storage.getCollection(interest.collectionId);
        if (!collection) {
          return res.status(404).json({ error: 'Collection not found' });
        }
        
        // Verify that the user is the collector for this collection
        if (req.user.id !== collection.collectorId) {
          return res.status(403).json({ error: 'You do not have permission to update this interest' });
        }
        
        // Update the interest status
        const updatedInterest = await storage.updateMaterialInterest(interestId, { status });
        
        // Get the recycler info for notification
        const recycler = await storage.getUser(interest.userId);
        
        if (!recycler) {
          return res.status(404).json({ error: 'Recycler not found' });
        }
        
        // Prepare WebSocket notification to the recycler
        const recyclerClients = clients.get(recycler.id) || [];
        let statusAction = '';
        
        if (status === 'accepted') {
          statusAction = 'accepted';
        } else if (status === 'rejected') {
          statusAction = 'rejected';
        } else if (status === 'completed') {
          statusAction = 'marked as completed';
        }
        
        const notification = {
          type: 'notification',
          title: status === 'completed' ? 'Transaction Completed' : `Material interest ${statusAction}`,
          message: `Your interest in the ${collection.wasteType} collection at ${collection.address} has been ${statusAction}.`,
          collectionId: collection.id,
          interestId: interest.id,
          status
        };
        
        // Send notification to all connected recycler clients
        recyclerClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
          }
        });
        
        // Create activity entry for both collector and recycler
        // Assign points based on status
        let collectorPoints = 0;
        let recyclerPoints = 0;
        
        if (status === 'accepted') {
          collectorPoints = 10;
          recyclerPoints = 5;
        } else if (status === 'completed') {
          collectorPoints = 15;
          recyclerPoints = 20; // More points for recycler when transaction is completed
        }
        
        const collectorActivity = {
          userId: req.user.id,
          activityType: `material_interest_${status}`,
          description: `You ${statusAction} a material interest from ${recycler.fullName || recycler.username} for the ${collection.wasteType} collection.`,
          points: collectorPoints
        };
        
        const recyclerActivity = {
          userId: recycler.id,
          activityType: `material_interest_${status}`,
          description: `Your interest in the ${collection.wasteType} collection was ${statusAction} by the collector.`,
          points: recyclerPoints
        };
        
        // Log activities
        await storage.createActivity(collectorActivity);
        await storage.createActivity(recyclerActivity);
        
        res.status(200).json({
          success: true,
          interest: updatedInterest
        });
        
      } catch (error) {
        let actionText = '';
        if (status === 'accepted') {
          actionText = 'accepting';
        } else if (status === 'rejected') {
          actionText = 'rejecting';
        } else if (status === 'completed') {
          actionText = 'completing';
        }
        console.error(`Error ${actionText} material interest:`, error);
        res.status(500).send(`Failed to update material interest status to ${status}`);
      }
    }
  );

  // Chat endpoints
  // Get chat conversations (users with whom the current user has chatted)
  app.get("/api/chat/conversations", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        const users = await storage.getUsersWithChats(req.user.id);
        
        // Remove sensitive information
        const sanitizedUsers = users.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          unreadCount: 0 // Will be populated below
        }));
        
        // Get unread message count for each user
        for (const user of sanitizedUsers) {
          const unreadCount = await storage.getUnreadMessageCount(req.user.id);
          user.unreadCount = unreadCount;
        }
        
        res.json(sanitizedUsers);
      } catch (error) {
        console.error("Error fetching chat conversations:", error);
        res.status(500).json({ error: "Failed to load conversations" });
      }
    }
  );
  
  // Get available users to start new chats with
  app.get("/api/chat/available-users", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        const currentUserRole = req.user.role;
        const allUsers = await storage.getAllUsers();
        
        // Filter users based on the current user's role
        let availableUsers = allUsers.filter(user => {
          // Don't include the current user
          if (user.id === req.user!.id) return false;
          
          // Collectors can chat with all users
          if (currentUserRole === UserRole.COLLECTOR) return true;
          
          // Recyclers can chat with collectors
          if (currentUserRole === UserRole.RECYCLER) {
            return user.role === UserRole.COLLECTOR;
          }
          
          // Households and organizations can chat with collectors
          if (currentUserRole === UserRole.HOUSEHOLD || currentUserRole === UserRole.ORGANIZATION) {
            return user.role === UserRole.COLLECTOR;
          }
          
          return false;
        });
        
        // Remove sensitive information
        const sanitizedUsers = availableUsers.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone || null,
          businessName: user.businessName || null
        }));
        
        res.json(sanitizedUsers);
      } catch (error) {
        console.error("Error fetching available users:", error);
        res.status(500).json({ error: "Failed to load available users" });
      }
    }
  );
  
  // Get chat messages between current user and another user
  app.get("/api/chat/messages/:userId", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      const otherUserId = parseInt(req.params.userId);
      if (isNaN(otherUserId)) return res.status(400).json({ error: "Invalid user ID" });
      
      try {
        // Get messages between the two users
        const messages = await storage.getChatMessages(req.user.id, otherUserId);
        
        // Mark messages from the other user as read
        await storage.markMessagesAsRead(otherUserId, req.user.id);
        
        res.json(messages);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ error: "Failed to load messages" });
      }
    }
  );
  
  // Send a new chat message
  app.post("/api/chat/messages", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        const { receiverId, content } = chatMessageSchema.parse(req.body);
        
        // Validate the receiver exists
        const receiver = await storage.getUser(receiverId);
        if (!receiver) {
          return res.status(404).json({ error: "Recipient not found" });
        }
        
        // Create the message
        const message = await storage.sendChatMessage({
          senderId: req.user.id,
          receiverId,
          content,
          read: false,
          timestamp: new Date()
        });
        
        // Notify the receiver via WebSocket if they're online
        const receiverClients = clients.get(receiverId) || [];
        const notification = {
          type: 'new_message',
          senderId: req.user.id,
          senderName: req.user.fullName || req.user.username,
          message: `New message from ${req.user.fullName || req.user.username}`,
          content: content, // Add content field for notification handling
          chatId: message.id, // Add chatId for reference
          timestamp: message.timestamp
        };
        
        receiverClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
          }
        });
        
        res.status(201).json(message);
      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError' && 'format' in error && typeof error.format === 'function') {
          return res.status(400).json({ error: "Invalid message format", details: error.format() });
        }
        console.error("Error sending chat message:", error);
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  );
  
  // Get unread message count
  app.get("/api/chat/unread", 
    requireAuthentication,
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        const count = await storage.getUnreadMessageCount(req.user.id);
        res.json({ count });
      } catch (error) {
        console.error("Error getting unread message count:", error);
        res.status(500).json({ error: "Failed to get unread count" });
      }
    }
  );

  const httpServer = createServer(app);
  
  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Keep track of connected clients by user ID
  const clients = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Authenticate the WebSocket connection
    let userId: number | null = null;
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          userId = parseInt(data.userId);
          
          // Add this client to the clients map
          if (!clients.has(userId)) {
            clients.set(userId, []);
          }
          clients.get(userId)?.push(ws);
          
          console.log(`WebSocket authenticated for user ${userId}`);
          
          // Send a connection status update silently, with a type that won't be shown as a notification
          ws.send(JSON.stringify({
            type: '_system',
            event: 'connection_status',
            status: 'connected'
          }));
          
          // Check for unread messages
          storage.getUnreadMessageCount(userId)
            .then(unreadCount => {
              if (unreadCount > 0) {
                ws.send(JSON.stringify({
                  type: 'unread_messages',
                  count: unreadCount
                }));
              }
            })
            .catch(error => {
              console.error(`Error checking unread messages for user ${userId}:`, error);
            });
        }
        
        // Handle direct chat messages via WebSocket
        else if (data.type === 'chat_message' && userId && data.receiverId && data.content) {
          const receiverId = parseInt(data.receiverId);
          
          // Store the message in the database
          storage.sendChatMessage({
            senderId: userId,
            receiverId: receiverId,
            content: data.content,
            read: false,
            timestamp: new Date()
          })
          .then(message => {
            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: 'message_sent',
              messageId: message.id,
              receiverId: receiverId,
              timestamp: message.timestamp
            }));
            
            // Get sender information 
            // Only proceed if userId is not null
            if (userId === null) {
              console.error('Cannot get sender info: userId is null');
              return;
            }
            
            storage.getUser(userId).then(sender => {
              const senderName = sender ? (sender.fullName || sender.username) : "Unknown user";
              
              // Forward to recipient if online
              const receiverClients = clients.get(receiverId) || [];
              const notification = {
                type: 'new_message',
                messageId: message.id,
                senderId: userId,
                senderName: senderName,
                message: `New message from ${senderName}`,
                content: data.content,
                chatId: message.id,
                timestamp: message.timestamp
              };
              
              receiverClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(notification));
                }
              });
            }).catch(error => {
              console.error('Error getting sender info:', error);
            });
          })
          .catch(error => {
            console.error('Error processing chat message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to send message'
            }));
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      if (userId) {
        // Remove this client from the clients map
        const userClients = clients.get(userId) || [];
        const index = userClients.indexOf(ws);
        if (index !== -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          clients.delete(userId);
        }
      }
    });
  });
  
  // We no longer need to modify the route handlers after registration
  // since we've integrated the notification logic directly into our PATCH handler

  return httpServer;
}
