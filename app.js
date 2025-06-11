const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/',(req,res) => {
    res.render('index');
});

app.get('/login',(req,res) => {
    res.render('login');
});

app.get('/profile', isLoggedIn, (req,res) => {
    console.log(req.user);
    res.render('profile');
});

app.get('/logout', (req, res) => {
    res.cookie("token", "", { httpOnly: true, expires: new Date(0), sameSite: "lax" });
    res.redirect('/login');
});

app.post('/login',async (req,res) => {
    let{email,password} = req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("something went wrong");

   bcrypt.compare(password, user.password, function (err,result){
    if(result) {
        let token = jwt.sign({email:email, userid:user._id},"shhhh");
        res.cookie("token",token);
        res.status(200).send("loged in");
    }

    else res.redirect("/login")
   })
});

app.post('/register',async (req,res) => {
    let{email,password,username,name,age} = req.body;

    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already registered");
   bcrypt.genSalt(10, (err, salt) => {
     bcrypt.hash(password,salt, async (err,hash) => {
        let user = await userModel.create({
            username,
            email,
            age,
            name,
            password:hash
        });

        let token = jwt.sign({email:email, userid:user._id},"shhhh");
        res.cookie("token",token);
        res.send("registered");
     });
});

});


function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).send("You must be logged in");
    try {
        const data = jwt.verify(token, "shhhh");
        req.user = data;
        next();
    } catch (err) {
        return res.status(401).send("Invalid or expired token");
    }
}

app.listen(3000);