export default function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="aspect-[4/3] animate-pulse bg-gray-200 dark:bg-gray-800" />
      <div className="space-y-3 p-4">
        <div className="flex justify-between">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex gap-1.5">
          <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
