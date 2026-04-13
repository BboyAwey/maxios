import ProcessorManager from '../process-manager'
import { AxiosError, AxiosResponse } from 'axios'

const mockAxiosResponse = (data: any): AxiosResponse => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: {} as any },
})

const mockAxiosError = (message: string): AxiosError => {
  const err = new Error(message) as AxiosError
  err.isAxiosError = true
  err.config = { headers: {} as any }
  err.toJSON = () => ({})
  return err
}

describe('ProcessorManager', () => {
  describe('chain API', () => {
    it('should support chained calls', () => {
      const pm = new ProcessorManager()
      const chain = pm.chain()
      const result = chain
        .loading(() => {})
        .success(() => {})
        .error(() => {})
        .requestError(() => {})
        .anyway(() => {})
      expect(result).toBe(chain)
    })
  })

  describe('processor execution order', () => {
    it('should execute processors in reverse order (low to high level)', () => {
      const pm = new ProcessorManager()
      const order: string[] = []

      pm.loadProcessorFromMaxiosConfig({
        success: () => { order.push('global') },
      })
      pm.loadProcessorFromMaxiosConfig({
        success: () => { order.push('module') },
      })
      pm.loadProcessorFromMaxiosConfig({
        success: () => { order.push('api') },
      })

      const chain = pm.chain()
      chain.success(() => { order.push('chain') })

      pm.executeSuccessProcessors('test-data')
      expect(order).toEqual(['chain', 'api', 'module', 'global'])
    })
  })

  describe('return false interruption', () => {
    it('should stop executing higher level processors when returning false', () => {
      const pm = new ProcessorManager()
      const order: string[] = []

      pm.loadProcessorFromMaxiosConfig({
        success: () => { order.push('global') },
      })
      pm.loadProcessorFromMaxiosConfig({
        success: () => { order.push('module') },
      })
      pm.loadProcessorFromMaxiosConfig({
        success: () => {
          order.push('api')
          return false
        },
      })

      const chain = pm.chain()
      chain.success(() => { order.push('chain') })

      pm.executeSuccessProcessors('test-data')
      // chain executes first, then api returns false, stopping module and global
      expect(order).toEqual(['chain', 'api'])
    })
  })

  describe('loading processors', () => {
    it('should pass loading status to callbacks', () => {
      const pm = new ProcessorManager()
      const statuses: boolean[] = []
      const chain = pm.chain()
      chain.loading((status) => { statuses.push(status) })

      pm.executeLoadingProcessors(true)
      pm.executeLoadingProcessors(false)
      expect(statuses).toEqual([true, false])
    })
  })

  describe('error processors', () => {
    it('should execute requestError processors', () => {
      const pm = new ProcessorManager()
      const errors: string[] = []
      const chain = pm.chain()
      chain.requestError((err) => { errors.push(err.message) })

      pm.executeRequestErrorProcessors(mockAxiosError('network error'))
      expect(errors).toEqual(['network error'])
    })

    it('should execute error processors with response data', () => {
      const pm = new ProcessorManager()
      const errors: any[] = []
      const chain = pm.chain()
      chain.error((data) => { errors.push(data) })

      pm.executeErrorProcessors(mockAxiosResponse({ code: -1, msg: 'fail' }))
      expect(errors).toEqual([{ code: -1, msg: 'fail' }])
    })
  })

  describe('anyway processors', () => {
    it('should always execute anyway processors', () => {
      const pm = new ProcessorManager()
      let called = false
      const chain = pm.chain()
      chain.anyway(() => { called = true })

      pm.executeAnywayProcessors(mockAxiosResponse('ok'))
      expect(called).toBe(true)
    })
  })

  describe('abort', () => {
    it('should call abort callback', () => {
      const pm = new ProcessorManager()
      const abortFn = jest.fn()
      pm.onAbort(abortFn)
      const chain = pm.chain()
      chain.abort()
      expect(abortFn).toHaveBeenCalled()
    })
  })

  describe('error handling in processors', () => {
    it('should catch errors in processors and continue', () => {
      const pm = new ProcessorManager()
      const order: string[] = []

      pm.loadProcessorFromMaxiosConfig({
        success: () => { order.push('global') },
      })

      const chain = pm.chain()
      chain.success(() => { throw new Error('oops') })

      // should not throw, and global should still execute
      expect(() => pm.executeSuccessProcessors('data')).not.toThrow()
      expect(order).toEqual(['global'])
    })
  })
})
