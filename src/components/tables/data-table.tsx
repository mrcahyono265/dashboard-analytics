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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-text-tertiary focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>
      )}
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider',
                      compact ? 'py-2.5' : 'py-3',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted'
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
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-text-secondary">
                  No data found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border transition-colors hover:bg-muted/30',
                    i % 2 === 0 ? 'bg-surface' : 'bg-surface-subtle/30',
                    compact ? 'last:border-b-0' : ''
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cn('px-4 text-sm text-text', compact ? 'py-2' : 'py-3')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>
          {table.getFilteredRowModel().rows.length} results
          {table.getRowModel().rows.length < data.length && (
            <span className="text-text-tertiary ml-1">
              (showing {table.getRowModel().rows.length})
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="xs" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
            const page = Math.max(0, Math.min(table.getState().pagination.pageIndex - 2, table.getPageCount() - 5)) + i
            if (page >= table.getPageCount()) return null
            return (
              <Button
                key={page}
                variant={table.getState().pagination.pageIndex === page ? 'primary' : 'outline'}
                size="xs"
                onClick={() => table.setPageIndex(page)}
                className="min-w-[28px]"
              >
                {page + 1}
              </Button>
            )
          })}
          <Button variant="outline" size="xs" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
