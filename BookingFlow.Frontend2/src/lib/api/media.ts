import { request } from './client'
import type { UploadedMediaResponse } from '../../types/api'

export const mediaApi = {
  uploadMedia(file: File, folder: string, token: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return request<UploadedMediaResponse>('/api/media/upload', {
      method: 'POST',
      body: formData,
      token,
    })
  },
}
