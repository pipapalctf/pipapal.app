import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserRole } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleSelect: (role: string) => void;
  isLoading: boolean;
}

export function RoleSelectionDialog({
  open,
  onOpenChange,
  onRoleSelect,
  isLoading,
}: RoleSelectionDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.HOUSEHOLD);

  const handleSubmit = () => {
    onRoleSelect(selectedRole);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-montserrat text-secondary">Select Your Role</DialogTitle>
          <DialogDescription>
            Please select your role to complete the registration process with Google.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">I am registering as a:</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isLoading}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.HOUSEHOLD}>Household/Individual</SelectItem>
                <SelectItem value={UserRole.COLLECTOR}>Waste Collector</SelectItem>
                <SelectItem value={UserRole.RECYCLER}>Recycler</SelectItem>
                <SelectItem value={UserRole.ORGANIZATION}>Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}