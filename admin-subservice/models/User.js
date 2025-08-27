const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/postgresql");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      validate: {
        len: [10, 15],
      },
    },
    dateOfBirth: {
      type: DataTypes.DATE,
    },
    profilePicture: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userType: {
      type: DataTypes.ENUM("tourist", "driver", "guide"),
      allowNull: false,
    },
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    lastLoginDate: {
      type: DataTypes.DATE,
    },
    address: {
      type: DataTypes.TEXT,
    },
    city: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    indexes: [
      {
        fields: ["email"],
      },
      {
        fields: ["userType"],
      },
      {
        fields: ["isActive"],
      },
    ],
  }
);

// Instance methods
User.prototype.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Class methods
User.findActiveUsers = function () {
  return this.findAll({
    where: {
      isActive: true,
    },
  });
};

User.findByUserType = function (userType) {
  return this.findAll({
    where: {
      userType: userType,
    },
  });
};

module.exports = { User };
