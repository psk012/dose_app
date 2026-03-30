const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, taskController.createTask);
router.get("/", auth, taskController.getTasks);
router.get("/wrapped", auth, taskController.getWrapped);
router.patch("/:id", auth, taskController.toggleTask);
router.delete("/:id", auth, taskController.deleteTask);

module.exports = router;
