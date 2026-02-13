from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base # Certifique-se que o caminho do seu Base está correto

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # 'admin' ou 'user'
    is_active = Column(Boolean, default=True)

class Ciclo(Base):
    __tablename__ = "ciclos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    responsavel = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ativo") 
    
    # Relacionamento com Perfis (Mãe e Filha)
    perfis = relationship("Perfil", back_populates="ciclo", cascade="all, delete-orphan")

class Perfil(Base):
    __tablename__ = "perfis"
    id = Column(Integer, primary_key=True, index=True)
    ciclo_id = Column(Integer, ForeignKey("ciclos.id"))
    tipo = Column(String) # 'MAE' ou 'FILHA'
    
    nome_ficticio = Column(String)
    senha = Column(String)
    
    # --- Dados de Identidade ---
    cpf = Column(String, nullable=True)
    phone = Column(String, nullable=True) # Campo de número/telefone
    
    # --- Dados de Rede ---
    proxy = Column(String, nullable=True) # Proxy principal
    proxy2 = Column(String, nullable=True) # Segunda proxy (usada na filha)
    
    # --- Financeiro ---
    total_deposito = Column(Float, default=0.0)
    total_saque = Column(Float, default=0.0)
    
    # Relacionamento reverso
    ciclo = relationship("Ciclo", back_populates="perfis")