#!/usr/bin/env node

const BASE_URL = 'http://localhost:8787';

async function debugDatabaseQueries() {
    console.log('🔍 Database Debug\n');
    
    try {
        // 创建一个特殊的测试端点请求来查看数据库状态
        console.log('1. Testing memo endpoint (should show empty array if DB is empty)...');
        const memoResponse = await fetch(`${BASE_URL}/api/memo`);
        const memoData = await memoResponse.text();
        console.log('   Status:', memoResponse.status);
        console.log('   Data:', memoData);
        
        // 尝试创建一个笔记（这会失败因为没有认证，但可以测试数据库连接）
        console.log('\n2. Testing memo creation (should fail with 401)...');
        const createMemoResponse = await fetch(`${BASE_URL}/api/memo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: 'Test memo'
            })
        });
        console.log('   Status:', createMemoResponse.status);
        const createMemoData = await createMemoResponse.text();
        console.log('   Data:', createMemoData);
        
        // 尝试用GET /api/user/me （这也会失败但可以测试数据库）
        console.log('\n3. Testing user endpoint (should fail with 401)...');
        const userResponse = await fetch(`${BASE_URL}/api/user/me`);
        console.log('   Status:', userResponse.status);
        const userData = await userResponse.text();
        console.log('   Data:', userData);
        
        // 现在尝试 signup
        console.log('\n4. Testing signup with detailed logging...');
        const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testadmin',
                password: 'password123',
                email: 'test@example.com'
            })
        });
        
        console.log('   Status:', signupResponse.status);
        const signupData = await signupResponse.text();
        console.log('   Data:', signupData);
        
        // 再次检查memo端点看是否有变化
        console.log('\n5. Re-checking memo endpoint after signup attempt...');
        const memoResponse2 = await fetch(`${BASE_URL}/api/memo`);
        const memoData2 = await memoResponse2.text();
        console.log('   Status:', memoResponse2.status);
        console.log('   Data:', memoData2);
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
    }
}

debugDatabaseQueries(); 