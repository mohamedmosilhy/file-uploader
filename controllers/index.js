require("dotenv").config();
const passport = require("../config/passport");
const bcryptjs = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { validationResult } = require("express-validator");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
      const file = req.file;
      if (!file) {
        req.flash("error_msg", "No file uploaded. Please select a file.");
        return res.redirect("/folders");
      }
      const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;

      const filePath = `${req.user.id}/${Date.now()}_${file.originalname}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      await prisma.file.create({
        data: {
          name: file.originalname,
          path: filePath,
          size: file.size,
          userId: req.user.id,
          folderId: folderId || null,
        },
      });
      req.flash(
        "success_msg",
        `File "${file.originalname}" uploaded successfully!`
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
      if (!file || file.userId !== req.user.id) {
        req.flash("error_msg", "File not found.");
        return res.redirect("/folders");
      }

      const { data, error } = await supabase.storage
        .from("uploads")
        .download(file.path);

      if (error) {
        req.flash("error_msg", "File not found on server.");
        return res.redirect("/folders");
      }

      // Convert Blob to Buffer
      const buffer = Buffer.from(await data.arrayBuffer());

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.name}"`
      );
      res.setHeader("Content-Type", data.type || "application/octet-stream");
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      return next(error);
    }
  },
  deleteFile: async (req, res, next) => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!file || file.userId !== req.user.id) {
        req.flash("error_msg", "File not found.");
        return res.redirect("/folders");
      }

      await supabase.storage.from("uploads").remove([file.path]);

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
      });

      if (!folder) {
        req.flash("error_msg", "Folder not found.");
        return res.redirect("/folders");
      }

      // Recursive function to collect all file paths from folder and nested folders
      const collectAllFilePaths = async (fId) => {
        const folderData = await prisma.folder.findUnique({
          where: { id: fId },
          include: { childFolders: true, files: true },
        });

        if (!folderData) return [];

        let allFilePaths = folderData.files.map((file) => file.path);

        // Recursively collect files from child folders
        for (const childFolder of folderData.childFolders) {
          const childFilePaths = await collectAllFilePaths(childFolder.id);
          allFilePaths = allFilePaths.concat(childFilePaths);
        }

        return allFilePaths;
      };

      // Collect all file paths from this folder and all nested folders
      const allFilePaths = await collectAllFilePaths(folderId);

      // Delete all files from Supabase storage
      if (allFilePaths.length > 0) {
        await supabase.storage.from("uploads").remove(allFilePaths);
      }

      // Delete the folder (cascade delete will handle child folders and files in DB)
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
