import { useQuery } from "@tanstack/react-query";
import { directoryService } from "@/services/directory";

// Directory query keys
export const directoryKeys = {
  all: ["directory"],
  lists: () => [...directoryKeys.all, "list"],
  list: (params) => [...directoryKeys.lists(), params],
};

// Get directory query
export const useDirectory = (params = {}) => {
  return useQuery({
    queryKey: directoryKeys.list(params),
    queryFn: async () => {
      const response = await directoryService.getDirectory(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
