import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Pagination } from './Pagination';

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
  rowKey?: keyof T | ((row: T) => React.Key);
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

const resolveRowKey = <T,>(
  row: T,
  rowIndex: number,
  rowKey?: keyof T | ((row: T) => React.Key),
) => {
  if (!rowKey) return 'row-' + rowIndex;
  if (typeof rowKey === 'function') return rowKey(row);

  const value = row[rowKey];
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : 'row-' + rowIndex;
};

export function Table<T>({
  data,
  columns,
  isLoading = false,
  error,
  emptyMessage = 'No data available.',
  rowKey,
  onRowClick,
  rowClassName,
  pagination,
}: TableProps<T>) {
  return (
    <div className="flex w-full flex-col">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-950">
        <table className="w-full border-collapse text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={'px-5 py-3 text-xs font-semibold uppercase tracking-wide ' + (column.className || '')}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={'skeleton-row-' + rowIndex} className="animate-pulse">
                  {columns.map((column) => (
                    <td key={'skeleton-cell-' + column.key} className="px-5 py-4">
                      <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-gray-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
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
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
                    <Inbox className="h-10 w-10 stroke-1" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const clickable = Boolean(onRowClick);
                const interactiveClasses = clickable
                  ? 'cursor-pointer focus:bg-blue-50/60 focus:outline-none dark:focus:bg-blue-950/20'
                  : '';

                return (
                  <tr
                    key={resolveRowKey(row, rowIndex, rowKey)}
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? 'button' : undefined}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(event) => {
                      if (!clickable) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick?.(row);
                      }
                    }}
                    className={'transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-900/70 ' + interactiveClasses + ' ' + (rowClassName?.(row) || '')}
                  >
                    {columns.map((column) => {
                      const value =
                        typeof column.accessor === 'function'
                          ? column.accessor(row)
                          : (row[column.accessor] as React.ReactNode);

                      return (
                        <td
                          key={'cell-' + column.key}
                          className={'whitespace-nowrap px-5 py-4 align-middle text-gray-900 dark:text-gray-100 ' + (column.className || '')}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
