import ConfigManager from '../config-manager'

beforeEach(() => {
  ConfigManager.globalConfig = {}
})

describe('ConfigManager', () => {
  describe('getFinalAxiosConfig', () => {
    it('should join baseURL from all levels', () => {
      ConfigManager.globalConfig = { axiosConfig: { baseURL: '/api' } }
      const cm = new ConfigManager({
        moduleConfig: { axiosConfig: { baseURL: '/user' } },
        apiConfig: { axiosConfig: { baseURL: '/list' } },
      })
      const config = cm.getFinalAxiosConfig()
      expect(config.baseURL).toBe('/api/user/list')
    })

    it('should merge headers from all levels', () => {
      ConfigManager.globalConfig = {
        axiosConfig: { headers: { 'X-Global': 'g' } as any },
      }
      const cm = new ConfigManager({
        moduleConfig: { axiosConfig: { headers: { 'X-Module': 'm' } as any } },
        apiConfig: { axiosConfig: { headers: { 'X-Api': 'a' } as any } },
      })
      const config = cm.getFinalAxiosConfig()
      expect(config.headers).toEqual({
        'X-Global': 'g',
        'X-Module': 'm',
        'X-Api': 'a',
      })
    })

    it('should merge params from all levels', () => {
      ConfigManager.globalConfig = {
        axiosConfig: { params: { page: 1 } },
      }
      const cm = new ConfigManager({
        moduleConfig: { axiosConfig: { params: { size: 10 } } },
        apiConfig: { axiosConfig: { params: { sort: 'name' } } },
      })
      const config = cm.getFinalAxiosConfig()
      expect(config.params).toEqual({ page: 1, size: 10, sort: 'name' })
    })

    it('should merge plain object data from all levels', () => {
      ConfigManager.globalConfig = {
        axiosConfig: { data: { a: 1 } },
      }
      const cm = new ConfigManager({
        moduleConfig: { axiosConfig: { data: { b: 2 } } },
        apiConfig: { axiosConfig: { data: { c: 3 } } },
      })
      const config = cm.getFinalAxiosConfig()
      expect(config.data).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should use non-plain-object data directly', () => {
      ConfigManager.globalConfig = {
        axiosConfig: { data: { a: 1 } },
      }
      const formData = 'raw-string-data'
      const cm = new ConfigManager({
        moduleConfig: { axiosConfig: {} },
        apiConfig: { axiosConfig: { data: formData } },
      })
      const config = cm.getFinalAxiosConfig()
      expect(config.data).toBe(formData)
    })

    it('should let lower level override higher level for general config', () => {
      ConfigManager.globalConfig = {
        axiosConfig: { method: 'GET', timeout: 5000 },
      }
      const cm = new ConfigManager({
        moduleConfig: { axiosConfig: { timeout: 10000 } },
        apiConfig: { axiosConfig: { method: 'POST' } },
      })
      const config = cm.getFinalAxiosConfig()
      expect(config.method).toBe('POST')
      expect(config.timeout).toBe(10000)
    })
  })

  describe('getNearestCallback', () => {
    it('should return api level callback first', () => {
      const globalFn = jest.fn()
      const moduleFn = jest.fn()
      const apiFn = jest.fn()
      ConfigManager.globalConfig = { expect: globalFn }
      const cm = new ConfigManager({
        moduleConfig: { expect: moduleFn },
        apiConfig: { expect: apiFn },
      })
      expect(cm.getNearestCallback('expect', () => {})).toBe(apiFn)
    })

    it('should fall back to module level', () => {
      const moduleFn = jest.fn()
      ConfigManager.globalConfig = {}
      const cm = new ConfigManager({
        moduleConfig: { expect: moduleFn },
        apiConfig: {},
      })
      expect(cm.getNearestCallback('expect', () => {})).toBe(moduleFn)
    })

    it('should fall back to default', () => {
      const defaultFn = jest.fn()
      ConfigManager.globalConfig = {}
      const cm = new ConfigManager({
        moduleConfig: {},
        apiConfig: {},
      })
      expect(cm.getNearestCallback('expect', defaultFn)).toBe(defaultFn)
    })
  })

  describe('functional config', () => {
    it('should support function-style global config', () => {
      ConfigManager.globalConfig = () => ({
        axiosConfig: { baseURL: '/api' },
      })
      const cm = new ConfigManager({
        moduleConfig: () => ({ axiosConfig: { baseURL: '/user' } }),
        apiConfig: () => ({ axiosConfig: { baseURL: '/detail' } }),
      })
      const config = cm.getFinalAxiosConfig()
      expect(config.baseURL).toBe('/api/user/detail')
    })
  })
})
