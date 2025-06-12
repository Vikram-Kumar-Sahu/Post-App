const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const post = require('./models/post');

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

app.get('/profile', isLoggedIn, async(req,res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");    
    res.render('profile',{user});
});

app.get('/like/:id', isLoggedIn, async (req, res) => {
    try {
        let post = await postModel.findById(req.params.id);

        if (!post) return res.status(404).send("Post not found");

        const userId = req.user.userid;

        const index = post.likes.indexOf(userId);
        if (index === -1) {
            post.likes.push(userId); // like
        } else {
            post.likes.splice(index, 1); // unlike
        }

        await post.save();
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {
    try {
        let post = await postModel.findById({_id: req.params.id}).populate("user");

       
        res.render('edit', { post });

    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

app.post('/update/:id', isLoggedIn, async (req, res) => {
    try {
        let post = await postModel.findOneAndUpdate({_id: req.params.id} ,{content: req.body.content});       
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

app.post('/post', isLoggedIn, async(req,res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content}= req.body;
    let post = await postModel.create({
        user:user._id,
        content:content
    });

    user.posts.push(post._id);  // ✅ CORRECT
await user.save();

    res.redirect("/profile")
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

app.get('/feed', isLoggedIn, async (req, res) => {
    try {
        const posts = await postModel.find()
            .populate("user")
            .sort({ createdAt: -1 }); // newest post first
        res.render("feed", { posts, currentUser: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
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