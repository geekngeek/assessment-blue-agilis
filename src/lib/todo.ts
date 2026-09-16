// dependency-free so client code can import it without pulling in the drizzle schema
export const TODO_STATUSES = ['todo', 'in_progress', 'done'] as const

export type TodoStatus = (typeof TODO_STATUSES)[number]

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const TODO_SORTS = ['newest', 'oldest', 'title'] as const

export type TodoSort = (typeof TODO_SORTS)[number]

export const TITLE_MAX_LENGTH = 200
export const DESCRIPTION_MAX_LENGTH = 2000
export const SEARCH_MAX_LENGTH = 200
