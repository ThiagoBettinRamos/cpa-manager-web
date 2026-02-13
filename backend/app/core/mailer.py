import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.all_models import Ciclo, User
from app.core.reports import gerar_pdf_consolidado

logger = logging.getLogger("MAILER")

def enviar_relatorio_email(user_id=None):
    db = SessionLocal()
    try:
        # Se for manual (user_id), filtra. Se não, pega todos.
        query_users = db.query(User).filter(User.id == user_id) if user_id else db.query(User)
        usuarios = query_users.all()

        lista_geral = []
        sete_dias_atras = datetime.utcnow() - timedelta(days=7)

        for usuario in usuarios:
            ciclos = db.query(Ciclo).filter(Ciclo.user_id == usuario.id, Ciclo.created_at >= sete_dias_atras).all()
            
            # Só adiciona no relatório se tiver ciclo ou se for pedido manual
            if not ciclos and not user_id: continue

            t_dep = t_saq = t_res = 0
            for c in ciclos:
                for p in c.perfis:
                    t_dep += (p.total_deposito or 0)
                    t_saq += (p.total_saque or 0)
                    t_res += (p.resgate_diario or 0)

            lista_geral.append({
                "usuario": usuario.username.upper(),
                "ciclos": len(ciclos),
                "lucro": (t_saq + t_res) - t_dep,
                "detalhes": f"Dep: {t_dep:.0f} | Saq: {t_saq:.0f} | Res: {t_res:.0f}"
            })

        if not lista_geral:
            logger.info("⚠️ Nenhum dado para reportar.")
            return

        # Gera UM ÚNICO PDF com a lista de todo mundo
        pdf_buffer = gerar_pdf_consolidado(lista_geral)
        
        msg = MIMEMultipart()
        msg['Subject'] = f"📊 RELATÓRIO CONSOLIDADO CPA PRO - {datetime.now().strftime('%d/%m')}"
        msg['From'] = "botemails21@gmail.com"
        msg['To'] = "thiagobettin21@gmail.com"

        msg.attach(MIMEText("Segue o relatório consolidado de todos os operadores da rede.", 'plain'))
        
        pdf_buffer.seek(0)
        part = MIMEApplication(pdf_buffer.read(), _subtype="pdf")
        part.add_header('Content-Disposition', 'attachment', filename="Relatorio_Geral.pdf")
        msg.attach(part)

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login("botemails21@gmail.com", "dwjsjjsknolfifql")
            server.send_message(msg)
            
        logger.info("✅ E-mail consolidado enviado!")

    except Exception as e:
        logger.error(f"❌ ERRO: {str(e)}")
    finally:
        db.close()