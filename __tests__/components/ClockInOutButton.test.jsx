import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { useClockStatus, useClockIn, useClockOut, useStartBreak, useEndBreak } from '@/hooks/useClock'
import { useCurrentUser } from '@/hooks/useAuth'
import { usePermissionsCheck } from '@/hooks/usePermissionsCheck'
import ClockInOutButton from '@/components/ClockInOutButton'

// Mock the hooks
jest.mock('@/hooks/useClock')
jest.mock('@/hooks/useAuth')
jest.mock('@/hooks/usePermissionsCheck')

describe('ClockInOutButton', () => {
  const mockClockIn = jest.fn()
  const mockClockOut = jest.fn()
  const mockStartBreak = jest.fn()
  const mockEndBreak = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    useCurrentUser.mockReturnValue({
      data: { id: 1, email: 'test@example.com' },
      isLoading: false,
    })
    
    usePermissionsCheck.mockReturnValue({
      hasPermission: jest.fn(() => true),
      isSuperuser: true,
    })
    
    useClockStatus.mockReturnValue({
      data: null,
      isLoading: false,
    })
    
    useClockIn.mockReturnValue({
      mutate: mockClockIn,
      mutateAsync: jest.fn(),
      isPending: false,
    })
    
    useClockOut.mockReturnValue({
      mutate: mockClockOut,
      mutateAsync: jest.fn(),
      isPending: false,
    })
    
    useStartBreak.mockReturnValue({
      mutate: mockStartBreak,
      mutateAsync: jest.fn(),
      isPending: false,
    })
    
    useEndBreak.mockReturnValue({
      mutate: mockEndBreak,
      mutateAsync: jest.fn(),
      isPending: false,
    })
  })

  it('should render clock in button when user is not clocked in', () => {
    render(<ClockInOutButton />)
    
    const button = screen.getByRole('button', { name: /check in/i })
    expect(button).toBeInTheDocument()
  })

  it('should render clock out button when user is clocked in', () => {
    useClockStatus.mockReturnValue({
      data: {
        is_clocked_in: true,
        clock_in_time: new Date().toISOString(),
      },
      isLoading: false,
    })

    render(<ClockInOutButton />)
    
    const button = screen.getByRole('button', { name: /check out/i })
    expect(button).toBeInTheDocument()
  })

  it('should not render when user lacks permission', () => {
    usePermissionsCheck.mockReturnValue({
      hasPermission: jest.fn(() => false),
      isSuperuser: false,
    })

    const { container } = render(<ClockInOutButton />)
    expect(container.firstChild).toBeNull()
  })

  it('should show loading state when status is loading', () => {
    useClockStatus.mockReturnValue({
      data: null,
      isLoading: true,
    })

    render(<ClockInOutButton />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show break button when clocked in and active', () => {
    useClockStatus.mockReturnValue({
      data: {
        is_clocked_in: true,
        clock_in_time: new Date().toISOString(),
        is_on_break: false,
      },
      isLoading: false,
    })

    render(<ClockInOutButton />)
    
    const breakButton = screen.getByRole('button', { name: /break/i })
    expect(breakButton).toBeInTheDocument()
  })
})

