//Core Modules
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

//Controllers
const authController = require("../controllers/auth");

//Routes to be executed

// /admin/signup ->get
router.get("/signup", authController.getSignup);

// /admin/signup ->post
router.post(
  "/signup",
  [
    body(
      "username",
      "User Name must contain letters only and minimum of 2 and maximum of 20 length"
    )
      .isAlpha(["en-US"], { ignore: " " })
      .isLength({ min: 2, max: 20 })
      .trim(),
    body("email").isEmail().isLength({ min: 5 }).normalizeEmail(),
    body(
      "password",
      "Password must not be empty with minimum 5 length alphanumeric characters allowed"
    )
      .trim()
      .isLength({ min: 5 })
      .isAlphanumeric()
      .notEmpty(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords have to match!");
      }
      return true;
    }),
  ],
  authController.postSignup
);

// /admin/signup/verify/:userId/:token -> get
router.get(
  "/signup/verify/:userId/:token",
  authController.getSignupVerification
);

// /admin/login ->get
router.get("/login", authController.getLogin);

// /admin/login ->post
router.post(
  "/login",
  [
    body("email").isEmail().isLength({ min: 5 }).normalizeEmail(),
    body(
      "password",
      "Password must not be empty with minimum 5 length alphanumeric characters allowed"
    )
      .trim()
      .isLength({ min: 5 })
      .isAlphanumeric()
      .notEmpty(),
  ],
  authController.postLogin
);

// /admin/forgetpassword ->get
router.get("/forgetpassword", authController.getForgetPassword);

// /admin/reset-password/:token ->get
router.get("/reset-password/:token", authController.getResetPassword);

// /admin/reset-password/:token ->post
router.post("/reset-password/:token", authController.postResetPassword);

// /admin/logout ->post
router.post("/logout", authController.postLogout);

module.exports = router;
