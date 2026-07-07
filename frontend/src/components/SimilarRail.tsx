import { useQuery } from '@tanstack/react-query'
import { getSimilar } from '../lib/api'
import DestinationCard from './DestinationCard'

export default function SimilarRail({ destinationId }: { destinationId: number }) {
  const { data } = useQuery({
    queryKey: ['similar', destinationId],
    queryFn: () => getSimilar(destinationId),
  })

  if (!data || data.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-extrabold tracking-tight">
        You might <span className="text-sky-600 dark:text-sky-400">also like</span>
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((d) => (
          <DestinationCard key={d.id} destination={d} />
        ))}
      </div>
    </section>
  )
}
