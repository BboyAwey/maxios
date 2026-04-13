<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- 1. Auto-fetch on mount -->
    <div class="section">
      <h3>1. Auto-fetch on mount</h3>
      <p class="desc">auto: true — fetches immediately</p>
      <div v-if="usersLoading" class="muted">Loading...</div>
      <pre v-if="users" class="result">{{ JSON.stringify(users, null, 2) }}</pre>
      <div v-if="usersError" class="error">{{ JSON.stringify(usersError) }}</div>
    </div>

    <!-- 2. Manual trigger -->
    <div class="section">
      <h3>2. Manual trigger</h3>
      <p class="desc">auto: false — call request() yourself</p>
      <button @click="fetchUser()" :disabled="userLoading" class="btn">
        {{ userLoading ? 'Loading...' : 'Fetch User' }}
      </button>
      <button @click="fetchUser(42)" :disabled="userLoading" class="btn">
        {{ userLoading ? 'Loading...' : 'Fetch User #42' }}
      </button>
      <pre v-if="user" class="result">{{ JSON.stringify(user, null, 2) }}</pre>
    </div>

    <!-- 3. Reactive args -->
    <div class="section">
      <h3>3. Reactive args</h3>
      <p class="desc">Change userId to auto-refetch</p>
      <input type="number" v-model.number="userId" style="padding: 8px; width: 100px" />
      <span style="margin-left: 8px; color: #666">userId = {{ userId }}</span>
      <div v-if="reactiveLoading" class="muted">Loading...</div>
      <pre v-if="reactiveUser" class="result">{{ JSON.stringify(reactiveUser, null, 2) }}</pre>
    </div>

    <!-- 4. Debounced search -->
    <div class="section">
      <h3>4. Debounced search</h3>
      <p class="desc">300ms debounce, only when query is non-empty</p>
      <input type="text" v-model="query" placeholder="Type to search..." style="padding: 8px; width: 200px" />
      <div v-if="searchLoading" class="muted">Loading...</div>
      <pre v-if="searchResult" class="result">{{ JSON.stringify(searchResult, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMaxios } from '../src/vue'
import { userApi } from './api-definitions'

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
const userId = ref(1)
const reactiveArgs = computed(() => [userId.value] as [number])
const {
  data: reactiveUser,
  loading: reactiveLoading
} = useMaxios(userApi.getById, { args: reactiveArgs, auto: true })

// 4. Debounced search
const query = ref('')
const searchArgs = computed(() => [query.value, 1] as [string, number])
const {
  data: searchResult,
  loading: searchLoading
} = useMaxios(userApi.search, {
  args: searchArgs,
  auto: { enable: true, condition: () => query.value.length > 0, debounce: 300 }
})
</script>

<style scoped>
.section { padding: 16px; background: #f9f9f9; border-radius: 8px; }
.section h3 { margin: 0 0 4px; }
.desc { margin: 0 0 12px; font-size: 13px; color: #666; }
.muted { color: #999; margin-top: 8px; }
.error { color: red; margin-top: 8px; font-size: 12px; }
.result { background: #f0f0f0; padding: 8px; font-size: 12px; border-radius: 4px; overflow: auto; margin-top: 8px; }
.btn { padding: 8px 16px; margin-right: 8px; background: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn:disabled { background: #ccc; cursor: not-allowed; }
</style>
