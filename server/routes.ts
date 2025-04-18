import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCollectionSchema, 
  insertEcoTipSchema, 
  CollectionStatus,
  Collection 
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateEcoTip } from "./openai";
import { WebSocketServer, WebSocket } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Collections
  app.get("/api/collections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const collections = await storage.getCollectionsByUser(req.user.id);
    res.json(collections);
  });
  
  app.get("/api/collections/upcoming", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const collections = await storage.getUpcomingCollectionsByUser(req.user.id);
    res.json(collections);
  });
  
  app.get("/api/collections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID format");
    
    const collection = await storage.getCollection(id);
    if (!collection) return res.status(404).send("Collection not found");
    
    // Verify user owns this collection or is a collector
    if (collection.userId !== req.user.id && req.user.role !== 'collector') {
      return res.sendStatus(403);
    }
    
    res.json(collection);
  });
  
  app.post("/api/collections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log("Received collection data:", JSON.stringify(req.body));
      
      const collectionData = insertCollectionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      console.log("Parsed collection data:", JSON.stringify(collectionData));
      
      const collection = await storage.createCollection(collectionData);
      
      // Award points based on the waste type (matching client configuration)
      const pointsMap: Record<string, number> = {
        'general': 5,
        'plastic': 10,
        'paper': 8,
        'glass': 10,
        'metal': 12,
        'electronic': 15,
        'organic': 8,
        'hazardous': 20,
        'cardboard': 8
      };
      
      // Award default points if waste type is not in the map
      const pointsToAward = pointsMap[collectionData.wasteType as string] || 5;
      
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
  });
  
  app.patch("/api/collections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID format");
    
    const collection = await storage.getCollection(id);
    if (!collection) return res.status(404).send("Collection not found");
    
    // Verify user owns this collection or is a collector
    if (collection.userId !== req.user.id && req.user.role !== 'collector') {
      return res.sendStatus(403);
    }
    
    try {
      const updates = req.body;
      const updatedCollection = await storage.updateCollection(id, updates);
      res.json(updatedCollection);
    } catch (error) {
      res.status(500).send("Failed to update collection");
    }
  });
  
  // Environmental Impact
  app.get("/api/impact", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const impact = await storage.getTotalImpactByUser(req.user.id);
    res.json(impact);
  });
  
  // User Badges
  app.get("/api/badges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const badges = await storage.getBadgesByUser(req.user.id);
    res.json(badges);
  });
  
  // EcoTips
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
  
  // Generate AI EcoTip
  app.post("/api/ecotips/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { category } = req.body;
      if (!category) return res.status(400).send("Category is required");
      
      const aiTip = await generateEcoTip(category);
      
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
  });
  
  // User Activities
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activities = await storage.getActivitiesByUser(req.user.id, limit);
    res.json(activities);
  });

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
  
  // Update patch route to send notifications
  const originalPatch = app._router.stack.find(
    (layer: any) => layer.route && layer.route.path === '/api/collections/:id' && layer.route.methods.patch
  );
  
  if (originalPatch) {
    const originalHandler = originalPatch.route.stack[0].handle;
    
    originalPatch.route.stack[0].handle = async (req: any, res: any) => {
      const originalEnd = res.end;
      
      res.end = function(...args: any[]) {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.body.status) {
          // Get the collection that was updated
          const collectionId = parseInt(req.params.id);
          storage.getCollection(collectionId).then((collection) => {
            if (collection) {
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
                
                const notification = {
                  type: 'collection_update',
                  collectionId: collection.id,
                  status: collection.status,
                  message: `Your collection has been ${statusConfig[collection.status as keyof typeof statusConfig]}`
                };
                
                userClients.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(notification));
                  }
                });
              }
            }
          }).catch(err => {
            console.error('Error sending WebSocket notification:', err);
          });
        }
        
        originalEnd.apply(res, args);
      };
      
      return originalHandler(req, res);
    };
  }

  return httpServer;
}
