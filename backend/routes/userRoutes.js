const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateProfileImage } = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getUserProfile);
router.post("/profile/image", authMiddleware, upload.single('profileImage'), updateProfileImage);

module.exports = router;
