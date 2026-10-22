const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { 
    createApplication, 
    listApplications, 
    getApplicationById, 
    updateApplication,
    deleteApplication, 
} = require("../controllers/applicationController");

const router = express.Router();

router.use(authMiddleware);

// Application routes
router.post("/", createApplication);
router.get("/", listApplications);
router.get("/:id", getApplicationById);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);


module.exports = router;