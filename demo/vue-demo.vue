<template>
  <div style="padding: 20px; border: 1px solid #ddd; margin: 10px 0;">
    <h2 style="margin-top: 0;">Vue Hook 完整测试 Demo</h2>
    
    <!-- 测试用例 1: 无参数函数 + 自动触发 -->
    <div style="margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #333;">测试 1: 无参数函数 + auto: true（仅在初始化时触发）</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        无参数函数，auto: true，应该在挂载时自动触发一次，之后不再自动触发
      </p>
      <button 
        @click="requestNoParams()" 
        :disabled="loadingNoParams"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingNoParams ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingNoParams ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingNoParams ? 'Loading...' : '手动触发（使用最新 args）' }}
      </button>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingNoParams ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ usersNoParams ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorNoParams ? '✗' : '✓' }}
      </div>
      <pre v-if="usersNoParams" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(usersNoParams, null, 2) }}
      </pre>
      <div v-if="errorNoParams" style="color: red; margin-top: 10px;">
        Error: {{ JSON.stringify(errorNoParams) }}
      </div>
    </div>

    <!-- 测试用例 2: 可选参数 + args 响应式更新 -->
    <div style="margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #333;">测试 2: 可选参数 + args 响应式更新</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        修改 userId，args 变化时应该自动触发请求
      </p>
      <input
        type="number"
        v-model.number="userId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">当前 args: [{{ `{ name: "User ${userId}" }` }}]</span>
      <button
        @click="requestOptional({ name: `Override ${userId}` })"
        :disabled="loadingOptional"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingOptional ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingOptional ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingOptional ? 'Loading...' : '覆盖参数' }}
      </button>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingOptional ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userOptional ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorOptional ? '✗' : '✓' }}
      </div>
      <pre v-if="userOptional" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userOptional, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 3: 必填参数 + args 响应式更新 -->
    <div style="margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #333;">测试 3: 必填参数 + args 响应式更新</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        修改 userIdRequired，args 变化时应该自动触发请求
      </p>
      <input
        type="number"
        v-model.number="userIdRequired"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">当前 args: [{{ userIdRequired }}]</span>
      <button
        @click="requestRequired(999)"
        :disabled="loadingRequired"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingRequired ? '#ccc' : '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingRequired ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingRequired ? 'Loading...' : '覆盖参数 (999)' }}
      </button>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingRequired ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userRequired ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorRequired ? '✗' : '✓' }}
      </div>
      <pre v-if="userRequired" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userRequired, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 4: 多参数（必填） -->
    <div style="margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #333;">测试 4: 多参数（必填）+ args 响应式更新</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        修改 multiId 或 multiName，args 变化时应该自动触发请求
      </p>
      <input
        type="number"
        v-model.number="multiId"
        placeholder="ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <input
        type="text"
        v-model="multiName"
        placeholder="Name"
        style="padding: 8px; margin-right: 10px; width: 150px;"
      />
      <span style="margin-right: 10px;">当前 args: [{{ multiId }}, "{{ multiName }}"]</span>
      <button
        @click="requestMulti(888, 'Override Name')"
        :disabled="loadingMulti"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingMulti ? '#ccc' : '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingMulti ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingMulti ? 'Loading...' : '覆盖参数' }}
      </button>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingMulti ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userMulti ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorMulti ? '✗' : '✓' }}
      </div>
      <pre v-if="userMulti" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userMulti, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 5: 禁用自动触发 -->
    <div style="margin-bottom: 30px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffc107;">
      <h3 style="margin-top: 0; color: #333;">测试 5: 禁用自动触发（auto: false）</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        auto: false，修改 manualUserId 不会自动触发，需要手动调用 request()
      </p>
      <input
        type="number"
        v-model.number="manualUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">当前 args: [{{ manualUserId }}]（不会自动触发）</span>
      <button
        @click="requestManual()"
        :disabled="loadingManual"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingManual ? '#ccc' : '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingManual ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingManual ? 'Loading...' : '手动触发（使用最新 args）' }}
      </button>
      <button
        @click="requestManual(777)"
        :disabled="loadingManual"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingManual ? '#ccc' : '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingManual ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingManual ? 'Loading...' : '覆盖参数 (777)' }}
      </button>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingManual ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userManual ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorManual ? '✗' : '✓' }}
      </div>
      <pre v-if="userManual" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userManual, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 6: 条件自动触发 -->
    <div style="margin-bottom: 30px; padding: 15px; background: #e3f2fd; border-radius: 8px; border: 1px solid #2196F3;">
      <h3 style="margin-top: 0; color: #333;">测试 6: 条件自动触发（auto: () => boolean）</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        auto: () => isEnabled && conditionalUserId > 0，只有当条件满足时才自动触发
      </p>
      <label style="margin-right: 10px;">
        <input
          type="checkbox"
          v-model="isEnabled"
          style="margin-right: 5px;"
        />
        isEnabled: {{ isEnabled ? 'true' : 'false' }}
      </label>
      <input
        type="number"
        v-model.number="conditionalUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">
        当前条件: {{ isEnabled && conditionalUserId > 0 ? '✓ 满足（会自动触发）' : '✗ 不满足（不会触发）' }}
      </span>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingConditional ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userConditional ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorConditional ? '✗' : '✓' }}
      </div>
      <pre v-if="userConditional" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userConditional, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 7: 参数记忆和覆盖 -->
    <div style="margin-bottom: 30px; padding: 15px; background: #f3e5f5; border-radius: 8px; border: 1px solid #9C27B0;">
      <h3 style="margin-top: 0; color: #333;">测试 7: 参数记忆和覆盖</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        测试 request() 使用最新 args，request(newArgs) 覆盖参数
      </p>
      <input
        type="number"
        v-model.number="memoryUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">当前 args: [{{ memoryUserId }}]</span>
      <button
        @click="requestMemory()"
        :disabled="loadingMemory"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingMemory ? '#ccc' : '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingMemory ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingMemory ? 'Loading...' : '使用最新 args' }}
      </button>
      <button
        @click="requestMemory(666)"
        :disabled="loadingMemory"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingMemory ? '#ccc' : '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingMemory ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingMemory ? 'Loading...' : '覆盖参数 (666)' }}
      </button>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingMemory ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userMemory ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorMemory ? '✗' : '✓' }}
      </div>
      <pre v-if="userMemory" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userMemory, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 8: 可选参数 + 无 args + 自动触发 -->
    <div style="margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #333;">测试 8: 可选参数 + 无 args + auto: true（仅在初始化时触发）</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        可选参数函数，没有提供 args，auto: true，应该在挂载时自动触发一次（使用 undefined 参数）
      </p>
      <button
        @click="requestOptionalNoArgs()"
        :disabled="loadingOptionalNoArgs"
        :style="{ padding: '8px 16px', margin: '5px', background: loadingOptionalNoArgs ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingOptionalNoArgs ? 'not-allowed' : 'pointer' }"
      >
        {{ loadingOptionalNoArgs ? 'Loading...' : '手动触发' }}
      </button>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingOptionalNoArgs ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ usersOptionalNoArgs ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorOptionalNoArgs ? '✗' : '✓' }}
      </div>
      <pre v-if="usersOptionalNoArgs" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(usersOptionalNoArgs, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 9: 对象格式 auto - 完整格式（enable + condition） -->
    <div style="margin-bottom: 30px; padding: 15px; background: #e8f5e9; border-radius: 8px; border: 1px solid #4CAF50;">
      <h3 style="margin-top: 0; color: #333;">测试 9: 对象格式 auto - enable + condition</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        使用对象格式的 auto，包含 enable 和 condition，condition 依赖 ref 状态
      </p>
      <input
        type="number"
        v-model.number="objUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <label style="margin-right: 15px;">
        <input
          type="checkbox"
          v-model="objEnabled"
          style="margin-right: 5px;"
        />
        Enable ({{ objEnabled ? 'ON' : 'OFF' }})
      </label>
      <span style="margin-right: 10px;">
        条件: {{ objUserId > 0 && objEnabled ? '✓ 满足' : '✗ 不满足' }}
      </span>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingObj ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userObj ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorObj ? '✗' : '✓' }}
      </div>
      <pre v-if="userObj" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userObj, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 10: 对象格式 auto - 只传递 condition -->
    <div style="margin-bottom: 30px; padding: 15px; background: #e8f5e9; border-radius: 8px; border: 1px solid #4CAF50;">
      <h3 style="margin-top: 0; color: #333;">测试 10: 对象格式 auto - 只传递 condition（enable 默认为 true）</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        只传递 condition，enable 默认为 true，condition 依赖 ref 状态
      </p>
      <input
        type="number"
        v-model.number="condUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">
        条件: {{ condUserId > 0 ? '✓ 满足' : '✗ 不满足' }}
      </span>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingCond ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userCond ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorCond ? '✗' : '✓' }}
      </div>
      <pre v-if="userCond" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userCond, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 11: 对象格式 auto - 只传递 enable -->
    <div style="margin-bottom: 30px; padding: 15px; background: #e8f5e9; border-radius: 8px; border: 1px solid #4CAF50;">
      <h3 style="margin-top: 0; color: #333;">测试 11: 对象格式 auto - 只传递 enable</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        只传递 enable，等同于 boolean 类型
      </p>
      <input
        type="number"
        v-model.number="enableUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <label style="margin-right: 15px;">
        <input
          type="checkbox"
          v-model="enableFlag"
          style="margin-right: 5px;"
        />
        Enable ({{ enableFlag ? 'ON' : 'OFF' }})
      </label>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingEnable ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userEnable ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorEnable ? '✗' : '✓' }}
      </div>
      <pre v-if="userEnable" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userEnable, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 12: 对象格式 auto - 带 debounce（true，默认 300ms） -->
    <div style="margin-bottom: 30px; padding: 15px; background: #fff3e0; border-radius: 8px; border: 1px solid #FF9800;">
      <h3 style="margin-top: 0; color: #333;">测试 12: 对象格式 auto - 带 debounce（true，默认 300ms）</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        快速修改 User ID，请求应该在 300ms 后触发（防抖）
      </p>
      <input
        type="number"
        v-model.number="debounceUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">当前 args: [{{ debounceUserId }}]</span>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingDebounce ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userDebounce ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorDebounce ? '✗' : '✓' }}
      </div>
      <pre v-if="userDebounce" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userDebounce, null, 2) }}
      </pre>
    </div>

    <!-- 测试用例 13: 对象格式 auto - 带 debounce（自定义毫秒数） -->
    <div style="margin-bottom: 30px; padding: 15px; background: #fff3e0; border-radius: 8px; border: 1px solid #FF9800;">
      <h3 style="margin-top: 0; color: #333;">测试 13: 对象格式 auto - 带 debounce（500ms）</h3>
      <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
        快速修改 User ID，请求应该在 500ms 后触发（防抖）
      </p>
      <input
        type="number"
        v-model.number="customDebounceUserId"
        placeholder="User ID"
        style="padding: 8px; margin-right: 10px; width: 100px;"
      />
      <span style="margin-right: 10px;">当前 args: [{{ customDebounceUserId }}]</span>
      <div style="margin-top: 10px;">
        <strong>Loading:</strong> {{ loadingCustomDebounce ? 'true' : 'false' }} | 
        <strong> Data:</strong> {{ userCustomDebounce ? '✓' : '✗' }} | 
        <strong> Error:</strong> {{ errorCustomDebounce ? '✗' : '✓' }}
      </div>
      <pre v-if="userCustomDebounce" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">
        {{ JSON.stringify(userCustomDebounce, null, 2) }}
      </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMaxios } from '../src/vue'
