import { describe, it, expect } from 'vitest'
import { pathJoin, SelfIncrementID, nextTick, uuid } from '../utils'

describe('pathJoin', () => {
  it('should join multiple path segments', () => {
    expect(pathJoin('/api', '/user', '/list')).toBe('/api/user/list')
  })

  it('should handle trailing slash on first segment', () => {
    expect(pathJoin('/api/', '/user', '/list')).toBe('/api/user/list')
  })

  it('should handle empty input', () => {
    expect(pathJoin()).toBe('')
  })

  it('should handle single segment', () => {
    expect(pathJoin('/api')).toBe('/api')
  })

  it('should filter out undefined/null segments', () => {
    expect(pathJoin('/api', undefined, '/list')).toBe('/api/list')
  })

  it('should collapse multiple consecutive slashes', () => {
    expect(pathJoin('/api', '///user///profile')).toBe('/api/user/profile')
  })
})

describe('SelfIncrementID', () => {
  it('should generate incrementing IDs', () => {
    const id = new SelfIncrementID()
    expect(id.generate()).toBe(0)
    expect(id.generate()).toBe(1)
    expect(id.generate()).toBe(2)
  })

  it('should reset when exceeding max', () => {
    const id = new SelfIncrementID(2)
    expect(id.generate()).toBe(0)
    expect(id.generate()).toBe(1)
    expect(id.generate()).toBe(2)
    expect(id.generate()).toBe(0)
  })
})

describe('nextTick', () => {
  it('should execute callback asynchronously', async () => {
    const order: number[] = []
    nextTick(() => order.push(2))
    order.push(1)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(order).toEqual([1, 2])
  })
})

describe('uuid', () => {
  it('should return a valid uuid v4 format', () => {
    const id = uuid()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('should return unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuid()))
    expect(ids.size).toBe(100)
  })
})
