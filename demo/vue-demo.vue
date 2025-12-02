<template>
  <div style="padding: 20px; border: 1px solid #ddd; margin: 10px 0;">
    <h3>Vue Hook Demo</h3>
    
    <div style="margin-bottom: 20px;">
      <h4>1. 使用初始参数</h4>
      <button 
        @click="request()" 
        :disabled="loading"
        style="padding: 8px 16px; margin: 5px;"
      >
        {{ loading ? 'Loading...' : 'Fetch Users (with initial params)' }}
      </button>
      <pre v-if="users" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto;">
        {{ JSON.stringify(users, null, 2) }}
      </pre>
      <div v-if="error" style="color: red; margin-top: 10px;">
        Error: {{ JSON.stringify(error) }}
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4>2. 使用新参数</h4>
      <input
        type="text"
        v-model="name"
        placeholder="Enter user name"
        style="padding: 8px; margin-right: 10px;"
      />
      <button
        @click="requestWithParams({ name })"
        :disabled="loadingWithParams || !name"
        style="padding: 8px 16px; margin: 5px;"
      >
        {{ loadingWithParams ? 'Loading...' : 'Fetch Users (with new params)' }}
      </button>
      <pre v-if="usersWithParams" style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto;">
        {{ JSON.stringify(usersWithParams, null, 2) }}
      </pre>
      <div v-if="errorWithParams" style="color: red; margin-top: 10px;">
        Error: {{ JSON.stringify(errorWithParams) }}
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4>3. 无参数请求</h4>
      <button
        @click="requestWithParams()"
        :disabled="loadingWithParams"
        style="padding: 8px 16px; margin: 5px;"
      >
        {{ loadingWithParams ? 'Loading...' : 'Fetch Users (no params)' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMaxios } from '../src/vue'
import { apis } from './api-definitions'

const [request, users, loading, error] = useMaxios(apis.getUsers, { name: 'Vue User' })
const [requestWithParams, usersWithParams, loadingWithParams, errorWithParams] = useMaxios(apis.getUsers)
const name = ref('')
</script>

