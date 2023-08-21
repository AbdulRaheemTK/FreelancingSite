//Core Modules
const path = require("path");
const crypto = require("crypto");
//Installed Modules
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rootDir = require("../util/path");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email,
    pass: process.env.password,
  },
});

//Models
const User = require("../models/user");
const Token = require("../models/token");

// /admin/login ->get
exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("login", {
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

// /admin/signup ->get
exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("signup", {
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      username: "",
    },
    validationErrors: [],
  });
};

// /admin/signup ->post
exports.postSignup = (req, res, next) => {
  const errors = validationResult(req);
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  if (!errors.isEmpty()) {
    const errorMessage = errors.array()[0].msg;
    const error = new Error(errorMessage, {
      cause: {
        render: "signup",
        oldInput: {
          email: email,
          password: password,
          username: username,
          confirmPassword: confirmPassword,
        },
        validationErrors: errors.array(),
      },
    });
    errors.statusCode = 422;
    throw error;
  }
  User.findOne({ $or: [{ email: email }, { username: username }] })
    .then((userExsits) => {
      if (userExsits) {
        const errorMessage =
          "User with this email address or user name already exists";
        const error = new Error(errorMessage, {
          cause: {
            render: "signup",
            oldInput: {
              email: email,
              password: password,
              username: username,
              confirmPassword: confirmPassword,
            },
            validationErrors: [
              {
                param: "email-username",
              },
            ],
          },
        });
        errors.statusCode = 409;
        throw error;
      }
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          const errorMessage = "Token is not generated";
          const error = new Error(errorMessage, {
            cause: {
              render: "signup",
              oldInput: {
                email: email,
                password: password,
                username: username,
                confirmPassword: confirmPassword,
              },
              validationErrors: [],
            },
          });
          errors.statusCode = 500;
          throw error;
        }
        const tokenValue = buffer.toString("hex");
        bcrypt
          .hash(password, 12)
          .then((hashedPassword) => {
            const user = new User({
              username: username,
              email: email,
              password: hashedPassword,
            });
            return user.save();
          })
          .then((user) => {
            const token = new Token({
              userId: user._id,
              token: tokenValue,
              tokenExpiration: Date.now() + 3600000,
            });
            return token.save();
          })
          .then((token) => {
            if (!token) {
              const errorMessage = "Token is not generated";
              const error = new Error(errorMessage, {
                cause: {
                  render: "signup",
                  oldInput: {
                    email: email,
                    password: password,
                    username: username,
                    confirmPassword: confirmPassword,
                  },
                  validationErrors: [],
                },
              });
              errors.statusCode = 404;
              throw error;
            }
            transporter.sendMail({
              to: email,
              from: "abdulraheemtahirkhan@gmail.com",
              subject: "Verify Signup Status!",
              html: `
                                <h3>You requested a signup to our Freelancing Platform</h3>
                                <p>Click this <a href="https://abdul-freelancingsite.herokuapp.com/admin/signup/verify/${token.userId}/${tokenValue}">link</a> to get verified.</p>
                            `,
            });
            res.render("message", {
              signupPage: true,
              inboxPage: false,
              token: false,
              authenticationNotRequired: true,
            });
          })
          .catch((err) => {
            return next(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// /admin/signup/verify/:userId/:token ->get
exports.getSignupVerification = (req, res, next) => {
  const userId = req.params.userId;
  const token = req.params.token;
  User.findOne({ _id: userId })

    .then((user) => {
      // if (!user) {
      //     const error = new Error("User with id:" + userId + " not found during verification");
      //     error.statusCode = 404;
      //     throw error;
      // }
      let loadedUser = user;
      Token.findOne({
        userId: userId,
        token: token,
        tokenExpiration: { $gt: Date.now() },
      })
        .then((token) => {
          // if (!token) {
          //     const error = new Error("Token not found during verifictaion");
          //     error.statusCode = 404;
          //     throw error;
          // }
          loadedUser.verified = true;
          loadedUser.firstlogin = true;
          return loadedUser.save();
        })
        .then((verifiedUser) => {
          // if (!verifiedUser) {
          //     const error = new Error("User is not verified!");
          //     error.statusCode = 404;
          //     throw error;
          // }
          Token.findOneAndDelete({ token: token })
            .then((tokenRemoved) => {
              // if (!tokenRemoved) {
              //     const error = new Error("User is verified but token is not removed from the data base");
              //     error.statusCode = 202;
              //     throw error;
              // }
              return res.redirect("/admin/login");
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

// /admin/login ->post
exports.postLogin = (req, res, next) => {
  const errors = validationResult(req);
  const email = req.body.email;
  const password = req.body.password;
  if (!errors.isEmpty()) {
    const errorMessage = errors.array()[0].msg;
    const error = new Error(errorMessage, {
      cause: {
        render: "login",
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: errors.array(),
      },
    });
    errors.statusCode = 422;
    throw error;
  }
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const errorMessage = "Invalid Email Address";
        const error = new Error(errorMessage, {
          cause: {
            render: "login",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [
              {
                param: "email",
              },
            ],
          },
        });
        errors.statusCode = 404;
        throw error;
      } else if (user.verified == false) {
        const errorMessage =
          "User not verified! Visit your email and click on the link provided to get verified!";
        const error = new Error(errorMessage, {
          cause: {
            render: "login",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [
              {
                param: "email",
              },
            ],
          },
        });
        errors.statusCode = 404;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((pwdEqual) => {
      if (!pwdEqual) {
        const errorMessage = "Password Incorrect!";
        const error = new Error(errorMessage, {
          cause: {
            render: "login",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [
              {
                param: "password",
              },
            ],
          },
        });
        errors.statusCode = 409;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "FreeLancingSiteByRaheem",
        { expiresIn: "1h" }
      );
      req.session.token = token;
      req.session.userId = loadedUser._id.toString();
      console.log(req.session.token);
      if (
        loadedUser.firstlogin == true ||
        !loadedUser.personalInformation.name ||
        !loadedUser.personalInformation.abilitiesAndExperiences ||
        !loadedUser.personalInformation.personelImageLink ||
        !loadedUser.personalInformation.city ||
        !loadedUser.personalInformation.country
      ) {
        res.redirect("/addPersonalInformationForm");
      } else if (loadedUser.firstlogin == true || !loadedUser.aboutMe) {
        res.redirect("/addAboutMeForm");
      } else {
        res.redirect("/");
      }
    })
    .catch((err) => {
      return next(err);
    });
};

// /admin/forgetpassword ->get
exports.getForgetPassword = (req, res, next) => {
  res.render("forgetpassword");
};

// /admin/reset-password/:token -> GET
exports.getResetPassword = (req, res, next) => {
  res.render("resetPassword");
};
// /admin/logout ->post
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

// /admin/reset-password/:token -> POST
exports.postResetPassword = (req, res, next) => {
  const token = req.params.token;
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  if (newPassword !== confirmPassword) {
    req.flash("error", "Passwords do not match.");
    return res.redirect(`/admin/reset-password/${token}`);
  }

  Token.findOne({
    token: token,
    tokenExpiration: { $gt: Date.now() },
  })
    .then((tokenDocument) => {
      if (!tokenDocument) {
        req.flash("error", "Token not found or expired.");
        return res.redirect(`/admin/reset-password/${token}`);
      }

      User.findOne({ _id: tokenDocument.userId })
        .then((user) => {
          if (!user) {
            req.flash("error", "User not found.");
            return res.redirect(`/admin/reset-password/${token}`);
          }

          // Update user's password here

          bcrypt
            .hash(newPassword, 12) // Hash the new password
            .then((hashedPassword) => {
              user.password = hashedPassword; // Set the user's new hashed password

              // Save the updated user with the new password
              return user.save();
            })
            .then(() => {
              // Delete the used token
              return Token.findOneAndDelete({ token: token });
            })
            .then(() => {
              req.flash(
                "success",
                "Password reset successful. You can now log in with your new password."
              );
              return res.redirect("/admin/login");
            })
            .catch((err) => {
              console.log(err);
              req.flash("error", "Server error.");
              return res.redirect(`/admin/reset-password/${token}`);
            });

          // Delete the used token
          Token.findOneAndDelete({ token: token })
            .then(() => {
              req.flash(
                "success",
                "Password reset successful. You can now log in with your new password."
              );
              return res.redirect("/admin/login");
            })
            .catch((err) => {
              console.log(err);
              req.flash("error", "Server error.");
              return res.redirect(`/admin/reset-password/${token}`);
            });
        })
        .catch((err) => {
          console.log(err);
          req.flash("error", "Server error.");
          return res.redirect(`/admin/reset-password/${token}`);
        });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Server error.");
      return res.redirect(`/admin/reset-password/${token}`);
    });
};
