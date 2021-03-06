Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/

});

Qualtrics.SurveyEngine.addOnReady(function()
{
	// disable next button before a recording is submitted
	this.disableNextButton();
	// save a reference to the qualtrics QuestionData obj
	var question = this;
	
	// webkitURL is deprecated but nevertheless
	URL = window.URL || window.webkitURL;

	var gumStream; 						// stream from getUserMedia()
	var rec; 							// Recorder.js object
	var input; 							// MediaStreamAudioSourceNode we'll be recording

	// shim for AudioContext when it's not avb. 
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	var audioContext // audio context to help us record

	var recordButton = document.getElementById("recordButton");
	var stopButton = document.getElementById("stopButton");
	var submitButton = document.getElementById("submitButton");
	var au = document.getElementById("playback");
	var blobHolder = undefined;

	// add events to those 3 buttons
	recordButton.addEventListener("click", startRecording);
	stopButton.addEventListener("click", stopRecording);
	submitButton.addEventListener("click", sendRequest);

	function startRecording() {
		console.log("recordButton clicked");

		/*
			Simple constraints object, for more advanced audio features see
			https://addpipe.com/blog/audio-constraints-getusermedia/
		*/

		var constraints = { audio: true, video: false }

		/*
			Disable the record button until we get a success or fail from getUserMedia() 
		*/

		recordButton.disabled = true;
		recordButton.innerHTML = "Recording...";
		stopButton.disabled = false;
		submitButton.disabled = true;

		/*
			We're using the standard promise based getUserMedia() 
			https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
		*/

		navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
			console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

			/*
				create an audio context after getUserMedia is called
				sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
				the sampleRate defaults to the one set in your OS for your playback device
			*/
			audioContext = new AudioContext();

			//update the format 
			// document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

			/*  assign to gumStream for later use  */
			gumStream = stream;

			/* use the stream */
			input = audioContext.createMediaStreamSource(stream);

			/* 
				Create the Recorder object and configure to record mono sound (1 channel)
				Recording 2 channels  will double the file size
			*/
			rec = new Recorder(input,{numChannels:1});

			// start the recording process
			rec.record();

			console.log("Recording started");

		}).catch(function(err) {
			// enable the record button if getUserMedia() fails
			recordButton.disabled = false;
			stopButton.disabled = true;
			submitButton.disabled = true;
		});
	}

	function stopRecording() {
		console.log("stopButton clicked");

		//disable the stop button, enable record to allow new recordings and enable submit
		stopButton.disabled = true;
		recordButton.disabled = false;
		submitButton.disabled = false;

		// change text on record button to "re-record"
		recordButton.innerHTML = "Re-record";

		// tell the recorder to stop the recording
		rec.stop();

		// stop microphone access
		gumStream.getAudioTracks()[0].stop();

		// create the wav blob and pass it on to createBlobLink
		rec.exportWAV(createBlobLink);

		// clear recorder
		rec.clear();
	}

	function createBlobLink(blob) {
		console.log("creating playback");
		console.log("blob: ", blob);

		var url = URL.createObjectURL(blob);

		// set audio source to new blob
		au.src = url;

		// blobHolder holds the last blob recorded, which will be sent
		blobHolder = blob;
	}

	function sendRequest(){
		console.log("sending request...");

		// create request and send blob to ocf server
		var xhr = new XMLHttpRequest();
		xhr.onload = function(e) {
		  if (this.readyState === 4) {
			  console.log("Server returned: ", e.target.responseText);
		  }
		};
		
		var fd = new FormData();
		var sen = document.getElementById("sen");
		var filename = "${e://Field/random_id}" + "-" + sen.getAttribute("data-sen-id");
		fd.append("audio_data", blobHolder, filename);
		console.log("submit blob: ", blobHolder);
		xhr.open("POST", "YOUR_SERVER_ADDRESS", true);
		xhr.send(fd);

		// reset submit button
		submitButton.disabled = true;
		submitButton.innerHTML = "Submitted";

		// reset record button
		recordButton.innerHTML = "Record";
		recordButton.disabled = true;
		
		// enable next button
		question.enableNextButton();
	}

});

Qualtrics.SurveyEngine.addOnPageSubmit(function(type){
	if (type == "next") {
		// send whether "don't know" is checked
		var xhr = new XMLHttpRequest();
		xhr.onload = function(e) {
			if (this.readyState === 4) {
				console.log("Server returned: ", e.target.responseText);
			}
		};

		var fd = new FormData();
		// assume embedded data "random_id" exists
		fd.append("participant", "${e://Field/random_id}");
		var id = document.getElementById("sen").getAttribute("data-sen-id");
		console.log("id: ", id);
		fd.append("sen", id);
		var dont = this.getSelectedChoices();
		if (dont.length != 0) {
			// if "don't know" is checked, set naturalness to 0
			fd.append("natural", 0);
		} else {
			fd.append("natural", 5);
		}		
		console.log("form: ", fd);
		xhr.open("POST", "YOUR_SERVER_ADDRESS", true);
		xhr.send(fd);
	}
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/
});