import { useState } from 'react';

interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  total: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  reset: () => void;
}

/**
 * Custom hook for pagination management
 * @param initialPage - Initial page number (default: 1)
 * @param initialPageSize - Initial page size (default: 10)
 * @returns Pagination state and controls
 */
export function usePagination(
  initialPage: number = 1,
  initialPageSize: number = 10
): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const setPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleSetPageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const reset = () => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
    setTotal(0);
  };

  return {
    currentPage,
    pageSize,
    total,
    setPage,
    setPageSize: handleSetPageSize,
    setTotal,
    reset,
  };
}
