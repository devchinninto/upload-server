import { asc, count, desc, ilike } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeRight } from '@/shared/either'

// Zod is used for the input schema to validate and parse incoming data at runtime.
const getUploadsInput = z.object({
  searchQuery: z.string().optional(),
  sortBy: z.enum(['createdAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(20),
})

type GetUploadsInput = z.input<typeof getUploadsInput>

// The output is defined as a plain TypeScript type since it's an internal contract with no need for runtime validation.
type GetUploadsOutput = {
  uploads: {
    id: string
    name: string
    remoteKey: string
    remoteUrl: string
    createdAt: Date
  }[]
  total: number
}

export async function getUploads(
  input: GetUploadsInput
): Promise<Either<never, GetUploadsOutput>> {
  // 'never' means this function cannot produce an expected error — unlike 'null', which would imply an error is possible but absent.
  // Note: unhandled runtime errors can still be thrown, but 'never' signals there are no intentional failure cases — invalid inputs like page or searchQuery simply return an empty array rather than an error.
  const { page, pageSize, searchQuery, sortBy, sortDirection } =
    getUploadsInput.parse(input)

  // Drizzle always returns an array, even for a single-row result, so we destructure [{ total }], the first (and only) element to access the total count directly.
  const [uploads, [{ total }]] = await Promise.all([
    // Note on writing the queries as an Array and destructuring the two separate results:
    // Always select only the fields the consumer actually needs. As the application grows, fetching unnecessary columns adds overhead to every HTTP request — both in database processing and payload size — which can become costly at scale.

    db
      .select({
        id: schema.uploads.id,
        name: schema.uploads.name,
        remoteKey: schema.uploads.remoteKey,
        remoteUrl: schema.uploads.remoteUrl,
        createdAt: schema.uploads.createdAt,
      })
      .from(schema.uploads)
      .where(
        searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined
      )
      .orderBy(fields => {
        if (sortBy && sortDirection === 'asc') {
          return asc(fields[sortBy])
        }

        if (sortBy && sortDirection === 'desc') {
          return desc(fields[sortBy])
        }

        return desc(fields.id) // UUIDv7 is time-ordered, so sorting by id is equivalent to sorting by createdAt.
      })
      .offset((page - 1) * pageSize)
      .limit(pageSize),

    // A separate count query is run in parallel to give the frontend the total number of records for pagination.
    db
      .select({ total: count(schema.uploads.id) })
      .from(schema.uploads)
      .where(
        searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined
      ),
  ])

  return makeRight({ uploads, total })
}
