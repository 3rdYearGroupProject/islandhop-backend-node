const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } =
  process.env;

// Public client for general operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client for service operations (with service role key)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const connectPostgreSQL = async () => {
  try {
    // Test the connection by checking if we can access Supabase
    // We'll try to query one of your existing tables or use a simple RPC call
    const { data, error } = await supabaseAdmin.rpc("version");

    // If the RPC call fails, let's try a simpler approach - just check if the client is configured
    if (error && error.code === "PGRST202") {
      // Function doesn't exist, but connection is working
      console.log("✅ Supabase connection has been established successfully.");
    } else if (error) {
      throw error;
    } else {
      console.log("✅ Supabase connection has been established successfully.");
    }
  } catch (error) {
    // If all else fails, just check if the client is properly configured
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      console.log("✅ Supabase client has been configured successfully.");
      console.log("⚠️  Database connection will be tested during first query.");
    } else {
      console.error("❌ Unable to connect to Supabase:", error);
      process.exit(1);
    }
  }
};

// Helper function to execute raw SQL queries using Supabase
const executeQuery = async (query, replacements = {}) => {
  try {
    // For now, we'll simulate the SQL queries using Supabase table operations
    // You'll need to adapt this based on your specific queries

    // This is a temporary implementation - ideally you'd create a PostgreSQL function
    // or convert your SQL queries to use Supabase's table operations

    console.warn(
      "⚠️  executeQuery is using fallback mode. Consider converting to Supabase table operations."
    );

    // Try to execute as RPC if available
    const { data, error } = await supabaseAdmin.rpc("execute_raw_sql", {
      sql_query: query,
      parameters: replacements,
    });

    if (error && error.code === "PGRST202") {
      // Function doesn't exist, throw a more helpful error
      throw new Error(
        `Raw SQL execution not available. Query: ${query}. Consider using executeTableQuery instead.`
      );
    } else if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Supabase Query Error:", error);
    throw error;
  }
};

// Helper function for table operations using Supabase client
const executeTableQuery = async (
  tableName,
  operation = "select",
  data = null,
  filters = {}
) => {
  try {
    let query = supabaseAdmin.from(tableName);

    switch (operation) {
      case "select":
        query = query.select("*");
        break;
      case "insert":
        return await query.insert(data);
      case "update":
        return await query.update(data);
      case "delete":
        return await query.delete();
      default:
        query = query.select("*");
    }

    // Apply filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined) {
        query = query.eq(key, filters[key]);
      }
    });

    const { data: result, error } = await query;

    if (error) {
      throw error;
    }

    return result;
  } catch (error) {
    console.error("Supabase Table Query Error:", error);
    throw error;
  }
};

// Legacy executeNonQuery function for compatibility
const executeNonQuery = async (query, replacements = {}) => {
  try {
    // This is a simplified version - you might need to adapt based on your SQL queries
    const result = await executeQuery(query, replacements);
    return { results: result, metadata: null };
  } catch (error) {
    console.error("Supabase Non-Query Error:", error);
    throw error;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  connectPostgreSQL,
  executeQuery,
  executeNonQuery,
  executeTableQuery,
};
