import { Client } from 'pg';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  name: string;
}

// 🔐 Lê o process.env dinamicamente no momento da chamada!
function obterConfiguracaoSSL() {
  const envSsl = process.env.DB_EXTERNAL_SSL;

  // Se o dotenv ainda não carregou ou se for 'self', força o objeto aceito pelo Neon
  if (!envSsl || envSsl === 'self') {
    return { rejectUnauthorized: false };
  }
  
  if (envSsl === 'true') {
    return true;
  }

  return false; 
}

export const databaseService = {
  // 🔌 Testar se as credenciais digitadas pelo usuário são válidas
  async testarConexao(config: DbConfig): Promise<boolean> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      connectionTimeoutMillis: 5000, // Desiste após 5 segundos se o banco estiver fora
      ssl: obterConfiguracaoSSL(),   // 🛡️ Handshake Criptografado ativo
    });

    try {
      await client.connect();
      await client.end();
      return true;
    } catch (err) {
      console.error('Falha ao testar conexão externa:', err);
      return false;
    }
  },

  // 📑 Listar todas as tabelas públicas do banco do cliente
  async listarTabelas(config: DbConfig): Promise<string[]> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      ssl: obterConfiguracaoSSL(),   // 🛡️ Handshake Criptografado ativo
    });

    try {
      await client.connect();

      // Query padrão do Postgres para ler o esquema de tabelas do usuário
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
      `;

      const resultado = await client.query(query);
      await client.end();

      return resultado.rows.map(row => row.table_name);
    } catch (err) {
      console.error('Erro ao listar tabelas externas:', err);
      throw new Error('Não foi possível mapear as tabelas do banco de dados.');
    }
  },

  // 🔍 Buscar os cabeçalhos (colunas) e tipos de uma tabela específica
  async obterColunasTabela(config: DbConfig, tabela: string): Promise<string[]> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      ssl: obterConfiguracaoSSL(),   // 🛡️ Handshake Criptografado ativo
    });

    try {
      await client.connect();

      // Query para buscar o nome de todas as colunas de uma tabela específica
      const query = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1;
      `;

      const resultado = await client.query(query, [tabela]);
      await client.end();

      return resultado.rows.map(row => row.column_name);
    } catch (err) {
      console.error(`Erro ao mapear colunas da tabela ${tabela}:`, err);
      throw new Error('Não foi possível ler as colunas da tabela selecionada.');
    }
  },

  // 📊 Executar agregação analítica baseada nos eixos selecionados pelo usuário
  async rodarQueryAnalitica(
    config: DbConfig,
    tabela: string,
    eixoX: string,
    eixoY: string
  ): Promise<{ label: string; valor: number }[]> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      ssl: obterConfiguracaoSSL(),   // 🛡️ Handshake Criptografado ativo
    });

    // Sanitização básica de identificadores para prevenir SQL Injection estrutural
    const regexValidador = /^[a-zA-Z0-9_]+$/;
    if (!regexValidador.test(tabela) || !regexValidador.test(eixoX) || !regexValidador.test(eixoY)) {
      throw new Error('Identificadores de tabela ou colunas inválidos.');
    }

    try {
      await client.connect();

      // Monta a query agrupando pelo eixo X e somando o eixo Y
      const query = `
        SELECT 
          CAST("${eixoX}" AS VARCHAR) as label,
          COALESCE(SUM(CAST("${eixoY}" AS NUMERIC)), 0) as valor
        FROM "${tabela}"
        GROUP BY "${eixoX}"
        ORDER BY valor DESC
        LIMIT 50;
      `;

      const resultado = await client.query(query);
      await client.end();

      return resultado.rows.map(row => ({
        label: row.label,
        valor: Number(row.valor)
      }));
    } catch (err: any) {
      console.error('Erro ao executar query analítica no banco:', err);
      throw new Error(`Falha na execução analítica: ${err.message}`);
    }
  }
};