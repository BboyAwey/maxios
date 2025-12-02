import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useMaxios } from '../src/react'
import { apis } from './api-definitions'

function ReactDemo() {
  const [request, users, loading, error] = useMaxios(apis.getUsers, { name: 'React User' })
  const [requestWithParams, usersWithParams, loadingWithParams, errorWithParams] = useMaxios(apis.getUsers)
  const [name, setName] = useState('')

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px 0' }}>
      <h3>React Hook Demo</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>1. 使用初始参数</h4>
        <button 
          onClick={() => request()} 
          disabled={loading}
          style={{ padding: '8px 16px', margin: '5px' }}
        >
          {loading ? 'Loading...' : 'Fetch Users (with initial params)'}
        </button>
        {users && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto' }}>
            {JSON.stringify(users, null, 2)}
          </pre>
        )}
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            Error: {JSON.stringify(error)}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>2. 使用新参数</h4>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter user name"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button
          onClick={() => requestWithParams({ name })}
          disabled={loadingWithParams || !name}
          style={{ padding: '8px 16px', margin: '5px' }}
        >
          {loadingWithParams ? 'Loading...' : 'Fetch Users (with new params)'}
        </button>
        {usersWithParams && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto' }}>
            {JSON.stringify(usersWithParams, null, 2)}
          </pre>
        )}
        {errorWithParams && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            Error: {JSON.stringify(errorWithParams)}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>3. 无参数请求</h4>
        <button
          onClick={() => requestWithParams()}
          disabled={loadingWithParams}
          style={{ padding: '8px 16px', margin: '5px' }}
        >
          {loadingWithParams ? 'Loading...' : 'Fetch Users (no params)'}
        </button>
      </div>
    </div>
  )
}

export function mountReactDemo(container: HTMLElement) {
  const root = createRoot(container)
  root.render(<ReactDemo />)
}

