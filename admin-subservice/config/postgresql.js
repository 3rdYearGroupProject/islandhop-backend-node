const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USERNAME,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl:
        process.env.PG_SSL === "true"
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  }
);

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error);
    process.exit(1);
  }
};

// Helper function to execute raw SQL queries
const executeQuery = async (query, replacements = {}) => {
  try {
    const [results, metadata] = await sequelize.query(query, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    });
    return results;
  } catch (error) {
    console.error("SQL Query Error:", error);
    throw error;
  }
};

// Helper function for non-SELECT queries (INSERT, UPDATE, DELETE)
const executeNonQuery = async (query, replacements = {}) => {
  try {
    const [results, metadata] = await sequelize.query(query, {
      replacements,
    });
    return { results, metadata };
  } catch (error) {
    console.error("SQL Query Error:", error);
    throw error;
  }
};

// Graceful close on app termination
process.on("SIGINT", async () => {
  await sequelize.close();
  console.log("🔌 PostgreSQL connection closed due to app termination");
});

module.exports = {
  sequelize,
  connectPostgreSQL,
  executeQuery,
  executeNonQuery,
};
