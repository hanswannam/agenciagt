"""PDF generation for commercial proposals using reportlab."""
from __future__ import annotations

import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

INNOVAGRAF_ORANGE = colors.HexColor("#FF4F00")
INNOVAGRAF_DARK = colors.HexColor("#0B0F19")
GRAY_BG = colors.HexColor("#F4F4F5")
TEXT_MUTED = colors.HexColor("#52525B")


def _styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("title", parent=base["Title"], fontSize=24, leading=28,
                                textColor=INNOVAGRAF_DARK, fontName="Helvetica-Bold"),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontSize=14, leading=18,
                             textColor=INNOVAGRAF_DARK, fontName="Helvetica-Bold",
                             spaceBefore=14, spaceAfter=6),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontSize=10.5, leading=15,
                               textColor=colors.HexColor("#1F2937")),
        "muted": ParagraphStyle("muted", parent=base["BodyText"], fontSize=9, leading=12,
                                textColor=TEXT_MUTED),
        "label": ParagraphStyle("label", parent=base["BodyText"], fontSize=8, leading=10,
                                textColor=INNOVAGRAF_ORANGE, fontName="Helvetica-Bold"),
    }
    return styles


def build_proposal_pdf(proposal: dict, lead: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=LETTER,
                            leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm,
                            title=proposal.get("title", "Propuesta"))
    s = _styles()
    story = []

    # Header band
    header_data = [[
        Paragraph("INNOVAGRAF<br/><font color='#FF4F00'>GROWTH SYSTEM</font>", s["title"]),
        Paragraph(
            f"Propuesta Comercial<br/><font color='#52525B' size='9'>"
            f"{datetime.utcnow().strftime('%d %b %Y')}</font>",
            s["body"]
        ),
    ]]
    t = Table(header_data, colWidths=[10 * cm, 7 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LINEBELOW", (0, 0), (-1, -1), 2, INNOVAGRAF_ORANGE),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    # Client block
    story.append(Paragraph("PREPARADO PARA", s["label"]))
    story.append(Paragraph(
        f"<b>{lead.get('company_name','')}</b><br/>{lead.get('contact_name','')}<br/>"
        f"{lead.get('contact_email','')}",
        s["body"]
    ))
    story.append(Spacer(1, 0.4 * cm))

    # Title + summary
    story.append(Paragraph(proposal.get("title", "Propuesta"), s["h2"]))
    if proposal.get("summary"):
        story.append(Paragraph(proposal["summary"], s["body"]))
    story.append(Spacer(1, 0.3 * cm))

    # Scope
    if proposal.get("scope"):
        story.append(Paragraph("Alcance", s["h2"]))
        story.append(Paragraph(proposal["scope"], s["body"]))

    # Objectives
    objectives = proposal.get("objectives") or []
    if objectives:
        story.append(Paragraph("Objetivos", s["h2"]))
        for o in objectives:
            story.append(Paragraph(f"• {o}", s["body"]))

    # Items table
    items = proposal.get("items") or []
    if items:
        story.append(Paragraph("Detalle de Servicios", s["h2"]))
        data = [["Servicio", "Descripción", "Cant.", "Precio U.", "Total"]]
        for it in items:
            data.append([
                it.get("name", ""),
                Paragraph(it.get("description", "") or "", s["muted"]),
                f"{it.get('quantity', 1)}",
                f"${it.get('unit_price', 0):,.2f}",
                f"${it.get('total', 0):,.2f}",
            ])
        tbl = Table(data, colWidths=[3.5 * cm, 6.5 * cm, 1.5 * cm, 2.5 * cm, 2.5 * cm])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INNOVAGRAF_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRAY_BG]),
            ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW", (0, 0), (-1, 0), 1, INNOVAGRAF_ORANGE),
        ]))
        story.append(tbl)

        # totals
        subtotal = proposal.get("subtotal", 0)
        tax = proposal.get("tax", 0)
        total = proposal.get("total", 0)
        currency = proposal.get("currency", "USD")
        totals_tbl = Table([
            ["Subtotal", f"{currency} ${subtotal:,.2f}"],
            [f"Impuestos ({proposal.get('tax_rate', 0) * 100:.0f}%)", f"{currency} ${tax:,.2f}"],
            ["Total", f"{currency} ${total:,.2f}"],
        ], colWidths=[13.5 * cm, 3 * cm])
        totals_tbl.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 2), (-1, 2), INNOVAGRAF_ORANGE),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("LINEABOVE", (0, 2), (-1, 2), 1, INNOVAGRAF_DARK),
        ]))
        story.append(Spacer(1, 0.3 * cm))
        story.append(totals_tbl)

    # Phases
    phases = proposal.get("phases") or []
    if phases:
        story.append(PageBreak())
        story.append(Paragraph("Cronograma del Proyecto", s["h2"]))
        data = [["Fase", "Duración", "Entregables"]]
        for p in phases:
            deliverables = "<br/>".join(f"• {d}" for d in (p.get("deliverables") or []))
            data.append([
                Paragraph(f"<b>{p.get('name', '')}</b>", s["body"]),
                f"{p.get('duration_weeks', 0)} sem",
                Paragraph(deliverables, s["muted"]),
            ])
        tbl = Table(data, colWidths=[4.5 * cm, 2.5 * cm, 9.5 * cm])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INNOVAGRAF_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRAY_BG]),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(tbl)

    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph(
        "Esta propuesta tiene validez de 30 días. Innovagraf S.A. — Guatemala.",
        s["muted"]
    ))

    doc.build(story)
    return buf.getvalue()
