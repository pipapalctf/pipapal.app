import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Building2, CheckCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RecyclingCenter } from "@shared/schema";

interface ClaimPickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wasteType: string;
  onConfirm: (centerId: number) => void;
  isPending: boolean;
}

export function ClaimPickupDialog({ open, onOpenChange, wasteType, onConfirm, isPending }: ClaimPickupDialogProps) {
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);

  const { data: centers = [], isLoading } = useQuery<RecyclingCenter[]>({
    queryKey: ['/api/recycling-centers/waste-type', wasteType],
    queryFn: async () => {
      const res = await fetch(`/api/recycling-centers/waste-type/${encodeURIComponent(wasteType)}`);
      if (!res.ok) throw new Error("Failed to fetch centers");
      return res.json();
    },
    enabled: open && !!wasteType,
  });

  const handleConfirm = () => {
    if (selectedCenterId) {
      onConfirm(selectedCenterId);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedCenterId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Drop-off Center</DialogTitle>
          <DialogDescription>
            Choose a recycling center to drop off the <span className="font-medium text-foreground">{wasteType}</span> waste after collection.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading centers...</span>
          </div>
        ) : centers.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No recycling centers found that accept <span className="font-medium">{wasteType}</span> waste.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[350px] pr-3">
            <RadioGroup
              value={selectedCenterId?.toString() || ""}
              onValueChange={(val) => setSelectedCenterId(parseInt(val))}
            >
              <div className="space-y-2">
                {centers.map((center) => (
                  <label
                    key={center.id}
                    htmlFor={`center-${center.id}`}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedCenterId === center.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={center.id.toString()} id={`center-${center.id}`} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-sm truncate">{center.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{center.address}, {center.city}</span>
                      </p>
                      {center.facilityType && (
                        <Badge variant="secondary" className="mt-1.5 text-xs">
                          {center.facilityType}
                        </Badge>
                      )}
                    </div>
                    {selectedCenterId === center.id && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-1" />
                    )}
                  </label>
                ))}
              </div>
            </RadioGroup>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCenterId || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              "Claim & Assign Center"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
