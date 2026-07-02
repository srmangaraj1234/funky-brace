import { jsPDF } from 'jspdf';
import { formatDate } from '../../../utils/formatDate.js';

export const generatePDFReceipt = ({ lastSubmittedId, title, category, severity, address, user }) => {
  try {
    const doc = new jsPDF();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, "F");
    
    // Header Banner
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, 210, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FIXMYCITY CIVIC RECEIPT", 20, 28);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("MUNICIPAL INTAKE SYSTEM RECEIPT RECORD", 20, 36);

    // Card Body Frame
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 55, 180, 210, 4, 4, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 55, 180, 210, 4, 4, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SUBMISSION DISPATCH RECEIPT", 25, 70);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(25, 75, 185, 75);

    const items = [
      ["Submission ID", lastSubmittedId],
      ["Title of Issue", title],
      ["Assigned Category", category],
      ["Assessed Severity", severity.toUpperCase()],
      ["Identified Location", address],
      ["Reporting Date", formatDate(new Date())],
      ["Citizen Profile", user ? `${user.displayName} (${user.email})` : "Anonymous Citizen"],
      ["Platform Source", "AI Studio Hyperlocal Portal"],
      ["Status State", "Issue Raised (Pending Validation)"]
    ];

    let y = 90;
    doc.setFontSize(10);
    items.forEach(([lbl, val]) => {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(lbl, 25, y);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      
      const wrapped = doc.splitTextToSize(val, 110);
      doc.text(wrapped, 75, y);
      
      y += Math.max(12, wrapped.length * 6);
    });

    doc.line(25, 220, 185, 220);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(34, 197, 94);
    doc.text("COMMUNITY GRIEVANCE COMPLIANCE", 25, 230);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("This PDF guarantees filing. If verified, municipal crews execute repairs within 7 business days.", 25, 236);

    doc.save(`FixMyCity-Submission-${lastSubmittedId}.pdf`);
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
};
