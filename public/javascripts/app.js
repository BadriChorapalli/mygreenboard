(function(){
	var app = angular.module('projectRtc', [],
		function($locationProvider){$locationProvider.html5Mode(true);}
    );
	var client = new PeerManager();
	var mediaConfig = {
        audio:true,
        video: {
			mandatory: {},
			optional: []
        }
    };

    app.factory('camera', ['$rootScope', '$window', function($rootScope, $window){
    	var camera = {};
    	camera.preview = $window.document.getElementById('localVideo');

    	camera.start = function(){
			return requestUserMedia(mediaConfig)
			.then(function(stream){			
				attachMediaStream(camera.preview, stream);
				client.setLocalStream(stream);
				camera.stream = stream;
				$rootScope.$broadcast('cameraIsOn',true);
			})
			.catch(Error('Failed to get access to local media.'));
		};
    	camera.stop = function(){
    		return new Promise(function(resolve, reject){			
				try {
					const stream = camera.preview.srcObject;
					const tracks = stream.getTracks();
				  
					tracks.forEach(function(track) {
					  track.stop();
					});
				  
				   camera.preview.srcObject = null;
					resolve();
				} catch(error) {
					reject(error);
				}
    		})
    		.then(function(result){
    			$rootScope.$broadcast('cameraIsOn',false);
    		});	
		};
		return camera;
    }]);

	app.controller('RemoteStreamsController', ['camera', '$location', '$http', function(camera, $location, $http){
		$('#example').DataTable();
		var rtc = this;
		rtc.cameraIsOn = false;
		rtc.name = 'Guest';
		rtc.link = '';
		rtc.remoteStreams = [];
		rtc.boardCameraIsPlaying=false;
		function getStreamById(id) {
		    for(var i=0; i<rtc.remoteStreams.length;i++) {
		    	if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
		    }
		}
		rtc.loadData = function () {
			// get list of streams from the server
			$http.get('/streams.json').success(function(data){
				// filter own stream
				var streams = data.filter(function(stream) {
			      	return stream.id != client.getId();
			    });
			    // get former state
			    for(var i=0; i<streams.length;i++) {
			    	var stream = getStreamById(streams[i].id);
			    	streams[i].isPlaying = (!!stream) ? stream.isPLaying : false;
			    }
			    // save new streams
			    rtc.remoteStreams = streams;
			});
		};
		rtc.qrcode = function () {
			// get list of streams from the server
			$http.get('/qrcode').success(function(data){
				console.log(data)
				loadQRCode(data.url)
			});
		};

		rtc.view = function(stream){
			client.peerInit(stream.id);
			stream.isPlaying = !stream.isPlaying;
			rtc.boardCameraIsPlaying=true;
		};
		rtc.call = function(stream){
			/* If json isn't loaded yet, construct a new stream 
			 * This happens when you load <serverUrl>/<socketId> : 
			 * it calls socketId immediatly.
			**/
			if(!stream.id){
				stream = {id: stream, isPlaying: false};
				rtc.remoteStreams.push(stream);
			}
			if(camera.isOn){
				client.toggleLocalStream(stream.id);
				if(stream.isPlaying){
					client.peerRenegociate(stream.id);
				} else {
					client.peerInit(stream.id);
				}
				stream.isPlaying = !stream.isPlaying;
			} else {
				camera.start()
				.then(function(result) {
					client.toggleLocalStream(stream.id);
					if(stream.isPlaying){
						client.peerRenegociate(stream.id);
					} else {
						client.peerInit(stream.id);
					}
					stream.isPlaying = !stream.isPlaying;
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};

		//initial 
		var checkDeviceTimerObject=null
		rtc.loadData();
		
		function checkforDevices(){
		rtc.loadData();	

		if(rtc.remoteStreams.length==0){
			checkDeviceTimerObject=setTimeout(checkforDevices(), 1000);
		}else{
			clearTimeout(checkDeviceTimerObject);
		}
		}
		rtc.qrcode();

		function loadQRCode(dataURL) {
			var canvas = document.getElementById('myqrCode');
			var context = canvas.getContext('2d');
	
			// load image from data url
			var imageObj = new Image();
			imageObj.onload = function() {
			  context.drawImage(this, 0, 0);
			};
	
			imageObj.src = dataURL;
		  }
    	if($location.url() != '/'){
      		rtc.call($location.url().slice(1));
    	};
		
		rtc.loadBoardCamera=true;
		rtc.startBoardCamera=true;
		rtc.stopBoardCamera=false;
		rtc.pauseBoardCamera=false;
		rtc.playBoardCamera=false;
		rtc.selfTeacherCamera=false;
	
		rtc.captureBoardImage = function(){
			var canvas = document.getElementById('board-camera-canvas');	
		  canvas.toBlob(function(blob) {
	  // blob ready, download it
	  let link = document.createElement('a');
	  link.download = 'example.png';
	
	  link.href = URL.createObjectURL(blob);
	  link.click();
	
	  // delete the internal blob reference, to let the browser clear memory from it
	  URL.revokeObjectURL(link.href);
	}, 'image/png');
	
		}
	  
		rtc.startRecordingBoardCamera = function(){
		rtc.startBoardCamera=false;
		rtc.stopBoardCamera=true;
		rtc.pauseBoardCamera=true;
		rtc.playBoardCamera=false;
		mediaRecorder.start();
		}
	  
		rtc.stopRecordingBoardCamera = function(){
		rtc.startBoardCamera=true;
		rtc.stopBoardCamera=false;
		rtc.pauseBoardCamera=false;
		rtc.playBoardCamera=false;
		mediaRecorder.stop();
		}
	  
		rtc.pauseRecordingBoardCamera = function(){
		  rtc.startBoardCamera=false;
		rtc.stopBoardCamera=true;
		rtc.pauseBoardCamera=false;
		rtc.playBoardCamera=true;
		mediaRecorder.pause();
		}
	  
		rtc.playRecordingBoardCamera = function(){
		  rtc.startBoardCamera=false;
		rtc.stopBoardCamera=true;
		rtc.pauseBoardCamera=true;
		rtc.playBoardCamera=false;
		mediaRecorder.resume();
		}
		rtc.startTeacherCamera = function(){
		  if(rtc.selfTeacherCamera){
			rtc.selfTeacherCamera=false;
		  }else{
			rtc.selfTeacherCamera=true;
		  }
		  rtc.toggleCam();
		}
		rtc.toggleCam = function(){
			if(rtc.cameraIsOn){
				camera.stop()
				.then(function(result){
					client.send('leave');
	    			client.setLocalStream(null);
				})
				.catch(function(err) {
					console.log(err);
				});
			} else {
				camera.start()
				.then(function(result) {
					rtc.link = $window.location.host + '/' + client.getId();
					client.send('readyToStream', { name: rtc.name });
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};
	  



	var teacherCanvas = document.getElementById("teacher-camera");
	var teacherCameraCtx = teacherCanvas.getContext("2d");
	teacherCameraCtx.fillStyle = "blue";
	teacherCameraCtx.fillRect(0, 0, teacherCanvas.width, teacherCanvas.height);
	//we use an HTML Canvas as source of the MediaStream, and stop recording after 9 seconds.
	
	// Optional frames per second argument.
	var greenBoardCameraCanvas = document.getElementById('board-camera-canvas');
	var stream = greenBoardCameraCanvas.captureStream(25);
	var recordedChunks = [];
	
	console.log(stream);
	var options = { mimeType: "video/webm; codecs=vp9" };
	mediaRecorder = new MediaRecorder(stream, options);
	
	mediaRecorder.ondataavailable = handleDataAvailable;
	
	
	function handleDataAvailable(event) {
	  console.log("data-available");
	  if (event.data.size > 0) {
		recordedChunks.push(event.data);
		console.log(recordedChunks);
		download();
	  } else {
		// ...
	  }
	}
	function download() {
	  var blob = new Blob(recordedChunks, {
		type: "video/webm"
	  });
	  var url = URL.createObjectURL(blob);
	  var a = document.createElement("a");
	  document.body.appendChild(a);
	  a.style = "display: none";
	  a.href = url;
	  a.download = "test.webm";
	  a.click();
	  window.URL.revokeObjectURL(url);
	}
	
	}]);

	app.controller('LocalStreamController',['camera', '$scope', '$window', function(camera, $scope, $window){
		var localStream = this;
		localStream.name = 'Guest';
		localStream.link = '';
		localStream.cameraIsOn = false;

		$scope.$on('cameraIsOn', function(event,data) {
    		$scope.$apply(function() {
		    	localStream.cameraIsOn = data;
		    });
		});

		localStream.toggleCam = function(){
			if(localStream.cameraIsOn){
				camera.stop()
				.then(function(result){
					client.send('leave');
	    			client.setLocalStream(null);
				})
				.catch(function(err) {
					console.log(err);
				});
			} else {
				camera.start()
				.then(function(result) {
					localStream.link = $window.location.host + '/' + client.getId();
					client.send('readyToStream', { name: localStream.name });
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};
	}]);
})();
