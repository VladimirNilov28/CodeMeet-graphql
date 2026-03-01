import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

type Bio = {
    primaryLanguage?: string;
    experienceLevel?: string;
    lookFor?: string;
    preferredOs?: string;
    codingStyle?: string;
    city?: string;
};

const Dashboard: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [bio, setBio] = useState<Bio | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const navigate = useNavigate();

    const calculateCompletion = (bioData: Bio | null): number => {
        if (!bioData) return 0;

        const values = [
            bioData.primaryLanguage,
            bioData.experienceLevel,
            bioData.lookFor,
            bioData.preferredOs,
            bioData.codingStyle,
            bioData.city,
        ];

        const filled = values.filter((value) => (value || '').trim().length > 0).length;
        return Math.round((filled / values.length) * 100);
    };

    const completion = calculateCompletion(bio);
    const ringSize = 96;
    const stroke = 8;
    const radius = (ringSize - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - completion / 100);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/me');
                setUser(userRes.data);
                
                try {
                    const bioRes = await api.get('/me/bio');
                    setBio(bioRes.data);
                } catch (e) {
                    // Bio probably doesn't exist yet
                }
            } catch (err) {
                // If 401/403, redirect to login
                navigate('/login');
            }
        };
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setUploadMessage('');
        
        try {
            await api.post('/me/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadMessage('AVATAR_UPLOAD_SUCCESS');
            // Refresh user to get new avatar URL
            const userRes = await api.get('/me');
            setUser(userRes.data);
        } catch (err: any) {
            setUploadMessage('UPLOAD_FAILED: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-cyan-400">LOADING_MAINFRAME...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto mt-10">
             <div className="flex justify-between items-center mb-8 border-b border-fuchsia-500 pb-4">
                <h1 className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,204,0.8)]">NEURAL_DASHBOARD</h1>
                <button onClick={handleLogout} className="text-red-500 border border-red-500 px-4 py-2 hover:bg-red-500 hover:text-white transition-colors">
                    TERMINATE_LINK
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="cyber-panel p-6">
                    <h2 className="text-2xl text-fuchsia-400 mb-4">ENTITY_STATUS</h2>
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="w-24 h-24 border-2 border-cyan-500 overflow-hidden bg-gray-900 flex items-center justify-center text-3xl">
                                {user.profilePicture ? (
                                    <img src={`http://localhost:8080${user.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>👤</span>
                                )}
                            </div>
                            <label className="mt-3 cursor-pointer text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/50 px-2 py-1 bg-cyan-900/20">
                                {uploading ? 'UPLOADING...' : 'UPLOAD_AVATAR'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>
                        <div className="space-y-3 font-mono text-sm leading-relaxed flex-1">
                            <p><span className="text-cyan-600">ID:</span> {user.id}</p>
                            <p><span className="text-cyan-600">ALIAS:</span> {user.name}</p>
                            <p><span className="text-cyan-600">NODE:</span> {user.email}</p>
                            {uploadMessage && (
                                <p className={`mt-2 ${uploadMessage.includes('SUCCESS') ? 'text-green-400' : 'text-red-500'}`}>
                                    [{uploadMessage}]
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-8 border-t border-fuchsia-500/30 pt-6">
                        <h3 className="text-lg text-fuchsia-300 mb-4">SYSTEM_NAVIGATION</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => navigate('/matches')} className="cyber-button w-full py-3 text-left pl-4 hover:pl-6 transition-all">
                                [01] FIND_MATCHES (RECOMMENDATION_ENGINE)
                            </button>
                            <button onClick={() => navigate('/connections')} className="cyber-button w-full py-3 text-left pl-4 hover:pl-6 transition-all">
                                [02] MANAGE_CONNECTIONS
                            </button>
                            <button onClick={() => navigate('/chat')} className="cyber-button w-full py-3 text-left pl-4 hover:pl-6 transition-all">
                                [03] ENCRYPTED_COMMUNICATIONS (CHAT)
                            </button>
                            <button onClick={() => navigate('/setup-bio')} className="text-cyan-500 border border-cyan-900 bg-black/40 w-full py-2 text-left pl-4 hover:bg-cyan-900/30 transition-all font-mono text-sm mt-4">
                                // UPDATE_BIO_PARAMETERS
                            </button>
                        </div>
                    </div>
                 </div>

                 <div className="cyber-panel p-6">
                    <h2 className="text-2xl text-fuchsia-400 mb-4">BIO_METRICS</h2>
                    {bio ? (
                         <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative" aria-label={`Bio completion ${completion}%`}>
                                    <svg width={ringSize} height={ringSize} className="-rotate-90">
                                        <circle
                                            cx={ringSize / 2}
                                            cy={ringSize / 2}
                                            r={radius}
                                            stroke="rgba(255,255,255,0.15)"
                                            strokeWidth={stroke}
                                            fill="transparent"
                                        />
                                        <circle
                                            cx={ringSize / 2}
                                            cy={ringSize / 2}
                                            r={radius}
                                            stroke="#ff00ff"
                                            strokeWidth={stroke}
                                            strokeLinecap="round"
                                            fill="transparent"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={dashOffset}
                                            style={{ transition: 'stroke-dashoffset 0.35s ease' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-fuchsia-300 font-bold text-sm">
                                        {completion}%
                                    </div>
                                </div>
                                <div className="font-mono text-sm">
                                    <p className="text-cyan-500">BIO_COMPLETION</p>
                                </div>
                            </div>

                            <div className="space-y-3 font-mono text-sm leading-relaxed">
                                <p><span className="text-cyan-600">PRIMARY_STACK:</span> {bio.primaryLanguage || 'UNKNOWN'}</p>
                                <p><span className="text-cyan-600">LEVEL:</span> {bio.experienceLevel || 'UNKNOWN'}</p>
                                <p><span className="text-cyan-600">TARGET:</span> {bio.lookFor || 'UNKNOWN'}</p>
                                <p><span className="text-cyan-600">OS_CORE:</span> {bio.preferredOs || 'UNKNOWN'}</p>
                                <p><span className="text-cyan-600">STYLE:</span> {bio.codingStyle || 'UNKNOWN'}</p>
                                <p><span className="text-cyan-600">CITY:</span> {bio.city || 'UNKNOWN'}</p>
                            </div>
                         </div>
                    ) : (
                        <div className="text-yellow-500">
                            WARNING: BIO_DATA MISSING. RECOMMENDATIONS INACTIVE.
                            <button className="cyber-button w-full py-2 mt-4 text-sm" onClick={() => navigate('/setup-bio')}>
                                INITIALIZE_BIO
                            </button>
                        </div>
                    )}
                 </div>
             </div>
        </div>
    );
};

export default Dashboard;
