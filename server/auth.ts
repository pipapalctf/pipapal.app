import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema, UserRole } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "pipapal-secret-key-development-only";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.error(`Failed to deserialize user with ID ${id}: User not found`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error(`Error deserializing user with ID ${id}:`, error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check for existing user by username or email
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).send("Username already exists");
      }
      
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).send("Email already exists");
      }
      
      // Validate user data
      const userData = insertUserSchema.parse(req.body);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // Auto login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.format() });
      }
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Dedicated endpoint for completing onboarding
  app.post("/api/onboarding", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Onboarding request rejected: User not authenticated");
      return res.sendStatus(401);
    }
    
    try {
      const user = req.user;
      const userData = req.body;
      console.log("Onboarding API called with user:", user.id, user.username, user.role);
      console.log("Onboarding data received:", JSON.stringify(userData));
      const updates: Record<string, any> = { onboardingCompleted: true };
      
      // Process role-specific fields based on user role
      if (user.role === UserRole.ORGANIZATION) {
        // Organization role requires these fields
        const requiredFields = ['organizationType', 'organizationName', 'contactPersonName'];
        for (const field of requiredFields) {
          if (!userData[field]) {
            return res.status(400).json({ 
              message: `Missing required field: ${field}` 
            });
          }
          updates[field] = userData[field];
        }
        
        // Optional fields for organizations
        const optionalFields = ['contactPersonPosition', 'contactPersonPhone', 'contactPersonEmail'];
        optionalFields.forEach(field => {
          if (userData[field]) {
            updates[field] = userData[field];
          }
        });
      } 
      else if (user.role === UserRole.COLLECTOR || user.role === UserRole.RECYCLER) {
        // Required fields for collectors and recyclers
        const requiredFields = ['businessType', 'businessName', 'serviceLocation', 'serviceType'];
        for (const field of requiredFields) {
          if (!userData[field]) {
            return res.status(400).json({ 
              message: `Missing required field for ${user.role}: ${field}` 
            });
          }
          updates[field] = userData[field];
        }
        
        // Process certification info
        if (userData.isCertified !== undefined) {
          updates.isCertified = userData.isCertified;
          
          // If certified, details should be provided
          if (userData.isCertified && userData.certificationDetails) {
            updates.certificationDetails = userData.certificationDetails;
          }
        }
        
        // Process organization-specific fields if business type is 'organization'
        if (userData.businessType === 'organization') {
          const orgFields = ['contactPersonName', 'contactPersonEmail', 'contactPersonPhone'];
          for (const field of orgFields) {
            if (userData[field]) {
              updates[field] = userData[field];
            }
          }
          
          if (userData.contactPersonPosition) {
            updates.contactPersonPosition = userData.contactPersonPosition;
          }
        }
        
        // Process waste specialization (array of waste types)
        if (userData.wasteSpecialization && Array.isArray(userData.wasteSpecialization)) {
          updates.wasteSpecialization = userData.wasteSpecialization;
        }
        
        // Process operating hours
        if (userData.operatingHours) {
          updates.operatingHours = userData.operatingHours;
        }
      }
      
      // Log updates that will be applied
      console.log("Updates to be applied to user:", JSON.stringify(updates));
      
      // Update user in database
      const updatedUser = await storage.updateUser(user.id, updates);
      
      if (!updatedUser) {
        console.log("User not found during onboarding update:", user.id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User successfully updated:", updatedUser.id, updatedUser.username);
      console.log("Onboarding status:", updatedUser.onboardingCompleted);
      
      // Create activity for completing onboarding
      await storage.createActivity({
        userId: user.id,
        activityType: 'onboarding',
        description: 'Completed profile setup',
        points: 5
      });
      
      console.log("Onboarding activity created, sending response");
      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });
  
  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Allow regular profile fields
      const allowedFields = ['fullName', 'email', 'address', 'phone'];
      // Also allow onboarding-related fields
      const onboardingFields = [
        // Organization fields
        'organizationType', 
        'organizationName', 
        'contactPersonName', 
        'contactPersonPosition', 
        'contactPersonPhone', 
        'contactPersonEmail', 
        // Collector/Recycler fields
        'isCertified', 
        'certificationDetails',
        'businessType',
        'businessName',
        'wasteSpecialization',
        'serviceLocation',
        'serviceType',
        'operatingHours',
        // Common
        'onboardingCompleted'
      ];
      
      const updates: Record<string, any> = {};
      
      // Process regular fields
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      // Process onboarding fields
      onboardingFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      // If user is changing email, check if it's already taken
      if (updates.email && updates.email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(updates.email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Update user in database
      const updatedUser = await storage.updateUser(req.user.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Update password endpoint
  app.post("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      
      // Verify current password
      const passwordValid = await comparePasswords(currentPassword, req.user.password);
      if (!passwordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(req.user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });
}
