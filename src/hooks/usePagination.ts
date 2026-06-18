import { useState, useMemo } from 'react';

export interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  pageSize?: number;
}

export interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  pageSize: number;
}

/**
 * Custom hook to manage pagination state.
 */
export function usePagination({
  totalItems,
  initialPage = 1,
  pageSize = 10,
}: UsePaginationProps): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const onPageChange = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    totalPages,
    onPageChange,
    startIndex,
    endIndex,
    pageSize,
  };
}
