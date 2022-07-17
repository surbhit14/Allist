const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const https = require('https');
const app = express();
let alert = require('alert'); 

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.use(session({
  secret: "Tottenham Sucks.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://surbhit:1234@cluster0.tas80.mongodb.net/allist3', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    username: String,//email
    password: String,
    wallet: String,
  });
  
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){
  User.register({username: req.body.username,
    wallet: req.body.wallet,}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/list");
      });
    }
  });
});

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/list");
      });
    }
  });

});

app.get('/list', (req, res) => {
  var url = 'https://api.covalenthq.com/v1/chains/?quote-currency=USD&format=JSON&key=ckey_1231e418207f49a99fe5676b1a0';
  https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
          var c=JSON.parse(data);
          res.render("list",{list:(c.data.items)})
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  })
  
  app.get('/list/:cid',function(req, res) {
    var cid = req.params.cid;
    if(req.isAuthenticated())
    { var address = req.user.wallet;
      var url = 'https://api.covalenthq.com/v1/'+cid+'/address/'+address+'/transactions_v2/?key=ckey_1231e418207f49a99fe5676b1a0';
      https.get(url, (resp) => {
          let data = '';
          resp.on('data', (chunk) => {
            data += chunk;
          });
          resp.on('end', () => {
              var c = JSON.parse(data);
              var x = c.data.items;
              var list2=[];
              for(var i=0;i<x.length;i++)
              {  var y = x[i].log_events;
                for(var j=0;j<y.length;j++)
                {
                if(y[j].sender_contract_ticker_symbol)
                {list2.push(y[j]);                
                }
                }
              }
              res.render("list2",{list:x,list2:list2});
          });
        }).on("error", (err) => {
          console.log("Error: " + err.message);
        });
    }
  else {
    res.redirect("/login");
  }
    });

  
app.listen(3000, function() {
  console.log("Server started on port 3000.");
});


