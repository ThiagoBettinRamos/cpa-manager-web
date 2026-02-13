from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CPA Manager Pro"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "ninqginabnqergniqngírngin45256"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 horas
    
    # URL do Banco (Default para localhost, mas editável via .env)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:@localhost:5432/cpa_manager"

    class Config:
        env_file = ".env"

settings = Settings()