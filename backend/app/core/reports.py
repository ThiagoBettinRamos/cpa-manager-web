from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from datetime import datetime
import io

def gerar_pdf_consolidado(lista_dados):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 150 # Posição inicial da lista

    # Estilo Dark
    p.setFillColor(HexColor("#020617"))
    p.rect(0, 0, width, height, fill=1)
    
    # Cabeçalho
    p.setStrokeColor(HexColor("#d946ef"))
    p.setLineWidth(2)
    p.line(50, height - 60, width - 50, height - 60)
    p.setFillColor(HexColor("#ffffff"))
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, height - 100, "CPA PRO - RELATÓRIO GERAL")
    
    # Cabeçalho da Tabela
    p.setFont("Helvetica-Bold", 10)
    p.setFillColor(HexColor("#94a3b8"))
    p.drawString(50, y, "USUÁRIO")
    p.drawString(180, y, "CICLOS")
    p.drawString(250, y, "LUCRO TOTAL")
    p.drawString(380, y, "MÉTRICAS (DEP|SAQ|RES)")
    p.line(50, y - 5, width - 50, y - 5)
    
    y -= 30

    # Listagem de Usuários
    for item in lista_dados:
        if y < 80: # Nova página se encher
            p.showPage()
            p.setFillColor(HexColor("#020617"))
            p.rect(0, 0, width, height, fill=1)
            y = height - 100

        p.setFillColor(HexColor("#ffffff"))
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, item['usuario'])
        
        p.setFont("Helvetica", 10)
        p.drawString(180, y, str(item['ciclos']))
        
        cor_lucro = "#10b981" if item['lucro'] >= 0 else "#f43f5e"
        p.setFillColor(HexColor(cor_lucro))
        p.drawString(250, y, f"R$ {item['lucro']:.2f}")
        
        p.setFillColor(HexColor("#cbd5e1"))
        p.setFont("Helvetica", 8)
        p.drawString(380, y, item['detalhes'])
        
        y -= 25 # Espaço entre linhas

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer