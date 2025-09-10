import mongoose from 'mongoose';

const lostItemsSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    description: { type: String, required: true },
    email: { type: String, required: true },
    lostDate: { type: Date, required: true },
    tripId: { type: String, required: true },
    status: { type: String, default: "not found" }, // Default status
    progressNotes: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
    }, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create a separate mongoose connection for the lost-items database
const createLostItemModel = () => {
    // Create a new connection specifically for the lost-items database
    const lostItemsConnection = mongoose.createConnection(process.env.MONGODB_URI, {
        dbName: "lost-items"
    });
    
    return lostItemsConnection.model('LostItem', lostItemsSchema, 'lost-items-log');
};

export { lostItemsSchema, createLostItemModel };