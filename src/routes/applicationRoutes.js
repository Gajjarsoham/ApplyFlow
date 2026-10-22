const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { createApplication, listApplications, getApplicationById, } = require("../controllers/applicationController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createApplication);
router.get("/", listApplications);
router.get("/:id", getApplicationById);


module.exports = router;