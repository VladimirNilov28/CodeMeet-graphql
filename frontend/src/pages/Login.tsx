import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = typeof res.data === 'string' ? res.data : res.data?.token;
      if (!token) {
        throw new Error('Token missing from login response');
      }
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } catch (err: any) {
      const backendMessage = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message;
      setError(backendMessage || err.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-transparent">
      <div className="cyber-panel p-8 w-full max-w-md">
        <h2 className="text-3xl mb-6 text-center text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,204,0.8)]">SYSTEM_LOGIN</h2>
        
        {error && <div className="text-red-500 mb-4 text-center">[{error}]</div>}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm mb-1 text-cyan-500">USER_IDENTIFIER (EMAIL)</label>
            <input 
              type="email" 
              className="cyber-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cyan-500">ACCESS_CODE (PASSWORD)</label>
            <input 
              type="password" 
              className="cyber-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="cyber-button w-full py-3 mt-4 font-bold tracking-widest hover:text-white">
            Authenticate
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm">UNKNOWN_ENTITY?</p>
          <a href="/register" className="text-fuchsia-500 hover:text-fuchsia-300 underline underline-offset-4">INITIALIZE_REGISTRATION</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
