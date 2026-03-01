import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { email, name, password });
      // On success, redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-transparent">
      <div className="cyber-panel p-8 w-full max-w-md">
        <h2 className="text-3xl mb-6 text-center text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,204,0.8)]">NEW_ENTITY_SETUP</h2>
        
        {error && <div className="text-red-500 mb-4 text-center">[{error}]</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-cyan-500">PROXY_ALIAS (NAME)</label>
            <input 
              type="text" 
              className="cyber-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cyan-500">CONTACT_NODE (EMAIL)</label>
            <input 
              type="email" 
              className="cyber-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cyan-500">SECURITY_KEY (PASSWORD)</label>
            <input 
              type="password" 
              className="cyber-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="cyber-button w-full py-3 mt-4 font-bold tracking-widest hover:text-white">
            Execute Inject
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm">ALREADY_REGISTERED?</p>
          <a href="/login" className="text-fuchsia-500 hover:text-fuchsia-300 underline underline-offset-4">RETURN_TO_LOGIN</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
