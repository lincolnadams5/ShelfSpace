require('dotenv').config(); // Load environment variables from .env file into memory

const express = require("express"); 
const session = require("express-session"); // Needed for the session variable
let path = require("path");
let bodyParser = require("body-parser");
let app = express();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname))); // Making sure that Express can serve static files (for imported fonts)

const port = process.env.PORT || 3001;

app.use(express.urlencoded({extended: true}));

// ===== MIDDLEWARE =====

// ~~ Global Authentication ~~
app.use((req, res, next) => {
    // Skip authentication for login routes
    if (req.path === "/" || req.path === "/login" || req.path === "/register") {
        return next();
    }

    // TODO: Routes that require manager authentication

    // Check if user is logged in for all other routes
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.render('login', { error_message: "" }); // TODO: Set EJS files to receive error message
    }
});

// ===== POST PAGE ROUTES =====

app.post("/login", (req, res) => {
    let username = req.body.username
    let password = req.body.password

    knex.select('username', 'password', 'level') // Gets user row where username and password match row values
        .from('users')
        .where('username', username)
        .andWhere('password', password)
        .first() // Gets only first return
        .then(user => {
            if (user) {
                req.session.isLoggedIn = true; // Sets session login value to true
                req.session.username = user.username; // Saves username to session storage
                req.session.password = user.password; // Saves password to session storage
                req.session.level = user.level // Saves user authentication level
                console.log('Username "', user.username, '" successfully logged in.'); // Logs user login in console
                res.redirect('/'); // Sends successful login to the home page                
            } else {
                res.render('login', { error_message: 'Incorrect username or password'}); // Otherwise returns to login page with error message
            }
        }).catch(err => {
            console.log('LOGIN ERROR:', err);
            res.render('login', { error_message: 'Server connection error'}); // Returns to login page with error message
        });
});

app.post('/registerUser', (req, res) => {
    let authKey = req.body.authKey
    let confirmPassword =  req.body.confirmPassword

    let newUser = {
        username: req.body.username,
        password: req.body.password,
        level: req.body.level
    }

    if (confirmPassword !== newUser.password) {
        res.render('register', { error_message: "Passwords do not match" });
    }

    if (newUser.level === 'M' && authKey !== process.env.authKey) {
        res.render('register', { error_message: "Incorrect authentication key" });
    }

    knex('users')
        .insert(newUser)
        .then((user) => {
            req.session.isLoggedIn = true; // Sets session login value to true
            req.session.username = user.username; // Saves username to session storage
            req.session.password = user.password; // Saves password to session storage
            req.session.level = user.level // Saves user authentication level
            console.log('Username "', user.username, '" successfully logged in.'); // Logs user login in console
            res.redirect('/'); // Sends successful login to the home page 
        }).catch(err => {
            console.log('REGISTRATION ERROR:', err);
            res.render('register', { error_message: 'Server connection error' }); // Returns to register page with error message
        });

});

// ===== GET PAGE ROUTES =====

app.get("/", (req, res) => {
    res.render("landing");
});

app.get("/login", (req, res) => {
    res.render("login", { error_message: "" });
});

app.get("/register", (req, res) => {
    res.render("register", { error_message: "" });
})

// ===== SERVER START =====
app.listen(port, () => {
    console.log(`Node.js app running on http://localhost:${port}`);
});