import { useState, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { useMaxios } from '../src/react'
import { apis } from './api-definitions'

function ReactDemo() {
  // ========== 测试用例 1: 无参数函数 + 自动触发（仅在初始化时） ==========
  const { 
    request: requestNoParams, 
    data: usersNoParams, 
    loading: loadingNoParams, 
    error: errorNoParams 
  } = useMaxios(apis.getUsersNoParams, { auto: true })

  // ========== 测试用例 2: 可选参数 + 自动触发 + args 响应式更新 ==========
  const [userId, setUserId] = useState(1)
  const { 
    request: requestOptional, 
    data: userOptional, 
    loading: loadingOptional, 
    error: errorOptional 
  } = useMaxios(apis.getUsers, { args: [{ name: `User ${userId}` }], auto: true })

  // ========== 测试用例 3: 必填参数 + 自动触发 + args 响应式更新 ==========
  const [userIdRequired, setUserIdRequired] = useState(2)
  const { 
    request: requestRequired, 
    data: userRequired, 
    loading: loadingRequired, 
    error: errorRequired 
  } = useMaxios(apis.getUserById, { args: [userIdRequired], auto: true })

  // ========== 测试用例 4: 多参数（必填）+ 自动触发 ==========
  const [multiId, setMultiId] = useState(3)
  const [multiName, setMultiName] = useState('Multi User')
  const multiArgs = useMemo<[number, string]>(() => [multiId, multiName], [multiId, multiName])
  const { 
    request: requestMulti, 
    data: userMulti, 
    loading: loadingMulti, 
    error: errorMulti 
  } = useMaxios(apis.getUserByMultipleParams, { args: multiArgs, auto: true })

  // ========== 测试用例 5: 禁用自动触发 ==========
  const [manualUserId, setManualUserId] = useState(4)
  const { 
    request: requestManual, 
    data: userManual, 
    loading: loadingManual, 
    error: errorManual 
  } = useMaxios(apis.getUserById, { args: [manualUserId], auto: false })

  // ========== 测试用例 6: 条件自动触发（auto 函数） ==========
  const [conditionalUserId, setConditionalUserId] = useState(5)
  const [isEnabled, setIsEnabled] = useState(true)
  const { 
    request: requestConditional, 
    data: userConditional, 
    loading: loadingConditional, 
    error: errorConditional 
  } = useMaxios(apis.getUserById, { 
    args: [conditionalUserId], 
    auto: () => isEnabled && conditionalUserId > 0 
  })

  // ========== 测试用例 7: 参数记忆和覆盖 ==========
  const [memoryUserId, setMemoryUserId] = useState(6)
  const { 
    request: requestMemory, 
    data: userMemory, 
    loading: loadingMemory, 
    error: errorMemory 
  } = useMaxios(apis.getUserById, { args: [memoryUserId], auto: false })

  // ========== 测试用例 8: 可选参数 + 无 args + 自动触发（仅在初始化时） ==========
  const { 
    request: requestOptionalNoArgs, 
    data: usersOptionalNoArgs, 
    loading: loadingOptionalNoArgs, 
    error: errorOptionalNoArgs 
  } = useMaxios(apis.getUsers, { auto: true })

  // ========== 测试用例 9: 对象格式 auto - 完整格式（enable + condition） ==========
  const [objUserId, setObjUserId] = useState(7)
  const [objEnabled, setObjEnabled] = useState(true)
  const { 
    request: _requestObj, 
    data: userObj, 
    loading: loadingObj, 
    error: errorObj 
  } = useMaxios(apis.getUserById, { 
    args: [objUserId], 
    auto: {
      enable: objEnabled,
      condition: () => objUserId > 0 && objEnabled
    }
  })

  // ========== 测试用例 10: 对象格式 auto - 只传递 condition（enable 默认为 true） ==========
  const [condUserId, setCondUserId] = useState(8)
  const { 
    request: _requestCond, 
    data: userCond, 
    loading: loadingCond, 
    error: errorCond 
  } = useMaxios(apis.getUserById, { 
    args: [condUserId], 
    auto: {
      condition: () => condUserId > 0
    }
  })

  // ========== 测试用例 11: 对象格式 auto - 只传递 enable ==========
  const [enableUserId, setEnableUserId] = useState(9)
  const [enableFlag, setEnableFlag] = useState(true)
  const { 
    request: _requestEnable, 
    data: userEnable, 
    loading: loadingEnable, 
    error: errorEnable 
  } = useMaxios(apis.getUserById, { 
    args: [enableUserId], 
    auto: {
      enable: enableFlag
    }
  })

  // ========== 测试用例 12: 对象格式 auto - 带 debounce（true，默认 300ms） ==========
  const [debounceUserId, setDebounceUserId] = useState(10)
  const { 
    request: _requestDebounce, 
    data: userDebounce, 
    loading: loadingDebounce, 
    error: errorDebounce 
  } = useMaxios(apis.getUserById, { 
    args: [debounceUserId], 
    auto: {
      enable: true,
      debounce: true  // 300ms 防抖
    }
  })

  // ========== 测试用例 13: 对象格式 auto - 带 debounce（自定义毫秒数） ==========
  const [customDebounceUserId, setCustomDebounceUserId] = useState(11)
  const { 
    request: _requestCustomDebounce, 
    data: userCustomDebounce, 
    loading: loadingCustomDebounce, 
    error: errorCustomDebounce 
  } = useMaxios(apis.getUserById, { 
    args: [customDebounceUserId], 
    auto: {
      enable: true,
      debounce: 500  // 500ms 防抖
    }
  })


  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px 0' }}>
      <h2 style={{ marginTop: 0 }}>React Hook 完整测试 Demo</h2>
      
      {/* 测试用例 1: 无参数函数 + 自动触发 */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 1: 无参数函数 + auto: true（仅在初始化时触发）</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          无参数函数，auto: true，应该在挂载时自动触发一次，之后不再自动触发
        </p>
        <button 
          onClick={() => requestNoParams()} 
          disabled={loadingNoParams}
          style={{ padding: '8px 16px', margin: '5px', background: loadingNoParams ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingNoParams ? 'not-allowed' : 'pointer' }}
        >
          {loadingNoParams ? 'Loading...' : '手动触发（使用最新 args）'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingNoParams ? 'true' : 'false'} | 
          <strong> Data:</strong> {usersNoParams ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorNoParams ? '✗' : '✓'}
        </div>
        {usersNoParams && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(usersNoParams, null, 2)}
          </pre>
        )}
        {errorNoParams && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            Error: {JSON.stringify(errorNoParams)}
          </div>
        )}
      </div>

      {/* 测试用例 2: 可选参数 + args 响应式更新 */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 2: 可选参数 + args 响应式更新</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          修改 userId，args 变化时应该自动触发请求
        </p>
        <input
          type="number"
          value={userId}
          onChange={(e) => setUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <span style={{ marginRight: '10px' }}>当前 args: [{`{ name: "User ${userId}" }`}]</span>
        <button
          onClick={() => requestOptional({ name: `Override ${userId}` })}
          disabled={loadingOptional}
          style={{ padding: '8px 16px', margin: '5px', background: loadingOptional ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingOptional ? 'not-allowed' : 'pointer' }}
        >
          {loadingOptional ? 'Loading...' : '覆盖参数'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingOptional ? 'true' : 'false'} | 
          <strong> Data:</strong> {userOptional ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorOptional ? '✗' : '✓'}
        </div>
        {userOptional && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userOptional, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 3: 必填参数 + args 响应式更新 */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 3: 必填参数 + args 响应式更新</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          修改 userIdRequired，args 变化时应该自动触发请求
        </p>
        <input
          type="number"
          value={userIdRequired}
          onChange={(e) => setUserIdRequired(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <span style={{ marginRight: '10px' }}>当前 args: [{userIdRequired}]</span>
        <button
          onClick={() => requestRequired(999)}
          disabled={loadingRequired}
          style={{ padding: '8px 16px', margin: '5px', background: loadingRequired ? '#ccc' : '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingRequired ? 'not-allowed' : 'pointer' }}
        >
          {loadingRequired ? 'Loading...' : '覆盖参数 (999)'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingRequired ? 'true' : 'false'} | 
          <strong> Data:</strong> {userRequired ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorRequired ? '✗' : '✓'}
        </div>
        {userRequired && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userRequired, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 4: 多参数（必填） */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 4: 多参数（必填）+ args 响应式更新</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          修改 multiId 或 multiName，args 变化时应该自动触发请求
        </p>
        <input
          type="number"
          value={multiId}
          onChange={(e) => setMultiId(Number(e.target.value))}
          placeholder="ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <input
          type="text"
          value={multiName}
          onChange={(e) => setMultiName(e.target.value)}
          placeholder="Name"
          style={{ padding: '8px', marginRight: '10px', width: '150px' }}
        />
        <span style={{ marginRight: '10px' }}>当前 args: [{multiId}, "{multiName}"]</span>
        <button
          onClick={() => requestMulti(888, 'Override Name')}
          disabled={loadingMulti}
          style={{ padding: '8px 16px', margin: '5px', background: loadingMulti ? '#ccc' : '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingMulti ? 'not-allowed' : 'pointer' }}
        >
          {loadingMulti ? 'Loading...' : '覆盖参数'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingMulti ? 'true' : 'false'} | 
          <strong> Data:</strong> {userMulti ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorMulti ? '✗' : '✓'}
        </div>
        {userMulti && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userMulti, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 5: 禁用自动触发 */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 5: 禁用自动触发（auto: false）</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          auto: false，修改 manualUserId 不会自动触发，需要手动调用 request()
        </p>
        <input
          type="number"
          value={manualUserId}
          onChange={(e) => setManualUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <span style={{ marginRight: '10px' }}>当前 args: [{manualUserId}]（不会自动触发）</span>
        <button
          onClick={() => requestManual()}
          disabled={loadingManual}
          style={{ padding: '8px 16px', margin: '5px', background: loadingManual ? '#ccc' : '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingManual ? 'not-allowed' : 'pointer' }}
        >
          {loadingManual ? 'Loading...' : '手动触发（使用最新 args）'}
        </button>
        <button
          onClick={() => requestManual(777)}
          disabled={loadingManual}
          style={{ padding: '8px 16px', margin: '5px', background: loadingManual ? '#ccc' : '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingManual ? 'not-allowed' : 'pointer' }}
        >
          {loadingManual ? 'Loading...' : '覆盖参数 (777)'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingManual ? 'true' : 'false'} | 
          <strong> Data:</strong> {userManual ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorManual ? '✗' : '✓'}
        </div>
        {userManual && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userManual, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 6: 条件自动触发 */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196F3' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 6: 条件自动触发（auto: () =&gt; boolean）</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          auto: () =&gt; isEnabled &amp;&amp; conditionalUserId &gt; 0，只有当条件满足时才自动触发
        </p>
        <label style={{ marginRight: '10px' }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          isEnabled: {isEnabled ? 'true' : 'false'}
        </label>
        <input
          type="number"
          value={conditionalUserId}
          onChange={(e) => setConditionalUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
      <span style={{ marginRight: '10px' }}>
        当前条件: {isEnabled && conditionalUserId > 0 ? '✓ 满足（会自动触发）' : '✗ 不满足（不会触发）'}
      </span>
      <button
        onClick={() => requestConditional()}
        disabled={loadingConditional}
        style={{ padding: '8px 16px', margin: '5px', background: loadingConditional ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingConditional ? 'not-allowed' : 'pointer' }}
      >
        {loadingConditional ? 'Loading...' : '手动触发'}
      </button>
      <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingConditional ? 'true' : 'false'} | 
          <strong> Data:</strong> {userConditional ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorConditional ? '✗' : '✓'}
        </div>
        {userConditional && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userConditional, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 7: 参数记忆和覆盖 */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f3e5f5', borderRadius: '8px', border: '1px solid #9C27B0' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 7: 参数记忆和覆盖</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          测试 request() 使用最新 args，request(newArgs) 覆盖参数
        </p>
        <input
          type="number"
          value={memoryUserId}
          onChange={(e) => setMemoryUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <span style={{ marginRight: '10px' }}>当前 args: [{memoryUserId}]</span>
        <button
          onClick={() => requestMemory()}
          disabled={loadingMemory}
          style={{ padding: '8px 16px', margin: '5px', background: loadingMemory ? '#ccc' : '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingMemory ? 'not-allowed' : 'pointer' }}
        >
          {loadingMemory ? 'Loading...' : '使用最新 args'}
        </button>
        <button
          onClick={() => requestMemory(666)}
          disabled={loadingMemory}
          style={{ padding: '8px 16px', margin: '5px', background: loadingMemory ? '#ccc' : '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingMemory ? 'not-allowed' : 'pointer' }}
        >
          {loadingMemory ? 'Loading...' : '覆盖参数 (666)'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingMemory ? 'true' : 'false'} | 
          <strong> Data:</strong> {userMemory ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorMemory ? '✗' : '✓'}
        </div>
        {userMemory && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userMemory, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 8: 可选参数 + 无 args + 自动触发 */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 8: 可选参数 + 无 args + auto: true（仅在初始化时触发）</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          可选参数函数，没有提供 args，auto: true，应该在挂载时自动触发一次（使用 undefined 参数）
        </p>
        <button
          onClick={() => requestOptionalNoArgs()}
          disabled={loadingOptionalNoArgs}
          style={{ padding: '8px 16px', margin: '5px', background: loadingOptionalNoArgs ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingOptionalNoArgs ? 'not-allowed' : 'pointer' }}
        >
          {loadingOptionalNoArgs ? 'Loading...' : '手动触发'}
        </button>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingOptionalNoArgs ? 'true' : 'false'} | 
          <strong> Data:</strong> {usersOptionalNoArgs ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorOptionalNoArgs ? '✗' : '✓'}
        </div>
        {usersOptionalNoArgs && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(usersOptionalNoArgs, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 9: 对象格式 auto - 完整格式（enable + condition） */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4CAF50' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 9: 对象格式 auto - enable + condition</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          使用对象格式的 auto，包含 enable 和 condition，condition 依赖 useState 状态
        </p>
        <input
          type="number"
          value={objUserId}
          onChange={(e) => setObjUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <label style={{ marginRight: '15px' }}>
          <input
            type="checkbox"
            checked={objEnabled}
            onChange={(e) => setObjEnabled(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Enable ({objEnabled ? 'ON' : 'OFF'})
        </label>
        <span style={{ marginRight: '10px' }}>
          条件: {objUserId > 0 && objEnabled ? '✓ 满足' : '✗ 不满足'}
        </span>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingObj ? 'true' : 'false'} | 
          <strong> Data:</strong> {userObj ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorObj ? '✗' : '✓'}
        </div>
        {userObj && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userObj, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 10: 对象格式 auto - 只传递 condition */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4CAF50' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 10: 对象格式 auto - 只传递 condition（enable 默认为 true）</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          只传递 condition，enable 默认为 true，condition 依赖 useState 状态
        </p>
        <input
          type="number"
          value={condUserId}
          onChange={(e) => setCondUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <span style={{ marginRight: '10px' }}>
          条件: {condUserId > 0 ? '✓ 满足' : '✗ 不满足'}
        </span>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingCond ? 'true' : 'false'} | 
          <strong> Data:</strong> {userCond ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorCond ? '✗' : '✓'}
        </div>
        {userCond && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userCond, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 11: 对象格式 auto - 只传递 enable */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4CAF50' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 11: 对象格式 auto - 只传递 enable</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          只传递 enable，等同于 boolean 类型
        </p>
        <input
          type="number"
          value={enableUserId}
          onChange={(e) => setEnableUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <label style={{ marginRight: '15px' }}>
          <input
            type="checkbox"
            checked={enableFlag}
            onChange={(e) => setEnableFlag(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Enable ({enableFlag ? 'ON' : 'OFF'})
        </label>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingEnable ? 'true' : 'false'} | 
          <strong> Data:</strong> {userEnable ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorEnable ? '✗' : '✓'}
        </div>
        {userEnable && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userEnable, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 12: 对象格式 auto - 带 debounce（true，默认 300ms） */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #FF9800' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 12: 对象格式 auto - 带 debounce（true，默认 300ms）</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          快速修改 User ID，请求应该在 300ms 后触发（防抖）
        </p>
        <input
          type="number"
          value={debounceUserId}
          onChange={(e) => setDebounceUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <span style={{ marginRight: '10px' }}>当前 args: [{debounceUserId}]</span>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingDebounce ? 'true' : 'false'} | 
          <strong> Data:</strong> {userDebounce ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorDebounce ? '✗' : '✓'}
        </div>
        {userDebounce && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userDebounce, null, 2)}
          </pre>
        )}
      </div>

      {/* 测试用例 13: 对象格式 auto - 带 debounce（自定义毫秒数） */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #FF9800' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>测试 13: 对象格式 auto - 带 debounce（500ms）</h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          快速修改 User ID，请求应该在 500ms 后触发（防抖）
        </p>
        <input
          type="number"
          value={customDebounceUserId}
          onChange={(e) => setCustomDebounceUserId(Number(e.target.value))}
          placeholder="User ID"
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <span style={{ marginRight: '10px' }}>当前 args: [{customDebounceUserId}]</span>
        <div style={{ marginTop: '10px' }}>
          <strong>Loading:</strong> {loadingCustomDebounce ? 'true' : 'false'} | 
          <strong> Data:</strong> {userCustomDebounce ? '✓' : '✗'} | 
          <strong> Error:</strong> {errorCustomDebounce ? '✗' : '✓'}
        </div>
        {userCustomDebounce && (
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(userCustomDebounce, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

export function mountReactDemo(container: HTMLElement) {
  const root = createRoot(container)
  root.render(<ReactDemo />)
}

