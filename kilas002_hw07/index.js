// Include the express module
const express = require('express');

// Helps in managing user sessions
const session = require('express-session');

// Import MySQL and xml2js module for database configuration and usage
const mysql = require("mysql");
var xml2js = require('xml2js');

// Bcrypt library for comparing password hashes
const bcrypt = require('bcrypt');

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// Helpful file modules for uploads, file reading and writing, exports, etc
const fileupload = require('express-fileupload');
const fs = require("fs");

// Specify port for running server and create an express application
const app = express();
const port = 9894;

/*-----------------*/

// apply the body-parser middleware to all incoming requests
app.use(bodyparser.urlencoded({
    extended: true
}));

// Use express-session. In-memory session is sufficient for this assignment
app.use(session({
    secret: "csci4131secretkey",
    saveUninitialized: true,
    resave: false
}));

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));

// middle ware for file uploads
app.use(fileupload());

// server listens on port set to value above for incoming connections
app.listen(port, () => console.log('\nListening on port', port));

// Get database configuration from xml file
var parser = xml2js.Parser();
fs.readFile(__dirname + "/dbconfig.xml", function (err, data) {
    parser.parseString(data, function (err, results) {
        db = mysql.createConnection({
            host: results.dbconfig.host[0],
            user: results.dbconfig.user[0],
            password: results.dbconfig.password[0],
            database: results.dbconfig.database[0],
            port: results.dbconfig.port[0]
        });
        db.connect(function(err) {
            if (err) {
                throw err;
            }
        console.log('Connected to database');
        });
    });
});

// Stores current user for welcome purposes
var currentUser = null;

/*-----------------*/

