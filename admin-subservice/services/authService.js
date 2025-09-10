const { Admin } = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

class AuthService {
  /**
   * Generate JWT token
   * @param {string} adminId
   * @returns {string} JWT token
   */
  static generateToken(adminId) {
    return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   * @param {string} token
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  /**
   * Hash password
   * @param {string} password
   * @returns {string} Hashed password
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  /**
   * Compare password
   * @param {string} password
   * @param {string} hashedPassword
   * @returns {boolean} Password match result
   */
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Create admin user
   * @param {Object} adminData
   * @returns {Object} Created admin
   */
  static async createAdmin(adminData) {
    const admin = new Admin(adminData);
    return await admin.save();
  }

  /**
   * Find admin by email
   * @param {string} email
   * @returns {Object|null} Admin user
   */
  static async findAdminByEmail(email) {
    return await Admin.findOne({ email });
  }

  /**
   * Find admin by ID
   * @param {string} id
   * @returns {Object|null} Admin user
   */
  static async findAdminById(id) {
    return await Admin.findById(id);
  }

  /**
   * Update admin last login
   * @param {string} adminId
   * @returns {Object} Updated admin
   */
  static async updateLastLogin(adminId) {
    return await Admin.findByIdAndUpdate(
      adminId,
      { lastLogin: new Date() },
      { new: true }
    );
  }

  /**
   * Check if admin has permission
   * @param {Object} admin
   * @param {string} permission
   * @returns {boolean} Permission check result
   */
  static hasPermission(admin, permission) {
    // Super admin has all permissions
    if (admin.role === "super_admin") {
      return true;
    }

    return admin.permissions.includes(permission);
  }

  /**
   * Get default permissions by role
   * @param {string} role
   * @returns {Array} Default permissions
   */
  static getDefaultPermissions(role) {
    const permissionMap = {
      super_admin: [
        "user_management",
        "role_management",
        "dashboard_view",
        "system_settings",
        "reports_view",
        "content_management",
      ],
      admin: ["user_management", "dashboard_view", "reports_view"],
      moderator: ["dashboard_view"],
    };

    return permissionMap[role] || [];
  }
}

module.exports = AuthService;
