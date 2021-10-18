require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();
const encrypt = require('mongoose-encryption');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://localhost:27017/userDB');
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    content: String
})

// encrytion-------------------------------------

userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ["password"]
})
//-----------------------------------------------

const User = mongoose.model('User', userSchema)

let currentID;

app.get('/', (req, res) => {
    res.render("home");
})

app.get('/login', (req, res) => {
    res.render("login")
})

app.get('/register', (req, res) => {
    res.render("register")
})

app.get('/logout', (req, res) => {
    res.render("home")
})

app.get('/submit', (req, res) => {
    res.render("submit")
})

app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password,
        content: 'Please submit your first secret'
    })

    newUser.save();
    currentID = newUser._id;
    res.render('secrets', {
        inputSecret: newUser.content
    });
})

app.post('/login', (req, res) => {
    User.findOne({
        email: req.body.username
    }, (err, doc) => {
        if (!doc) res.send('Not Match');
        else {
            if (req.body.password === doc.password) {
                currentID = doc._id;
                res.render('secrets', {
                    inputSecret: doc.content
                });
            }


        }
    })
})

app.post('/submit', (req, res) => {
    User.findByIdAndUpdate(currentID, {
        content: req.body.secret
    }, (err, doc) => {
        err ? console.log(err) :
            res.render('secrets', {
                inputSecret: req.body.secret
            });
    })
})

app.listen(3000, () => console.log("Server started on port 3000."))