import {
  UserRoleType,
  CollectionStatusType,
  WasteTypeValue,
  BadgeTypeValue,
  User,
  Collection,
  Impact,
  Badge,
  EcoTip,
  Activity
} from "@shared/schema";
import { 
  Trash2, 
  Recycle, 
  Newspaper, 
  Wine, 
  ShoppingBag, 
  Cpu, 
  Apple, 
  FlaskConical, 
  Package 
} from "lucide-react";
import { BadgeIcons } from "@/components/ui/badge-icons";
import type { ElementType } from "react";

// Map of waste types to their display config
export const wasteTypeConfig: Record<WasteTypeValue, { 
  label: string; 
  icon: any; // Using any temporarily to resolve type issues with Lucide icons
  bgColor: string;
  textColor: string;
}> = {
  general: { 
    label: 'General Waste', 
    icon: Trash2,
    bgColor: 'bg-primary/20',
    textColor: 'text-primary'
  },
  plastic: { 
    label: 'Plastic', 
    icon: Recycle,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  paper: { 
    label: 'Paper', 
    icon: Newspaper,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600'
  },
  glass: { 
    label: 'Glass', 
    icon: Wine,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  metal: { 
    label: 'Metal', 
    icon: ShoppingBag,
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-600'
  },
  electronic: { 
    label: 'Electronic', 
    icon: Cpu,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600'
  },
  organic: { 
    label: 'Organic', 
    icon: Apple,
    bgColor: 'bg-green-100',
    textColor: 'text-green-600'
  },
  hazardous: { 
    label: 'Hazardous', 
    icon: FlaskConical,
    bgColor: 'bg-red-100',
    textColor: 'text-red-600'
  },
  cardboard: { 
    label: 'Cardboard', 
    icon: Package,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600'
  }
};

// Map of collection statuses to their display config
export const collectionStatusConfig: Record<CollectionStatusType, {
  label: string;
  bgColor: string;
  textColor: string;
}> = {
  scheduled: {
    label: 'Scheduled',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600'
  },
  pending: {
    label: 'Pending',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700'
  },
  confirmed: {
    label: 'Confirmed',
    bgColor: 'bg-primary/20',
    textColor: 'text-primary'
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600'
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600'
  }
};

import { BadgeIcons } from "@/components/ui/badge-icons";
import type { ElementType } from "react";

// Map of badges to their display config
export const badgeConfig: Record<BadgeTypeValue, {
  label: string;
  icon: ElementType;
  description: string;
  bgColor: string;
  textColor: string;
}> = {
  eco_starter: {
    label: 'Eco Starter',
    icon: BadgeIcons.seedling,
    description: 'Awarded for joining the PipaPal platform',
    bgColor: 'bg-green-100',
    textColor: 'text-primary'
  },
  water_saver: {
    label: 'Water Saver',
    icon: BadgeIcons.saver,
    description: 'Awarded for saving more than 500 liters of water',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  energy_pro: {
    label: 'Energy Pro',
    icon: BadgeIcons.saver,
    description: 'Awarded for conserving more than 200 kWh of energy',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600'
  },
  recycling_champion: {
    label: 'Recycling Champion',
    icon: BadgeIcons.recycler,
    description: 'Awarded for recycling more than 100kg of waste',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700'
  },
  zero_waste_hero: {
    label: 'Zero Waste Hero',
    icon: BadgeIcons.hero,
    description: 'Awarded for completing 20 waste collections',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600'
  },
  community_leader: {
    label: 'Community Leader',
    icon: BadgeIcons.champion,
    description: 'Awarded for inviting 5 friends to join PipaPal',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600'
  }
};

// Eco tip categories with icons
export const ecoTipCategories = [
  { value: 'water', label: 'Water Conservation', icon: 'tint' },
  { value: 'energy', label: 'Energy Saving', icon: 'bolt' },
  { value: 'waste', label: 'Waste Reduction', icon: 'trash-alt' },
  { value: 'plastic', label: 'Plastic-Free Living', icon: 'ban' },
  { value: 'composting', label: 'Composting', icon: 'seedling' },
  { value: 'recycling', label: 'Recycling', icon: 'recycle' },
  { value: 'transportation', label: 'Green Transportation', icon: 'bicycle' }
];

export type TotalImpact = {
  waterSaved: number;
  co2Reduced: number;
  treesEquivalent: number;
  energyConserved: number;
  wasteAmount: number;
};
