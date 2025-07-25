import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import NotesList from './pages/NotesList';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('webnotebook_token') || '');

    useEffect(() => {
        // 从URL参数中获取token
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');

        if (urlToken) {
            setToken(urlToken);
            localStorage.setItem('webnotebook_token', urlToken);
            // 清除URL中的token参数
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleLogin = t => {
        setToken(t);
        localStorage.setItem('webnotebook_token', t);
    };

    const handleLogout = () => {
        setToken('');
        localStorage.removeItem('webnotebook_token');
    };

    return (
        <BrowserRouter>
            <nav className="navbar navbar-expand navbar-light bg-light">
                <div className="container">
                    <Link className="navbar-brand" to="/">网页笔记本后台</Link>
                    <div>
                        {token
                            ? <button className="btn btn-outline-danger" onClick={handleLogout}>退出</button>
                            : <Link className="btn btn-outline-primary" to="/login">登录</Link>
                        }
                        <Link className="btn btn-outline-success ms-2" to="/register">注册</Link>
                    </div>
                </div>
            </nav>
            <Routes>
                <Route path="/" element={token ? <NotesList token={token} /> : <Login onLogin={handleLogin} />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </BrowserRouter>
    );
} 