import { apis } from './api-definitions'

// ========== 测试用例 1: 无参数函数 + 自动触发（仅在初始化时） ==========
const { 
  request: requestNoParams, 
  data: usersNoParams, 
  loading: loadingNoParams, 
  error: errorNoParams 
} = useMaxios(apis.getUsersNoParams, { auto: true })

// ========== 测试用例 2: 可选参数 + 自动触发 + args 响应式更新 ==========
const userId = ref(1)
const optionalArgs = computed(() => [{ name: `User ${userId.value}` }])
const { 
  request: requestOptional, 
  data: userOptional, 
  loading: loadingOptional, 
  error: errorOptional 
} = useMaxios(apis.getUsers, { args: optionalArgs, auto: true })

// ========== 测试用例 3: 必填参数 + 自动触发 + args 响应式更新 ==========
const userIdRequired = ref(2)
const requiredArgs = computed(() => [userIdRequired.value])
const { 
  request: requestRequired, 
  data: userRequired, 
  loading: loadingRequired, 
  error: errorRequired 
} = useMaxios(apis.getUserById, { args: requiredArgs, auto: true })

// ========== 测试用例 4: 多参数（必填）+ 自动触发 ==========
const multiId = ref(3)
const multiName = ref('Multi User')
const multiArgs = computed(() => [multiId.value, multiName.value])
const { 
  request: requestMulti, 
  data: userMulti, 
  loading: loadingMulti, 
  error: errorMulti 
} = useMaxios(apis.getUserByMultipleParams, { args: multiArgs, auto: true })

