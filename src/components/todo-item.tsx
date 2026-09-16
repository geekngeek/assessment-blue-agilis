import { StatusBadge } from '#/components/status-badge.tsx'
import { formatDate } from '#/lib/format.ts'

import type { Todo } from '#/server/todos.ts'

export function TodoItem({ todo }: { todo: Todo }) {
  return (
    <li className="flex items-start gap-3 border-b border-neutral-200 px-4 py-3 last:border-b-0 dark:border-neutral-800">
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-medium ${todo.status === 'done' ? 'text-neutral-400 line-through dark:text-neutral-500' : ''}`}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
            {todo.description}
          </p>
        ) : null}
      </div>
      <StatusBadge status={todo.status} />
      <time
        dateTime={new Date(todo.createdAt).toISOString()}
        className="w-12 shrink-0 text-right text-xs text-neutral-400 tabular-nums dark:text-neutral-500"
      >
        {formatDate(todo.createdAt)}
      </time>
    </li>
  )
}
