import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

function sanitize(value: unknown): unknown {
  if (typeof value === 'string' && value.startsWith('data:')) {
    return '[imagen base64]';
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  return value;
}

export class DbLogger implements TypeOrmLogger {
  logQuery(query: string, parameters?: unknown[], _qr?: QueryRunner) {
    console.log('query:', query, sanitize(parameters));
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[], _qr?: QueryRunner) {
    console.error('query error:', error, query, sanitize(parameters));
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[], _qr?: QueryRunner) {
    console.warn(`query slow (${time}ms):`, query, sanitize(parameters));
  }

  logSchemaBuild(message: string) { console.log('schema:', message); }
  logMigration(message: string)   { console.log('migration:', message); }
  log(level: 'log' | 'info' | 'warn', message: unknown) {
    if (level === 'warn') console.warn(message);
    else console.log(message);
  }
}
