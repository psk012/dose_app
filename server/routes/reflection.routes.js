const express = require("express");
const router = express.Router();
const reflectionController = require("../controllers/reflection.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, reflectionController.saveReflection);
router.get("/activity", auth, reflectionController.getActivityDates);
router.get("/:date", auth, reflectionController.getReflectionsByDate);
router.delete("/:id", auth, reflectionController.deleteReflection);

module.exports = router;
