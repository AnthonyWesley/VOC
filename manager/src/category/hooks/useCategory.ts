import { useQuery } from "@tanstack/react-query";
import {
  categoriesService,
  CategoryOutput,
} from "../services/categoriesService";
import useAuthStatus from "../../auth/hooks/useAuthStatus";

export default function useCategory(categoryId: string) {
  const { isAuthenticated } = useAuthStatus();

  const queryCategory = useQuery<CategoryOutput>({
    queryKey: ["categoryData", categoryId],
    queryFn: () => categoriesService.findById(categoryId),
    enabled: isAuthenticated && !!categoryId,
  });

  return { queryCategory };
}
