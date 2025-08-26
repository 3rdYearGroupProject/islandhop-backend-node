import mongoose from "mongoose";

export async function connectDatabases() {
  try {
    const defaultConn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "islandhop_trips",
    });
    console.log(`✅ Connected to main DB: ${defaultConn.connection.name}`);

    const lostItemsDb = mongoose.connection.client.db("lost-items");
    console.log(`✅ Connected to additional DB: ${lostItemsDb.databaseName}`);

    return { lostItemsDb };
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
