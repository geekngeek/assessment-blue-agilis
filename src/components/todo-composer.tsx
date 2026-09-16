import { useRef, useState } from 'react'

import { useTodoActions } from '#/hooks/use-todo-actions.ts'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TODO_STATUSES,
  TODO_STATUS_LABELS,
} from '#/lib/todo.ts'

import type { TodoStatus } from '#/lib/todo.ts'

// id lets the "n" shortcut and the command palette focus this field
export const COMPOSER_INPUT_ID = 'todo-composer'

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100'

export function TodoComposer() {
  const { create } = useTodoActions()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TodoStatus>('todo')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setTitle('')
    setDescription('')
    setStatus('todo')
    setIsExpanded(false)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()

    const trimmed = title.trim()

    if (!trimmed) {
      return
    }

    create({ title: trimmed, description: description.trim(), status })
    reset()
    inputRef.current?.focus()
    setIsExpanded(true)
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex gap-2">
        <input
          id={COMPOSER_INPUT_ID}
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              reset()
              inputRef.current?.blur()
            }
          }}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="Add a todo"
          aria-label="New todo title"
          aria-expanded={isExpanded}
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Add
        </button>
      </div>

      {isExpanded ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              // newlines stay available in the textarea, so submit needs a modifier
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                submit(event)
              }

              if (event.key === 'Escape') {
                event.preventDefault()
                reset()
              }
            }}
            rows={2}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder="Description (optional)"
            aria-label="New todo description"
            className={`flex-1 resize-y ${inputClass}`}
          />
          <label className="flex shrink-0 items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TodoStatus)}
              aria-label="New todo status"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {TODO_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {TODO_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </form>
  )
}
