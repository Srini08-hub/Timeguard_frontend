import React from 'react';
// import { Spinner } from './Spinner';
import { Pagination } from './Pagination';
import { AlertCircle, Inbox } from 'lucide-react';

export interface TableColumn<T> {
  header: React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  key: string;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function Table<T>({
  data,
  columns,
  isLoading = false,
  error,
  emptyMessage = 'No data available.',
  pagination,
}: TableProps<T>) {
  return (
    <div className="w-full flex flex-col">
      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
        <table className="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 font-medium border-b border-gray-150 dark:border-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-4 font-semibold text-xs tracking-wider uppercase ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
                  {columns.map((column) => (
                    <td key={`skeleton-cell-${column.key}`} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              // Error State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Failed to load data
                    </p>
                    <p className="text-xs text-red-500">{error}</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
                    <Inbox className="h-10 w-10 stroke-1" />
                    <p className="text-sm font-medium text-gray-650 dark:text-gray-400">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Active Data State
              data.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                >
                  {columns.map((column) => {
                    const value =
                      typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : (row[column.accessor] as React.ReactNode);

                    return (
                      <td
                        key={`cell-${column.key}`}
                        className={`px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-200 ${column.className || ''}`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Wrapper */}
      {!isLoading && !error && data.length > 0 && pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
