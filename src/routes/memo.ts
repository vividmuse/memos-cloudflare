import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';

type Env = {
  DB: D1Database;
};

interface Variables {
  user: {
    sub: string;
    username: string;
    role: string;
  };
}

const memoRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// 创建笔记
memoRoutes.post('/', async (c) => {
  try {
    const userPayload = c.get('user');
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const { content, visibility = 'PRIVATE', resourceIdList = [] } = await c.req.json();
    
    if (!content) {
      return c.json({ message: 'Content is required' }, 400);
    }

    const memoUid = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    // 获取用户ID
    const user = await c.env.DB.prepare(
      'SELECT id FROM user WHERE uid = ?'
    ).bind(userPayload.sub).first();

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    // 创建笔记
    const memoResult = await c.env.DB.prepare(`
      INSERT INTO memo (uid, creator_id, content, visibility, row_status, created_ts, updated_ts)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(memoUid, user.id, content, visibility, 'NORMAL', now, now).run();

    if (!memoResult.success) {
      throw new Error('Failed to create memo');
    }

    const memoId = memoResult.meta.last_row_id;

    // 关联资源
    if (resourceIdList.length > 0) {
      for (const resourceId of resourceIdList) {
        await c.env.DB.prepare(`
          INSERT INTO memo_resource (memo_id, resource_id) VALUES (?, ?)
        `).bind(memoId, resourceId).run();
      }
    }

    // 获取创建的笔记信息
    const newMemo = await getMemoWithDetails(c.env.DB, memoId);
    
    return c.json(newMemo);

  } catch (error) {
    console.error('Create memo error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 获取笔记列表
memoRoutes.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const rowStatus = url.searchParams.get('rowStatus') || 'NORMAL';
    const creatorId = url.searchParams.get('creatorId');
    const tag = url.searchParams.get('tag');
    const visibility = url.searchParams.get('visibility');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let whereClause = 'WHERE m.row_status = ?';
    const params = [rowStatus];

    if (creatorId) {
      whereClause += ' AND m.creator_id = ?';
      params.push(creatorId);
    }

    if (visibility) {
      whereClause += ' AND m.visibility = ?';
      params.push(visibility);
    } else {
      // 默认只显示公开的笔记，除非指定了 creatorId
      if (!creatorId) {
        whereClause += ' AND m.visibility = ?';
        params.push('PUBLIC');
      }
    }

    if (tag) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM memo_tag mt 
        JOIN tag t ON mt.tag_id = t.id 
        WHERE mt.memo_id = m.id AND t.name = ?
      )`;
      params.push(tag);
    }

    params.push(limit, offset);

    const memos = await c.env.DB.prepare(`
      SELECT m.*, u.username as creator_username
      FROM memo m
      JOIN user u ON m.creator_id = u.id
      ${whereClause}
      ORDER BY m.created_ts DESC
      LIMIT ? OFFSET ?
    `).bind(...params).all();

    // 为每个笔记获取详细信息
    const memosWithDetails = [];
    for (const memo of memos.results || []) {
      const memoWithDetails = await getMemoWithDetails(c.env.DB, memo.id);
      memosWithDetails.push(memoWithDetails);
    }

    return c.json(memosWithDetails);

  } catch (error) {
    console.error('Get memos error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 获取单个笔记
memoRoutes.get('/:id', async (c) => {
  try {
    const memoId = parseInt(c.req.param('id'));
    
    const memo = await c.env.DB.prepare(
      'SELECT m.*, u.username as creator_username FROM memo m JOIN user u ON m.creator_id = u.id WHERE m.id = ?'
    ).bind(memoId).first();

    if (!memo) {
      return c.json({ message: 'Memo not found' }, 404);
    }

    // 检查访问权限
    if (memo.visibility === 'PRIVATE') {
      const userPayload = c.get('user');
      if (!userPayload || memo.creator_id !== (await getUserIdFromUid(c.env.DB, userPayload.sub))) {
        return c.json({ message: 'Forbidden' }, 403);
      }
    }

    const memoWithDetails = await getMemoWithDetails(c.env.DB, memoId);
    
    return c.json(memoWithDetails);

  } catch (error) {
    console.error('Get memo error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 更新笔记
memoRoutes.patch('/:id', async (c) => {
  try {
    const memoId = parseInt(c.req.param('id'));
    const userPayload = c.get('user');
    
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const memo = await c.env.DB.prepare(
      'SELECT * FROM memo WHERE id = ?'
    ).bind(memoId).first();

    if (!memo) {
      return c.json({ message: 'Memo not found' }, 404);
    }

    const userId = await getUserIdFromUid(c.env.DB, userPayload.sub);
    if (memo.creator_id !== userId && userPayload.role !== 'HOST') {
      return c.json({ message: 'Forbidden' }, 403);
    }

    const { content, visibility, resourceIdList } = await c.req.json();
    const now = Math.floor(Date.now() / 1000);

    // 构建更新字段
    const updates = [];
    const values = [];
    
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    
    if (visibility !== undefined) {
      updates.push('visibility = ?');
      values.push(visibility);
    }

    updates.push('updated_ts = ?');
    values.push(now);
    values.push(memoId);

    if (updates.length > 1) {
      await c.env.DB.prepare(`
        UPDATE memo SET ${updates.join(', ')} WHERE id = ?
      `).bind(...values).run();
    }

    // 更新资源关联
    if (resourceIdList !== undefined) {
      // 删除现有关联
      await c.env.DB.prepare(
        'DELETE FROM memo_resource WHERE memo_id = ?'
      ).bind(memoId).run();

      // 添加新关联
      if (resourceIdList.length > 0) {
        for (const resourceId of resourceIdList) {
          await c.env.DB.prepare(`
            INSERT INTO memo_resource (memo_id, resource_id) VALUES (?, ?)
          `).bind(memoId, resourceId).run();
        }
      }
    }

    const updatedMemo = await getMemoWithDetails(c.env.DB, memoId);
    
    return c.json(updatedMemo);

  } catch (error) {
    console.error('Update memo error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 删除笔记
memoRoutes.delete('/:id', async (c) => {
  try {
    const memoId = parseInt(c.req.param('id'));
    const userPayload = c.get('user');
    
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const memo = await c.env.DB.prepare(
      'SELECT * FROM memo WHERE id = ?'
    ).bind(memoId).first();

    if (!memo) {
      return c.json({ message: 'Memo not found' }, 404);
    }

    const userId = await getUserIdFromUid(c.env.DB, userPayload.sub);
    if (memo.creator_id !== userId && userPayload.role !== 'HOST') {
      return c.json({ message: 'Forbidden' }, 403);
    }

    // 逻辑删除
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(`
      UPDATE memo SET row_status = ?, updated_ts = ? WHERE id = ?
    `).bind('ARCHIVED', now, memoId).run();

    return c.json({ message: 'Memo deleted successfully' });

  } catch (error) {
    console.error('Delete memo error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 获取笔记统计
memoRoutes.get('/stats', async (c) => {
  try {
    // 总数统计
    const totalResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM memo WHERE row_status = ? AND visibility = ?'
    ).bind('NORMAL', 'PUBLIC').first();

    // 每日统计（最近30天）
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    
    const dailyStats = await c.env.DB.prepare(`
      SELECT 
        DATE(created_ts, 'unixepoch') as date,
        COUNT(*) as count
      FROM memo 
      WHERE row_status = ? 
        AND visibility = ? 
        AND created_ts > ?
      GROUP BY DATE(created_ts, 'unixepoch')
      ORDER BY date DESC
    `).bind('NORMAL', 'PUBLIC', thirtyDaysAgo).all();

    const dailyHistogram = (dailyStats.results || []).map((row: any) => ({
      ts: Math.floor(new Date(row.date).getTime() / 1000),
      count: row.count
    }));

    return c.json({
      total: totalResult?.total || 0,
      dailyHistogram
    });

  } catch (error) {
    console.error('Get memo stats error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 辅助函数：获取笔记详细信息（包括资源和标签）
async function getMemoWithDetails(db: any, memoId: number) {
  const memo = await db.prepare(
    'SELECT m.*, u.username as creator_username FROM memo m JOIN user u ON m.creator_id = u.id WHERE m.id = ?'
  ).bind(memoId).first();

  if (!memo) return null;

  // 获取关联的资源ID
  const resources = await db.prepare(
    'SELECT resource_id FROM memo_resource WHERE memo_id = ?'
  ).bind(memoId).all();

  const resourceIdList = (resources.results || []).map((r: any) => r.resource_id);

  // 获取标签
  const tags = await db.prepare(`
    SELECT t.name FROM tag t 
    JOIN memo_tag mt ON t.id = mt.tag_id 
    WHERE mt.memo_id = ?
  `).bind(memoId).all();

  const tagList = (tags.results || []).map((t: any) => t.name);

  return {
    id: memo.id,
    uid: memo.uid,
    creatorId: memo.creator_id,
    content: memo.content,
    visibility: memo.visibility,
    rowStatus: memo.row_status,
    createdTs: memo.created_ts,
    updatedTs: memo.updated_ts,
    resourceIdList,
    tags: tagList
  };
}

// 辅助函数：通过 UID 获取用户 ID
async function getUserIdFromUid(db: any, uid: string): Promise<number | null> {
  const user = await db.prepare('SELECT id FROM user WHERE uid = ?').bind(uid).first();
  return user ? user.id : null;
}

export { memoRoutes }; 