// ========== 测试用例 5: 禁用自动触发 ==========
const manualUserId = ref(4)
const manualArgs = computed(() => [manualUserId.value])
const { 
  request: requestManual, 
  data: userManual, 
  loading: loadingManual, 
  error: errorManual 
} = useMaxios(apis.getUserById, { args: manualArgs, auto: false })

// ========== 测试用例 6: 条件自动触发（auto 函数） ==========
const conditionalUserId = ref(5)
const isEnabled = ref(true)
const conditionalArgs = computed(() => [conditionalUserId.value])
const { 
  request: _requestConditional, 
  data: userConditional, 
  loading: loadingConditional, 
  error: errorConditional 
} = useMaxios(apis.getUserById, { 
  args: conditionalArgs, 
  auto: () => isEnabled.value && conditionalUserId.value > 0 
})

// ========== 测试用例 7: 参数记忆和覆盖 ==========
const memoryUserId = ref(6)
const memoryArgs = computed(() => [memoryUserId.value])
const { 
  request: requestMemory, 
  data: userMemory, 
  loading: loadingMemory, 
  error: errorMemory 
} = useMaxios(apis.getUserById, { args: memoryArgs, auto: false })

// ========== 测试用例 8: 可选参数 + 无 args + 自动触发（仅在初始化时） ==========
const { 
  request: requestOptionalNoArgs, 
  data: usersOptionalNoArgs, 
  loading: loadingOptionalNoArgs, 
  error: errorOptionalNoArgs 
} = useMaxios(apis.getUsers, { auto: true })

