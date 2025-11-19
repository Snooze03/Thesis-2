from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from io import BytesIO
from datetime import datetime
import re


class ProgressReportPDFExporter:
    """Service to export progress reports as PDF"""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Check if style already exists before adding
        if "ReportTitle" not in self.styles:
            self.styles.add(
                ParagraphStyle(
                    name="ReportTitle",
                    parent=self.styles["Heading1"],
                    fontSize=22,
                    textColor=colors.HexColor("#1a202c"),
                    spaceAfter=10,
                    alignment=TA_CENTER,
                )
            )

        if "SectionHeader" not in self.styles:
            self.styles.add(
                ParagraphStyle(
                    name="SectionHeader",
                    parent=self.styles["Heading2"],
                    fontSize=16,
                    textColor=colors.HexColor("#2d3748"),
                    spaceBefore=20,
                    spaceAfter=12,
                )
            )

        if "BodyText" not in self.styles:
            self.styles.add(
                ParagraphStyle(
                    name="BodyText",
                    parent=self.styles["Normal"],
                    fontSize=11,
                    leading=16,
                    alignment=TA_JUSTIFY,
                    spaceAfter=10,
                )
            )

        if "BulletPoint" not in self.styles:
            self.styles.add(
                ParagraphStyle(
                    name="BulletPoint",
                    parent=self.styles["Normal"],
                    fontSize=10,
                    leading=14,
                    leftIndent=20,
                    spaceAfter=6,
                )
            )

    def _clean_markdown(self, text):
        """Remove markdown formatting for PDF"""
        if not text:
            return ""

        # Remove bold markers
        text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
        # Remove italic markers
        text = re.sub(r"\*(.*?)\*", r"<i>\1</i>", text)
        # Remove bullet points
        text = re.sub(r"^[\-\*]\s+", "", text, flags=re.MULTILINE)

        return text

    def _create_stat_table(self, stats, color):
        """Create a formatted table for statistics"""
        data = []
        for stat in stats:
            label = stat.get("label", "")
            value = self._clean_markdown(stat.get("value", ""))
            data.append([label, value])

        table = Table(data, colWidths=[2.5 * inch, 3.5 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), color),
                    ("BACKGROUND", (1, 0), (1, -1), colors.white),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        return table

    def _parse_bullet_list(self, text):
        """Parse bullet list from text"""
        if not text:
            return []

        lines = text.strip().split("\n")
        bullets = []
        for line in lines:
            line = line.strip()
            if line.startswith("-") or line.startswith("*"):
                bullets.append(line[1:].strip())
            elif line:
                bullets.append(line)
        return bullets

    def export_report(self, report):
        """
        Export a progress report to PDF.

        Args:
            report: ProgressReport instance

        Returns:
            BytesIO: PDF file buffer
        """
        buffer = BytesIO()

        # Balanced margins - 0.75 inch on all sides
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        # Container for PDF elements
        story = []

        # Title
        title = Paragraph(f"Progress Report #{report.id}", self.styles["ReportTitle"])
        story.append(title)
        story.append(Spacer(1, 0.2 * inch))  # Reduced space after title

        # Period info
        period_text = f"<b>Period:</b> {report.period_start.strftime('%b %d')} - {report.period_end.strftime('%b %d, %Y')}"
        story.append(Paragraph(period_text, self.styles["BodyText"]))

        generated_text = (
            f"<b>Generated:</b> {report.created_at.strftime('%b %d, %Y at %I:%M %p')}"
        )
        story.append(Paragraph(generated_text, self.styles["BodyText"]))
        story.append(Spacer(1, 0.3 * inch))

        # Progress Summary Section
        if report.progress_summary:
            story.append(Paragraph("Progress Summary", self.styles["SectionHeader"]))
            summary_text = self._clean_markdown(report.progress_summary)
            story.append(Paragraph(summary_text, self.styles["BodyText"]))
            story.append(Spacer(1, 0.2 * inch))

        # Workout Section
        if report.workout_feedback:
            # Keep section together with KeepTogether
            workout_section = []
            workout_section.append(
                Paragraph("Workout Feedback", self.styles["SectionHeader"])
            )
            workout_text = self._clean_markdown(report.workout_feedback)
            workout_section.append(Paragraph(workout_text, self.styles["BodyText"]))
            workout_section.append(Spacer(1, 0.15 * inch))

            # Workout stats table
            workout_stats = [
                {
                    "label": "Current Frequency",
                    "value": report.workout_frequency or "N/A",
                },
                {
                    "label": "Average Duration",
                    "value": report.workout_duration or "N/A",
                },
            ]
            workout_section.append(
                self._create_stat_table(workout_stats, colors.HexColor("#fed7aa"))
            )

            story.append(KeepTogether(workout_section))
            story.append(Spacer(1, 0.15 * inch))

            # Workout recommendations - Keep together with header
            if report.workout_recommendations:
                recommendations_section = []
                recommendations_section.append(
                    Paragraph("<b>Recommendations:</b>", self.styles["BodyText"])
                )
                recommendations = self._parse_bullet_list(
                    report.workout_recommendations
                )
                for rec in recommendations:
                    rec_text = f"• {self._clean_markdown(rec)}"
                    recommendations_section.append(
                        Paragraph(rec_text, self.styles["BulletPoint"])
                    )

                story.append(KeepTogether(recommendations_section))
            story.append(Spacer(1, 0.25 * inch))

        # Nutrition Section
        if report.nutrition_feedback:
            # Keep section together
            nutrition_section = []
            nutrition_section.append(
                Paragraph("Nutrition Feedback", self.styles["SectionHeader"])
            )
            nutrition_text = self._clean_markdown(report.nutrition_feedback)
            nutrition_section.append(Paragraph(nutrition_text, self.styles["BodyText"]))
            nutrition_section.append(Spacer(1, 0.15 * inch))

            # Nutrition stats table
            nutrition_stats = [
                {"label": "Adherence", "value": report.nutrition_adherence or "N/A"},
                {"label": "Average Intake", "value": report.nutrition_intake or "N/A"},
            ]
            nutrition_section.append(
                self._create_stat_table(nutrition_stats, colors.HexColor("#bae6fd"))
            )

            story.append(KeepTogether(nutrition_section))
            story.append(Spacer(1, 0.15 * inch))

            # Nutrition recommendations - Keep together with header
            if report.nutrition_recommendations:
                recommendations_section = []
                recommendations_section.append(
                    Paragraph("<b>Recommendations:</b>", self.styles["BodyText"])
                )
                recommendations = self._parse_bullet_list(
                    report.nutrition_recommendations
                )
                for rec in recommendations:
                    rec_text = f"• {self._clean_markdown(rec)}"
                    recommendations_section.append(
                        Paragraph(rec_text, self.styles["BulletPoint"])
                    )

                story.append(KeepTogether(recommendations_section))
            story.append(Spacer(1, 0.25 * inch))

        # Key Takeaways - Keep together
        if report.key_takeaways:
            takeaways_section = []
            takeaways_section.append(
                Paragraph("Key Takeaways", self.styles["SectionHeader"])
            )
            takeaways = self._parse_bullet_list(report.key_takeaways)
            for takeaway in takeaways:
                takeaway_text = f"• {self._clean_markdown(takeaway)}"
                takeaways_section.append(
                    Paragraph(takeaway_text, self.styles["BulletPoint"])
                )

            story.append(KeepTogether(takeaways_section))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
