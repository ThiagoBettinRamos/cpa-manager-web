import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cpa_user');
    const token = localStorage.getItem('cpa_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function signIn(username, password) {
    try {
      // Enviando como JSON para bater com o Schema do Backend
      const response = await api.post('/token', { username, password });
      const { access_token, role } = response.data;
      
      // SALVAMENTO IMEDIATO
      localStorage.setItem('cpa_token', access_token);
      const userData = { username, role };
      localStorage.setItem('cpa_user', JSON.stringify(userData));
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  }

  function signOut() {
    localStorage.removeItem('cpa_token');
    localStorage.removeItem('cpa_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}