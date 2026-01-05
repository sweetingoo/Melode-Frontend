import {
  parseTime,
  formatElapsedTime,
  formatElapsedTimeHHMMSS,
  calculateElapsedHours,
  combineDateAndTime,
  formatDateTimeForAPI,
  formatDateForAPI,
  startOfDay,
  endOfDay,
} from '@/utils/time'

describe('Time Utilities', () => {
  describe('parseTime', () => {
    it('should parse ISO string without timezone as UTC', () => {
      const result = parseTime('2024-01-15T10:30:00')
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toContain('2024-01-15')
    })

    it('should parse ISO string with Z suffix', () => {
      const result = parseTime('2024-01-15T10:30:00Z')
      expect(result).toBeInstanceOf(Date)
    })

    it('should return null for empty input', () => {
      expect(parseTime(null)).toBeNull()
      expect(parseTime(undefined)).toBeNull()
      expect(parseTime('')).toBeNull()
    })
  })

  describe('formatElapsedTime', () => {
    it('should format elapsed time correctly', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const result = formatElapsedTime(oneHourAgo.toISOString())
      expect(result).toContain('1h')
    })

    it('should return "0m" for null input', () => {
      expect(formatElapsedTime(null)).toBe('0m')
    })

    it('should handle days, hours, and minutes', () => {
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000 - 30 * 60 * 1000)
      const result = formatElapsedTime(twoDaysAgo.toISOString())
      expect(result).toContain('2d')
      expect(result).toContain('5h')
      expect(result).toContain('30m')
    })
  })

  describe('formatElapsedTimeHHMMSS', () => {
    it('should format time as HH:mm:ss', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const result = formatElapsedTimeHHMMSS(oneHourAgo.toISOString())
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
      expect(result).toContain('01:00:00')
    })

    it('should return "00:00:00" for null input', () => {
      expect(formatElapsedTimeHHMMSS(null)).toBe('00:00:00')
    })
  })

  describe('calculateElapsedHours', () => {
    it('should calculate elapsed hours correctly', () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const result = calculateElapsedHours(twoHoursAgo.toISOString())
      expect(result).toBeCloseTo(2, 1)
    })

    it('should return 0 for null input', () => {
      expect(calculateElapsedHours(null)).toBe(0)
    })
  })

  describe('combineDateAndTime', () => {
    it('should combine date and time correctly', () => {
      const date = new Date('2024-01-15')
      const timeString = '14:30'
      const result = combineDateAndTime(date, timeString)
      expect(result.getHours()).toBe(14)
      expect(result.getMinutes()).toBe(30)
    })

    it('should return null for invalid input', () => {
      expect(combineDateAndTime(null, '14:30')).toBeNull()
      expect(combineDateAndTime(new Date(), null)).toBeNull()
    })
  })

  describe('formatDateTimeForAPI', () => {
    it('should format datetime for API correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTimeForAPI(date, '14:30')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    })
  })

  describe('formatDateForAPI', () => {
    it('should format date for API correctly', () => {
      const date = new Date('2024-01-15')
      const result = formatDateForAPI(date)
      expect(result).toBe('2024-01-15')
    })
  })

  describe('startOfDay', () => {
    it('should set time to start of day', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = startOfDay(date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })
  })

  describe('endOfDay', () => {
    it('should set time to end of day', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = endOfDay(date)
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
    })
  })
})











