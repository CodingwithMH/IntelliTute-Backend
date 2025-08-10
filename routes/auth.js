const express = require("express");
const bcrypt = require("bcrypt");
const fetchuser = require("../middlewares/fetchuser");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const user = require("../models/user");
const router = express.Router();

// Register a user-----------------------------------------

router.post(
  "/register",
  [
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid Email!"),
    body("name").notEmpty().withMessage("Username is required"),
    body("image").notEmpty().withMessage("Profile image is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
      }
      const { email,name,image, password } = req.body;
      const existingUser = await user.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedpassword = await bcrypt.hash(password, salt);

      await user.create({
        email:email,
        name: name,
        password: hashedpassword,
        image:image
      });
      res.json({ message: "User Added Successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Error creating user", details: err.message });
    }
  }
);

// Update User-----------------------------------------

router.put(
  "/update",
  [
    body("id").notEmpty().withMessage("id is required"),
    body("name").notEmpty().withMessage("Name is required"),
    body("image").notEmpty().withMessage("Profile image is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid Email!"),
  ],
  async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
      }
      const { name,email, newPassword,currentPassword,image, id } = req.body;
      // Fetch the user by ID
      let existingUser = await user.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found!" });
      }

      // Prepare the update object
      const updateData = {
        name,
        email,
        image
      };

      // Only update password if it is provided
      if (newPassword && currentPassword && newPassword.length >= 6 && currentPassword.length >= 6) {
        const passwordcomparision = await bcrypt.compare(
        currentPassword,
        existingUser.password
      );
      if (!passwordcomparision) {
        return res
          .status(400)
          .json({ error: "Please enter correct credentials" });
      }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(newPassword, salt);
      }

      await user.findByIdAndUpdate(id, updateData);

      res.json({ message: "User's information updated successfully!" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Some error occurred.", details: err.message });
    }
  }
);

//Login Endpoint-----------------------------------------

router.post(
  "/login",

  //validations
  body("password").isLength({ min: 6 }).withMessage("Enter a valid password"),
  body("email").notEmpty().withMessage("Email is required!").isEmail().withMessage("Enter a valid Email!"),

  async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
      }
      let { email, password } = req.body;
      let existingUser = await user.findOne({ email });
      if (!existingUser) {
        return res.status(400).json({ error: "User not found!" });
      }
      const passwordcomparision = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!passwordcomparision) {
        return res
          .status(400)
          .json({ error: "Please enter correct credentials" });
      }
      const mydata = {
        user: {
          id: existingUser.id,
        },
      };
      var token = jwt.sign(mydata, process.env.JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite:"None",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({ token: token, message: "Logged in successfuly!" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Some error occurred.", details: err.message });
    }
  }
);

//Fetch user's Information------------------------------------

router.get("/getuser", fetchuser, async (req, res) => {
  try {
    let userid = req.user.id;
    let existingUser = await user.findById(userid).select("-password");
    res.send(existingUser);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Some error occurred.", details: err.message });
  }
});

// Delete User-----------------------------------------

router.delete("/delete", fetchuser, async (req, res) => {
  try {
    let userid = req.user.id;
    let existingUser = await user.findById(userid).select("-password");
    if (!existingUser) {
      return res.status(400).json({ error: "User not found!" });
    }
    await user.findByIdAndDelete(userid);
    res.json({ message: "User deleted successfully!" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Some error occurred.", details: err.message });
  }
});

//Logout and clear cookies-------------------

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
