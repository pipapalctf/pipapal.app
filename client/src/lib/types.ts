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
// No longer need imports since we're using string icons


// Map of waste types to their display config
export const wasteTypeConfig: Record<WasteTypeValue, { 
  label: string; 
  icon: string;
  bgColor: string;
  textColor: string;
  points: number; // Points awarded for this waste type
  description?: string; // Description of the waste type
}> = {
  general: { 
    label: 'General Waste', 
    icon: 'trash',
    bgColor: 'bg-primary/20',
    textColor: 'text-primary',
    points: 5,
    description: 'Mixed waste that cannot be separated into recyclable categories'
  },
  plastic: { 
    label: 'Plastic', 
    icon: 'recycle',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    points: 10,
    description: 'Bottles, containers, packaging and other plastic items'
  },
  paper: { 
    label: 'Paper', 
    icon: 'file',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    points: 8,
    description: 'Newspapers, magazines, office paper, and printed materials'
  },
  glass: { 
    label: 'Glass', 
    icon: 'wine-glass',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    points: 10,
    description: 'Bottles, jars, and other glass containers'
  },
  metal: { 
    label: 'Metal', 
    icon: 'shopping-bag',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-600',
    points: 12,
    description: 'Cans, aluminum foil, metal containers and scrap metal'
  },
  electronic: { 
    label: 'Electronic', 
    icon: 'cpu',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    points: 15,
    description: 'Old computers, phones, appliances and electronic equipment'
  },
  organic: { 
    label: 'Organic', 
    icon: 'apple',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    points: 8,
    description: 'Food waste, kitchen scraps, garden trimmings and compostable items'
  },
  hazardous: { 
    label: 'Hazardous', 
    icon: 'flask',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    points: 20,
    description: 'Batteries, chemicals, paint and other potentially harmful materials'
  },
  cardboard: { 
    label: 'Cardboard', 
    icon: 'package',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    points: 8,
    description: 'Boxes, packaging materials and corrugated cardboard'
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

// Map of badges to their display config
export const badgeConfig: Record<BadgeTypeValue, {
  label: string;
  icon: string;
  description: string;
  bgColor: string;
  textColor: string;
}> = {
  eco_starter: {
    label: 'Eco Starter',
    icon: 'leaf',
    description: 'Awarded for joining the PipaPal platform',
    bgColor: 'bg-green-100',
    textColor: 'text-primary'
  },
  water_saver: {
    label: 'Water Saver',
    icon: 'droplet',
    description: 'Awarded for saving more than 500 liters of water',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  energy_pro: {
    label: 'Energy Pro',
    icon: 'zap',
    description: 'Awarded for conserving more than 200 kWh of energy',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600'
  },
  recycling_champion: {
    label: 'Recycling Champion',
    icon: 'recycle',
    description: 'Awarded for recycling more than 100kg of waste',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700'
  },
  zero_waste_hero: {
    label: 'Zero Waste Hero',
    icon: 'heart',
    description: 'Awarded for completing 20 waste collections',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600'
  },
  community_leader: {
    label: 'Community Leader',
    icon: 'medal',
    description: 'Awarded for inviting 5 friends to join PipaPal',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600'
  }
};

// Eco tip categories with icons (using Lucide icon names)
export const ecoTipCategories = [
  { value: 'water', label: 'Water Conservation', icon: 'droplet' },
  { value: 'energy', label: 'Energy Saving', icon: 'zap' },
  { value: 'waste', label: 'Waste Reduction', icon: 'trash' },
  { value: 'plastic', label: 'Plastic-Free Living', icon: 'recycle' },
  { value: 'composting', label: 'Composting', icon: 'leaf' },
  { value: 'recycling', label: 'Recycling', icon: 'recycle' },
  { value: 'transportation', label: 'Green Transportation', icon: 'car' }
];

export type TotalImpact = {
  waterSaved: number;
  co2Reduced: number;
  treesEquivalent: number;
  energyConserved: number;
  wasteAmount: number;
};
