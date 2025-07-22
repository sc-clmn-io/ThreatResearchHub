import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { localStorage } from "@/lib/storage";
import type { 
  ThreatReport, 
  UseCase, 
  TrainingPath, 
  ValidationItem, 
  ProgressTracking 
} from "@shared/schema";

export function useThreatReports() {
  return useQuery({
    queryKey: ['threatReports'],
    queryFn: () => localStorage.getThreatReports(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSaveThreatReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (report: ThreatReport) => localStorage.saveThreatReport(report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threatReports'] });
    },
  });
}

export function useUseCases() {
  return useQuery({
    queryKey: ['useCases'],
    queryFn: () => localStorage.getUseCases(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveUseCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (useCase: UseCase) => localStorage.saveUseCase(useCase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useCases'] });
    },
  });
}

export function useTrainingPaths() {
  return useQuery({
    queryKey: ['trainingPaths'],
    queryFn: () => localStorage.getTrainingPaths(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveTrainingPath() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (path: TrainingPath) => localStorage.saveTrainingPath(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPaths'] });
    },
  });
}

export function useValidationItems() {
  return useQuery({
    queryKey: ['validationItems'],
    queryFn: () => localStorage.getValidationItems(),
    staleTime: 1000 * 60 * 2, // 2 minutes for more frequent updates
  });
}

export function useSaveValidationItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item: ValidationItem) => localStorage.saveValidationItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validationItems'] });
    },
  });
}

export function useProgressTracking(trainingPathId?: string) {
  return useQuery({
    queryKey: ['progressTracking', trainingPathId],
    queryFn: () => trainingPathId 
      ? localStorage.getProgressByTrainingPath(trainingPathId)
      : Promise.resolve([]),
    enabled: !!trainingPathId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSaveProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (progress: ProgressTracking) => localStorage.saveProgress(progress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['progressTracking', variables.trainingPathId] 
      });
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: () => localStorage.exportAllData(),
  });
}

export function useClearData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => localStorage.clearAllData(),
    onSuccess: () => {
      // Invalidate all queries
      queryClient.invalidateQueries();
    },
  });
}
