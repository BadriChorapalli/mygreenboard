module.exports = function(app, streams,QRCode,fs) {

  // GET home 
  var index = function(req, res) {
    res.render('index', { 
                          title: 'Project RTC', 
                          header: 'WebRTC live streaming',
                          username: 'Username',
                          share: 'Share this link',
                          footer: 'pierre@chabardes.net',
                          id: req.params.id
                        });
  };
  var board = function(req, res) {
    res.render('board', { 
                          title: 'School', 
                          header: 'WebRTC live streaming',
                          username: 'Username',
                          share: 'Share this link',
                          footer: 'pierre@chabardes.net',
                          id: req.params.id
                        });
  };

  // GET streams as JSON
  var displayStreams = function(req, res) {
    var streamList = streams.getStreams();
    // JSON exploit to clone streamList.public
    var data = (JSON.parse(JSON.stringify(streamList))); 

    res.status(200).json(data);
  };
  var qrCode=function(req,res){
    var qrObject={};
    //
    let data = 'https://192.168.1.8:3000/board';

// Converting the data into base64
QRCode.toDataURL(data, function (err, code) {
	if(err) return console.log("error occurred")
  qrObject.url=code
	
  var data = (JSON.parse(JSON.stringify(qrObject))); 
  res.status(200).json(data);
    })

   
 
  }
  var getpdf = function(req, res) {
    var filename=req.params.id
    console.log(filename)
    var data =fs.readFileSync('./public/docs/app.pdf');
      res.contentType("application/pdf");
      res.send(data);
        };
  app.get('/streams.json', displayStreams);
  app.get('/qrcode', qrCode);
  app.get('/', index);
  app.get('/board', board);
  app.get('/:id', index);
  app.get('/pdf/:id', getpdf);
}