const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { Admin } = require("../models/Admin");
const { logger } = require("../middlewares/errorHandler");

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  role: Joi.string()
    .valid("super_admin", "admin", "moderator")
    .default("admin"),
  permissions: Joi.array()
    .items(
      Joi.string().valid(
        "user_management",
        "role_management",
        "dashboard_view",
        "system_settings",
        "reports_view",
        "content_management"
      )
    )
    .default([]),
  phoneNumber: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Helper function to generate JWT token
const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register new admin
// @route   POST /api/admin/auth/register
// @access  Private (Super Admin only)
const registerAdmin = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      permissions,
      phoneNumber,
    } = value;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Set default permissions based on role
    let defaultPermissions = permissions;
    if (role === "super_admin") {
      defaultPermissions = [
        "user_management",
        "role_management",
        "dashboard_view",
        "system_settings",
        "reports_view",
        "content_management",
      ];
    } else if (role === "admin") {
      defaultPermissions = [
        "user_management",
        "dashboard_view",
        "reports_view",
      ];
    } else if (role === "moderator") {
      defaultPermissions = ["dashboard_view"];
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
      firstName,
      lastName,
      role,
      permissions: defaultPermissions,
      phoneNumber,
    });

    // Generate token
    const token = generateToken(admin._id);

    logger.info(`New admin registered: ${email}`);

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        admin,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
// @route   POST /api/admin/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { email, password } = value;

    // Find admin and include password for verification
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Check password
    const isPasswordValid = await admin.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateToken(admin._id);

    logger.info(`Admin logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/admin/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    res.status(200).json({
      success: true,
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "profilePicture",
    ];
    const updates = {};

    // Filter allowed fields
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const admin = await Admin.findByIdAndUpdate(req.admin.id, updates, {
      new: true,
      runValidators: true,
    });

    logger.info(`Admin profile updated: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/admin/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Find admin with password
    const admin = await Admin.findById(req.admin.id).select("+password");

    // Verify current password
    const isCurrentPasswordValid = await admin.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    logger.info(`Admin password changed: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getProfile,
  updateProfile,
  changePassword,
};
