//jshint esversion:6
const swal = require('sweetalert');
require("dotenv-extended").load();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
var findOrCreate = require("mongoose-findorcreate");
let userName = "";
let CLIENT_ID = "437541160843-tt9qd2kjg0nmtbjfgfpj9rva0p5vbh47.apps.googleusercontent.com"
let CLIENT_SECRET = "XNWX7ewU_MepDN9hPVwLgIlo";

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "Jai ho!",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb+srv://mongoUser:mongoUser@mydiary.v45zj.mongodb.net/userDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect("mongodb+srv://mongoUser:mongoUser@diaryapp.rlm85.mongodb.net/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

const secretSchema = new mongoose.Schema({
  secret: String,
  user: String,
  date: Date
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user", userSchema);
const Secret = new mongoose.model("secret", secretSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
passport.use(
  new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: "https://mighty-mountain-27271.herokuapp.com/auth/google/secrets",
  },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      console.log("Email:" + profile.emails[0].value)
      userName = profile.emails[0].value;
      User.findOrCreate({
        googleId: profile.id,
        email: profile.emails[0].value
      }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["openid", "profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/logout", function (req, res) {
  req.logOut();
  res.redirect("/");
});

app.post("/register", async function (req, res) {
  console.log(req.body.username);
  User.register({
    username: req.body.username
  }, req.body.password, function (
    err,
    user
  ) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        userName = req.body.username;
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", async function (req, res) {
  const user = await new User({
    username: req.body.username,
    password: req.body.password,
  });
  userName = req.body.username;

  await req.login(user, async function (err) {
    if (err) {
      console.log(err);
    } else {
      await passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/secrets", async function (req, res) {
  if (req.isAuthenticated()) {
    var secrets = [];
    await Secret.find({ user: userName }, async function (err, secretsList) {
      if (err) {
        console.log(err);
        res.send("Error!");
      } else if (secretsList) {
        const sorted = await secretsList.sort((a, b) => a.date - b.date)
        secrets = sorted;
      }

    })

    res.render("secrets", {
      secrets: secrets
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", function (req, res) {
  res.render("submit");
});

app.post("/submit", async function (req, res) {


  const secret = new Secret({
    secret: req.body.secret,
    user: userName,
    date: req.body.date

  })
  const willSunmit = await swal({
    title: "Are you sure?",
    text: "Are you sure that you want to Submit this file?",
    icon: "warning",
    dangerMode: true,
  });

  if (willDelete) {
    await secret.save();
    swal("Submitted!", "Your imaginary file has been Submitted!", "success");

  }

  res.redirect("/secrets");

})



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});
//Mongo user yexaja9930@kartk5.com Mongo@user
//mongoUser mongoUser
//mongodb+srv://mongoUser:<password>@mydiary.v45zj.mongodb.net/<dbname>?retryWrites=true&w=majority
//https://secure-brushlands-12707.herokuapp.com/ | https://git.heroku.com/secure-brushlands-12707.git
//2 mongodb+srv://mongoUser:<password>@diaryapp.rlm85.mongodb.net/<dbname>?retryWrites=true&w=majority
//Client Id= 437541160843-tt9qd2kjg0nmtbjfgfpj9rva0p5vbh47.apps.googleusercontent.com
//Client Secret = XNWX7ewU_MepDN9hPVwLgIlo