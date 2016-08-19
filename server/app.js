var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');

var app = express();
var server = http.createServer(app);
var con;

var zipcodeRegex = new RegExp(/^\d{5}$/);
var messageRegex = new RegExp(/^[\w]*$/);

app.use(bodyParser());

var connectToSQL = function () {
    var obj = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    con = mysql.createConnection(obj.mysql);
    con.connect(function (err) {
        if (err) {
            console.log("Error connecting to database.");
            console.log(err);
            setTimeout(connectToSQL, 2000);
        } else {
            console.log("Connected to the database.");
        }
    });

    con.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connectToSQL();
        } else {
            throw err;
        }
    });
};

/**
 * /get/zipcode
 */
app.get('/get/:zipcode', function (req, res) {
    var zipcode = req.params.zipcode;
    var result = zipcodeRegex.test(zipcode);

    if (!result) {
        console.log("Zipcode was incorrect");
        return;
    }

    var query = "SELECT * FROM `amir_project` ORDER BY RAND() LIMIT 9;";
    con.query(query, function (err, rows, fields) {
        if (err) throw err;

        var result = {
            messages: []
        };

        for (var i in rows) {
            if (!rows.hasOwnProperty(i)) {
                console.log("Broke!!");
                break;
            }
            result.messages.push(rows[i].message);
        }
        sendResults(result, req, res);
    });
});

/**
 * /put/zipcode/string
 */
app.get('/put/:zipcode/:str', function (req, res) {
    var zipcode = req.params.zipcode;
    var str = req.params.str;

    var r = zipcodeRegex.test(zipcode);
    if (!r) {
        console.log("Zipcode was incorrect");
        return;
    }

    r = messageRegex.test(str);
    if (!r) {
        console.log("Message was incorrect");
        return;
    }

    var result = {
        success: true
    };

    var query = "INSERT INTO `amir_project`(`message`,`zipcode`) VALUES (?,?);";
    con.query(query, [str, zipcode], function (err, row, fields) {
        if (err) throw err;
        result.success = true;
    });
    sendResults(result, req, res);
});

function sendResults(result, request, response) {
    console.log(request.params);
    response.jsonp(result);
}

server.listen(4754);

if (require.main === module) {
    connectToSQL();
}
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});