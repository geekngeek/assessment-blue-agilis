// module scope on purpose; the command palette reads this without threading context through the tree
let lastDeletedId: string | null = null

export function rememberDeleted(id: string) {
  lastDeletedId = id
}

export function takeLastDeleted() {
  const id = lastDeletedId
  lastDeletedId = null
  return id
}

export function forgetDeleted(id: string) {
  if (lastDeletedId === id) {
    lastDeletedId = null
  }
}
