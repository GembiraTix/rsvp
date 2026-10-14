import { serverSupabaseClient } from '#supabase/server'
import { nanoid } from 'nanoid'
import { buildLogger } from '~~/server/services/logger.factory'
import { isValidImageBuffer } from '~~/shared/utils/imageValidation'

const logger = buildLogger()

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    logger.warn('unauthenticated user uploading image')

    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    logger.warn('no file(s) found')

    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak ada berkas yang diunggah.',
    })
  }

  const file = files.find((f) => f.name === 'file' || f.filename)
  if (!file || !file.data) {
    logger.warn('file is empty or null')

    throw createError({
      statusCode: 400,
      statusMessage: 'Berkas gambar tidak ditemukan dalam permintaan.',
    })
  }

  const maxBytes = 5 * 1024 * 1024 // 5MB
  if (file.data.length > maxBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ukuran berkas melebihi batas maksimum 5MB.',
    })
  }

  if (!isValidImageBuffer(file.data)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Header berkas bukan merupakan gambar yang valid.',
    })
  }

  const extension = file.filename
    ? file.filename.split('.').pop() || 'png'
    : 'png'
  const fileName = `${nanoid()}.${extension}`

  const client = await serverSupabaseClient(event)
  const { data, error } = await client.storage
    .from('event-banners')
    .upload(fileName, file.data, {
      contentType: file.type || 'image/png',
      upsert: true,
    })

  if (error) {
    logger.error(error.message)

    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengunggah gambar ke storage, silahkan coba lagi dalam beberapa saat.`,
    })
  }

  const { data: publicUrlData } = client.storage
    .from('event-banners')
    .getPublicUrl(data.path)

  return {
    success: true,
    data: {
      url: publicUrlData.publicUrl,
    },
  }
})