// ========== 测试用例 9: 对象格式 auto - 完整格式（enable + condition） ==========
const objUserId = ref(7)
const objEnabled = ref(true)
const objArgs = computed(() => [objUserId.value])
// 注意：在 Vue 中，condition 函数会自动捕获最新的 ref 值
// enable 如果是静态值，不会响应式更新，但 condition 函数会响应式地访问 ref
// 为了演示响应式的 enable，我们可以使用 condition 函数来实现
const { 
  request: _requestObj, 
  data: userObj, 
  loading: loadingObj, 
  error: errorObj 
} = useMaxios(apis.getUserById, { 
  args: objArgs, 
  auto: {
    enable: true,  // 静态值，如果需要响应式，可以使用 condition
    condition: () => objUserId.value > 0 && objEnabled.value
  }
})

// ========== 测试用例 10: 对象格式 auto - 只传递 condition（enable 默认为 true） ==========
const condUserId = ref(8)
const condArgs = computed(() => [condUserId.value])
const { 
  request: _requestCond, 
  data: userCond, 
  loading: loadingCond, 
  error: errorCond 
} = useMaxios(apis.getUserById, { 
  args: condArgs, 
  auto: {
    condition: () => condUserId.value > 0
  }
})

// ========== 测试用例 11: 对象格式 auto - 只传递 enable ==========
const enableUserId = ref(9)
const enableFlag = ref(true)
const enableArgs = computed(() => [enableUserId.value])
// 注意：enable 如果是静态值，不会响应式更新
// 如果需要响应式的 enable，可以使用 condition 函数
const { 
  request: _requestEnable, 
  data: userEnable, 
  loading: loadingEnable, 
  error: errorEnable 
} = useMaxios(apis.getUserById, { 
  args: enableArgs, 
  auto: {
    enable: enableFlag.value  // 静态值，如果需要响应式，可以使用 condition
  }
})

// ========== 测试用例 12: 对象格式 auto - 带 debounce（true，默认 300ms） ==========
const debounceUserId = ref(10)
const debounceArgs = computed(() => [debounceUserId.value])
const { 
  request: _requestDebounce, 
  data: userDebounce, 
  loading: loadingDebounce, 
  error: errorDebounce 
} = useMaxios(apis.getUserById, { 
  args: debounceArgs, 
  auto: {
    enable: true,
    debounce: true  // 300ms 防抖
  }
})

// ========== 测试用例 13: 对象格式 auto - 带 debounce（自定义毫秒数） ==========
const customDebounceUserId = ref(11)
const customDebounceArgs = computed(() => [customDebounceUserId.value])
const { 
  request: _requestCustomDebounce, 
  data: userCustomDebounce, 
  loading: loadingCustomDebounce, 
  error: errorCustomDebounce 
} = useMaxios(apis.getUserById, { 
  args: customDebounceArgs, 
  auto: {
    enable: true,
    debounce: 500  // 500ms 防抖
  }
})

// 这些变量在模板中使用，但 TypeScript 无法识别
// 通过显式引用它们来避免未使用变量的警告
if (false) {
  void requestNoParams
  void requestOptional
  void requestRequired
  void requestMulti
  void requestManual
  void requestMemory
  void requestOptionalNoArgs
}
</script>

