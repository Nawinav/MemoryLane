export function formatMemoryDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long"
  }).format(new Date(value));
}
