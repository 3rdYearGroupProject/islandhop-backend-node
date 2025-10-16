const Joi = require("joi");
const { Admin } = require("../models/Admin");
const { logger } = require("../middlewares/errorHandler");

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  phoneNumber: Joi.string().optional(),
});

// @desc    Register new admin
// @route   POST /api/admin/auth/register
// @access  Public
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

    const { email, firstName, lastName, phoneNumber } = value;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Create admin
    const admin = await Admin.create({
      email,
      firstName,
      lastName,
      phoneNumber,
    });

    logger.info(`New admin registered: ${email}`);

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admins
// @route   GET /api/admin/auth/admins
// @access  Public
const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        admins,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin by ID
// @route   GET /api/admin/auth/admins/:id
// @access  Public
const getAdminById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

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
// @route   PUT /api/admin/auth/admins/:id
// @access  Public
const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "profilePicture",
      "isActive",
    ];
    const updates = {};

    // Filter allowed fields
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const admin = await Admin.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    logger.info(`Admin profile updated: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete admin
// @route   DELETE /api/admin/auth/admins/:id
// @access  Public
const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    logger.info(`Admin deleted: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
