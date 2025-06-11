// REST API Client for Cloudflare Workers Backend

// 获取 API 基础 URL，优先级：环境变量 > 同域名下的 /api > 默认后端地址
const getApiBaseUrl = () => {
  // 如果设置了环境变量，使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL;
    // 确保 URL 包含协议前缀
    if (url && !url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  }
  
  // 如果是生产环境且在 Pages 上，尝试使用后端 Workers URL
  if (window.location.hostname === 'memos-cloudflare.pages.dev' || window.location.hostname === 'memos.51min.win') {
    return 'https://memos-api.51min.win';
  }
  
  // 开发环境或其他情况，使用相对路径
  return '';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log('🔗 API Client initialized with base URL:', this.baseUrl);
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include',
      ...options,
    };

    try {
      console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error: ${response.status}`, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Response: ${options.method || 'GET'} ${url}`, data);
      return data;
    } catch (error) {
      console.error(`💥 API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth Services
  async signIn(username: string, password: string) {
    const response = await this.request<{ accessToken?: string, user?: any }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // 保存 token 到 localStorage
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }
    
    return response;
  }

  async signUp(username: string, password: string, email?: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
  }

  // User Services
  async getCurrentUser() {
    const user = await this.request<{ id: number, [key: string]: any }>('/api/user/me');
    // 转换为前端期望的格式
    return {
      ...user,
      name: `users/${user.id}`, // 前端期望的 name 格式
    };
  }

  async getUser(id: number) {
    return this.request(`/api/user/${id}`);
  }

  async getUserByUsername(username: string) {
    return this.request(`/api/user/username/${username}`);
  }

  async listUsers() {
    return this.request('/api/user');
  }

  async updateUser(id: number, data: any) {
    return this.request(`/api/user/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/api/user/${id}`, {
      method: 'DELETE',
    });
  }

  // Memo Services
  async getMemos(params: any = {}) {
    const searchParams = new URLSearchParams(params);
    const memos = await this.request<any[]>(`/api/memo?${searchParams}`);
    
    // 转换为前端期望的protobuf格式
    const formattedMemos = Array.isArray(memos) ? memos.map(memo => ({
      name: `memos/${memo.id}`,
      uid: memo.uid || `memo-uid-${memo.id}`,
      creator: `users/${memo.creatorId}`,
      content: memo.content || '',
      nodes: [], // TODO: 如果需要的话，解析markdown内容为节点
      visibility: memo.visibility || 'PRIVATE',
      tags: memo.tags || [],
      pinned: memo.pinned || false,
      resources: memo.resourceIdList || [],
      relations: memo.relations || [],
      reactions: memo.reactions || [],
      snippet: memo.content ? memo.content.slice(0, 100) : '',
      parent: memo.parent || '',
      createTime: memo.createdTs ? new Date(memo.createdTs * 1000) : new Date(),
      updateTime: memo.updatedTs ? new Date(memo.updatedTs * 1000) : new Date(),
      displayTime: memo.createdTs ? new Date(memo.createdTs * 1000) : new Date(),
      state: memo.rowStatus === 'ARCHIVED' ? 'ARCHIVED' : 'NORMAL',
      location: memo.location || undefined,
    })) : [];
    
    const result = { 
      memos: formattedMemos, 
      nextPageToken: '' // 暂时返回空字符串，表示没有更多页面
    };
    
    console.log('🔄 Transformed memo response:', result);
    return result;
  }

  async getMemo(id: number) {
    const memo = await this.request<any>(`/api/memo/${id}`);
    
    // 转换为前端期望的protobuf格式
    return {
      name: `memos/${memo.id}`,
      uid: memo.uid || `memo-uid-${memo.id}`,
      creator: `users/${memo.creatorId}`,
      content: memo.content || '',
      nodes: [], // TODO: 如果需要的话，解析markdown内容为节点
      visibility: memo.visibility || 'PRIVATE',
      tags: memo.tags || [],
      pinned: memo.pinned || false,
      resources: memo.resourceIdList || [],
      relations: memo.relations || [],
      reactions: memo.reactions || [],
      snippet: memo.content ? memo.content.slice(0, 100) : '',
      parent: memo.parent || '',
      createTime: memo.createdTs ? new Date(memo.createdTs * 1000) : new Date(),
      updateTime: memo.updatedTs ? new Date(memo.updatedTs * 1000) : new Date(),
      displayTime: memo.createdTs ? new Date(memo.createdTs * 1000) : new Date(),
      state: memo.rowStatus === 'ARCHIVED' ? 'ARCHIVED' : 'NORMAL',
      location: memo.location || undefined,
    };
  }

  async createMemo(data: any) {
    return this.request('/api/memo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMemo(id: number, data: any) {
    return this.request(`/api/memo/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMemo(id: number) {
    return this.request(`/api/memo/${id}`, {
      method: 'DELETE',
    });
  }

  // Tag Services
  async getTags() {
    return this.request('/api/tag');
  }

  async createTag(name: string) {
    return this.request('/api/tag', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteTag(id: number) {
    return this.request(`/api/tag/${id}`, {
      method: 'DELETE',
    });
  }

  // Resource Services
  async uploadResource(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/api/resource/blob', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
  }

  // Workspace Services
  async getWorkspaceProfile() {
    return this.request('/health').then(health => ({
      version: '0.24.0-cloudflare',
      mode: 'prod',
      instanceUrl: this.baseUrl,
      owner: 'users/1', // Default owner
    }));
  }

  async getWorkspaceSetting(key: string) {
    // For now, return default settings
    return {
      name: `workspace/${key}`,
      value: this.getDefaultSetting(key),
    };
  }

  private getDefaultSetting(key: string) {
    const defaults: Record<string, any> = {
      'GENERAL': {
        disallowUserRegistration: false,
        disallowPasswordAuth: false,
        additionalScript: '',
        additionalStyle: '',
        customProfile: {
          title: 'Memos',
          description: 'A privacy-first, lightweight note-taking service',
          logoUrl: '',
          locale: 'en',
          appearance: 'auto',
        },
        weekStartDayOffset: 0,
        disallowChangeUsername: false,
        disallowChangeNickname: false,
      },
      'STORAGE': {
        storageType: 'DATABASE',
        filepathTemplate: '{{filename}}',
        uploadSizeLimitMb: 32,
        s3Config: undefined,
      },
      'MEMO_RELATED': {
        disallowPublicVisibility: false,
        displayWithUpdateTime: false,
        contentLengthLimit: 1000,
        autoCollapse: false,
        defaultVisibility: 'PRIVATE',
      },
    };
    return defaults[key] || {};
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient; 