import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { uploadImage } from '@/app/use-cases/upload-image'
import { isRight, unwrapEither } from '@/shared/either'

const MAXIMUM_FILE_SIZE_IN_BYTES = 1024 * 1024 * 4 // 4mb

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        tags: ['uploads'],
        consumes: ['multipart/form-data'],
        response: {
          201: z.object({}).describe('Image uploaded'),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const uploadedFile = await request.file({
        limits: {
          fileSize: MAXIMUM_FILE_SIZE_IN_BYTES,
        },
      })

      if (!uploadedFile) {
        return reply.status(400).send({ message: 'File is required.' })
      }

      const result = await uploadImage({
        // This is where the stream is consumed
        fileName: uploadedFile.filename,
        contentType: uploadedFile.mimetype,
        contentStream: uploadedFile.file,
      })

      // Since we're using streams, the file size is unknown upfront — it's processed chunk by chunk.
      // This means size validation can only happen AFTER the stream is fully consumed.
      // Fastify enforces the 2mb limit by aborting the stream if it's exceeded, and R2 automatically removes incomplete uploads from the bucket after a set number of days.
      // This check exists to improve the user experience by surfacing a friendly error when the upload was truncated (i.e., aborted due to exceeding the size limit).
      if (uploadedFile.file.truncated) {
        return reply.status(400).send({
          message: 'File size limit reached.',
        })
      }

      if (isRight(result)) {
        console.log(unwrapEither(result))

        return reply.status(201).send({})
      } // Checks if it's success. Below it unwraps the error.

      const error = unwrapEither(result)

      // Error handling
      switch (error.constructor.name) {
        case 'InvalidFileFormat':
          return reply.status(400).send({ message: error.message })
      }
    }
  )
}
