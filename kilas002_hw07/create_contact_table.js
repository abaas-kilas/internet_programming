/*
TO DO:
-----
READ ALL COMMENTS AND REPLACE VALUES ACCORDINGLY
*/

const mysql = require("mysql");

const dbCon = mysql.createConnection({
    host: "cse-mysql-classes-01.cse.umn.edu",
    user: "C4131SN22U32",               // replace with the database user provided to you
    password: "1074",           // replace with the database password provided to you
    database: "C4131SN22U32",           // replace with the database user provided to you
    port: 3306
});

console.log("Attempting database connection");
dbCon.connect(function(err) {
  if (err) {
    throw err;
  };
  console.log("Connected to database");
    var sql = `CREATE TABLE contact_table(contact_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                         contact_category VARCHAR(32),
                                         contact_name VARCHAR(256),
                                         contact_location VARCHAR(256),
                                         contact_info VARCHAR(256),
                                         contact_email VARCHAR(256),
                                         website_title VARCHAR(256),
                                         website_url VARCHAR(256))`;
  console.log("Attempting to create table contact_table");
  dbCon.query(sql, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Table contact_table created");
  });
  dbCon.end();
});
