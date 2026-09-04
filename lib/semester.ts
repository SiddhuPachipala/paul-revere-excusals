export function semesterOptions(reference = new Date()) {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  return month < 5
    ? [`Spring ${year}`, `Fall ${year}`]
    : [`Fall ${year}`, `Spring ${year + 1}`]
}
