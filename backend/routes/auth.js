const express = require("express");
const router = express.Router();

const admin = require("../firebaseAdmin");
const User = require("../models/User");

router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Missing Firebase token",
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const {
      uid,
      name,
      email,
      picture,
    } = decoded;

    let user = await User.findOne({ googleId: uid });

    if (!user) {
      user = await User.create({
        googleId: uid,
        name,
        email,
        photoURL: picture,
        lastLoginAt: new Date(),
      });
    } else {
      user.name = name;
      user.email = email;
      user.photoURL = picture;
      user.lastLoginAt = new Date();

      await user.save();
    }

    res.json({
      success: true,
      user,
    });

  } catch (err) {
    console.error("Google login error:", err);

    res.status(500).json({
      error: "Authentication failed",
    });
  }
});

module.exports = router;