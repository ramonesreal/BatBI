// pdfService.ts
import puppeteer from 'puppeteer';

/**
 * Interface for data required to generate a PDF report.
 */
interface PdfData {
  title: string;
  kpis: {
    total: number;
    max: number;
    average: number;
    suffix?: string;
  };
  labels: string[];
  values: number[];
  chartImg: string; // 🚀 New property received from the front-end (Base64 image)
}

export const pdfService = {
  /**
   * Generates a dashboard report as a PDF.
   * @param data The data needed to populate the PDF report.
   * @returns A Buffer containing the generated PDF.
   */
  async generateDashboardReport(data: PdfData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // [SECURITY] See notes below.
    });

    const page = await browser.newPage();

    // Helper for number formatting within HTML
    const formatNumber = (val: number) => val.toLocaleString('en-US', { maximumFractionDigits: 2 }); // Changed to en-US for internationalization
    const prefix = data.kpis.suffix || '';

    // [SECURITY] HTML Entity Encoding: Ensure user-supplied strings are encoded to prevent XSS.
    // For `data.title` and `data.labels`, which come from user input, they should be
    // HTML-encoded before being embedded into the HTML template.
    const encodeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const encodedTitle = encodeHtml(data.title);

    // Creates the data table row structure for the report
    const tableRows = data.labels.map((label, index) => `
      <tr class="border-b border-slate-800 text-sm text-slate-300">
        <td class="py-3 px-4 text-left">${encodeHtml(label)}</td>
        <td class="py-3 px-4 text-right">${prefix} ${formatNumber(data.values[index])}</td>
      </tr>
    `).join('');

    const contentHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BatBI Report - ${encodedTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #e2e8f0; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          </style>
      </head>
      <body>
          <div class="container bg-slate-950 p-8 rounded-lg shadow-2xl">
              <div class="mb-8 text-center">
                  <h1 class="text-3xl font-bold text-white mb-2">BatBI Dashboard Report</h1>
                  <p class="text-md text-slate-400">Analysis: ${encodedTitle}</p>
                  <p class="text-xs text-slate-500">Generated on: ${new Date().toLocaleDateString('en-US')}</p>
              </div>

              <div class="grid grid-cols-3 gap-4 mb-8">
                  <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Accumulated</p>
                      <p class="text-xl font-bold text-white">${prefix} ${formatNumber(data.kpis.total)}</p>
                  </div>
                  <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Global Average</p>
                      <p class="text-xl font-bold text-white">${prefix} ${formatNumber(data.kpis.average)}</p>
                  </div>
                  <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Maximum Peak</p>
                      <p class="text-xl font-bold text-white">${prefix} ${formatNumber(data.kpis.max)}</p>
                  </div>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 shadow-xl flex justify-center">
                  <img src="${data.chartImg}" alt="Dashboard Chart" class="max-w-full h-auto"/>
              </div>

              <div class="mb-8">
                  <h2 class="text-2xl font-bold text-white mb-4">Detailed Data</h2>
                  <div class="overflow-x-auto rounded-lg border border-slate-800 shadow-lg">
                      <table class="min-w-full bg-slate-900">
                          <thead>
                              <tr class="bg-slate-800">
                                  <th class="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                                  <th class="py-3 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Value</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${tableRows}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    await page.setContent(contentHtml, { waitUntil: 'domcontentloaded' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();

    return Buffer.from(pdfUint8Array);
  }
};