const express = require("express");
const { body } = require("express-validator");
const { prisma } = require("../lib/prisma");
const multer = require("multer");
const path = require("path");
const {
  index,
  loginPage,
  loginPost,
  signupPage,
  signupPost,
  logout,
  getFolders,
  postFolders,
  getFilesForm,
  postFiles,
  downloadFile,
  deleteFile,
  deleteFolder,
} = require("../controllers/index");
const { ensureAuthenticated } = require("../middlewares/auth");
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", ensureAuthenticated, index);
router.get("/login", loginPage);
router.post("/login", loginPost);
router.get("/signup", signupPage);
router.post(
  "/signup",
  [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .custom(async (value) => {
        const existingUser = await prisma.user.findUnique({
          where: { username: value },
        });
        if (existingUser) {
          throw new Error("Username already exists");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  signupPost
);

router.get("/logout", logout);
router.get("/folders", ensureAuthenticated, getFolders);
router.post("/folders", ensureAuthenticated, postFolders);
router.get("/files/upload/:id", ensureAuthenticated, getFilesForm);
router.post(
  "/files/upload",
  ensureAuthenticated,
  upload.single("file"),
  postFiles
);
router.get("/files/:id/download", ensureAuthenticated, downloadFile);
router.get("/files/:id/delete", ensureAuthenticated, deleteFile);
router.get("/folders/:id/delete", ensureAuthenticated, deleteFolder);
module.exports = router;
