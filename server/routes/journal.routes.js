const express = require("express");
const router = express.Router();
const journalController = require("../controllers/journal.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, journalController.createEntry);
router.get("/", auth, journalController.getEntries);
router.get("/deleted", auth, journalController.getDeletedEntries);
router.delete("/soft/:id", auth, journalController.softDeleteEntry);
router.patch("/restore/:id", auth, journalController.restoreEntry);
router.delete("/permanent/:id", auth, journalController.permanentDeleteEntry);

module.exports = router;
