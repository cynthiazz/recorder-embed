<?php
	header('Access-Control-Allow-Origin: https://berkeley.qualtrics.com');
	header('Access-Control-Request-Method: POST');

	// received audio data
	if (isset($_FILES['audio_data'])) {
		print_r($_FILES); // this will print out the received name, temp name, type, size, etc.
		
		$name = $_FILES['audio_data']['name'];

		$input = $_FILES['audio_data']['tmp_name']; // temporary name that PHP gave to the uploaded file
		$output = $name.".wav";

		$dir = "audios/".explode("-", $name)[0]; // dir for the participant, named after their unique id

		if (!is_dir($dir)) {
		    // dir does not exist, so lets create it
		    mkdir($dir, 0700);
		}

		// move the file from temp name to local folder using $output name
		move_uploaded_file($input, "$dir/$output");
		exit();
	}

	print_r($_POST);
	// received naturalness rating
	if (isset($_POST['participant'])) {
		$dir = "audios/".$_POST['participant'];
		if (!is_dir($dir)) {
		    // dir does not exist (although it should); create it
		    mkdir($dir, 0700);
		}

		// open participant's csv file and add entry
		$file = "$dir/".$_POST['participant'].".csv";
		$fd = fopen($file, "a") or die("file open errored");
		$entry = $_POST['sen']."\t".$_POST['natural']."\n";
		fwrite($fd, $entry) or die("file write failed");
		exit();
	}
?>