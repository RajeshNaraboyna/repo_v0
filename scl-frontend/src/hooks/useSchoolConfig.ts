import { useQuery } from '@tanstack/react-query'
import configService from '../services/configService'
import type { SchoolConfig } from '../services/configService'

const FALLBACK: SchoolConfig = {
  grades: [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12',
  ],
  classes: [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12',
  ],
  sections: ['A', 'B', 'C', 'D', 'E'],
}

/**
 * Shared hook that returns the canonical school configuration
 * (grades, classes, sections) fetched from the backend.
 *
 * The query is cached with a long staleTime so the network call
 * only fires once per session.
 */
export function useSchoolConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['school-config'],
    queryFn: configService.getSchoolConfig,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: Infinity,
    placeholderData: FALLBACK,
  })

  return {
    /** All grades including pre-primary (Nursery, LKG, UKG, Class 1-12) */
    grades: data?.grades ?? FALLBACK.grades,
    /** Only formal classes (Class 1-12) */
    classes: data?.classes ?? FALLBACK.classes,
    /** Available sections (A-E) */
    sections: data?.sections ?? FALLBACK.sections,
    isLoading,
  }
}
