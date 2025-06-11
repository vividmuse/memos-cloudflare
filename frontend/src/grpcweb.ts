// REST API Client for Cloudflare Workers Backend
import { apiClient } from "./api/client";

// Create compatible service clients that use REST API
const createServiceClient = (service: any) => ({
  [service]: apiClient,
});

// Workspace Service
export const workspaceServiceClient = {
  getWorkspaceProfile: async () => {
    try {
      const profile = await apiClient.getWorkspaceProfile();
      console.log('✅ Workspace profile loaded:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Failed to load workspace profile:', error);
      // Return a fallback profile if API fails
      return {
        version: '0.24.0-cloudflare',
        mode: 'prod',
        instanceUrl: window.location.origin,
        owner: 'users/1',
      };
    }
  },
};

export const workspaceSettingServiceClient = {
  getWorkspaceSetting: (request: { name: string }) => {
    const key = request.name.replace('workspace/', '');
    return apiClient.getWorkspaceSetting(key);
  },
  setWorkspaceSetting: (request: { setting: any }) => Promise.resolve(request.setting),
};

// Auth Service  
export const authServiceClient = {
  signIn: (request: { passwordCredentials?: { username: string; password: string }; neverExpire?: boolean }) => {
    if (request.passwordCredentials) {
      return apiClient.signIn(request.passwordCredentials.username, request.passwordCredentials.password);
    }
    throw new Error('Password credentials required');
  },
  signUp: (request: { username: string; password: string; email?: string }) =>
    apiClient.signUp(request.username, request.password, request.email),
  getAuthStatus: () => apiClient.getCurrentUser(),
};

// User Service
export const userServiceClient = {
  getCurrentUser: () => apiClient.getCurrentUser(),
  getUser: (request: { name: string }) => {
    const id = parseInt(request.name.replace('users/', ''));
    return apiClient.getUser(id);
  },
  getUserByUsername: (request: { username: string }) => apiClient.getUserByUsername(request.username),
  listUsers: () => apiClient.listUsers(),
  updateUser: (request: { user: any; updateMask: any }) => {
    const id = parseInt(request.user.name.replace('users/', ''));
    // 构造后端期望的数据格式
    const userData = {
      username: request.user.username,
      nickname: request.user.nickname,
      email: request.user.email,
      avatarUrl: request.user.avatarUrl,
      description: request.user.description,
    };
    return apiClient.updateUser(id, userData);
  },
  deleteUser: (request: { name: string }) => {
    const id = parseInt(request.name.replace('users/', ''));
    return apiClient.deleteUser(id);
  },
  getUserSetting: (request?: { name?: string }) => {
    // 从当前登录用户获取ID
    const currentUserId = 1; // TODO: 从当前用户context获取真实ID
    return apiClient.getUserSetting(currentUserId);
  },
  updateUserSetting: (request: { setting: any; updateMask: string[] }) => {
    // 从当前登录用户获取ID
    const currentUserId = 1; // TODO: 从当前用户context获取真实ID
    return apiClient.updateUserSetting(currentUserId, request.setting);
  },
  getUserStats: (request: { name: string }) => 
    Promise.resolve({
      name: request.name,
      memoDisplayTimestamps: [],
      memoTypeStats: {
        totalMemoCount: 0,
        dailyMemoCount: 0,
        weeklyMemoCount: 0,
        monthlyMemoCount: 0,
      },
      tagCount: {},
      pinnedMemos: [],
      totalMemoCount: 0,
    }),
  listAllUserStats: () => 
    Promise.resolve({ 
      userStats: [{
        name: 'users/1',
        memoDisplayTimestamps: [],
        memoTypeStats: {
          totalMemoCount: 0,
          dailyMemoCount: 0,
          weeklyMemoCount: 0,
          monthlyMemoCount: 0,
        },
        tagCount: {},
        pinnedMemos: [],
        totalMemoCount: 0,
      }]
    }),
};

// Memo Service  
export const memoServiceClient = {
  listMemos: (request: any) => apiClient.getMemos(request),
  getMemo: (request: { name: string }) => {
    const id = parseInt(request.name.replace('memos/', ''));
    return apiClient.getMemo(id);
  },
  createMemo: (request: { memo: any }) => apiClient.createMemo(request.memo),
  updateMemo: (request: { memo: any; updateMask: any }) =>
    apiClient.updateMemo(request.memo.id, request.memo),
  deleteMemo: (request: { name: string }) => {
    const id = parseInt(request.name.replace('memos/', ''));
    return apiClient.deleteMemo(id);
  },
  renameMemoTag: (request: { parent: string; oldTag: string; newTag: string }) => Promise.resolve({}),
  deleteMemoTag: (request: { parent: string; tag: string; deleteRelatedMemos?: boolean }) => Promise.resolve({}),
};

// Resource Service
export const resourceServiceClient = {
  getResource: (request: { name: string }) => Promise.resolve({
    name: request.name,
    uid: '',
    createTime: '',
    filename: '',
    content: new Uint8Array(),
    externalLink: '',
    type: '',
    size: 0,
    memo: '',
  }),
  createResource: (request: { resource?: any, filename?: string, type?: string }) => {
    if (request.resource?.blob) {
      const file = new File([request.resource.blob], request.resource.filename);
      return apiClient.uploadResource(file);
    }
    return Promise.resolve({
      name: 'resources/1',
      uid: '',
      createTime: new Date().toISOString(),
      filename: request.filename || '',
      content: new Uint8Array(),
      externalLink: '',
      type: request.type || '',
      size: 0,
      memo: '',
    });
  },
  updateResource: (request: any) => Promise.resolve(request.resource),
  deleteResource: (request: { name: string }) => Promise.resolve({}),
  listResources: (request: { parent: string }) => Promise.resolve({ resources: [] }),
};

// Shortcut Service
export const shortcutServiceClient = {
  listShortcuts: (request: { parent: string }) => Promise.resolve({ shortcuts: [] }),
  createShortcut: (request: { parent: string; shortcut: any }) => Promise.resolve({
    ...request.shortcut,
    id: request.shortcut.id || `shortcut-${Date.now()}`,
  }),
  updateShortcut: (request: { parent: string; shortcut: any; updateMask?: string[] }) => Promise.resolve(request.shortcut),
  deleteShortcut: (request: { parent: string; id: string }) => Promise.resolve({}),
};

// Inbox Service  
export const inboxServiceClient = {
  listInboxes: (request: any) => Promise.resolve({ inboxes: [] }),
  updateInbox: (request: { inbox: any; updateMask: string[] }) => Promise.resolve(request.inbox),
  deleteInbox: (request: { name: string }) => Promise.resolve({}),
};

export const activityServiceClient = {
  getActivity: () => Promise.resolve({}),
};

export const webhookServiceClient = {
  listWebhooks: () => Promise.resolve([]),
};

export const markdownServiceClient = {
  parseMarkdown: (request: { markdown: string }) => 
    Promise.resolve({ nodes: [] }),
};

export const identityProviderServiceClient = {
  listIdentityProviders: () => Promise.resolve({ identityProviders: [] }),
  getIdentityProvider: (request: { name: string }) => Promise.resolve({
    name: request.name,
    type: 'OAUTH2',
    title: '',
    identifierFilter: '',
    config: undefined,
  }),
  createIdentityProvider: (request: { identityProvider: any }) => Promise.resolve(request.identityProvider),
  updateIdentityProvider: (request: { identityProvider: any }) => Promise.resolve(request.identityProvider),
  deleteIdentityProvider: (request: { name: string }) => Promise.resolve({}),
};
