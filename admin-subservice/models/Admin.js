const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profilePicture: {
      type: String,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
adminSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method to update last login
adminSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  return await this.save();
};

// Static method to find active admins
adminSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = { Admin };
