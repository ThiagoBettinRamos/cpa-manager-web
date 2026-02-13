import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NeonBackground from '../components/ui/NeonBackground';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [user, setUserInput] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    // Tentativa de login
    const success = await signIn(user, pass);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center text-white p-4">
      <NeonBackground />
      
      {/* Container Principal com Bordas Arredondadas e Efeito Vidro */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[400px]"
      >
        {/* Glow Externo (Aura do Login) */}
        <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-[30px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        
        <div className="relative glass-panel p-10 rounded-[30px] border border-white/10 overflow-hidden bg-black/40 backdrop-blur-2xl">
          
          {/* Luz de destaque interna */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-[60px]"></div>

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center border border-fuchsia-500/30 mb-4 shadow-[0_0_20px_rgba(192,38,211,0.2)]">
              <ShieldCheck size={32} className="text-fuchsia-500" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
              CPA MANAGER
            </h2>
            <p className="text-[10px] text-fuchsia-400 font-bold tracking-[0.4em] uppercase mt-2">
              Secure Terminal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-4 uppercase">Identity</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  placeholder="Username"
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm focus:border-fuchsia-500 focus:bg-white/10 outline-none transition-all"
                  value={user} onChange={e => setUserInput(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-4 uppercase">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="password"
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm focus:border-fuchsia-500 focus:bg-white/10 outline-none transition-all"
                  value={pass} onChange={e => setPass(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-rose-500 text-[10px] text-center font-black uppercase tracking-widest"
              >
                Access Denied: Invalid Credentials
              </motion.p>
            )}

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-4 rounded-full shadow-[0_10px_20px_rgba(192,38,211,0.3)] transition-all flex items-center justify-center gap-2"
            >
              {loading ? "VERIFYING..." : "INITIALIZE SYSTEM"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}