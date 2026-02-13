from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class LoginData(BaseModel):
    username: str
    password: str

# --- Perfil ---
class PerfilBase(BaseModel):
    tipo: str
    nome_ficticio: str
    senha: str
    cpf: Optional[str] = None
    phone: Optional[str] = None
    proxy: Optional[str] = None
    proxy2: Optional[str] = None
    total_deposito: float = 0.0
    total_saque: float = 0.0
    resgate_diario: float = 0.0  # <--- ADICIONADO

class PerfilUpdate(BaseModel):
    # Todos os campos como opcionais para permitir atualização parcial
    cpf: Optional[str] = None
    phone: Optional[str] = None
    proxy: Optional[str] = None
    proxy2: Optional[str] = None
    total_deposito: Optional[float] = None
    total_saque: Optional[float] = None
    resgate_diario: Optional[float] = None  # <--- ADICIONADO

class PerfilResponse(PerfilBase):
    id: int
    class Config:
        from_attributes = True

# --- Ciclo ---
class CicloCreate(BaseModel):
    responsavel: str
    mae: PerfilBase
    filha: PerfilBase

class CicloResponse(BaseModel):
    id: int
    responsavel: str
    created_at: datetime
    # FIX: Valor padrão definido como "ativo" para evitar ResponseValidationError
    status: str = "ativo" 
    perfis: List[PerfilResponse] = []
    
    class Config:
        from_attributes = True