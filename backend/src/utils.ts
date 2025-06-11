import { v4 as uuidv4 } from 'uuid';
import type { JWTPayload, UserRole } from './types';

// JWT 相关工具函数
export class JWT {
  private static encoder = new TextEncoder();

  // 生成 JWT Token
  static async sign(payload: JWTPayload, secret: string): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/[=]/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/[=]/g, '');
    
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.hmacSHA256(data, secret);
    
    return `${data}.${signature}`;
  }

  // 验证并解析 JWT Token
  static async verify(token: string, secret: string): Promise<JWTPayload | null> {
    try {
      const [header, payload, signature] = token.split('.');
      if (!header || !payload || !signature) return null;

      const data = `${header}.${payload}`;
      const expectedSignature = await this.hmacSHA256(data, secret);
      
      if (signature !== expectedSignature) return null;

      const decoded = JSON.parse(atob(payload)) as JWTPayload;
      
      // 检查过期时间
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decoded;
    } catch {
      return null;
    }
  }

  // HMAC-SHA256 签名
  private static async hmacSHA256(data: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      this.encoder.encode(data)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/[=]/g, '');
  }
}

// 密码哈希工具
export class Password {
  // 生成密码哈希
  static async hash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 验证密码
  static async verify(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hash(password);
    return hashedPassword === hash;
  }
}

// UUID 工具
export function generateUID(): string {
  return uuidv4();
}

// 时间戳工具
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// 创建 JWT Payload
export function createJWTPayload(
  userUid: string,
  username: string,
  role: UserRole,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 days
): JWTPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: userUid,
    username,
    role,
    iat: now,
    exp: now + expiresIn
  };
}

// 解析查询参数
export function parseQueryParams(url: URL): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// 转换数据库行到模型对象
export function dbRowToUser(row: any): any {
  return {
    id: row.id,
    uid: row.uid,
    username: row.username,
    role: row.role,
    email: row.email,
    avatarUrl: row.avatar_url,
    passwordHash: row.password_hash,
    rowStatus: row.row_status,
    createdTs: row.created_ts,
    updatedTs: row.updated_ts
  };
}

export function dbRowToMemo(row: any): any {
  return {
    id: row.id,
    uid: row.uid,
    creatorId: row.creator_id,
    content: row.content,
    visibility: row.visibility,
    rowStatus: row.row_status,
    createdTs: row.created_ts,
    updatedTs: row.updated_ts
  };
}

export function dbRowToResource(row: any): any {
  return {
    id: row.id,
    uid: row.uid,
    creatorId: row.creator_id,
    filename: row.filename,
    mimeType: row.mime_type,
    size: row.size,
    externalUri: row.external_uri,
    createdTs: row.created_ts
  };
}

export function dbRowToTag(row: any): any {
  return {
    id: row.id,
    creatorId: row.creator_id,
    name: row.name,
    createdTs: row.created_ts
  };
}

// 用户公开信息过滤
export function sanitizeUser(user: any): any {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// 日志工具
export function log(level: string, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logData = data ? ` ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}${logData}`);
} 