import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DataTableProps<TData extends Record<string, any>> {
  columns: ColumnDef<TData>[]
  data: TData[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  compact?: boolean
}

export function DataTable<TData extends Record<string, any>>({
  columns, data, pageSize = 20, searchable = true,
  searchPlaceholder = 'Search...', compact = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-2xl border border-outline-variant bg-surface-container-low pl-10 pr-4 text-sm outline-none placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary text-on-surface transition-all"
          />
        </div>
      )}
      <div className="overflow-auto rounded-2xl border border-outline-variant shadow-sm">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-6 text-left text-[10px] font-bold uppercase tracking-widest',
                      compact ? 'py-3' : 'py-4',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:bg-surface-container-high transition-colors'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUp className="h-3 w-3 text-primary" />,
                        desc: <ChevronDown className="h-3 w-3 text-primary" />,
                      }[header.column.getIsSorted() as string] ?? (
                        header.column.getCanSort() && <ChevronsUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                  No data found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-all hover:bg-surface-container-high/50 cursor-pointer group',
                    compact ? 'last:border-b-0' : ''
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cn('px-6 text-sm text-on-surface', compact ? 'py-2.5' : 'py-5')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        <span>
          {table.getFilteredRowModel().rows.length} results
          {table.getRowModel().rows.length < data.length && (
            <span className="text-on-surface-variant/60 ml-1">
              (showing {table.getRowModel().rows.length})
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 bg-surface-container-high border border-outline-variant rounded-xl hover:bg-surface-container-highest transition-all disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 text-on-surface" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
              const page = Math.max(0, Math.min(table.getState().pagination.pageIndex - 2, table.getPageCount() - 5)) + i
              if (page >= table.getPageCount()) return null
              return (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page)}
                  className={cn(
                    'w-10 h-10 rounded-xl font-bold text-sm transition-all',
                    table.getState().pagination.pageIndex === page
                      ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/10'
                      : 'hover:bg-surface-container-high text-on-surface'
                  )}
                >
                  {page + 1}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 bg-surface-container-high border border-outline-variant rounded-xl hover:bg-surface-container-highest transition-all disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-on-surface" />
          </button>
        </div>
      </div>
    </div>
  )
}
