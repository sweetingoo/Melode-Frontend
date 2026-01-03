// Mock API client
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  upload: jest.fn(),
  download: jest.fn(),
}

// Mock auth service
export const mockAuthService = {
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  signup: jest.fn(),
  mfaLogin: jest.fn(),
}

// Mock user data
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  roles: [{ id: 1, name: 'Admin' }],
  assignments: [{ id: 1, role_id: 1, department_id: 1 }],
}

// Mock API responses
export const mockApiResponses = {
  success: (data) => ({
    status: 200,
    statusText: 'OK',
    data,
    headers: {},
    config: {},
  }),
  error: (status, message, data = {}) => ({
    response: {
      status,
      statusText: 'Error',
      data: {
        message,
        ...data,
      },
    },
    message,
  }),
  validationError: (errors) => ({
    response: {
      status: 422,
      statusText: 'Unprocessable Entity',
      data: {
        message: 'Validation error',
        errors,
      },
    },
  }),
}

// Helper to create mock query data
export const createMockQueryData = (data) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
  isSuccess: true,
  refetch: jest.fn(),
})

// Helper to create mock mutation
export const createMockMutation = (overrides = {}) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  ...overrides,
})




