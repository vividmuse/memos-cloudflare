import { Hono } from 'hono';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

interface Variables {
  user: {
    sub: string;
    username: string;
    role: string;
    iat: number;
    exp: number;
  };
}

const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// 获取当前用户信息
userRoutes.get('/me', async (c) => {
  try {
    // 从中间件获取用户信息
    const userPayload = c.get('user');
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // 查询完整用户信息
    const user = await c.env.DB.prepare(
      'SELECT * FROM user WHERE uid = ? AND row_status = ?'
    ).bind(userPayload.sub, 'NORMAL').first();

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    // 返回用户信息（不包括密码哈希）
    const userResponse = {
      id: user.id,
      uid: user.uid,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      email: user.email,
      avatarUrl: user.avatar_url,
      description: user.description,
      rowStatus: user.row_status,
      createdTs: user.created_ts,
      updatedTs: user.updated_ts
    };

    return c.json(userResponse);

  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 获取用户列表（管理员功能）
userRoutes.get('/', async (c) => {
  try {
    const userPayload = c.get('user');
    if (!userPayload || userPayload.role !== 'HOST') {
      return c.json({ message: 'Forbidden' }, 403);
    }

    const url = new URL(c.req.url);
    const rowStatus = url.searchParams.get('rowStatus') || 'NORMAL';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const users = await c.env.DB.prepare(`
      SELECT id, uid, username, nickname, role, email, avatar_url, description, row_status, created_ts, updated_ts
      FROM user 
      WHERE row_status = ?
      ORDER BY created_ts DESC
      LIMIT ? OFFSET ?
    `).bind(rowStatus, limit, offset).all();

    return c.json(users.results || []);

  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 获取指定用户公开信息
userRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    
    const user = await c.env.DB.prepare(
      'SELECT id, uid, username, role, avatar_url, created_ts FROM user WHERE id = ? AND row_status = ?'
    ).bind(userId, 'NORMAL').first();

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json(user);

  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 更新用户信息
userRoutes.patch('/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const userPayload = c.get('user');
    
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // 检查权限：只能修改自己的信息，或者HOST可以修改任何人
    const targetUser = await c.env.DB.prepare(
      'SELECT * FROM user WHERE id = ? AND row_status = ?'
    ).bind(userId, 'NORMAL').first();

    if (!targetUser) {
      return c.json({ message: 'User not found' }, 404);
    }

    if (targetUser.uid !== userPayload.sub && userPayload.role !== 'HOST') {
      return c.json({ message: 'Forbidden' }, 403);
    }

    const { username, nickname, email, avatarUrl, description } = await c.req.json();
    const now = Math.floor(Date.now() / 1000);

    // 构建更新字段
    const updates = [];
    const values = [];
    
    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    
    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatarUrl);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    updates.push('updated_ts = ?');
    values.push(now);
    values.push(userId);

    if (updates.length > 1) { // 除了 updated_ts 还有其他字段
      await c.env.DB.prepare(`
        UPDATE user SET ${updates.join(', ')} WHERE id = ?
      `).bind(...values).run();
    }

    // 返回更新后的用户信息
    const updatedUser = await c.env.DB.prepare(
      'SELECT id, uid, username, nickname, role, email, avatar_url, description, row_status, created_ts, updated_ts FROM user WHERE id = ?'
    ).bind(userId).first();

    return c.json(updatedUser);

  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 获取用户设置
userRoutes.get('/:id/setting', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const userPayload = c.get('user');
    
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // 检查权限：只能获取自己的设置，或者HOST可以获取任何人
    const targetUser = await c.env.DB.prepare(
      'SELECT * FROM user WHERE id = ? AND row_status = ?'
    ).bind(userId, 'NORMAL').first();

    if (!targetUser) {
      return c.json({ message: 'User not found' }, 404);
    }

    if (targetUser.uid !== userPayload.sub && userPayload.role !== 'HOST') {
      return c.json({ message: 'Forbidden' }, 403);
    }

    // 获取用户设置，如果不存在则返回默认值
    let userSetting = await c.env.DB.prepare(
      'SELECT * FROM user_setting WHERE user_id = ?'
    ).bind(userId).first();

    if (!userSetting) {
      // 如果没有设置记录，创建默认设置
      const now = Math.floor(Date.now() / 1000);
      await c.env.DB.prepare(`
        INSERT INTO user_setting (user_id, locale, appearance, memo_visibility, created_ts, updated_ts)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(userId, 'zh', 'system', 'PRIVATE', now, now).run();
      
      userSetting = {
        user_id: userId,
        locale: 'zh',
        appearance: 'system',
        memo_visibility: 'PRIVATE',
        created_ts: now,
        updated_ts: now
      };
    }

    return c.json({
      name: `users/${userId}/setting`,
      locale: userSetting.locale,
      appearance: userSetting.appearance,
      memoVisibility: userSetting.memo_visibility
    });

  } catch (error) {
    console.error('Get user setting error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// 更新用户设置
userRoutes.patch('/:id/setting', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const userPayload = c.get('user');
    
    if (!userPayload) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    // 检查权限：只能修改自己的设置，或者HOST可以修改任何人
    const targetUser = await c.env.DB.prepare(
      'SELECT * FROM user WHERE id = ? AND row_status = ?'
    ).bind(userId, 'NORMAL').first();

    if (!targetUser) {
      return c.json({ message: 'User not found' }, 404);
    }

    if (targetUser.uid !== userPayload.sub && userPayload.role !== 'HOST') {
      return c.json({ message: 'Forbidden' }, 403);
    }

    const { locale, appearance, memoVisibility } = await c.req.json();
    const now = Math.floor(Date.now() / 1000);

    // 检查是否已有设置记录
    const existingSetting = await c.env.DB.prepare(
      'SELECT * FROM user_setting WHERE user_id = ?'
    ).bind(userId).first();

    if (existingSetting) {
      // 更新现有设置
      const updates = [];
      const values = [];
      
      if (locale !== undefined) {
        updates.push('locale = ?');
        values.push(locale);
      }
      
      if (appearance !== undefined) {
        updates.push('appearance = ?');
        values.push(appearance);
      }
      
      if (memoVisibility !== undefined) {
        updates.push('memo_visibility = ?');
        values.push(memoVisibility);
      }

      if (updates.length > 0) {
        updates.push('updated_ts = ?');
        values.push(now);
        values.push(userId);

        await c.env.DB.prepare(`
          UPDATE user_setting SET ${updates.join(', ')} WHERE user_id = ?
        `).bind(...values).run();
      }
    } else {
      // 创建新设置记录
      await c.env.DB.prepare(`
        INSERT INTO user_setting (user_id, locale, appearance, memo_visibility, created_ts, updated_ts)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        locale || 'zh',
        appearance || 'system',
        memoVisibility || 'PRIVATE',
        now,
        now
      ).run();
    }

    // 返回更新后的设置
    const updatedSetting = await c.env.DB.prepare(
      'SELECT * FROM user_setting WHERE user_id = ?'
    ).bind(userId).first();

    if (!updatedSetting) {
      return c.json({ message: 'Failed to retrieve updated setting' }, 500);
    }

    return c.json({
      name: `users/${userId}/setting`,
      locale: updatedSetting.locale,
      appearance: updatedSetting.appearance,
      memoVisibility: updatedSetting.memo_visibility
    });

  } catch (error) {
    console.error('Update user setting error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

export { userRoutes }; 