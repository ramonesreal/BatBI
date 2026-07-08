// databaseService.ts
import { Client } from 'pg';

/**
 * Interface for database connection configuration.
 */
interface DbConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  name: string;
}

// 🔐 Dynamically reads process.env at call time!
/**
 * Determines the SSL configuration for the PostgreSQL client based on environment variables.
 * @returns SSL configuration object for the pg client.
 */
function getSslConfiguration(): boolean | { rejectUnauthorized: boolean } {
  const envSsl = process.env.DB_EXTERNAL_SSL;

  // If dotenv hasn't loaded yet or if it's 'self', force the object accepted by Neon
  if (!envSsl || envSsl === 'self') {
    return { rejectUnauthorized: false }; // Allows self-signed certificates for development/testing
  }

  if (envSsl === 'true') {
    return true; // Use default SSL behavior
  }

  return false; // Disable SSL
}

export const databaseService = {
  /**
   * Tests if the credentials entered by the user are valid by attempting a connection.
   * @param config Database configuration.
   * @returns True if connection is successful, false otherwise.
   */
  async testConnection(config: DbConfig): Promise<boolean> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      connectionTimeoutMillis: 5000, // Give up after 5 seconds if the database is down
      ssl: getSslConfiguration(),   // 🛡️ Active encrypted handshake
    });

    try {
      await client.connect();
      await client.end();
      return true;
    } catch (err) {
      console.error('Failed to test external connection:', err);
      return false;
    }
  },

  /**
   * Lists all public tables from the client's database.
   * @param config Database configuration.
   * @returns An array of table names.
   * @throws Error if tables cannot be mapped.
   */
  async listTables(config: DbConfig): Promise<string[]> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      ssl: getSslConfiguration(),   // 🛡️ Active encrypted handshake
    });

    try {
      await client.connect();

      // Standard Postgres query to read user's table schema
      const query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
      `;

      const result = await client.query(query);
      await client.end();

      return result.rows.map(row => row.table_name);
    } catch (err) {
      console.error('Error listing external tables:', err);
      throw new Error('Could not map database tables.');
    }
  },

  /**
   * Retrieves columns for a specific table from the client's database.
   * @param config Database configuration.
   * @param tableName The name of the table to retrieve columns from.
   * @returns An array of column names.
   * @throws Error if columns cannot be read or table name is invalid.
   */
  async getColumnsFromTable(config: DbConfig, tableName: string): Promise<string[]> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      ssl: getSslConfiguration(),   // 🛡️ Active encrypted handshake
    });

    // [SECURITY] Basic sanitization of table name to prevent structural SQL Injection for identifiers
    const identifierValidator = /^[a-zA-Z0-9_]+$/;
    if (!identifierValidator.test(tableName)) {
      throw new Error('Invalid table name.');
    }

    try {
      await client.connect();

      // Query to get column names for a specific table
      // [SECURITY] table_name is parameterized to prevent injection in the WHERE clause.
      const query = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1;
      `;

      const result = await client.query(query, [tableName]);
      await client.end();

      return result.rows.map(row => row.column_name);
    } catch (err) {
      console.error('Error reading table columns:', err);
      throw new Error('Could not read columns for the selected table.');
    }
  },

  /**
   * Executes an analytical aggregation query based on user-selected axes.
   * @param config Database configuration.
   * @param tableName The name of the table to query.
   * @param xAxis The column to group by.
   * @param yAxis The column to sum.
   * @returns An array of aggregated data with labels and values.
   * @throws Error if table or column identifiers are invalid.
   */
  async runAnalyticalQuery(
    config: DbConfig,
    tableName: string,
    xAxis: string,
    yAxis: string
  ): Promise<{ label: string; value: number }[]> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      ssl: getSslConfiguration(),   // 🛡️ Active encrypted handshake
    });

    // [SECURITY] Strict sanitization of identifiers (table and column names)
    // This regex ensures only alphanumeric characters and underscores are allowed,
    // preventing SQL Injection through identifier names.
    const identifierValidator = /^[a-zA-Z0-9_]+$/;
    if (!identifierValidator.test(tableName) || !identifierValidator.test(xAxis) || !identifierValidator.test(yAxis)) {
      throw new Error('Invalid table or column identifiers.');
    }

    try {
      await client.connect();

      // Constructs the query, grouping by X-axis and summing the Y-axis.
      // Identifiers are safely interpolated *after* validation.
      const query = `
        SELECT
          CAST("${xAxis}" AS VARCHAR) as label,
          SUM("${yAxis}") as value
        FROM "${tableName}"
        GROUP BY "${xAxis}"
        ORDER BY "${xAxis}";
      `;

      const result = await client.query(query);
      await client.end();

      return result.rows.map(row => ({
        label: String(row.label),
        value: Number(row.value)
      }));
    } catch (err) {
      console.error('Error running analytical query:', err);
      throw new Error('Could not execute analytical query.');
    }
  },
};