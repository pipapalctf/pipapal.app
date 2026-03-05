import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Building2, CheckCircle, Award, Recycle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Recycler {
  id: number;
  businessName: string;
  fullName: string;
  address: string;
  serviceLocation: string;
  wasteSpecialization: string[];
  serviceType: string;
  isCertified: boolean;
}

interface ClaimPickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wasteType: string;
  onConfirm: (recyclerId: number) => void;
  isPending: boolean;
}

export function ClaimPickupDialog({ open, onOpenChange, wasteType, onConfirm, isPending }: ClaimPickupDialogProps) {
  const [selectedRecyclerId, setSelectedRecyclerId] = useState<number | null>(null);

  const { data: recyclers = [], isLoading } = useQuery<Recycler[]>({
    queryKey: ['/api/recyclers', wasteType],
    queryFn: async () => {
      const res = await fetch(`/api/recyclers?wasteType=${encodeURIComponent(wasteType)}`);
      if (!res.ok) throw new Error("Failed to fetch recyclers");
      return res.json();
    },
    enabled: open && !!wasteType,
  });

  const handleConfirm = () => {
    if (selectedRecyclerId) {
      onConfirm(selectedRecyclerId);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedRecyclerId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Drop-off Recycler</DialogTitle>
          <DialogDescription>
            Choose a recycler to drop off the <span className="font-medium text-foreground">{wasteType}</span> waste after collection. The recycler will need to accept the drop-off.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading recyclers...</span>
          </div>
        ) : recyclers.length === 0 ? (
          <div className="text-center py-8">
            <Recycle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No recyclers found that handle <span className="font-medium">{wasteType}</span> waste.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[350px] pr-3">
            <RadioGroup
              value={selectedRecyclerId?.toString() || ""}
              onValueChange={(val) => setSelectedRecyclerId(parseInt(val))}
            >
              <div className="space-y-2">
                {recyclers.map((recycler) => (
                  <label
                    key={recycler.id}
                    htmlFor={`recycler-${recycler.id}`}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedRecyclerId === recycler.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={recycler.id.toString()} id={`recycler-${recycler.id}`} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-sm truncate">{recycler.businessName}</span>
                        {recycler.isCertified && (
                          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200 shrink-0">
                            <Award className="h-3 w-3 mr-0.5" />
                            Certified
                          </Badge>
                        )}
                      </div>
                      {recycler.address && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{recycler.address}</span>
                        </p>
                      )}
                      {recycler.serviceLocation && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Serves: {recycler.serviceLocation}
                        </p>
                      )}
                      {recycler.wasteSpecialization && recycler.wasteSpecialization.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {recycler.wasteSpecialization.map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs py-0">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedRecyclerId === recycler.id && (
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
            disabled={!selectedRecyclerId || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              "Claim & Assign Recycler"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
