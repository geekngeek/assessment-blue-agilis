// thrown by server functions so callers can tell a missing row from a real failure
export class TodoNotFoundError extends Error {
  readonly code = 'TODO_NOT_FOUND'

  constructor(id: string) {
    super(`No todo with id ${id}`)
    this.name = 'TodoNotFoundError'
  }
}

const NOT_FOUND_PREFIX = 'No todo with id '

// the class is lost crossing the rpc boundary, so the client matches on the serialized message
export function isTodoNotFound(error: unknown): boolean {
  if (error instanceof TodoNotFoundError) {
    return true
  }

  const message = (error as { message?: unknown } | null | undefined)?.message

  return typeof message === 'string' && message.startsWith(NOT_FOUND_PREFIX)
}
