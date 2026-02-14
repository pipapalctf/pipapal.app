import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";

interface RatingDialogProps {
  collectionId: number;
  rateeId: number;
  rateeName: string;
  trigger?: React.ReactNode;
}

export default function RatingDialog({ collectionId, rateeId, rateeName, trigger }: RatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const { data: checkData } = useQuery<{ hasRated: boolean }>({
    queryKey: [`/api/ratings/check/${collectionId}/${rateeId}`],
    enabled: open,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ratings", {
        collectionId,
        rateeId,
        rating,
        comment: comment.trim() || null,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to submit rating" }));
        throw new Error(data.error || "Failed to submit rating");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rating submitted", description: `You rated ${rateeName} ${rating} star${rating !== 1 ? 's' : ''}.` });
      queryClient.invalidateQueries({ queryKey: [`/api/ratings/check/${collectionId}/${rateeId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ratings/user/${rateeId}/average`] });
      setOpen(false);
      setRating(0);
      setComment("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit rating", variant: "destructive" });
    },
  });

  const alreadyRated = checkData?.hasRated;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={alreadyRated}>
            <Star className="mr-2 h-4 w-4" />
            {alreadyRated ? "Already Rated" : "Rate"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {rateeName}</DialogTitle>
          <DialogDescription>
            How was your experience? Your feedback helps improve the community.
          </DialogDescription>
        </DialogHeader>

        {alreadyRated ? (
          <div className="text-center py-4 text-muted-foreground">
            You've already submitted a rating for this collection.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}

            <Textarea
              placeholder="Add an optional comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <Button
              className="w-full"
              disabled={rating === 0 || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className="mr-2 h-4 w-4" />
              )}
              Submit Rating
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
