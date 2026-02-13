import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from typing import List
from faker import Faker

from app.db.session import SessionLocal
from app.models.all_models import Ciclo, Perfil, User
from app.schemas.schemas import CicloResponse, PerfilUpdate
from app.core.security import get_current_user

router = APIRouter()
fake = Faker('pt_BR')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- HELPERS ---
def gerar_senha_forte():
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(10))

# --- ROTAS ---

@router.get("/ciclos", response_model=List[CicloResponse])
def listar_ciclos(
    skip: int = 0, 
    limit: int = 5, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # FILTRO DE SEGURANÇA: Apenas ciclos do utilizador logado
    return db.query(Ciclo).options(joinedload(Ciclo.perfis))\
        .filter(Ciclo.user_id == current_user.id)\
        .order_by(desc(Ciclo.created_at))\
        .offset(skip).limit(limit).all()

@router.post("/ciclos", response_model=CicloResponse)
def criar_ciclo_completo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # FIX: Adicionado status="ativo" para evitar ResponseValidationError
    novo_ciclo = Ciclo(
        responsavel=current_user.username,
        user_id=current_user.id,
        status="ativo"
    )
    db.add(novo_ciclo)
    db.commit()
    db.refresh(novo_ciclo)
    
    mae = Perfil(
        ciclo_id=novo_ciclo.id,
        tipo="MAE",
        nome_ficticio=fake.name(),
        senha=gerar_senha_forte(),
        total_deposito=0.0,
        total_saque=0.0
    )
    
    filha = Perfil(
        ciclo_id=novo_ciclo.id,
        tipo="FILHA",
        nome_ficticio=fake.name(),
        senha=gerar_senha_forte(),
        total_deposito=0.0,
        total_saque=0.0
    )
    
    db.add_all([mae, filha])
    db.commit()
    
    # Busca completa com perfis carregados para o Pydantic não reclamar
    return db.query(Ciclo).options(joinedload(Ciclo.perfis)).filter(Ciclo.id == novo_ciclo.id).first()

@router.put("/perfis/{perfil_id}")
def atualizar_perfil(
    perfil_id: int, 
    dados: PerfilUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # PROTEÇÃO: Garante que o utilizador só edita perfis de ciclos que lhe pertencem
    perfil = db.query(Perfil).join(Ciclo).filter(
        Perfil.id == perfil_id, 
        Ciclo.user_id == current_user.id
    ).first()
    
    if not perfil:
        raise HTTPException(status_code=403, detail="Não autorizado a alterar este perfil.")
    
    update_data = dados.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(perfil, key, value)
    
    db.commit()
    return {"status": "success"}

@router.get("/ranking")
def obter_ranking(db: Session = Depends(get_db)):
    # Ranking global de lucro para o dashboard
    results = db.query(
        Ciclo.responsavel,
        func.sum(Perfil.total_saque - Perfil.total_deposito).label("lucro_total")
    ).join(Perfil).group_by(Ciclo.responsavel).order_by(desc("lucro_total")).limit(5).all()
    
    return [{"nome": r[0], "lucro": r[1]} for r in results]