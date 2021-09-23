/**
 * Module dependencies.
 */
var express = require('express')
,	path = require('path')
,	streams = require('./app/streams.js')();

var favicon = require('serve-favicon')
,	logger = require('morgan')
,	methodOverride = require('method-override')
,	bodyParser = require('body-parser')
,	errorHandler = require('errorhandler');

var app = express();
var https = require('https');  
var fs = require('fs');  
// Require the package
const QRCode = require('qrcode')
var options = {  
    key: fs.readFileSync('./key.pem', 'utf8'),  
    cert: fs.readFileSync('./server.crt', 'utf8')  
}; 

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
var httpsPort=app.get('port');
// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

// routing
require('./app/routes.js')(app, streams,QRCode,fs);

/*var server = app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});*/
var secureServer = https.createServer(options, app).listen(httpsPort, () => {  
  console.log(">> CentraliZr listening at port " + httpsPort);  
});
var io = require('socket.io').listen(secureServer);
/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io, streams);