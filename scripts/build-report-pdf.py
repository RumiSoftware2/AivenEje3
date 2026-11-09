from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs' / 'INFORME_EJE3.md'
OUTPUT = ROOT / 'output' / 'pdf' / 'Informe_Academico_Pay_Services.pdf'
NAVY = colors.HexColor('#102E46')
TEAL = colors.HexColor('#28A99C')
INK = colors.HexColor('#263B49')
MUTED = colors.HexColor('#74838D')
PALE = colors.HexColor('#F0F6F5')


def clean_text(value):
    return value.replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', '-')


def markup(value):
    value = clean_text(value.strip())
    value = escape(value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', value)
    value = re.sub(r'`([^`]+)`', r'<font name="Courier" size="8">\1</font>', value)
    value = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<link href="\2" color="#208D83">\1</link>', value)
    value = value.replace('·', ' | ')
    return value


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyES', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.2,
                          leading=13.2, textColor=INK, spaceAfter=6, alignment=TA_LEFT))
styles.add(ParagraphStyle(name='SectionES', parent=styles['Heading2'], fontName='Helvetica-Bold',
                          fontSize=15, leading=19, textColor=NAVY, spaceBefore=13, spaceAfter=8,
                          keepWithNext=True))
styles.add(ParagraphStyle(name='SubsectionES', parent=styles['Heading3'], fontName='Helvetica-Bold',
                          fontSize=11, leading=14, textColor=TEAL, spaceBefore=10, spaceAfter=5,
                          keepWithNext=True))
styles.add(ParagraphStyle(name='CalloutES', parent=styles['BodyES'], backColor=PALE, borderColor=TEAL,
                          borderWidth=0, borderPadding=8, leftIndent=7, rightIndent=5, spaceBefore=5,
                          spaceAfter=10, textColor=NAVY))
styles.add(ParagraphStyle(name='BulletES', parent=styles['BodyES'], leftIndent=14, firstLineIndent=-9,
                          bulletIndent=0, spaceAfter=2))
styles.add(ParagraphStyle(name='TableHeadES', parent=styles['BodyES'], fontName='Helvetica-Bold',
                          fontSize=8, leading=10, textColor=colors.white, spaceAfter=0))
styles.add(ParagraphStyle(name='TableCellES', parent=styles['BodyES'], fontSize=8, leading=10,
                          spaceAfter=0))
styles.add(ParagraphStyle(name='CoverKicker', fontName='Helvetica-Bold', fontSize=9, leading=13,
                          tracking=1.4, textColor=TEAL, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name='CoverTitle', fontName='Helvetica-Bold', fontSize=32, leading=36,
                          textColor=NAVY, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name='CoverSubtitle', fontName='Helvetica', fontSize=12, leading=18,
                          textColor=MUTED, alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name='CoverInfo', fontName='Helvetica', fontSize=10, leading=16,
                          textColor=INK, alignment=TA_CENTER, spaceAfter=0))


def on_body_page(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setFillColor(TEAL)
    canvas.rect(0, height - 0.12 * inch, width, 0.12 * inch, stroke=0, fill=1)
    canvas.setFont('Helvetica-Bold', 7.5)
    canvas.setFillColor(NAVY)
    canvas.drawString(doc.leftMargin, height - 0.38 * inch, 'PAY SERVICES  |  INFORME ACADÉMICO')
    canvas.setStrokeColor(colors.HexColor('#E5EBED'))
    canvas.line(doc.leftMargin, 0.48 * inch, width - doc.rightMargin, 0.48 * inch)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 0.31 * inch, 'Gestión de Bases de Datos  |  Areandina')
    canvas.drawRightString(width - doc.rightMargin, 0.31 * inch, str(doc.page - 1))
    canvas.restoreState()


def on_cover(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 0.25 * inch, width, 0.25 * inch, stroke=0, fill=1)
    canvas.setFillColor(TEAL)
    canvas.rect(0, height - 0.25 * inch, width * 0.26, 0.25 * inch, stroke=0, fill=1)
    canvas.restoreState()


class AcademicDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=letter, leftMargin=0.76 * inch, rightMargin=0.76 * inch,
                         topMargin=0.66 * inch, bottomMargin=0.67 * inch,
                         title='Pay Services - Informe académico Eje 3',
                         author='Fundación Universitaria del Área Andina')
        body = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id='body',
                     leftPadding=0, rightPadding=0, topPadding=0.08 * inch, bottomPadding=0)
        cover = Frame(0.85 * inch, 0.85 * inch, letter[0] - 1.7 * inch, letter[1] - 1.7 * inch,
                      id='cover', leftPadding=0, rightPadding=0, topPadding=0.25 * inch, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id='Cover', frames=[cover], onPage=on_cover),
            PageTemplate(id='Body', frames=[body], onPage=on_body_page)
        ])


def parse_body(lines):
    story = []
    paragraph = []
    table_rows = []

    def flush_paragraph():
        if paragraph:
            raw = ' '.join(part.strip() for part in paragraph)
            story.append(Paragraph(markup(raw), styles['BodyES']))
            paragraph.clear()

    def flush_table():
        if not table_rows:
            return
        data = []
        for row_index, row in enumerate(table_rows):
            cells = [cell.strip() for cell in row.strip().strip('|').split('|')]
            if all(re.fullmatch(r':?-{3,}:?', cell) for cell in cells):
                continue
            style = 'TableHeadES' if row_index == 0 else 'TableCellES'
            data.append([Paragraph(markup(cell), styles[style]) for cell in cells])
        if data:
            widths = [0.30 * inch, 1.58 * inch, 2.65 * inch, 1.17 * inch]
            if len(data[0]) != len(widths):
                widths = [None] * len(data[0])
            table = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), NAVY),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#E0E8EA')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(table)
            story.append(Spacer(1, 8))
        table_rows.clear()

    for raw in lines:
        line = raw.rstrip()
        if line.startswith('|'):
            flush_paragraph()
            table_rows.append(line)
            continue
        flush_table()
        if not line.strip() or line.strip() == '---':
            flush_paragraph()
            continue
        if line.startswith('## '):
            flush_paragraph()
            story.append(Paragraph(markup(line[3:]), styles['SectionES']))
        elif line.startswith('### '):
            flush_paragraph()
            story.append(Paragraph(markup(line[4:]), styles['SubsectionES']))
        elif line.startswith('> '):
            flush_paragraph()
            story.append(Paragraph(markup(line[2:]), styles['CalloutES']))
        elif line.startswith('- '):
            flush_paragraph()
            story.append(Paragraph(markup(line[2:]), styles['BulletES'], bulletText='•'))
        else:
            paragraph.append(line)
    flush_table()
    flush_paragraph()
    return story


def main():
    source = SOURCE.read_text(encoding='utf-8')
    lines = source.splitlines()
    start = next(index for index, line in enumerate(lines) if line.startswith('## 1. Introducción'))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    story = [Spacer(1, 0.7 * inch),
             Paragraph('ESPACIO RESERVADO', styles['CoverKicker']),
             Table([[Paragraph('Insertar aquí el logo oficial de Areandina', styles['CoverInfo'])]],
                   colWidths=[2.75 * inch], rowHeights=[0.72 * inch], hAlign='CENTER',
                   style=TableStyle([('BOX', (0, 0), (-1, -1), 0.8, TEAL),
                                     ('BACKGROUND', (0, 0), (-1, -1), PALE),
                                     ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                     ('LEFTPADDING', (0, 0), (-1, -1), 12),
                                     ('RIGHTPADDING', (0, 0), (-1, -1), 12)])),
             Spacer(1, 0.55 * inch),
             Paragraph('PAY SERVICES', styles['CoverTitle']),
             Paragraph('Actividad Evaluativa Eje 3<br/>Desarrollo de aplicación', styles['CoverSubtitle']),
             Spacer(1, 0.12 * inch),
             Paragraph('<b>Fundación Universitaria del Área Andina</b><br/>Gestión de Bases de Datos<br/>'
                       'Docente: Yashin Alberto Rueda Matos<br/><br/>'
                       '<b>Integrantes</b><br/>Santiago | Sebastian | Wilmer Dávila Ríos<br/><br/>'
                       '9 de noviembre de 2026', styles['CoverInfo']),
             NextPageTemplate('Body'), PageBreak()]
    story.extend(parse_body(lines[start:]))
    AcademicDoc(str(OUTPUT)).build(story)
    print(f'PDF generado: {OUTPUT}')


if __name__ == '__main__':
    main()
