const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middlewares/auth");
const thirdPartyDriverController = require("../controllers/thirdPartyDriverController");

router.use(verifyAdminToken);

router.get("/third-party-drivers", thirdPartyDriverController.getAllDrivers);
router.get("/third-party-drivers/:id", thirdPartyDriverController.getDriverById);
router.post("/third-party-drivers", thirdPartyDriverController.createDriver);
router.put("/third-party-drivers/:id", thirdPartyDriverController.updateDriver);
router.delete("/third-party-drivers/:id", thirdPartyDriverController.deleteDriver);


module.exports = router;
