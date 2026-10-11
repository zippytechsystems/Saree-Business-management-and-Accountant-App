import * as mysql from './mysql.js';

export const isMysqlConfigured = () => mysql.isMySQLConfigured();
export const getMysqlPool = () => mysql.getPool();
export const testMysqlConnection = async () => {
  const res = await mysql.testMySQLConnection();
  return {
    ...res,
    message: res.connected ? 'Connected to Hostinger MySQL successfully' : (res.error || 'Failed to connect'),
  };
};
export const query = (sql, params = []) => mysql.query(sql, params);
export const execute = (sql, params = []) => mysql.execute(sql, params);
export const withTransaction = (callback) => mysql.withTransaction(callback);
export const initMysqlSchema = () => mysql.initMySQLSchema();
export const getMysqlDatabaseStatus = () => mysql.getMySQLStatus();

export default {
  isMysqlConfigured,
  getMysqlPool,
  testMysqlConnection,
  query,
  execute,
  withTransaction,
  initMysqlSchema,
  getMysqlDatabaseStatus,
};

