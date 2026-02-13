import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# O Railway injeta a DATABASE_URL automaticamente. 
# Se não existir (rodando local), ele usa o seu banco de 64bits.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:sua_senha_local@localhost:5432/seu_banco_local"
)

# Fix para o Railway/Heroku (algumas versões exigem postgresql:// ao invés de postgres://)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)