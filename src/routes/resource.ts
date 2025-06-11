import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';

const resourceRoutes = new Hono();

// 上传文件
resourceRoutes.post('/blob', async (c) => {
  try {
    const userPayload = c.get('user');
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // 获取用户ID
    const user = await c.env.DB.prepare(
      'SELECT id FROM user WHERE uid = ?'
    ).bind(userPayload.sub).first();

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    // 解析 multipart/form-data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ message: 'No file provided' }, 400);
    }

    // 检查文件大小（限制 100MB）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return c.json({ message: 'File too large' }, 413);
    }

    // 生成资源 UID 和文件路径
    const resourceUid = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = file.name;
    const mimeType = file.type || 'application/octet-stream';
    
    // 检查 R2 配置是否完整
    if (!c.env.R2_ACCOUNT_ID || !c.env.R2_ACCESS_KEY_ID || !c.env.R2_SECRET_ACCESS_KEY || !c.env.R2_BUCKET) {
      return c.json({ message: 'R2 configuration incomplete' }, 500);
    }

    // R2 存储路径
    const r2Key = `${resourceUid}/${fileName}`;
    const externalUri = `r2://${c.env.R2_BUCKET}/${r2Key}`;

    // 上传到 R2
    const uploadSuccess = await uploadToR2(
      c.env.R2_ACCOUNT_ID,
      c.env.R2_ACCESS_KEY_ID,
      c.env.R2_SECRET_ACCESS_KEY,
      c.env.R2_BUCKET,
      r2Key,
      file
    );

    if (!uploadSuccess) {
      throw new Error('Failed to upload file to R2');
    }

    const now = Math.floor(Date.now() / 1000);

    // 保存资源记录到数据库
    const result = await c.env.DB.prepare(`
      INSERT INTO resource (uid, creator_id, filename, mime_type, size, external_uri, created_ts)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(resourceUid, user.id, fileName, mimeType, file.size, externalUri, now).run();

    if (!result.success) {
      throw new Error('Failed to save resource record');
    }

    // 返回资源信息
    const newResource = await c.env.DB.prepare(
      'SELECT * FROM resource WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return c.json({
      id: newResource.id,
      uid: newResource.uid,
      filename: newResource.filename,
      mimeType: newResource.mime_type,
      size: newResource.size,
      externalUri: newResource.external_uri,
      createdTs: newResource.created_ts
    });

  } catch (error) {
    console.error('Upload resource error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 获取资源列表
resourceRoutes.get('/', async (c) => {
  try {
    const userPayload = c.get('user');
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // 获取用户ID
    const user = await c.env.DB.prepare(
      'SELECT id FROM user WHERE uid = ?'
    ).bind(userPayload.sub).first();

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    const url = new URL(c.req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const resources = await c.env.DB.prepare(`
      SELECT id, uid, filename, mime_type, size, external_uri, created_ts
      FROM resource 
      WHERE creator_id = ?
      ORDER BY created_ts DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    return c.json(resources.results || []);

  } catch (error) {
    console.error('Get resources error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 删除资源
resourceRoutes.delete('/:id', async (c) => {
  try {
    const resourceId = parseInt(c.req.param('id'));
    const userPayload = c.get('user');
    
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // 获取用户ID
    const user = await c.env.DB.prepare(
      'SELECT id FROM user WHERE uid = ?'
    ).bind(userPayload.sub).first();

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    // 检查资源是否存在且属于当前用户
    const resource = await c.env.DB.prepare(
      'SELECT * FROM resource WHERE id = ? AND creator_id = ?'
    ).bind(resourceId, user.id).first();

    if (!resource) {
      return c.json({ message: 'Resource not found' }, 404);
    }

    // 删除资源相关的关联
    await c.env.DB.prepare(
      'DELETE FROM memo_resource WHERE resource_id = ?'
    ).bind(resourceId).run();

    // 删除数据库记录
    await c.env.DB.prepare(
      'DELETE FROM resource WHERE id = ?'
    ).bind(resourceId).run();

    // TODO: 删除 R2 中的文件
    // 这里可以考虑异步删除或者定期清理

    return c.json({ message: 'Resource deleted successfully' });

  } catch (error) {
    console.error('Delete resource error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// R2 上传函数（简化版，实际需要完整的 S3 API 实现）
async function uploadToR2(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  file: File
): Promise<boolean> {
  try {
    // 这里需要实现完整的 AWS S3 兼容 API 调用
    // 包括签名计算、请求构建等
    
    // 简化版实现，实际应该使用 AWS SDK 或者实现完整的 S3 签名
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
        // 这里需要添加正确的 AWS 签名头
        // 'Authorization': 'AWS4-HMAC-SHA256 ...',
        // 'X-Amz-Date': '...',
        // 'X-Amz-Content-Sha256': '...',
      },
      body: file
    });

    return response.ok;
  } catch (error) {
    console.error('R2 upload error:', error);
    return false;
  }
}

export { resourceRoutes }; 