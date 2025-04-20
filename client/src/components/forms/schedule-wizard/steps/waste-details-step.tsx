import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { WasteType } from "@shared/schema";
import { wasteTypeConfig } from "@/lib/types";
import { iconMap } from "@/components/ui/icon-badge";
import { Trash2 } from "lucide-react";

interface WasteDetailsStepProps {
  form: UseFormReturn<any>;
  calculateEstimatedPoints: () => number;
}

export default function WasteDetailsStep({ form, calculateEstimatedPoints }: WasteDetailsStepProps) {
  const points = calculateEstimatedPoints();
  const wasteType = form.watch("wasteType");
  const wasteAmount = form.watch("wasteAmount") || 0;
  
  // Get the waste type description
  const getWasteTypeDescription = (type: string) => {
    switch (type) {
      case WasteType.ORGANIC:
        return "Food scraps, garden waste, compostable materials";
      case WasteType.PAPER:
        return "Paper, cardboard, newspapers, magazines";
      case WasteType.PLASTIC:
        return "Plastic bottles, containers, packaging";
      case WasteType.GLASS:
        return "Glass bottles, jars, broken glass items";
      case WasteType.METAL:
        return "Aluminum cans, steel containers, scrap metal";
      case WasteType.ELECTRONIC:
        return "Computers, phones, appliances, batteries";
      case WasteType.HAZARDOUS:
        return "Paints, chemicals, medical waste";
      case WasteType.GENERAL:
      default:
        return "Mixed household waste";
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Waste Details</h2>
      
      <FormField
        control={form.control}
        name="wasteType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Waste Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-16">
                  {field.value ? (
                    <div className="flex items-center">
                      {field.value && (
                        <div className={`flex items-center`}>
                          <div className={`flex items-center justify-center rounded-full ${wasteTypeConfig[field.value as keyof typeof wasteTypeConfig]?.bgColor || 'bg-gray-100'} p-1.5 mr-3`}>
                            {(() => {
                              const wasteConfig = wasteTypeConfig[field.value as keyof typeof wasteTypeConfig] || {
                                label: 'General Waste',
                                icon: 'trash',
                                bgColor: 'bg-gray-100',
                                textColor: 'text-gray-600',
                                points: 5
                              };
                              const IconComponent = field.value ? iconMap[wasteConfig?.icon || 'trash'] || Trash2 : Trash2;
                              return (
                                <IconComponent 
                                  className="h-4 w-4" 
                                  style={{ 
                                    color: field.value 
                                      ? wasteConfig?.textColor.replace('text-', '').includes('-') 
                                        ? `var(--${wasteConfig.textColor.replace('text-', '')})` 
                                        : `var(--${wasteConfig.textColor.replace('text-', '')}-500)` 
                                      : undefined 
                                  }} 
                                />
                              );
                            })()}
                          </div>
                          <div>
                            <span className="font-medium capitalize">
                              {field.value ? wasteTypeConfig[field.value as keyof typeof wasteTypeConfig]?.label || field.value : 'Select waste type'}
                            </span>
                            {field.value && (
                              <div className="mt-0.5 flex items-center">
                                <span className="text-xs text-primary font-medium">{wasteTypeConfig[field.value as keyof typeof wasteTypeConfig]?.points || 5} pts per 10kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <SelectValue placeholder="Select waste type" />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(WasteType).map(([key, value]) => {
                  const wasteConfig = wasteTypeConfig[value as keyof typeof wasteTypeConfig] || {
                    label: 'General Waste',
                    icon: 'trash',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-600',
                    points: 5
                  };
                  const IconComponent = iconMap[wasteConfig?.icon || 'trash'] || Trash2;
                  
                  // Set standard waste weight in kg (for calculation purposes)
                  const standardWeight = 10; // kg
                  
                  return (
                    <SelectItem key={value} value={value} className="px-0 py-0.5">
                      <div className="flex items-center w-full pl-2 pr-3 py-1.5 hover:bg-muted/20 rounded-sm">
                        <div className="flex items-center flex-1">
                          <div className={`flex items-center justify-center rounded-full ${wasteConfig?.bgColor || 'bg-gray-100'} p-1.5 mr-3`}>
                            <IconComponent className="h-4 w-4" 
                              style={{ color: wasteConfig?.textColor.replace('text-', '').includes('-') 
                                ? `var(--${wasteConfig.textColor.replace('text-', '')})` 
                                : `var(--${wasteConfig.textColor.replace('text-', '')}-500)` 
                              }} 
                            />
                          </div>
                          <span className="font-medium">{wasteConfig?.label || value}:</span>
                          <span className="ml-2 font-medium text-primary">
                            {wasteConfig?.points || 5} pts
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            per {standardWeight}kg
                          </span>
                          <span className="text-xs ml-1 text-primary font-medium">
                            ({((wasteConfig?.points || 5) / standardWeight).toFixed(1)} pts/kg)
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {wasteType && (
              <FormDescription>
                {getWasteTypeDescription(wasteType)}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="wasteDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Waste Description</FormLabel>
            <FormControl>
              <Input placeholder="e.g., apple Organic, pineapple byproducts" {...field} />
            </FormControl>
            <FormDescription>
              Add specific details about your waste (e.g., apple Organic, expired canned goods)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="wasteAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Approximate Weight (kg)</FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  type="number" 
                  min="1"
                  max="1000"
                  placeholder="10" 
                  {...field}
                  className="pr-12" 
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              </div>
            </FormControl>
            <FormDescription>
              Enter the estimated weight of your waste in kilograms
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Estimated points display */}
      {wasteType && wasteAmount > 0 && (
        <div className="p-4 border rounded-md bg-muted/30 mt-6">
          <p className="text-sm text-muted-foreground">Estimated points: <span className="font-medium text-primary">{points} pts</span></p>
        </div>
      )}
    </div>
  );
}