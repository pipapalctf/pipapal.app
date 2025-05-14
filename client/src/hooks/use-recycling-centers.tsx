import { useQuery, useMutation } from "@tanstack/react-query";
import { RecyclingCenter } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useRecyclingCenters() {
  const { toast } = useToast();
  
  const {
    data: recyclingCenters,
    isLoading,
    error,
  } = useQuery<RecyclingCenter[]>({
    queryKey: ["/api/recycling-centers"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    recyclingCenters: recyclingCenters || [],
    isLoading,
    error,
  };
}

export function useRecyclingCentersByCity(city: string) {
  const { toast } = useToast();
  
  const {
    data: recyclingCenters,
    isLoading,
    error,
  } = useQuery<RecyclingCenter[]>({
    queryKey: ["/api/recycling-centers/city", city],
    enabled: !!city, // Only run query if city is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    recyclingCenters: recyclingCenters || [],
    isLoading,
    error,
  };
}

export function useRecyclingCentersByWasteType(wasteType: string) {
  const { toast } = useToast();
  
  const {
    data: recyclingCenters,
    isLoading,
    error,
  } = useQuery<RecyclingCenter[]>({
    queryKey: ["/api/recycling-centers/waste-type", wasteType],
    enabled: !!wasteType, // Only run query if wasteType is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    recyclingCenters: recyclingCenters || [],
    isLoading,
    error,
  };
}

export function useRecyclingCenterById(id: number) {
  const { toast } = useToast();
  
  const {
    data: recyclingCenter,
    isLoading,
    error,
  } = useQuery<RecyclingCenter>({
    queryKey: ["/api/recycling-centers", id],
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    recyclingCenter,
    isLoading,
    error,
  };
}