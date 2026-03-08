const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "autodb",
  password: "saif12345",
  port: 5432
});

module.exports = pool;