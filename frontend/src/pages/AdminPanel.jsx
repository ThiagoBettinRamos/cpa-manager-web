import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NeonBackground from '../components/ui/NeonBackground';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/register-user', {
        username: username,
        password: password
      });
      setMessage({ type: 'success', text: `Usuário ${username} criado com sucesso!` });
      setUsername('');
      setPassword('');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Erro ao criar usuário.";
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans flex items-center justify-center p-6">
      <NeonBackground />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden"
      >
        {/* Botão Voltar */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center border border-fuchsia-500/30 mb-4 shadow-[0_0_15px_rgba(192,38,211,0.3)]">
            <UserPlus size={28} className="text-fuchsia-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter uppercase">Gestão de Acessos</h2>
          <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">APENAS ADMINISTRADOR</p>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Codinome do Operador</label>
            <input 
              required
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-fuchsia-600 outline-none transition-all"
              placeholder="Ex: joao_operador"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Senha de Acesso</label>
            <input 
              required
              type="text"
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-fuchsia-600 outline-none transition-all"
              placeholder="Defina a senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {message.text && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-4 rounded-xl text-center text-[10px] font-black uppercase tracking-tighter ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}
            >
              {message.text}
            </motion.div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "REGISTRAR AGENTE"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}