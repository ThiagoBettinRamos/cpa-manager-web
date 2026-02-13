import logging
from app.db.session import SessionLocal
from app.models.all_models import User, Ciclo
from app.core.mailer import enviar_relatorio_email

# Configuração básica de log para vermos o progresso no terminal
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DISPARO-MANUAL")

def rodar_disparo_total():
    logger.info("🚀 Iniciando disparo manual de relatórios para TODOS os usuários...")
    
    db = SessionLocal()
    try:
        # Busca todos os usuários que possuem ciclos cadastrados
        usuarios = db.query(User).all()
        total_users = len(usuarios)
        
        logger.info(f"📊 Encontrados {total_users} usuários no banco de dados.")
        
        # Chama a função do mailer sem passar ID (o que faz ela rodar o loop geral)
        enviar_relatorio_email()
        
        logger.info("✅ Processo de disparo finalizado com sucesso!")
        
    except Exception as e:
        logger.error(f"❌ Falha crítica no disparo manual: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    rodar_disparo_total()