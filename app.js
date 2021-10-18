require('dotenv').config();
// const md5 = require('md5');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();
// const encrypt = require('mongoose-encryption');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')
let cct = [];

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));
app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());




mongoose.connect('mongodb://localhost:27017/userDB');
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    content: Array,
    googleId: String,
    facebookId: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// // encrytion(.env)-------------------------------------
// userSchema.plugin(encrypt, {
//     secret: process.env.SECRET,
//     encryptedFields: ["password"]
// })
// //-----------------------------------------------

// bcrypt---------------------
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
//------------------------------

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        // console.log(accessToken);
        User.findOrCreate({
            googleId: profile.id,
            username: profile.provider + profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            facebookId: profile.id,
            username: profile.provider + profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

// let currentID;

app.get('/', (req, res) => {
    res.render("home");
})

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/login', (req, res) => {
    res.render("login")
})

app.get('/register', (req, res) => {
    res.render("register")
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})

app.get('/secrets', (req, res) => {
    User.find({
        "content": {
            $ne: null
        }
    }, (err, docs) => {
        // console.log(docs);
        res.render('secrets', {
            usersWithSecrets: docs,
            secretss: cct
        })
    })
})

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else res.redirect('/login')
})

app.post('/register', (req, res) => {
    User.register({
        username: req.body.username
    }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            })
        }
    })
})

app.post('/login', (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (err) => {
        passport.authenticate('local')(req, res, () => {
            res.redirect('/secrets');
        })
    })
})

app.post('/submit', (req, res) => {
    const inputSecret = req.body.secret;
    User.findById(req.user.id, (err, doc) => {
        doc.content.push(inputSecret);
        cct.push(inputSecret);
        doc.save(() => {
            res.redirect('/secrets')
        })
        // console.log(doc);
    })


})

app.listen(3000, () => console.log("Server started on port 3000."))