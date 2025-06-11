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
    const response = await this.request<{ token?: string, user?: any }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // 保存 token 到 localStorage
    if (response.token) {
      localStorage.setItem('accessToken', response.token);
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
    return this.request('/api/user/me');
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
    return this.request(`/api/memo?${searchParams}`);
  }

  async getMemo(id: number) {
    return this.request(`/api/memo/${id}`);
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
      'general': {
        instanceUrl: this.baseUrl,
        disallowSignup: false,
        disallowPasswordLogin: false,
        additionalScript: '',
        additionalStyle: '',
      },
      'storage': {
        storageType: 'DATABASE',
        filepathTemplate: '{{filename}}',
        uploadSizeLimitMb: 32,
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