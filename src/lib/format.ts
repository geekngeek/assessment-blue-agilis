// fixed to UTC so the server and client render identical text and hydration stays stable
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
})

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value))
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`
}
