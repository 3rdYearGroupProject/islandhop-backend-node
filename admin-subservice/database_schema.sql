-- PostgreSQL Database Schema for Admin Subservice
-- This file contains the table structures used by the raw SQL queries

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15),
    date_of_birth DATE,
    profile_picture TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('tourist', 'driver', 'guide')),
    registration_date TIMESTAMP DEFAULT NOW(),
    last_login_date TIMESTAMP,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT[], -- Array of permission strings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Role-Permission junction table
CREATE TABLE IF NOT EXISTS "RolePermissions" (
    "roleId" UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    "permissionId" UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY ("roleId", "permissionId")
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- Sample data (optional)
-- Insert default roles
INSERT INTO roles (name, description, permissions, is_active) VALUES
('super_admin', 'Super Administrator with all permissions', ARRAY['user_management', 'role_management', 'dashboard_view', 'system_settings'], true),
('admin', 'Administrator with limited permissions', ARRAY['user_management', 'dashboard_view'], true),
('moderator', 'Moderator with view permissions', ARRAY['dashboard_view'], true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, module, action) VALUES
('user_management', 'Manage users', 'users', 'manage'),
('role_management', 'Manage roles and permissions', 'roles', 'manage'),
('dashboard_view', 'View dashboard and analytics', 'dashboard', 'view'),
('system_settings', 'Modify system settings', 'system', 'manage'),
('reports_view', 'View reports', 'reports', 'view'),
('content_management', 'Manage content', 'content', 'manage')
ON CONFLICT (name) DO NOTHING;