// GET and POST methods route for the various pages.
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/welcome.html');
});
app.get('/welcome', function(req, res) {
    res.sendFile(__dirname + '/client/welcome.html');
});
app.get('/login', function(req, res) {
    if(req.session.value){
        res.redirect('/AllContacts');
    }
    else{
        console.log("Waiting for login");
        res.sendFile(__dirname + '/client/login.html');
    }
});
app.get('/logout', function(req, res) {
    req.session.destroy();
    console.log("Logging off\n");
    res.redirect('/login');
});
app.post('/details', function(req, res) {
    const saltRounds = 10;
    var flag = true;
    var user = req.body.user;
    var pass = req.body.pass;
    var cmd = 'SELECT * FROM tbl_accounts WHERE acc_login=?';
    db.query(cmd, user, function(err, rows){
        if(err){
          throw err;
        }
        else if(rows.length != 0){
            for(var i=0; i<rows.length; i++){
                var hash = rows[i].acc_password;
                if(bcrypt.compareSync(pass, hash)){
                    console.log('Valid credentials. Access permitted');
                    req.session.value = 1;
                    currentUser = user;
                    flag = false;
                    res.redirect(302, '/AllContacts');
                    
                }
            }
            if(flag){
                console.log('Invalid credentials. Access denied');
                res.sendStatus(401);
            }
        }
        else{
            console.log('Invalid credentials. Access denied');
            res.sendStatus(401);
        }
    });
});
app.get('/AllContacts', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        res.sendFile(__dirname + '/client/AllContacts.html');
    } 
});
app.get('/MyContacts', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        res.sendFile(__dirname + '/client/MyContacts.html');
    } 
});
app.get('/AddContact', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        res.sendFile(__dirname + '/client/AddContact.html');
    } 
});
app.get('/getContacts', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        category = req.originalUrl.split('=')[1];
        var cmd;
        var json={};
        var list=[];
        if(category === 'all'){ 
            cmd = 'SELECT * FROM contact_table ORDER BY contact_category ASC,contact_name ASC';
            db.query(cmd, function(err, rows){
                if(err){
                  throw err;
                }
                else{
                    for(var i=0; i<rows.length; i++){
                        list.push({
                            'category': rows[i].contact_category,
                            'name': rows[i].contact_name,
                            'location': rows[i].contact_location,
                            'info': rows[i].contact_info,
                            'email': rows[i].contact_email,
                            'website_title': rows[i].website_title,
                            'url': rows[i].website_url
                        });
                    }
                    json[category] = list;
                    res.send(JSON.stringify(json));
               }
            });
        }
        else{ 
            cmd = 'SELECT * FROM contact_table WHERE contact_category=? ORDER BY contact_name ASC';
            db.query(cmd, category, function(err, rows){
                if(err){
                  throw err;
                }
                else{
                    for(var i=0; i<rows.length; i++){
                        list.push({
                            'name': rows[i].contact_name,
                            'location': rows[i].contact_location,
                            'info': rows[i].contact_info,
                            'email': rows[i].contact_email,
                            'website_title': rows[i].website_title,
                            'url': rows[i].website_url
                        });
                    }
                    json[category] = list;
                    res.send(JSON.stringify(json));
               }
            });
        }
    }
});
app.post('/postContactEntry', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        var json={};
        var cmd = 'INSERT contact_table SET ?';
        json['contact_category']=req.body.category.toLowerCase();
        json['contact_name']=req.body.name;
        json['contact_location']=req.body.location;
        json['contact_info']=req.body.info;
        json['contact_email']=req.body.email;
        json['website_title']=req.body.website_title;
        json['website_url']=req.body.url;
        db.query(cmd, json, function(err, row){
            if(err){
                throw err;
            }
        });
        console.log(`Database updated. 1 added to '${req.body.category.toLowerCase()}'`);
        res.sendFile(__dirname + '/client/AllContacts.html');
    } 
});
app.post('/addJson', function(req, res){
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        if(!req.files){
            console.log('No file specified');
            res.redirect(302, '/AddContact');
        }
        else{
            var file = req.files.json;
            if(file.mimetype === 'application/json'){
                console.log('File uploaded');
                json = JSON.parse(file.data.toString('utf-8'));
                for(var category in json){
                    for(var i=0; i<json[category].length; i++){
                        var contact=json[category][i];
                        var set={};
                        var cmd = 'INSERT contact_table SET ?';
                        set['contact_category']=category;
                        set['contact_name']=contact.name;
                        set['contact_location']=contact.location;
                        set['contact_info']=contact.info;
                        set['contact_email']=contact.email;
                        set['website_title']=contact.website_title;
                        set['website_url']=contact.url;
                        db.query(cmd, set, function(err, row){
                            if(err){
                                throw err;
                            }
                        });
                    }
                    console.log(`Database updated. ${json[category].length} added to '${category}'`);
                }
                res.redirect(302, '/AllContacts');
            }
            else{
                console.log('Unsupported file type');
                res.redirect(302, '/AddContact');
            }
        }
    }
});
app.get('/Stocks', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        res.sendFile(__dirname + '/client/stocks.html');
    } 
});

app.get('/Admin', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        res.sendFile(__dirname + '/client/admin.html');
    } 
});
app.get('/getUsers', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        var cmd = 'SELECT * FROM tbl_accounts';
        var json={}
        var list=[];
        db.query(cmd, function(err, rows){
            if(err){
                throw err;
            }
            else{
                for(var i=0; i<rows.length; i++){
                    list.push({
                        'id': rows[i].acc_id,
                        'name': rows[i].acc_name,
                        'username': rows[i].acc_login,
                        'password': rows[i].acc_password,
                    });
                }
                json={'users':list};
                res.send(JSON.stringify(json));
            }
        });
    }
});
app.get('/welcomeUser', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        var json = {'current': currentUser}
        res.send(JSON.stringify(json));    
    }
    
});

// Bonus for user switching
app.post('/switchUser', function(req, res) {
    if(!req.session.value){
        res.redirect('/login');
    }
    else{
        var json = {'current': req.body.new}
        res.send(JSON.stringify(json));    
    }
    
});

/*-----------------*/

//Resource not found error
app.get('*', function(req, res) {
    res.sendStatus(404);
});