import React, { useState } from 'react';
import { login } from '../api';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const handleLogin = async () => {
        try {
            const data = await login(username, password);
            onLogin(data.token);
        } catch {
            setMsg('登录失败');
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 400 }}>
            <h3>登录</h3>
            <input className="form-control my-2" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="form-control my-2" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn btn-primary w-100" onClick={handleLogin}>登录</button>
            <div className="text-danger mt-2">{msg}</div>
        </div>
    );
} 