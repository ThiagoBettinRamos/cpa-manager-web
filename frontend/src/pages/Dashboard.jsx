import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, User, Wifi, DollarSign, Smartphone, 
  Copy, Check, LogOut, Hash, ChevronDown, Settings, Trophy, Link as LinkIcon, FileText, Send
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
  const [toast, setToast] = useState({ show: false, message: "" });

  useEffect(() => { 
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([loadCiclos(0, true), loadRanking()]);
  };

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 4000);
  };

  async function loadRanking() {
    try {
      const res = await api.get('/ranking');
      setRanking(res.data || []);
    } catch (err) { console.error("Erro Ranking:", err); }
  }

  async function loadCiclos(pageNumber, isInitial = false) {
    setLoading(true);
    try {
      const skip = pageNumber * 5;
      const res = await api.get(`/ciclos?skip=${skip}&limit=5`);
      const newData = res.data || [];
      if (newData.length < 5) setHasMore(false);
      else setHasMore(true);
      
      if (isInitial) setCiclos(newData);
      else setCiclos(prev => [...prev, ...newData]);
    } catch (err) { 
      console.error("Erro Ciclos:", err);
      showToast("Erro ao carregar dados do banco ❌");
    } finally { setLoading(false); }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCiclos(nextPage);
  };

  async function handleNewCycle() {
    try {
      const res = await api.post('/ciclos');
      if (res.data) setCiclos([res.data, ...ciclos]);
    } catch (err) { 
        console.error(err);
        showToast("Erro ao criar ciclo. Verifique o banco de dados ❌"); 
    }
  }

  async function handleAccumulate(perfilId, field, value, currentValue) {
    const valFloat = parseFloat(value);
    if (isNaN(valFloat)) return;
    const newValue = parseFloat(currentValue || 0) + valFloat;
    try {
      await api.put(`/perfis/${perfilId}`, { [field]: newValue });
      setCiclos(prev => prev.map(c => ({
        ...c,
        perfis: c.perfis.map(p => p.id === perfilId ? {...p, [field]: newValue} : p)
      })));
      loadRanking();
    } catch (err) { showToast("Erro ao salvar valor ❌"); }
  }

  async function handleUpdateField(perfilId, field, value) {
    try { await api.put(`/perfis/${perfilId}`, { [field]: value }); } 
    catch (err) { console.error(err); }
  }

  async function handleWeeklyReport() {
    try {
      showToast("Enviando relatório para seu e-mail...");
      await api.get('/relatorio-semanal');
      showToast("Relatório enviado com sucesso! ✅");
    } catch (err) { 
      showToast("Erro ao enviar e-mail. Verifique o servidor ❌"); 
    }
  }

  const quickLinks = [
    "http://9znn.com", "http://199pg.com", "http://88up.com", "http://ss123b.com", 
    "http://99hi.com", "http://kz999h.com", "http://7lbr.com", "http://kk45.com", "http://hh666.com"
  ];

  return (
    <div className="h-screen w-screen overflow-hidden text-white font-sans flex flex-col bg-slate-950">
      <NeonBackground />

      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-fuchsia-600 px-6 py-3 rounded-2xl shadow-2xl border border-fuchsia-400 flex items-center gap-3">
            <Send size={18} className="animate-pulse" />
            <span className="font-black text-xs uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 flex flex-col h-full max-w-[1750px] mx-auto w-full p-4 md:p-6">
        
        <header className="flex justify-between items-center mb-6 glass-panel p-5 rounded-[2rem] border border-white/10 flex-shrink-0 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Hash size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">CPA <span className="text-fuchsia-500">PRO</span></h1>
              <span className="text-[8px] text-gray-500 font-bold tracking-[0.3em] uppercase italic">Operador: {user?.username}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleWeeklyReport} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-black text-[10px] transition-all flex items-center gap-2">
              <FileText size={14} /> RELATÓRIO E-MAIL
            </button>
            <button onClick={handleNewCycle} className="bg-fuchsia-600 hover:bg-fuchsia-500 px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg">
              <Plus size={18} /> NOVO CICLO
            </button>
            <button onClick={signOut} className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-rose-500 transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
            <div className="flex flex-col gap-8">
              <AnimatePresence>
                {ciclos.map(ciclo => {
                  const mae = ciclo.perfis?.find(p => p.tipo === "MAE") || {};
                  const filha = ciclo.perfis?.find(p => p.tipo === "FILHA") || {};
                  const lucro = ((mae.total_saque || 0) + (mae.resgate_diario || 0) + (filha.total_saque || 0) + (filha.resgate_diario || 0)) - ((mae.total_deposito || 0) + (filha.total_deposito || 0));

                  return (
                    <motion.div key={ciclo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                      <div className="flex justify-between items-center bg-white/5 px-8 py-3 border-b border-white/5">
                        <span className="text-fuchsia-500 font-black text-xs uppercase tracking-widest italic">Operação #{ciclo.id}</span>
                        <div className={`px-4 py-1 rounded-full text-[10px] font-black ${lucro >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                          LUCRO: R$ {lucro.toFixed(2)}
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
                          <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-3xl border border-white/5">
                            <AccumulatorInput label="Depósito" color="border-rose-500" onEnter={(v) => handleAccumulate(mae.id, 'total_deposito', v, mae.total_deposito)} />
                            <AccumulatorInput label="Saque" color="border-emerald-500" onEnter={(v) => handleAccumulate(mae.id, 'total_saque', v, mae.total_saque)} />
                            <AccumulatorInput label="Resgate" color="border-yellow-500" onEnter={(v) => handleAccumulate(mae.id, 'resgate_diario', v, mae.resgate_diario)} />
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
                          <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-3xl border border-white/5">
                            <AccumulatorInput label="Depósito" color="border-rose-500" onEnter={(v) => handleAccumulate(filha.id, 'total_deposito', v, filha.total_deposito)} />
                            <AccumulatorInput label="Saque" color="border-emerald-500" onEnter={(v) => handleAccumulate(filha.id, 'total_saque', v, filha.total_saque)} />
                            <AccumulatorInput label="Resgate" color="border-yellow-500" onEnter={(v) => handleAccumulate(filha.id, 'resgate_diario', v, filha.resgate_diario)} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {hasMore && (
                <button onClick={handleLoadMore} disabled={loading} className="bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold text-fuchsia-400 transition-all flex justify-center items-center">
                  {loading ? "CARREGANDO..." : <ChevronDown size={20} />}
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:flex flex-col w-80 gap-6 flex-shrink-0">
            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="text-yellow-500" size={18} />
                <h2 className="font-black uppercase tracking-tighter text-sm">Top Operadores</h2>
              </div>
              <div className="space-y-3">
                {ranking.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-fuchsia-500'}`}>{index + 1}</span>
                      <span className="text-xs font-bold text-gray-300 truncate w-32">{item.nome}</span>
                    </div>
                    <span className={`text-[10px] font-black ${item.lucro >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>R$ {item.lucro.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-center gap-3 mb-6">
                <LinkIcon className="text-fuchsia-500" size={18} />
                <h2 className="font-black uppercase tracking-tighter text-sm">Cópia Rápida</h2>
              </div>
              <div className="mb-6">
                <span className="text-[9px] font-black text-gray-500 uppercase ml-1">Senha do Grupo</span>
                <ClickCopyInput label="PASSWORD" value="101010" color="text-yellow-400" />
              </div>
              <div className="space-y-3">
                <span className="text-[9px] font-black text-gray-500 uppercase ml-1 tracking-widest">Links HTTPS</span>
                {quickLinks.map(link => (
                  <div key={link}><ClickCopyInput label="" value={link} color="text-fuchsia-400" /></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      {label && <span className="text-[9px] font-black text-gray-500 uppercase ml-3 tracking-tighter">{label}</span>}
      <div className="relative">
        <input value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => onSave && onSave(val)} onClick={handleCopy} 
          className={`w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-mono outline-none focus:border-fuchsia-600 transition-all cursor-pointer ${color}`} />
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
        <input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && temp){ onEnter(temp); setTemp(""); } }} 
          placeholder="0" className="w-full bg-transparent py-2 px-3 text-xs font-black outline-none" />
        <DollarSign size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10" />
      </div>
    </div>
  );
}