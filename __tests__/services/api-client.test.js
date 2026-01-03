import { api, apiUtils } from '@/services/api-client'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    // Mock axios.create to return a mock instance
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })
  })

  describe('apiUtils', () => {
    describe('setAuthToken', () => {
      it('should set auth token in localStorage', () => {
        apiUtils.setAuthToken('test-token')
        expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token')
      })

      it('should remove token when null is passed', () => {
        apiUtils.setAuthToken(null)
        expect(localStorage.removeItem).toHaveBeenCalledWith('authToken')
      })
    })

    describe('getAuthToken', () => {
      it('should get auth token from localStorage', () => {
        localStorage.getItem.mockReturnValue('test-token')
        const token = apiUtils.getAuthToken()
        expect(token).toBe('test-token')
        expect(localStorage.getItem).toHaveBeenCalledWith('authToken')
      })

      it('should return null when token does not exist', () => {
        localStorage.getItem.mockReturnValue(null)
        const token = apiUtils.getAuthToken()
        expect(token).toBeNull()
      })
    })

    describe('clearAuthToken', () => {
      it('should clear auth and refresh tokens', () => {
        apiUtils.clearAuthToken()
        expect(localStorage.removeItem).toHaveBeenCalledWith('authToken')
        expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
      })
    })

    describe('isAuthenticated', () => {
      it('should return true when token exists', () => {
        localStorage.getItem.mockReturnValue('test-token')
        const isAuth = apiUtils.isAuthenticated()
        expect(isAuth).toBe(true)
      })

      it('should return false when token does not exist', () => {
        localStorage.getItem.mockReturnValue(null)
        const isAuth = apiUtils.isAuthenticated()
        expect(isAuth).toBe(false)
      })
    })

    describe('setActiveRoleId', () => {
      it('should set active role ID', () => {
        apiUtils.setActiveRoleId(123)
        expect(localStorage.setItem).toHaveBeenCalledWith('activeRoleId', '123')
      })

      it('should remove role ID when null is passed', () => {
        apiUtils.setActiveRoleId(null)
        expect(localStorage.removeItem).toHaveBeenCalledWith('activeRoleId')
      })
    })

    describe('getActiveRoleId', () => {
      it('should get active role ID as integer', () => {
        localStorage.getItem.mockReturnValue('123')
        const roleId = apiUtils.getActiveRoleId()
        expect(roleId).toBe(123)
      })

      it('should return null when role ID does not exist', () => {
        localStorage.getItem.mockReturnValue(null)
        const roleId = apiUtils.getActiveRoleId()
        expect(roleId).toBeNull()
      })
    })
  })
})




