/// <reference types="jest" />
import { getCurrentWeekNumber, getWeekRange } from '@/app/utils/dateUtils'

describe('dateUtils', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2023-05-10T00:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('getCurrentWeekNumber returns current ISO week info', () => {
    expect(getCurrentWeekNumber()).toEqual({ year: 2023, week: 20 })
  })

  test('getWeekRange returns range for given week', () => {
    expect(getWeekRange(2023, 20)).toEqual({
      year: 2023,
      week: 20,
      start: '2023-05-15',
      end: '2023-05-21',
    })
  })
})