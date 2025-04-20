import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { wasteTypeConfig } from "@/lib/types";
import { iconMap } from "@/components/ui/icon-badge";
import { CalendarDays, Clock, MapPin, Scale, Box, Clipboard, BadgeCheck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewStepProps {
  form: UseFormReturn<any>;
  calculateEstimatedPoints: () => number;
  isRescheduling: boolean;
}

export default function ReviewStep({ form, calculateEstimatedPoints, isRescheduling }: ReviewStepProps) {
  const formValues = form.getValues();
  const points = calculateEstimatedPoints();
  
  // Get the waste type label
  const getWasteTypeLabel = () => {
    if (!formValues.wasteType) return "Unknown";
    return wasteTypeConfig[formValues.wasteType]?.label || "Unknown";
  };
  
  // Get icon for waste type
  const getWasteTypeIcon = () => {
    if (!formValues.wasteType) return Box;
    const iconName = wasteTypeConfig[formValues.wasteType]?.icon || "package";
    return iconMap[iconName] || Box;
  };
  
  // Get style for waste type
  const getWasteTypeStyle = () => {
    if (!formValues.wasteType) return {};
    
    const bgColor = wasteTypeConfig[formValues.wasteType]?.bgColor || "bg-gray-100";
    const textColor = wasteTypeConfig[formValues.wasteType]?.textColor.replace('text-', '').includes('-')
      ? `var(--${wasteTypeConfig[formValues.wasteType]?.textColor.replace('text-', '')})`
      : `var(--${wasteTypeConfig[formValues.wasteType]?.textColor.replace('text-', '')}-500)`;
    
    return { bgColor, textColor };
  };
  
  const WasteTypeIcon = getWasteTypeIcon();
  const wasteTypeStyle = getWasteTypeStyle();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Review & Confirm</h2>
      <p className="text-muted-foreground">Please verify all the information before scheduling the pickup</p>
      
      <div className="space-y-6 mt-6">
        {/* Waste Details Review */}
        <div className="border rounded-lg">
          <div className="border-b p-4 flex justify-between items-center">
            <h3 className="font-medium text-sm">Waste Details</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2"
              onClick={() => {/* Navigate to waste details step */}}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center">
              <div className={`flex items-center justify-center rounded-full ${wasteTypeStyle.bgColor || "bg-gray-100"} p-2 mr-3`}>
                <WasteTypeIcon 
                  className="h-5 w-5" 
                  style={{ color: wasteTypeStyle.textColor }} 
                />
              </div>
              <div>
                <div className="font-medium">{getWasteTypeLabel()}</div>
                <div className="text-sm text-muted-foreground">
                  {formValues.wasteDescription || "No specific description provided"}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Scale className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-sm">
                <span className="font-medium">{formValues.wasteAmount || 0} kg</span>
                <span className="text-muted-foreground ml-2">
                  (~{points} points)
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Location Review */}
        <div className="border rounded-lg">
          <div className="border-b p-4 flex justify-between items-center">
            <h3 className="font-medium text-sm">Location</h3>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-8 px-2"
              onClick={() => {/* Navigate to location step */}}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Pickup Address</div>
                <div className="text-muted-foreground">
                  {formValues.address || "No address provided"}
                </div>
              </div>
            </div>
            
            {formValues.notes && (
              <div className="flex items-start">
                <Clipboard className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Additional Notes</div>
                  <div className="text-muted-foreground">
                    {formValues.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Schedule Review */}
        <div className="border rounded-lg">
          <div className="border-b p-4 flex justify-between items-center">
            <h3 className="font-medium text-sm">Schedule</h3>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-8 px-2"
              onClick={() => {/* Navigate to schedule step */}}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-sm">
                <div className="font-medium">Date</div>
                <div className="text-muted-foreground">
                  {formValues.scheduledDate ? format(new Date(formValues.scheduledDate), "PPP") : "No date selected"}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-sm">
                <div className="font-medium">Time</div>
                <div className="text-muted-foreground">
                  {formValues.scheduledDate ? format(new Date(formValues.scheduledDate), "p") : "No time selected"}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Final Confirmation */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="flex items-start">
            <BadgeCheck className="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium">Confirm your {isRescheduling ? "rescheduled" : "new"} pickup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                By confirming, you agree to have your waste collected at the specified time and location.
                You'll earn approximately <span className="font-medium text-primary">{points} points</span> for this collection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}