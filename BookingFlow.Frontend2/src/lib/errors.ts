export interface ApiProblem {
  message?: string
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem?: ApiProblem,
  ) {
    super(message)
  }
}

export function normalizeApiError(problem: ApiProblem | null | undefined, fallbackMessage: string) {
  if (!problem) {
    return fallbackMessage
  }

  if (problem.message) {
    return problem.message
  }

  if (problem.title) {
    return problem.title
  }

  if (problem.detail) {
    return problem.detail
  }

  const firstValidationMessage = Object.values(problem.errors ?? {})[0]?.[0]
  return firstValidationMessage ?? fallbackMessage
}
