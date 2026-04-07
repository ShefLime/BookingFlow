import { ApiError, normalizeApiError, type ApiProblem } from '../errors'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

interface RequestOptions extends RequestInit {
  token?: string
}

function buildUrl(path: string) {
  if (!apiBaseUrl) {
    return path
  }

  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (normalizedBase === '/api' && normalizedPath.startsWith('/api/')) {
    return normalizedPath
  }

  return `${normalizedBase}${normalizedPath}`
}

export function toQuery(params: Record<string, string | boolean | number | undefined>) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue
    }

    searchParams.set(key, String(value))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { token, headers, ...rest } = options
  const isFormData = rest.body instanceof FormData
  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    let problem: ApiProblem | undefined

    try {
      problem = (await response.json()) as ApiProblem
    } catch {
      problem = undefined
    }

    throw new ApiError(
      normalizeApiError(problem, response.statusText || 'Запрос завершился с ошибкой.'),
      response.status,
      problem,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}
