from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.all_models import User
from app.core.security import get_password_hash
from app.routers import auth, dashboard

# Cria tabelas automaticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CPA Manager API")

# Configuração CORS (Crucial para React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em prod, coloque a URL do Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Auth"])
app.include_router(dashboard.router, tags=["Dashboard"])

@app.on_event("startup")
def seed_admin_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "thiagobettin").first()
        if not user:
            print("🚀 Criando Admin Supremo: thiagobettin")
            hashed_pwd = get_password_hash("Thibettin21*$")
            admin = User(username="thiagobettin", hashed_password=hashed_pwd, role="admin")
            db.add(admin)
            db.commit()
        else:
            print("✅ Admin já existe.")
    finally:
        db.close()