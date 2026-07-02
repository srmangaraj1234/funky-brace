import { jsPDF } from 'jspdf';
import { formatDate } from '../utils/formatDate.js';
import { mapStatusLabel } from '../utils/statusStyle.js';

export const generateIssueReceipt = (issue) => {
  try {
    const doc = new jsPDF();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, "F");
    
    // Header Banner
    doc.setFillColor(34, 197, 94); 
    doc.rect(0, 0, 210, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.text("FIXMYCITY CIVIC RECORD", 20, 28);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("OFFICIAL LOCAL CITIZEN DISPATCH REPORT", 20, 36);

    // Card Frame
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 55, 180, 220, 4, 4, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 55, 180, 220, 4, 4, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("REPORT DETAIL RECEIPT", 25, 70);

    doc.setDrawColor(226, 232, 240);
    doc.line(25, 75, 185, 75);

    const fields = [
      ["Report Identifier", issue.id],
      ["Civic Title", issue.title],
      ["Issue Category", issue.category],
      ["Severity Level", issue.severity.toUpperCase()],
      ["Current Location", issue.address],
      ["Reporting Date", formatDate(issue.createdAt)],
      ["Verification Status", mapStatusLabel(issue.status)],
      ["Community Upvotes", String(issue.upvotesCount)],
      ["Reporter Profile", issue.creatorName || "Anonymous Citizen"],
    ];

    let yPos = 90;
    doc.setFontSize(10);
    fields.forEach(([label, value]) => {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(label, 25, yPos);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      
      const splitText = doc.splitTextToSize(value, 110);
      doc.text(splitText, 75, yPos);
      
      yPos += Math.max(12, splitText.length * 6);
    });

    doc.save(`FixMyCity-${issue.id}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
  }
};
