import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth, useCurrentUser, useLogin } from '@/hooks/useAuth'
import { authService } from '@/services/auth'
import { apiUtils } from '@/services/api-client'

// Mock dependencies
jest.mock('@/services/auth')
jest.mock('@/services/api-client')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAuth hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('useCurrentUser', () => {
    it('should fetch current user when authenticated', async () => {
      const mockUser = { id: 1, email: 'test@example.com' }
      authService.getCurrentUser.mockResolvedValue({
        data: mockUser,
      })
      apiUtils.isAuthenticated.mockReturnValue(true)

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockUser)
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })

    it('should not fetch when not authenticated', () => {
      apiUtils.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFetching).toBe(false)
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('useLogin', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        access_token: 'token123',
        refresh_token: 'refresh123',
      }
      authService.login.mockResolvedValue({
        data: mockResponse,
      })

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        email: 'test@example.com',
        password: 'password123',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(apiUtils.setAuthToken).toHaveBeenCalledWith('token123')
      expect(apiUtils.setRefreshToken).toHaveBeenCalledWith('refresh123')
    })

    it('should handle login errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      }
      authService.login.mockRejectedValue(mockError)

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useAuth', () => {
    it('should return authenticated state when user exists', async () => {
      const mockUser = { id: 1, email: 'test@example.com' }
      authService.getCurrentUser.mockResolvedValue({
        data: mockUser,
      })
      apiUtils.isAuthenticated.mockReturnValue(true)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should return unauthenticated state when no user', () => {
      apiUtils.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeUndefined()
    })
  })
})











