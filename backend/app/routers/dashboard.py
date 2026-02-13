import random
import string
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from typing import List
from faker import Faker
from datetime import datetime, timedelta

from app.db.session import SessionLocal
from app.models.all_models import Ciclo, Perfil, User
from app.schemas.schemas import CicloResponse, PerfilUpdate
from app.core.security import get_current_user

# --- CORREÇÃO IMPORTANTE: Importa do novo arquivo mailer para evitar loop ---
from app.core.mailer import enviar_relatorio_email

# Configuração de Logs para monitoramento no terminal
logger = logging.getLogger("DASHBOARD_ROUTER")
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
    logger.info(f"🔍 Listando ciclos para: {current_user.username}")
    try:
        return db.query(Ciclo).options(joinedload(Ciclo.perfis))\
            .filter(Ciclo.user_id == current_user.id)\
            .order_by(desc(Ciclo.created_at))\
            .offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"❌ Erro ao listar ciclos: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar dados no banco.")

@router.post("/ciclos", response_model=CicloResponse)
def criar_ciclo_completo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"➕ Criando novo ciclo para: {current_user.username}")
    try:
        novo_ciclo = Ciclo(
            responsavel=current_user.username,
            user_id=current_user.id,
            status="ativo"
        )
        db.add(novo_ciclo)
        db.commit()
        db.refresh(novo_ciclo)
        
        # Criação dos perfis MÃE e FILHA com resgate_diario inicializado
        mae = Perfil(
            ciclo_id=novo_ciclo.id, tipo="MAE",
            nome_ficticio=fake.name(), senha=gerar_senha_forte(),
            total_deposito=0.0, total_saque=0.0, resgate_diario=0.0
        )
        
        filha = Perfil(
            ciclo_id=novo_ciclo.id, tipo="FILHA",
            nome_ficticio=fake.name(), senha=gerar_senha_forte(),
            total_deposito=0.0, total_saque=0.0, resgate_diario=0.0
        )
        
        db.add_all([mae, filha])
        db.commit()
        logger.info(f"✅ Ciclo #{novo_ciclo.id} criado com sucesso.")
        
        return db.query(Ciclo).options(joinedload(Ciclo.perfis)).filter(Ciclo.id == novo_ciclo.id).first()
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao criar ciclo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na criação: {str(e)}")

@router.put("/perfis/{perfil_id}")
def atualizar_perfil(
    perfil_id: int, 
    dados: PerfilUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"📝 Atualizando perfil ID: {perfil_id}")
    perfil = db.query(Perfil).join(Ciclo).filter(
        Perfil.id == perfil_id, 
        Ciclo.user_id == current_user.id
    ).first()
    
    if not perfil:
        logger.warning(f"⚠️ Perfil {perfil_id} não encontrado ou acesso negado.")
        raise HTTPException(status_code=403, detail="Não autorizado.")
    
    try:
        update_data = dados.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(perfil, key, value)
        
        db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao salvar alteração.")

@router.get("/ranking")
def obter_ranking(db: Session = Depends(get_db)):
    try:
        # Cálculo de lucro considerando Saques + Resgates - Depósitos
        results = db.query(
            Ciclo.responsavel,
            func.sum((Perfil.total_saque + Perfil.resgate_diario) - Perfil.total_deposito).label("lucro_total")
        ).join(Perfil).group_by(Ciclo.responsavel).order_by(desc("lucro_total")).limit(5).all()
        
        return [{"nome": r[0], "lucro": r[1] or 0.0} for r in results]
    except Exception as e:
        logger.error(f"❌ Erro ao gerar ranking: {str(e)}")
        return []

@router.get("/relatorio-semanal")
def relatorio_semanal(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"📊 Relatório solicitado via Dashboard por: {current_user.username}")
    try:
        # Dispara a função modularizada do mailer.py (passando o ID do usuário para relatório específico)
        enviar_relatorio_email(user_id=current_user.id)
        
        return {
            "status": "success",
            "message": "Relatório enviado com sucesso para o seu e-mail!"
        }
    except Exception as e:
        logger.error(f"❌ Erro no disparo do relatório: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao enviar e-mail.")
    
@router.get("/relatorio-geral-admin")
def relatorio_geral_admin(current_user: User = Depends(get_current_user)):
    # Segurança: Apenas o seu usuário admin pode disparar o geral
    if current_user.username != "thiagobettin":
        logger.warning(f"🚫 Tentativa de acesso não autorizado ao relatório geral: {current_user.username}")
        raise HTTPException(status_code=403, detail="Acesso restrito ao Administrador.")

    logger.info("📢 Disparando Relatório Geral de TODOS os usuários via Admin")
    try:
        # Chamada sem user_id percorre todos os usuários no mailer.py
        enviar_relatorio_email() 
        return {"status": "success", "message": "Relatórios de todos os usuários enviados!"}
    except Exception as e:
        logger.error(f"❌ Erro no disparo geral: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar relatórios gerais.")