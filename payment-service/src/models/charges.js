const mongoose = require('mongoose');

const chargesSchema = new mongoose.Schema({
  driverDailyCharge: {
    type: Number,
    required: true,
    default: 0
  },
  guideDailyCharge: {
    type: Number,
    required: true,
    default: 0
  },
  systemChargePercentage: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Ensure only one document exists in the charges collection
chargesSchema.statics.getSingleton = async function() {
  let charges = await this.findOne();
  if (!charges) {
    charges = await this.create({
      driverDailyCharge: 0,
      guideDailyCharge: 0,
      systemChargePercentage: 0
    });
  }
  return charges;
};

chargesSchema.statics.updateSingleton = async function(updateData) {
  let charges = await this.findOne();
  if (!charges) {
    charges = await this.create({
      driverDailyCharge: 0,
      guideDailyCharge: 0,
      systemChargePercentage: 0,
      ...updateData
    });
  } else {
    Object.assign(charges, updateData);
    await charges.save();
  }
  return charges;
};

module.exports = mongoose.model('Charges', chargesSchema);
