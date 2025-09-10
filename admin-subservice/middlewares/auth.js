const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");
const { supabase } = require("../config/postgresql");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Middleware to verify Firebase JWT token and check if user is admin
 */
const verifyAdminToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided or invalid format.",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Firebase JWT token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user exists in admin_accounts table using email
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_accounts")
      .select("email")
      .eq("email", decodedToken.email)
      .single();

    if (adminError || !adminUser) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Check if admin account is active
    // if (adminUser.status != "ACTIVE") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Access denied. Admin account is inactive.",
    //   });
    // }

    console.log("Admin verified:", decodedToken.email);

    // Attach user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || "admin",
      admin: decodedToken.admin || true,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({
        success: false,
        message: "Token revoked. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token. Authentication failed.",
    });
  }
};

/**
 * Optional middleware for routes that need user info but don't require admin
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided or invalid format.",
      });
    }

    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      admin: decodedToken.admin,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid token. Authentication failed.",
    });
  }
};

module.exports = {
  verifyAdminToken,
  verifyToken,
};
