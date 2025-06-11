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
    return apiClient.getWorkspaceSetting(request.name);
  },
  setWorkspaceSetting: (request: { setting: any }) => {
    return apiClient.setWorkspaceSetting(request.setting);
  },
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
  updateMemo: (request: { memo: any; updateMask: any }) => {
    console.log('🔄 updateMemo request:', request);
    
    if (!request.memo || !request.memo.name) {
      throw new Error('Memo name is required for update');
    }
    
    const memoName = request.memo.name;
    console.log('📝 Memo name:', memoName);
    
    // 提取ID，添加更严格的验证
    const idString = memoName.replace('memos/', '');
    const id = parseInt(idString, 10);
    
    console.log('🔢 Extracted ID string:', idString);
    console.log('🔢 Parsed ID:', id);
    
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid memo ID: ${idString} from name: ${memoName}`);
    }
    
    return apiClient.updateMemo(id, request.memo);
  },
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
  parseMarkdown: (request: { markdown: string }) => {
    // 这是一个简化版的markdown解析器
    // 在实际生产环境中，应该使用后端的markdown解析服务
    const nodes = parseMarkdownToNodes(request.markdown);
    return Promise.resolve({ nodes });
  },
  restoreMarkdownNodes: (request: { nodes: any[] }) => {
    // 这是一个简化版的节点还原为markdown的功能
    const markdown = restoreNodesToMarkdown(request.nodes);
    return Promise.resolve({ markdown });
  },
  getLinkMetadata: (request: { link: string }) =>
    Promise.resolve({
      title: request.link,
      description: '',
      image: '',
    }),
};

// 简化版markdown解析器
function parseMarkdownToNodes(markdown: string): any[] {
  const lines = markdown.split('\n');
  const nodes: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 任务列表项
    if (/^(\s*)- \[([ xX])\] (.*)/.test(line)) {
      const match = line.match(/^(\s*)- \[([ xX])\] (.*)/);
      if (match) {
        nodes.push({
          type: 'TASK_LIST_ITEM',
          taskListItemNode: {
            symbol: '-',
            complete: match[2].toLowerCase() === 'x',
            content: match[3]
          }
        });
      }
    }
    // 普通列表项
    else if (/^(\s*)- (.*)/.test(line)) {
      const match = line.match(/^(\s*)- (.*)/);
      if (match) {
        nodes.push({
          type: 'UNORDERED_LIST_ITEM',
          unorderedListItemNode: {
            symbol: '-',
            content: match[2]
          }
        });
      }
    }
    // 有序列表项
    else if (/^(\s*)(\d+)\. (.*)/.test(line)) {
      const match = line.match(/^(\s*)(\d+)\. (.*)/);
      if (match) {
        nodes.push({
          type: 'ORDERED_LIST_ITEM',
          orderedListItemNode: {
            number: match[2],
            content: match[3]
          }
        });
      }
    }
    // 普通文本
    else if (line.trim()) {
      nodes.push({
        type: 'TEXT',
        textNode: {
          content: line
        }
      });
    }
    // 换行
    else {
      nodes.push({
        type: 'LINE_BREAK'
      });
    }
  }
  
  return nodes;
}

// 简化版节点还原为markdown
function restoreNodesToMarkdown(nodes: any[]): string {
  const lines: string[] = [];
  
  for (const node of nodes) {
    switch (node.type) {
      case 'TASK_LIST_ITEM':
        const checkbox = node.taskListItemNode?.complete ? '[x]' : '[ ]';
        lines.push(`- ${checkbox} ${node.taskListItemNode?.content || ''}`);
        break;
      case 'UNORDERED_LIST_ITEM':
        lines.push(`- ${node.unorderedListItemNode?.content || ''}`);
        break;
      case 'ORDERED_LIST_ITEM':
        lines.push(`${node.orderedListItemNode?.number || 1}. ${node.orderedListItemNode?.content || ''}`);
        break;
      case 'TEXT':
        lines.push(node.textNode?.content || '');
        break;
      case 'LINE_BREAK':
        lines.push('');
        break;
      default:
        // 对于不识别的节点类型，尝试保留原始内容
        if (node.content) {
          lines.push(node.content);
        }
    }
  }
  
  return lines.join('\n');
}

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
