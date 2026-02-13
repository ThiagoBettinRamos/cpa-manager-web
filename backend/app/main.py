import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.all_models import User
from app.core.security import get_password_hash
from app.routers import auth, dashboard

# IMPORTANTE: Importamos do mailer.py para evitar que o main dependa do dashboard e vice-versa
from app.core.mailer import enviar_relatorio_email 
from apscheduler.schedulers.background import BackgroundScheduler

# --- CONFIGURAÇÃO DE LOGS ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CPA-LOGS")

# --- BANCO DE DADOS ---
# Cria as tabelas e colunas (incluindo resgate_diario se estiver no model)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CPA Manager API")

# --- MIDDLEWARE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AGENDADOR DE TAREFAS (CRON) ---
scheduler = BackgroundScheduler()
# Agendado para rodar toda Sexta-feira às 18:00
# Ele vai percorrer todos os usuários e enviar os e-mails automaticamente
scheduler.add_job(enviar_relatorio_email, 'cron', day_of_week='fri', hour=18, minute=0)

@app.on_event("startup")
def on_startup():
    # 1. Inicia o Agendador de Relatórios
    if not scheduler.running:
        scheduler.start()
        logger.info("⏰ Agendador de relatórios ativo (Sexta-feira às 18h).")
    
    # 2. Seed do Usuário Admin
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "thiagobettin").first()
        if not user:
            logger.info("🚀 Criando Admin Supremo: thiagobettin")
            admin = User(
                username="thiagobettin", 
                hashed_password=get_password_hash("Thibettin21*$"), 
                role="admin"
            )
            db.add(admin)
            db.commit()
            logger.info("✅ Admin criado com sucesso.")
        else:
            logger.info("✅ Usuário thiagobettin já validado no banco.")
    except Exception as e:
        logger.error(f"❌ Erro no startup do banco: {e}")
    finally:
        db.close()

# --- ROTAS DA API ---
# Sem prefixos para manter compatibilidade direta com o seu Frontend atual
app.include_router(auth.router, tags=["Auth"])
app.include_router(dashboard.router, tags=["Dashboard"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)