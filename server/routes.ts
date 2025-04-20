import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCollectionSchema, 
  insertEcoTipSchema, 
  CollectionStatus,
  Collection,
  UserRole
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
  message: z.string().optional(),
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

  // Collections
  app.get("/api/collections", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
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
      
      // Check ownership or collector rights
      const isOwner = collection.userId === req.user.id;
      const isCollector = req.user.role === UserRole.COLLECTOR && 
                         (collection.collectorId === req.user.id || !collection.collectorId);
      
      if (!isOwner && !isCollector) {
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
      
      // Send notification if the status was updated
      if (updates.status && updatedCollection) {
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
            
            const statusText = statusConfig[updates.status as keyof typeof statusConfig] || 'updated';
            
            const notification = {
              type: 'collection_update',
              collectionId: collection.id,
              status: updates.status,
              message: `Your collection has been ${statusText}`
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
  
  // Environmental Impact - All authenticated users can view their impact data
  app.get("/api/impact", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      const impact = await storage.getTotalImpactByUser(req.user.id);
      res.json(impact);
    }
  );
  
  // Monthly Collection and Impact Data
  app.get("/api/impact/monthly", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        // Get all collections for this user
        const collections = await storage.getCollectionsByUser(req.user.id);
        
        // Group by month
        const monthlyData = new Map();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        collections.forEach(collection => {
          const collectionDate = new Date(collection.scheduledDate);
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
  
  // Waste Type Distribution
  app.get("/api/impact/waste-types", 
    requirePermission(Permissions.VIEW_PICKUP_HISTORY),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        // Get all collections for this user
        const collections = await storage.getCollectionsByUser(req.user.id);
        
        // Group by waste type
        const wasteTypeData = new Map();
        
        collections.forEach(collection => {
          const wasteType = collection.wasteType || 'general';
          const wasteAmount = collection.wasteAmount || 10;
          
          if (!wasteTypeData.has(wasteType)) {
            wasteTypeData.set(wasteType, {
              name: wasteType.charAt(0).toUpperCase() + wasteType.slice(1),
              value: 0
            });
          }
          
          // Update waste type data
          const typeData = wasteTypeData.get(wasteType);
          typeData.value += wasteAmount;
        });
        
        // Convert to array
        const result = Array.from(wasteTypeData.values());
        
        // If no collections, provide some default data
        if (result.length === 0) {
          result.push({ name: 'No collections yet', value: 100 });
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
  
  // Express interest in recycling materials
  app.post("/api/materials/express-interest", 
    requirePermission(Permissions.BUY_RECYCLABLES),
    async (req, res) => {
      if (!req.user) return res.sendStatus(401);
      
      try {
        const { collectionId, message } = materialInterestSchema.parse(req.body);
        
        // Get the collection
        const collection = await storage.getCollection(collectionId);
        if (!collection) {
          return res.status(404).json({ error: 'Collection not found' });
        }
        
        // Make sure collection is completed and has waste
        if (collection.status !== CollectionStatus.COMPLETED || !collection.wasteAmount) {
          return res.status(400).json({ 
            error: 'Invalid collection', 
            message: 'This collection is not ready for recycling' 
          });
        }
        
        // Create an activity for the recycler
        await storage.createActivity({
          userId: req.user.id,
          activityType: 'express_interest',
          description: `Expressed interest in ${collection.wasteType} materials (${collection.wasteAmount}kg)`,
          timestamp: new Date()
        });
        
        // Notify the collection owner
        const ownerClients = clients.get(collection.userId) || [];
        const notification = {
          type: 'notification',
          message: `A recycler has expressed interest in your ${collection.wasteType} materials`,
          collectionId: collection.id
        };
        
        ownerClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
          }
        });
        
        // Notify the collector if assigned
        if (collection.collectorId) {
          const collectorClients = clients.get(collection.collectorId) || [];
          collectorClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(notification));
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
          
          // Send a welcome message
          ws.send(JSON.stringify({
            type: 'notification',
            message: 'Connected to real-time notifications'
          }));
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
