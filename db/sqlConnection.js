const sql = require("mssql");

const config = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER, // e.g. passwordmanager-sql-server.database.windows.net
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Azure SQL Connected!");
    return pool;
  })
  .catch(err => {
    console.error("❌ Database Connection Failed! ", err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};
