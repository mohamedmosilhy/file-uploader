const passport = require("../config/passport");
const bcryptjs = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { validationResult } = require("express-validator");
const fs = require("fs");

module.exports = {
  index: (req, res) => {
    res.render("index", { pageTitle: "Home", user: req.user });
  },
  loginPage: (req, res) => {
    res.render("login", { pageTitle: "Login" });
  },
  loginPost: passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  signupPage: (req, res) => {
    res.render("signup", { pageTitle: "Signup" });
  },
  signupPost: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render("signup", {
          pageTitle: "Signup",
          errors: errors.array(),
        });
      }
      const { username, password } = req.body;
      await prisma.user.create({
        data: {
          username,
          password: await bcryptjs.hash(password, 10),
        },
      });
      req.flash("success_msg", "Account created successfully! Please login.");
      res.redirect("/login");
    } catch (error) {
      return next(error);
    }
  },
  logout: (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/login");
    });
  },
  getFolders: async (req, res, next) => {
    try {
      // Fetch all folders and files for the user
      const allFolders = await prisma.folder.findMany({
        where: { userId: req.user.id },
        include: { files: true },
        orderBy: { name: "asc" },
      });

      // Build tree structure recursively
      const buildTree = (parentId = null) => {
        return allFolders
          .filter((folder) => folder.parentFolderId === parentId)
          .map((folder) => ({
            ...folder,
            childFolders: buildTree(folder.id),
          }));
      };

      const rootFolders = buildTree(null);
      res.render("folders", {
        pageTitle: "Folders",
        rootFolders,
        user: req.user,
      });
    } catch (error) {
      return next(error);
    }
  },
  postFolders: async (req, res, next) => {
    try {
      const { folderName, parentId } = req.body;
      const parentFolderId = parentId ? parseInt(parentId) : null;

      await prisma.folder.create({
        data: {
          name: folderName,
          userId: req.user.id,
          parentFolderId,
        },
      });

      req.flash("success_msg", `Folder "${folderName}" created successfully!`);
      res.redirect("/folders");
    } catch (error) {
      return next(error);
    }
  },
  getFilesForm: async (req, res, next) => {
    try {
      const folderId = parseInt(req.params.id);
      res.render("filesForm", { pageTitle: "Files Form", folderId });
    } catch (error) {
      return next(error);
    }
  },
  postFiles: async (req, res, next) => {
    try {
      if (!req.file) {
        req.flash("error_msg", "No file uploaded. Please select a file.");
        return res.redirect("/folders");
      }
      const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;
      await prisma.file.create({
        data: {
          name: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          userId: req.user.id,
          folderId: folderId || null,
        },
      });
      req.flash(
        "success_msg",
        `File "${req.file.originalname}" uploaded successfully!`
      );
      res.redirect("/folders");
    } catch (error) {
      return next(error);
    }
  },
  downloadFile: async (req, res, next) => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: parseInt(req.params.id) },
      });
      if (!file) {
        req.flash("error_msg", "File not found.");
        return res.redirect("/folders");
      }
      if (!fs.existsSync(file.path)) {
        req.flash("error_msg", "File not found on server.");
        return res.redirect("/folders");
      }
      res.download(file.path, file.name);
    } catch (error) {
      return next(error);
    }
  },
  deleteFile: async (req, res, next) => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!file) {
        req.flash("error_msg", "File not found.");
        return res.redirect("/folders");
      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      await prisma.file.delete({
        where: { id: parseInt(req.params.id) },
      });

      req.flash("success_msg", `File "${file.name}" deleted successfully!`);
      res.redirect("/folders");
    } catch (error) {
      return next(error);
    }
  },
  deleteFolder: async (req, res, next) => {
    try {
      const folderId = parseInt(req.params.id);

      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        include: { childFolders: true, files: true },
      });

      if (!folder) {
        req.flash("error_msg", "Folder not found.");
        return res.redirect("/folders");
      }

      // Delete all files in the folder
      if (folder.files && folder.files.length > 0) {
        folder.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      await prisma.folder.delete({ where: { id: folderId } });

      req.flash(
        "success_msg",
        `Folder "${folder.name}" and all its contents deleted successfully!`
      );
      res.redirect("/folders");
    } catch (error) {
      return next(error);
    }
  },
};
