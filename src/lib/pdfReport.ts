import PDFDocument from 'pdfkit';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  goals: Array<{ name: string; target: number; current: number; progress: number }>;
  topTransactions: Array<{ date: string; description: string; amount: number; category: string }>;
}

export async function generateFinancialReport(data: ReportData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#1e40af').text('Financial Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#6b7280').text(data.period, { align: 'center' });
      doc.moveDown(2);

      // Summary Section
      doc.fontSize(16).fillColor('#111827').text('Summary');
      doc.moveDown(0.5);
      
      const summaryY = doc.y;
      doc.fontSize(10).fillColor('#374151');
      
      // Income box
      doc.rect(50, summaryY, 150, 80).fillAndStroke('#dcfce7', '#86efac');
      doc.fillColor('#166534').fontSize(12).text('Total Income', 60, summaryY + 15);
      doc.fillColor('#15803d').fontSize(18).text(`₪${data.totalIncome.toFixed(2)}`, 60, summaryY + 40);
      
      // Expenses box
      doc.rect(220, summaryY, 150, 80).fillAndStroke('#fee2e2', '#fca5a5');
      doc.fillColor('#991b1b').fontSize(12).text('Total Expenses', 230, summaryY + 15);
      doc.fillColor('#dc2626').fontSize(18).text(`₪${data.totalExpenses.toFixed(2)}`, 230, summaryY + 40);
      
      // Net Savings box
      doc.rect(390, summaryY, 150, 80).fillAndStroke('#dbeafe', '#93c5fd');
      doc.fillColor('#1e40af').fontSize(12).text('Net Savings', 400, summaryY + 15);
      doc.fillColor('#2563eb').fontSize(18).text(`₪${data.netSavings.toFixed(2)}`, 400, summaryY + 40);
      doc.fillColor('#6b7280').fontSize(10).text(`${data.savingsRate.toFixed(1)}% rate`, 400, summaryY + 62);
      
      doc.y = summaryY + 100;
      doc.moveDown(2);

      // Category Breakdown
      doc.fontSize(16).fillColor('#111827').text('Spending by Category');
      doc.moveDown(1);

      // Generate pie chart
      const chartCanvas = new ChartJSNodeCanvas({ width: 400, height: 300, backgroundColour: 'white' });
      const chartConfig = {
        type: 'pie' as const,
        data: {
          labels: data.categoryBreakdown.map(c => c.category),
          datasets: [{
            data: data.categoryBreakdown.map(c => c.amount),
            backgroundColor: [
              '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
              '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
            ]
          }]
        },
        options: {
          plugins: {
            legend: { position: 'right' as const }
          }
        }
      };

      const chartBuffer = await chartCanvas.renderToBuffer(chartConfig);
      doc.image(chartBuffer, 100, doc.y, { width: 400 });
      doc.moveDown(18);

      // Category table
      const tableTop = doc.y;
      doc.fontSize(10).fillColor('#374151');
      
      // Table header
      doc.rect(50, tableTop, 490, 25).fillAndStroke('#f3f4f6', '#d1d5db');
      doc.fillColor('#111827').text('Category', 60, tableTop + 8);
      doc.text('Amount', 300, tableTop + 8);
      doc.text('% of Total', 450, tableTop + 8);
      
      let currentY = tableTop + 25;
      data.categoryBreakdown.forEach((cat, idx) => {
        if (idx % 2 === 0) {
          doc.rect(50, currentY, 490, 20).fillAndStroke('#ffffff', '#e5e7eb');
        } else {
          doc.rect(50, currentY, 490, 20).fillAndStroke('#f9fafb', '#e5e7eb');
        }
        doc.fillColor('#374151').text(cat.category, 60, currentY + 5);
        doc.text(`₪${cat.amount.toFixed(2)}`, 300, currentY + 5);
        doc.text(`${cat.percentage.toFixed(1)}%`, 450, currentY + 5);
        currentY += 20;
      });

      doc.y = currentY + 20;

      // Goals Progress (if on new page)
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(16).fillColor('#111827').text('Goals Progress');
      doc.moveDown(1);

      data.goals.forEach(goal => {
        doc.fontSize(12).fillColor('#374151').text(goal.name);
        doc.fontSize(10).fillColor('#6b7280').text(`₪${goal.current.toFixed(2)} / ₪${goal.target.toFixed(2)}`);
        
        // Progress bar
        const barY = doc.y + 5;
        doc.rect(50, barY, 490, 15).fillAndStroke('#e5e7eb', '#d1d5db');
        const progressWidth = (goal.progress / 100) * 490;
        doc.rect(50, barY, progressWidth, 15).fillAndStroke('#10b981', '#059669');
        doc.fillColor('#ffffff').fontSize(9).text(`${goal.progress.toFixed(0)}%`, 50 + progressWidth / 2 - 10, barY + 3);
        
        doc.moveDown(2);
      });

      // Top Transactions
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(16).fillColor('#111827').text('Recent Transactions');
      doc.moveDown(1);

      const txTableTop = doc.y;
      doc.fontSize(9).fillColor('#374151');
      
      // Table header
      doc.rect(50, txTableTop, 490, 25).fillAndStroke('#f3f4f6', '#d1d5db');
      doc.fillColor('#111827').text('Date', 60, txTableTop + 8);
      doc.text('Description', 130, txTableTop + 8);
      doc.text('Category', 320, txTableTop + 8);
      doc.text('Amount', 450, txTableTop + 8);
      
      let txY = txTableTop + 25;
      data.topTransactions.forEach((tx, idx) => {
        if (idx % 2 === 0) {
          doc.rect(50, txY, 490, 20).fillAndStroke('#ffffff', '#e5e7eb');
        } else {
          doc.rect(50, txY, 490, 20).fillAndStroke('#f9fafb', '#e5e7eb');
        }
        doc.fillColor('#374151').text(tx.date, 60, txY + 5);
        doc.text(tx.description.substring(0, 25), 130, txY + 5);
        doc.text(tx.category, 320, txY + 5);
        const amountColor = tx.amount >= 0 ? '#10b981' : '#ef4444';
        doc.fillColor(amountColor).text(`₪${Math.abs(tx.amount).toFixed(2)}`, 450, txY + 5);
        txY += 20;
      });

      // Footer
      doc.fontSize(8).fillColor('#9ca3af')
        .text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 
          50, 770, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
