import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { memoRoutes } from './routes/memo';
import { tagRoutes } from './routes/tag';
import { resourceRoutes } from './routes/resource';
import { authMiddleware } from './middleware/auth';

// 导入环境类型
import { Env } from './types';

// 创建 Hono 应用实例
const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', cors({
  origin: [
    'https://memos-cloudflare.pages.dev',
    'https://memos.51min.win',
    'http://localhost:3001',  // 本地开发
    'http://localhost:3000'   // 本地开发备用
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400
}));

app.use('*', logger());
app.use('/api/*', prettyJSON());

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'memos-cloudflare',
    version: '0.2.0'
  });
});

// API 路由
app.route('/api/auth', authRoutes);

// 需要认证的路由
app.use('/api/user/*', authMiddleware);
app.use('/api/tag/*', authMiddleware);
app.use('/api/resource/*', authMiddleware);

// memo 路由需要部分认证
app.use('/api/memo', authMiddleware);
app.post('/api/memo/*', authMiddleware);
app.patch('/api/memo/*', authMiddleware);
app.delete('/api/memo/*', authMiddleware);

app.route('/api/user', userRoutes);
app.route('/api/memo', memoRoutes);
app.route('/api/tag', tagRoutes);
app.route('/api/resource', resourceRoutes);

// 文件下载路由 (不在 /api 下)
app.get('/o/r/:uid/:filename', async (c) => {
  try {
    const { uid, filename } = c.req.param();
    
    // 查询资源信息
    const resource = await c.env.DB.prepare(
      'SELECT * FROM resource WHERE uid = ?'
    ).bind(uid).first();

    if (!resource) {
      return c.json({ message: 'Resource not found' }, 404);
    }

    // 检查 R2 配置是否完整
    if (!c.env.R2_ACCOUNT_ID || !c.env.R2_ACCESS_KEY_ID || !c.env.R2_SECRET_ACCESS_KEY || !c.env.R2_BUCKET) {
      return c.json({ message: 'R2 configuration incomplete' }, 500);
    }

    // 生成 R2 签名 URL 并重定向
    const signedUrl = await generateR2DownloadUrl(
      c.env.R2_ACCOUNT_ID,
      c.env.R2_ACCESS_KEY_ID,
      c.env.R2_SECRET_ACCESS_KEY,
      c.env.R2_BUCKET,
      `${uid}/${filename}`
    );

    return c.redirect(signedUrl, 302);
  } catch (error: any) {
    console.error('File download error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 404 处理
app.notFound((c) => {
  return c.json({ message: 'Not Found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    message: 'Internal Server Error',
    ...(c.env.LOG_LEVEL === 'debug' && { error: err.message })
  }, 500);
});

// R2 签名 URL 生成函数 (简化版，实际需要完整的 S3 签名实现)
async function generateR2DownloadUrl(
  accountId: string,
  accessKeyId: string, 
  secretAccessKey: string,
  bucket: string,
  key: string
): Promise<string> {
  // 这里需要实现完整的 AWS S3 签名 V4 算法
  // 为了简化，先返回一个基本的 URL
  const baseUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
  return baseUrl;
}

export default app; 