import { useQuery, useMutation } from "@tanstack/react-query";
import { RecyclingCenter, InsertRecyclingCenter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useRecyclingCenters() {
  const { toast } = useToast();

  // Fetch all recycling centers
  const {
    data: recyclingCenters = [],
    isLoading,
    error,
    refetch,
  } = useQuery<RecyclingCenter[]>({
    queryKey: ["/api/recycling-centers"],
  });

  // Fetch recycling centers by city
  const fetchRecyclingCentersByCity = (city: string) => {
    return useQuery<RecyclingCenter[]>({
      queryKey: ["/api/recycling-centers/city", city],
      queryFn: async () => {
        const res = await fetch(`/api/recycling-centers/city/${encodeURIComponent(city)}`);
        if (!res.ok) {
          throw new Error("Failed to fetch recycling centers by city");
        }
        return res.json();
      },
      enabled: Boolean(city),
    });
  };

  // Fetch recycling centers by waste type
  const fetchRecyclingCentersByWasteType = (wasteType: string) => {
    return useQuery<RecyclingCenter[]>({
      queryKey: ["/api/recycling-centers/waste-type", wasteType],
      queryFn: async () => {
        const res = await fetch(`/api/recycling-centers/waste-type/${encodeURIComponent(wasteType)}`);
        if (!res.ok) {
          throw new Error("Failed to fetch recycling centers by waste type");
        }
        return res.json();
      },
      enabled: Boolean(wasteType),
    });
  };

  // Fetch a specific recycling center by ID
  const fetchRecyclingCenter = (id: number) => {
    return useQuery<RecyclingCenter>({
      queryKey: ["/api/recycling-centers", id],
      queryFn: async () => {
        const res = await fetch(`/api/recycling-centers/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch recycling center");
        }
        return res.json();
      },
      enabled: Boolean(id),
    });
  };

  // Create a new recycling center (admin only)
  const createRecyclingCenterMutation = useMutation({
    mutationFn: async (centerData: InsertRecyclingCenter) => {
      const res = await apiRequest("POST", "/api/recycling-centers", centerData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recycling center added successfully",
      });
      // Invalidate the recycling centers query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["/api/recycling-centers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add recycling center: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Helper function to get centers within a radius of coordinates
  const getRecyclingCentersNearby = (
    latitude: number,
    longitude: number,
    radiusKm: number = 20
  ): RecyclingCenter[] => {
    // Filter centers that have latitude and longitude and are within the radius
    return recyclingCenters.filter((center) => {
      if (!center.latitude || !center.longitude) return false;

      // Calculate distance using Haversine formula
      const R = 6371; // Radius of the Earth in km
      const dLat = ((center.latitude - latitude) * Math.PI) / 180;
      const dLon = ((center.longitude - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((center.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km

      return distance <= radiusKm;
    });
  };

  return {
    recyclingCenters,
    isLoading,
    error,
    refetch,
    fetchRecyclingCentersByCity,
    fetchRecyclingCentersByWasteType,
    fetchRecyclingCenter,
    createRecyclingCenterMutation,
    getRecyclingCentersNearby,
  };
}