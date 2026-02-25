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
import { Loader2, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ConsentData {
  consentPrivacyPolicy: boolean;
  consentTermsOfService: boolean;
  consentUserAgreement: boolean;
}

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleSelect: (role: string, consent: ConsentData) => void;
  isLoading: boolean;
}

export function RoleSelectionDialog({
  open,
  onOpenChange,
  onRoleSelect,
  isLoading,
}: RoleSelectionDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.HOUSEHOLD);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentAgreement, setConsentAgreement] = useState(false);

  const allConsented = consentPrivacy && consentTerms && consentAgreement;

  const handleSubmit = () => {
    if (!allConsented) return;
    onRoleSelect(selectedRole, {
      consentPrivacyPolicy: consentPrivacy,
      consentTermsOfService: consentTerms,
      consentUserAgreement: consentAgreement,
    });
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

          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium text-gray-700">
              By creating an account, you agree to the following:
            </p>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent-privacy-google"
                checked={consentPrivacy}
                onCheckedChange={(checked) => setConsentPrivacy(checked === true)}
                disabled={isLoading}
              />
              <label htmlFor="consent-privacy-google" className="text-sm font-normal cursor-pointer leading-tight">
                I have read and agree to the{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5">
                  Privacy Policy
                  <ExternalLink className="h-3 w-3" />
                </a>
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent-terms-google"
                checked={consentTerms}
                onCheckedChange={(checked) => setConsentTerms(checked === true)}
                disabled={isLoading}
              />
              <label htmlFor="consent-terms-google" className="text-sm font-normal cursor-pointer leading-tight">
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5">
                  Terms & Conditions
                  <ExternalLink className="h-3 w-3" />
                </a>
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent-agreement-google"
                checked={consentAgreement}
                onCheckedChange={(checked) => setConsentAgreement(checked === true)}
                disabled={isLoading}
              />
              <label htmlFor="consent-agreement-google" className="text-sm font-normal cursor-pointer leading-tight">
                I have read and agree to the{" "}
                <a href="/user-agreement" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5">
                  User Agreement
                  <ExternalLink className="h-3 w-3" />
                </a>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !allConsented}
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
          {!allConsented && (
            <p className="text-xs text-muted-foreground text-center w-full mt-1">
              Please accept all agreements to continue
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
