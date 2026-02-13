import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, User, Wifi, DollarSign, Smartphone, 
  Copy, Check, LogOut, Hash, ChevronDown, Settings, Trophy 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NeonBackground from '../components/ui/NeonBackground';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [ciclos, setCiclos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Carregamento inicial
  useEffect(() => { 
    loadCiclos(0, true); 
    loadRanking();
  }, []);

  async function loadRanking() {
    try {
      const res = await api.get('/ranking');
      setRanking(res.data);
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    }
  }

  async function loadCiclos(pageNumber, isInitial = false) {
    setLoading(true);
    try {
      const skip = pageNumber * 5;
      const res = await api.get(`/ciclos?skip=${skip}&limit=5`);
      
      if (res.data.length < 5) setHasMore(false);
      else setHasMore(true);

      if (isInitial) {
        setCiclos(res.data);
      } else {
        setCiclos(prev => [...prev, ...res.data]);
      }
    } catch (err) { 
      console.error("Erro ao carregar dados:", err); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCiclos(nextPage);
  };

  async function handleNewCycle() {
    try {
      const res = await api.post('/ciclos');
      setCiclos([res.data, ...ciclos]);
    } catch (err) { 
      alert("Erro ao criar ciclo no servidor."); 
    }
  }

  async function handleAccumulate(perfilId, field, value, currentValue) {
    const valFloat = parseFloat(value);
    if (isNaN(valFloat)) return;
    
    const newValue = parseFloat(currentValue || 0) + valFloat;
    try {
      await api.put(`/perfis/${perfilId}`, { [field]: newValue });
      
      // Atualização otimista no estado local
      setCiclos(prev => prev.map(c => ({
        ...c,
        perfis: c.perfis.map(p => p.id === perfilId ? {...p, [field]: newValue} : p)
      })));
      
      // Atualiza o ranking para refletir o novo lucro
      loadRanking();
    } catch (err) { 
      console.error("Erro ao salvar valor:", err); 
    }
  }

  async function handleUpdateField(perfilId, field, value) {
    try { 
      await api.put(`/perfis/${perfilId}`, { [field]: value }); 
    } catch (err) { 
      console.error("Erro ao atualizar campo:", err); 
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden text-white font-sans flex flex-col bg-slate-950">
      <NeonBackground />
      
      <div className="relative z-10 flex flex-col h-full max-w-[1700px] mx-auto w-full p-4 md:p-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-6 glass-panel p-5 rounded-[2rem] border border-white/10 flex-shrink-0 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Hash size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">CPA <span className="text-fuchsia-500">PRO</span></h1>
              <span className="text-[8px] text-gray-500 font-bold tracking-[0.3em]">OPERADOR: {user?.username}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 text-fuchsia-400 transition-all flex items-center gap-2 group"
              >
                <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="hidden md:inline text-[10px] font-black uppercase">Admin</span>
              </button>
            )}

            <button onClick={handleNewCycle} className="bg-fuchsia-600 hover:bg-fuchsia-500 px-8 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg">
              <Plus size={18} /> <span className="hidden md:inline">NOVO CICLO</span>
            </button>
            <button onClick={signOut} className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-rose-500 transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-1 gap-6 overflow-hidden">
          
          {/* LISTA DE CICLOS (SCROLL) */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
            <div className="flex flex-col gap-8">
              <AnimatePresence>
                {ciclos.map(ciclo => {
                  const mae = ciclo.perfis.find(p => p.tipo === "MAE") || {};
                  const filha = ciclo.perfis.find(p => p.tipo === "FILHA") || {};
                  const lucro = ((mae.total_saque || 0) + (filha.total_saque || 0)) - ((mae.total_deposito || 0) + (filha.total_deposito || 0));

                  return (
                    <motion.div 
                      key={ciclo.id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl group"
                    >
                      <div className="flex justify-between items-center bg-white/5 px-8 py-3 border-b border-white/5">
                        <span className="text-fuchsia-500 font-black text-xs uppercase tracking-widest">OPERAÇÃO #{ciclo.id}</span>
                        <div className={`px-4 py-1 rounded-full text-[10px] font-black ${lucro >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                          LUCRO ATUAL: R$ {lucro.toFixed(2)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/10">
                        <div className="p-8 space-y-6">
                          <div className="flex items-center gap-3 text-purple-400 font-black text-[10px] uppercase tracking-widest"><User size={14}/> Master (Mãe)</div>
                          <div className="grid grid-cols-2 gap-4">
                            <ClickCopyInput label="Nome" value={mae.nome_ficticio} />
                            <ClickCopyInput label="Senha" value={mae.senha} color="text-fuchsia-300" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <ClickCopyInput label="CPF" value={mae.cpf} onSave={(v) => handleUpdateField(mae.id, 'cpf', v)} />
                            <ClickCopyInput label="Número" value={mae.phone} onSave={(v) => handleUpdateField(mae.id, 'phone', v)} />
                          </div>
                          <ClickCopyInput label="Proxy" value={mae.proxy} onSave={(v) => handleUpdateField(mae.id, 'proxy', v)} />
                          <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                            <AccumulatorInput label="Depósito" color="border-rose-500" onEnter={(v) => handleAccumulate(mae.id, 'total_deposito', v, mae.total_deposito)} />
                            <AccumulatorInput label="Saque" color="border-emerald-500" onEnter={(v) => handleAccumulate(mae.id, 'total_saque', v, mae.total_saque)} />
                          </div>
                        </div>

                        <div className="p-8 space-y-6">
                          <div className="flex items-center gap-3 text-pink-400 font-black text-[10px] uppercase tracking-widest"><Smartphone size={14}/> Slave (Filha)</div>
                          <div className="grid grid-cols-2 gap-4">
                            <ClickCopyInput label="Nome" value={filha.nome_ficticio} />
                            <ClickCopyInput label="Senha" value={filha.senha} color="text-fuchsia-300" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <ClickCopyInput label="CPF" value={filha.cpf} onSave={(v) => handleUpdateField(filha.id, 'cpf', v)} />
                            <ClickCopyInput label="Número" value={filha.phone} onSave={(v) => handleUpdateField(filha.id, 'phone', v)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <ClickCopyInput label="Proxy 1" value={filha.proxy} onSave={(v) => handleUpdateField(filha.id, 'proxy', v)} />
                            <ClickCopyInput label="Proxy 2" value={filha.proxy2} onSave={(v) => handleUpdateField(filha.id, 'proxy2', v)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                            <AccumulatorInput label="Depósito" color="border-rose-500" onEnter={(v) => handleAccumulate(filha.id, 'total_deposito', v, filha.total_deposito)} />
                            <AccumulatorInput label="Saque" color="border-emerald-500" onEnter={(v) => handleAccumulate(filha.id, 'total_saque', v, filha.total_saque)} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={handleLoadMore} 
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-12 py-4 rounded-2xl font-bold transition-all text-fuchsia-400 flex items-center gap-3"
                  >
                    {loading ? "PROCESSANDO..." : <><ChevronDown size={20}/> CARREGAR MAIS</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RANKING LATERAL (FIXO) */}
          <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 h-fit sticky top-0 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                   <Trophy className="text-yellow-500" size={18} />
                </div>
                <h2 className="font-black uppercase tracking-tighter text-sm">Top Operadores</h2>
              </div>
              
              <div className="space-y-3">
                {ranking.length > 0 ? (
                  ranking.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-fuchsia-500'}`}>
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-300 truncate w-32">{item.nome}</span>
                      </div>
                      <span className={`text-[10px] font-black ${item.lucro >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                        R$ {item.lucro.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-500 text-center py-4 uppercase font-bold tracking-widest">Sem dados ainda</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function ClickCopyInput({ label, value, onSave, color="text-white" }) {
  const [val, setVal] = useState(value || "");
  const [copied, setCopied] = useState(false);
  useEffect(() => { setVal(value || ""); }, [value]);

  const handleCopy = () => {
    if(!val) return;
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-gray-500 uppercase ml-3 tracking-tighter">{label}</span>
      <div className="relative">
        <input 
          value={val} 
          onChange={(e) => setVal(e.target.value)} 
          onBlur={() => onSave && onSave(val)}
          onClick={handleCopy}
          className={`w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-mono outline-none focus:border-fuchsia-600 transition-all cursor-pointer ${color}`}
        />
        {copied && <Check size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-bounce" />}
      </div>
    </div>
  );
}

function AccumulatorInput({ label, onEnter, color }) {
  const [temp, setTemp] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-tighter">{label}</span>
      <div className={`relative border-b-2 ${color} bg-black/40 rounded-xl`}>
        <input 
          type="number" 
          value={temp} 
          onChange={(e) => setTemp(e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter' && temp){ onEnter(temp); setTemp(""); } }}
          placeholder="VALOR"
          className="w-full bg-transparent py-2.5 px-4 text-sm font-black outline-none placeholder:text-white/5"
        />
        <DollarSign size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/5" />
      </div>
    </div>
  );
}