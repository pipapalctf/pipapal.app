import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCollectionSchema, 
  insertEcoTipSchema, 
  CollectionStatus 
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateEcoTip } from "./openai";

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
    
    // Verify user owns this collection
    if (collection.userId !== req.user.id) return res.sendStatus(403);
    
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
      res.status(201).json(collection);
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

  return httpServer;
}
