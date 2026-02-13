from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta

from app.db.session import SessionLocal
from app.models.all_models import User
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas.schemas import Token, LoginData
from app.core.config import settings

router = APIRouter()

# Configuração para extrair o token do Header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- FUNÇÃO DE DEPENDÊNCIA: RECUPERA O USUÁRIO LOGADO ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- ROTA DE LOGIN ---
@router.post("/token", response_model=Token)
def login_for_access_token(form_data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token válido por 24 horas (configurado no settings)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "username": user.username, 
        "role": user.role
    }

# --- ROTA DE REGISTRO (RESTRITA AO ADMIN SUPREMO) ---
@router.post("/register-user", status_code=status.HTTP_201_CREATED)
def register_new_user(
    new_user_data: LoginData, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Só entra se estiver logado
):
    # BLOQUEIO DE SEGURANÇA: Só o Thiago Bettin tem a chave da mansão
    if current_user.username != "thiagobettin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso Negado: Apenas o Admin Supremo pode criar novas contas."
        )

    # Verifica se o login já existe
    user_exists = db.query(User).filter(User.username == new_user_data.username).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Este nome de usuário já está em uso."
        )

    # Cria o novo usuário comum
    new_user = User(
        username=new_user_data.username,
        hashed_password=get_password_hash(new_user_data.password),
        role="user", # Os criados manualmente nunca são admin
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"msg": f"Usuário '{new_user.username}' criado com sucesso e pronto para operar."}

# --- ROTA DE VALIDAÇÃO (ÚTIL PARA O FRONTEND) ---
@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "is_active": current_user.is_active
    }