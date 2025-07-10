const express = require("express");
const axios = require("axios");

if (!process.env.PORT) {
	throw new Error("Please specify the port number for the HTTP server with the environment varible PORT.")
}

const PORT = process.env.PORT;


// Application entry point
async function main() {

	// Instantiate the application
	const app = express();

	// Route for streaming video
	app.get("/video", async (req, res) => {

		const videoId = req.query.id;

		// Forwards the request to the video-storage microservice
		const response = await axios({
			method: "GET",
			url: `http://video-storage/video?id=${videoId}`,
			data: req,
			responseType: "stream",
		});
		
		response.data.pipe(res);
	});

	// Starts the HTTP server
	app.listen(PORT, () => {
		console.log("Microservice online.");
	});
}

main()
	.catch(err => {
		console.error("Microservice failed to start.");
		console.error(err && err.stack || err);
	});