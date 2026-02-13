import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.all_models import User
from app.core.security import get_password_hash
from app.routers import auth, dashboard

# Importação para o agendador
from app.core.mailer import enviar_relatorio_email 
from apscheduler.schedulers.background import BackgroundScheduler

# --- CONFIGURAÇÃO DE LOGS ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CPA-LOGS")

# --- BANCO DE DADOS ---
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CPA Manager API")

# --- MIDDLEWARE DE DEBUG (Para rastrear o Erro 502) ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    # Log da chegada da requisição
    logger.info(f"➡ RECEBIDO: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    logger.info(f"⬅ RESPOSTA: {request.method} {request.url.path} - Status: {response.status_code} - {process_time:.2f}ms")
    return response

# --- MIDDLEWARE CORS (Liberado para o Vercel) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AGENDADOR DE TAREFAS (CRON) ---
scheduler = BackgroundScheduler()
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
                # Certifique-se de que essa senha é a que você está digitando
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
app.include_router(auth.router, tags=["Auth"])
app.include_router(dashboard.router, tags=["Dashboard"])

# Rota de teste simples para checar o 502
@app.get("/health")
def health_check():
    return {"status": "online", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    # No Railway, o uvicorn é controlado pelo Procfile ou Start Command das Settings
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)