import puppeteer from 'puppeteer';

interface DadosPdf {
  titulo: string;
  kpis: {
    total: number;
    maior: number;
    media: number;
    sufixo?: string;
  };
  labels: string[];
  valores: number[];
  graficoImg: string; // 🚀 Nova propriedade recebida do front-end
}

export const pdfService = {
  async gerarRelatorioDashboard(dados: DadosPdf): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Auxiliar para formatação de números dentro do HTML
    const formatar = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    const prefixo = dados.kpis.sufixo || '';

    // Criamos a estrutura de linhas da tabela de dados para o relatório
    const linhasTabela = dados.labels.map((label, index) => `
      <tr class="border-b border-slate-800 text-sm text-slate-300">
        <td class="py-3 px-4 text-left">${label}</td>
        <td class="py-3 px-4 text-right font-semibold text-white">${prefixo} ${formatar(dados.valores[index])}</td>
      </tr>
    `).join('');

    // Conteúdo HTML injetado dinamicamente com o print do Recharts integrado
    const conteudoHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Relatório BatBI</title>
      </head>
      <body class="bg-slate-950 text-slate-100 p-10 font-sans">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
          <div>
            <h1 class="text-3xl font-bold text-yellow-500 tracking-tight">BatBI <span class="text-white text-xl font-normal">v1.0</span></h1>
            <p class="text-xs text-slate-400 mt-1">Motor Analítico de Gotham — Relatório Executivo</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-white">${dados.titulo}</p>
            <p class="text-xs text-slate-500 mt-0.5">Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Acumulado Total</p>
            <p class="text-xl font-bold text-white">${prefixo} ${formatar(dados.kpis.total)}</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Média Global</p>
            <p class="text-xl font-bold text-white">${prefixo} ${formatar(dados.kpis.media)}</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pico Máximo</p>
            <p class="text-xl font-bold text-white">${prefixo} ${formatar(dados.kpis.maior)}</p>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 shadow-xl flex justify-center">
          <img src="${dados.graficoImg}" class="w-full max-h-[350px] object-contain rounded-lg" alt="Gráfico Analítico BatBI" />
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div class="bg-slate-850 px-5 py-4 border-b border-slate-800">
            <h3 class="text-sm font-bold uppercase tracking-wider text-yellow-500">Detalhamento dos Registros</h3>
          </div>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th class="py-3 px-4 text-left">Dimensão (Eixo X)</th>
                <th class="py-3 px-4 text-right">Métrica Agregada (Eixo Y)</th>
              </tr>
            </thead>
            <tbody>
              ${linhasTabela}
            </tbody>
          </table>
        </div>

        <div class="mt-12 text-center text-xs text-slate-600 border-top border-slate-900 pt-4">
          Documento confidencial gerado de forma automatizada pelo ecossistema BatBI.
        </div>

      </body>
      </html>
    `;

    await page.setContent(conteudoHtml, { waitUntil: 'domcontentloaded' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();

    return Buffer.from(pdfUint8Array);
  }
};