import { useEffect, useRef, useState } from 'react'

import { StatusBadge } from '#/components/status-badge.tsx'
import { useTodoActions } from '#/hooks/use-todo-actions.ts'
import { formatDate } from '#/lib/format.ts'
import { isOptimistic } from '#/lib/mutations.ts'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TODO_STATUSES,
  TODO_STATUS_LABELS,
} from '#/lib/todo.ts'

import type { TodoStatus } from '#/lib/todo.ts'
import type { Todo } from '#/server/todos.ts'

function nextStatus(status: TodoStatus): TodoStatus {
  return TODO_STATUSES[
    (TODO_STATUSES.indexOf(status) + 1) % TODO_STATUSES.length
  ]
}

const fieldClass =
  'w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:focus:border-neutral-100'

export function TodoItem({ todo }: { todo: Todo }) {
  const { update, remove } = useTodoActions()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description)
  const [status, setStatus] = useState<TodoStatus>(todo.status)
  const titleRef = useRef<HTMLInputElement>(null)

  // a row still being created has no server id yet, so it cannot be edited or deleted
  const pending = isOptimistic(todo)

  useEffect(() => {
    if (isEditing) {
      titleRef.current?.focus()
      titleRef.current?.select()
    }
  }, [isEditing])

  function startEditing() {
    setTitle(todo.title)
    setDescription(todo.description)
    setStatus(todo.status)
    setIsEditing(true)
  }

  function cancel() {
    setIsEditing(false)
  }

  function save() {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      titleRef.current?.focus()
      return
    }

    setIsEditing(false)

    const changed =
      trimmedTitle !== todo.title ||
      description.trim() !== todo.description ||
      status !== todo.status

    if (!changed) {
      return
    }

    update({
      id: todo.id,
      title: trimmedTitle,
      description: description.trim(),
      status,
    })
  }

  if (isEditing) {
    return (
      <li className="border-b border-neutral-200 px-4 py-3 last:border-b-0 dark:border-neutral-800">
        <div className="flex flex-col gap-2">
          <input
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                save()
              }

              if (event.key === 'Escape') {
                event.preventDefault()
                cancel()
              }
            }}
            maxLength={TITLE_MAX_LENGTH}
            aria-label="Edit title"
            className={`font-medium ${fieldClass}`}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                save()
              }

              if (event.key === 'Escape') {
                event.preventDefault()
                cancel()
              }
            }}
            rows={2}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder="Description"
            aria-label="Edit description"
            className={`resize-y ${fieldClass}`}
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TodoStatus)
                }
                aria-label="Edit status"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
              >
                {TODO_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {TODO_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancel}
                className="rounded-md px-3 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li
      className={`group flex items-start gap-3 border-b border-neutral-200 px-4 py-3 last:border-b-0 dark:border-neutral-800 ${pending ? 'opacity-50' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          disabled={pending}
          onClick={startEditing}
          title="Edit this todo"
          className={`block w-full truncate text-left font-medium hover:underline ${
            todo.status === 'done'
              ? 'text-neutral-400 line-through dark:text-neutral-500'
              : ''
          }`}
        >
          {todo.title}
        </button>
        {todo.description ? (
          <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
            {todo.description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => update({ id: todo.id, status: nextStatus(todo.status) })}
        title={`Mark as ${TODO_STATUS_LABELS[nextStatus(todo.status)]}`}
        aria-label={`Status ${TODO_STATUS_LABELS[todo.status]}, change to ${TODO_STATUS_LABELS[nextStatus(todo.status)]}`}
        className="shrink-0"
      >
        <StatusBadge status={todo.status} />
      </button>

      <time
        dateTime={new Date(todo.createdAt).toISOString()}
        className="w-12 shrink-0 text-right text-xs text-neutral-400 tabular-nums dark:text-neutral-500"
      >
        {formatDate(todo.createdAt)}
      </time>

      {/* kept visible rather than hover-only, so the actions are discoverable and work on touch */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={startEditing}
          aria-label={`Edit ${todo.title}`}
          title="Edit"
          className="rounded p-1 text-neutral-400 opacity-70 hover:bg-neutral-100 hover:text-neutral-900 focus:opacity-100 group-hover:opacity-100 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          ✎
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => remove(todo)}
          aria-label={`Delete ${todo.title}`}
          title="Delete"
          className="rounded p-1 text-neutral-400 opacity-70 hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:text-neutral-500 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          ✕
        </button>
      </div>
    </li>
  )
}
