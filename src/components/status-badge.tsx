import { TODO_STATUS_LABELS } from '#/lib/todo.ts'

import type { TodoStatus } from '#/lib/todo.ts'

const STATUS_STYLES: Record<TodoStatus, string> = {
  todo: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  in_progress:
    'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
}

export function StatusBadge({ status }: { status: TodoStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {TODO_STATUS_LABELS[status]}
    </span>
  )
}
