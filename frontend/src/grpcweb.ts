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
};

// Auth Service  
export const authServiceClient = {
  signIn: (request: { username: string; password: string }) =>
    apiClient.signIn(request.username, request.password),
  signUp: (request: { username: string; password: string; email?: string }) =>
    apiClient.signUp(request.username, request.password, request.email),
};

// User Service
export const userServiceClient = {
  getCurrentUser: () => apiClient.getCurrentUser(),
  getUser: (request: { name: string }) => {
    const id = parseInt(request.name.replace('users/', ''));
    return apiClient.getUser(id);
  },
  updateUser: (request: { user: any; updateMask: any }) =>
    apiClient.updateUser(request.user.id, request.user),
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
};

// Resource Service
export const resourceServiceClient = {
  createResource: (request: { resource: any }) => {
    if (request.resource.blob) {
      const file = new File([request.resource.blob], request.resource.filename);
      return apiClient.uploadResource(file);
    }
    throw new Error('Resource upload requires blob data');
  },
};

// Simplified services that may not be fully implemented yet
export const shortcutServiceClient = {
  listShortcuts: () => Promise.resolve([]),
};

export const inboxServiceClient = {
  listInboxes: () => Promise.resolve([]),
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
};
