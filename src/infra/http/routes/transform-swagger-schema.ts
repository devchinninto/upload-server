import { jsonSchemaTransform } from 'fastify-type-provider-zod'

// Extracts the parameter type that jsonSchemaTransform expects, so we don't have to write it manually
type TransformSwaggerSchemaData = Parameters<typeof jsonSchemaTransform>[0]

export function transformSwaggerSchema(data: TransformSwaggerSchemaData) {
  // Runs the default Zod→JSON Schema transformation provided by the library
  const { schema, url } = jsonSchemaTransform(data)

  // Only run for routes that receive multipart/form-data (i.e. file upload routes)
  if (schema.consumes?.includes('multipart/form-data')) {
    // If the route has no body schema yet, create a base object schema for it
    if (schema.body === undefined) {
      schema.body = {
        type: 'object',
        required: [] as string[],
        properties: {} as Record<string, unknown>,
      }
    }

    // Cast to a known shape so TypeScript lets us access .properties and .required
    // (schema.body is typed as `unknown` in fastify-type-provider-zod v6+)
    const body = schema.body as {
      properties: Record<string, unknown>
      required: string[]
    }

    // Add the `file` field to the schema as a binary string (how OpenAPI represents file uploads)
    body.properties.file = {
      type: 'string',
      format: 'binary',
    }

    // Mark `file` as a required field in the request body
    body.required.push('file')
  }

  return { schema, url }
}
