const express = require("express");
const router = express.Router();
const journalController = require("../controllers/journal.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, journalController.createEntry);
router.get("/", auth, journalController.getEntries);

module.exports = router;
