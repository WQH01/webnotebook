import React, { useState } from 'react';
import { register } from '../api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const handleRegister = async () => {
        try {
            await register(username, email, password);
            setMsg('注册成功，请登录');
        } catch {
            setMsg('注册失败');
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 400 }}>
            <h3>注册</h3>
            <input className="form-control my-2" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="form-control my-2" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="form-control my-2" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn btn-success w-100" onClick={handleRegister}>注册</button>
            <div className="text-danger mt-2">{msg}</div>
        </div>
    );
} 