//Core Modules
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
require("dotenv").config();

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});
//Application Modules
const rootDir = require("./util/path");
const app = express();

//Routes
const siteRoutes = require("./routes/site");
const authRoutes = require("./routes/auth");

app.set("view engine", "ejs");
app.set("views", "views");
//middlewares
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('projectImage'));

//serving files statically
app.use(express.static(path.join(rootDir, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

//Serving Routes
app.use(flash());
app.use(siteRoutes);
app.use("/admin", authRoutes);

//Generalized Error Handler
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;

  if (error.cause.render === "login") {
    return res.status(status).render(error.cause.render, {
      errorMessage: message,
      oldInput: {
        email: error.cause.oldInput.email,
        password: error.cause.oldInput.password,
      },
      validationErrors: [
        {
          param: error.cause.validationErrors[0].param,
        },
      ],
    });
  } else if (error.cause.render === "signup") {
    return res.status(status).render(error.cause.render, {
      errorMessage: message,
      oldInput: {
        email: error.cause.oldInput.email,
        password: error.cause.oldInput.password,
        username: error.cause.oldInput.username,
        confirmPassword: error.cause.oldInput.confirmPassword,
      },
      validationErrors: [
        {
          param: error.cause.validationErrors[0].param,
        },
      ],
    });
  } else if (error.cause.render === "addPersonalInformationForm") {
    return res.status(status).render(error.cause.render, {
      errorMessage: message,
      token: error.cause.token,
      authenticationNotRequired: error.cause.authenticationNotRequired,
      oldInput: {
        EPIName: error.cause.oldInput.EPIName,
        EPIAbilitiesAndExperiences:
          error.cause.oldInput.EPIAbilitiesAndExperiences,
        EPICity: error.cause.oldInput.EPICity,
        EPICountry: error.cause.oldInput.EPICountry,
        EPIGitHubLink: error.cause.oldInput.EPIGitHubLink,
        EPIStackoverflowLink: error.cause.oldInput.EPIStackoverflowLink,
        EPITwitterLink: error.cause.oldInput.EPITwitterLink,
        EPILinkedInLink: error.cause.oldInput.EPILinkedInLink,
        EPIPersonalWebsiteLink: error.cause.oldInput.EPIPersonalWebsiteLink,
      },
      validationErrors: [
        {
          param: error.cause.validationErrors[0].param,
        },
      ],
    });
  } else if (error.cause.render === "addAboutMeForm") {
    return res.status(status).render(error.cause.render, {
      errorMessage: message,
      token: error.cause.token,
      authenticationNotRequired: error.cause.authenticationNotRequired,
      oldInput: {
        EPIAboutMe: error.cause.oldInput.EPIAboutMe,
      },
      validationErrors: [
        {
          param: error.cause.validationErrors[0].param,
        },
      ],
    });
  }
});

//Database Connection
const portNo = 3000;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(process.env.PORT || portNo);
    console.log("Server Started listening on port:" + portNo);
  })
  .catch((err) => {
    console.log(err);
  });
