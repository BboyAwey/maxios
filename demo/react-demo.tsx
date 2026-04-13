import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useMaxios } from '../src/react'
import { userApi } from './api-definitions'

function ReactDemo() {
  // 1. Auto-fetch on mount
  const {
    data: users,
    loading: usersLoading,
    error: usersError
  } = useMaxios(userApi.getAll, { args: [{ name: 'Alice' }], auto: true })

  // 2. Manual trigger
  const {
    request: fetchUser,
    data: user,
    loading: userLoading
  } = useMaxios(userApi.getById, { args: [1], auto: false })

  // 3. Reactive args
  const [userId, setUserId] = useState(1)
  const {
    data: reactiveUser,
    loading: reactiveLoading
  } = useMaxios(userApi.getById, { args: [userId], auto: true })

  // 4. Debounced search
  const [query, setQuery] = useState('')
  const {
    data: searchResult,
    loading: searchLoading
  } = useMaxios(userApi.search, {
    args: [query, 1],
    auto: { enable: query.length > 0, debounce: 300 }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Auto-fetch */}
      <Section title="1. Auto-fetch on mount" desc="auto: true — fetches immediately">
        <Status loading={usersLoading} data={users} error={usersError} />
      </Section>

      {/* 2. Manual trigger */}
      <Section title="2. Manual trigger" desc="auto: false — call request() yourself">
        <button onClick={() => fetchUser()} disabled={userLoading} style={btnStyle(userLoading)}>
          {userLoading ? 'Loading...' : 'Fetch User'}
        </button>
        <button onClick={() => fetchUser(42)} disabled={userLoading} style={btnStyle(userLoading)}>
          {userLoading ? 'Loading...' : 'Fetch User #42'}
        </button>
        <Status loading={userLoading} data={user} />
      </Section>

      {/* 3. Reactive args */}
      <Section title="3. Reactive args" desc="Change userId to auto-refetch">
        <input type="number" value={userId} onChange={e => setUserId(Number(e.target.value))}
          style={{ padding: 8, width: 100 }} />
        <span style={{ marginLeft: 8, color: '#666' }}>userId = {userId}</span>
        <Status loading={reactiveLoading} data={reactiveUser} />
      </Section>

      {/* 4. Debounced search */}
      <Section title="4. Debounced search" desc="300ms debounce, only when query is non-empty">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Type to search..." style={{ padding: 8, width: 200 }} />
        <Status loading={searchLoading} data={searchResult} />
      </Section>
    </div>
  )
}

// ========== Helpers ==========

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 4px' }}>{title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>{desc}</p>
      {children}
    </div>
  )
}

function Status({ loading, data, error }: { loading: boolean; data: any; error?: any }) {
  return (
    <div style={{ marginTop: 8 }}>
      {loading && <div style={{ color: '#999' }}>Loading...</div>}
      {error && <pre style={{ color: 'red', fontSize: 12 }}>{JSON.stringify(error, null, 2)}</pre>}
      {data && <pre style={{ background: '#f0f0f0', padding: 8, fontSize: 12, borderRadius: 4, overflow: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return { padding: '8px 16px', marginRight: 8, background: disabled ? '#ccc' : '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer' }
}

export function mountReactDemo(container: HTMLElement) {
  createRoot(container).render(<ReactDemo />)
}
