const express = require("express");
const path = require("path");
const axios = require("axios");

if (!process.env.PORT) {
	throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}
if (!process.env.METADATA_HOST) {
	throw new Error("Please specify the metadata microservice host using the environment variable METADATA_HOST.");
}
if (!process.env.HISTORY_HOST) {
	throw new Error("Please specify the history microservice host using the environment variable HISTORY_HOST.");
}
if (!process.env.VIDEO_STREAMING_HOST) {
	throw new Error("Please specify the video streaming microservice host using the environment variable VIDEO_STREAMING_HOST.");
}
if (!process.env.VIDEO_UPLOAD_HOST) {
	throw new Error("Please specify the video upload microservice host using the environment variable VIDEO_UPLOAD_HOST.");
}

const PORT = process.env.PORT;
const METADATA_HOST = process.env.METADATA_HOST;
const METADATA_PORT = 3000; // Common internal port for Node.js services
const HISTORY_HOST = process.env.HISTORY_HOST;
const HISTORY_PORT = 3000; // Common internal port for Node.js services
const VIDEO_STREAMING_HOST = process.env.VIDEO_STREAMING_HOST;
const VIDEO_STREAMING_PORT = 3000; // Common internal port for Node.js services
const VIDEO_UPLOAD_HOST = process.env.VIDEO_UPLOAD_HOST;
const VIDEO_UPLOAD_PORT = 3000; 


// Application entry point
async function main() {

	const app = express();

	// Views management configuration goes here
	// Tells Express where to find your `.hbs` template files. 
	// `__dirname` is the current directory (`src`), 
	// so `path.join(__dirname, 'views')` points to `src/views`.
	app.set('views', path.join(__dirname, 'views'));
	// Set Handlebars as the view engine
	app.set('view engine', 'hbs');
	// Serve static files from the 'public' directory
	// This is crucial. It tells Express to serve static files (like your `tailwind.min.css`, `app.css`, and `upload.js`)
	// from the `public` directory. `path.join(__dirname, '..', 'public')` 
	// correctly navigates up one level from `src` to the `video-gateway` root and then into `public`.
	app.use(express.static(path.join(__dirname, '..', 'public')));

	// Main web page that lists videos
	app.get("/", async (req, res) => {
		try {
			// Retrieves the list of videos from the metadata microservice
			const videoResponse = await axios.get(`http://${METADATA_HOST}:${METADATA_PORT}/videos`);
			// Renders the video list for display in the browser
			res.render("video-list", { videos: videoResponse.data.videos });

		} catch (err) {
			console.error("Error retrieving videos from metadata service: ", err.message);
			res.status(500).send("Failed to retrieve video list.");
		}
	});

	// Web page to play a particular video
	app.get("/video", async (req, res) => {
		const videoId = req.query.id;
		
		try {

			// Retrieves the data from the metadata microservice
			const videoResponse = await axios.get(`http://${METADATA_HOST}:${METADATA_PORT}/video?id=${videoId}`);

			const video = {
				metadata: videoResponse.data.video,
				// This URL is handled by the API Gateway itself
				url: `/api/video?id=${videoId}`,
			};

			// Renders the video for display in the browser
			res.render("play-video", { video });
		} catch (err) {
			console.error(`Error retrieving video metadata for ID ${videoId}:`, err.message);

			if (err.response && err.response.status == 404) {
				res.status(404).send("Video not found.");
			} else {
				res.status(500).send("Failed to retrieve video details.");
			}
		}
	});

	// Web page to upload a new video
	app.get("/upload", (req, res) => {
		res.render("upload-video", {});
	});

	// Web page to show viewing history
	app.get("/history", async (req, res) => {
		try {
			// Retrieves the data from the history microservice
			const historyResponse = await axios.get(`http://${HISTORY_HOST}:${HISTORY_PORT}/history`);
			// Renders the history for display in the browser
			res.render("history", { videos: historyResponse.data.history });
		} catch (err) {
			console.error("Error retrieving history from history service: ", err.message);
			res.status(500).send("Failed to retrieve viewing history.");
		}
	});

	// HTTP GET route that streams video to the user's browser
	app.get("/api/video", async (req, res) => {
		try {
			const response = await axios({
				// Forwards the request to the video-streaming microservice
				method: "GET",
				url: `http://${VIDEO_STREAMING_HOST}:${VIDEO_STREAMING_PORT}/video?id=${req.query.id}`,
				// Forward original request body/headers if needed, though GET usually doesn't have body
				data: req,
				responseType: "stream",
			});
			// Pipe the stream directly to the client
			response.data.pipe(res);
		} catch (err) {
			console.error(`Error streaming video ID ${req.query.id} from streaming service: `, err.message);
			res.status(500).send("Failed to stream video.");
		}
	});

	// HTTP POST route to upload video from the user's browser
	app.post("/api/upload", async (req, res) => {
		try {
			// Forwards the request to the video-upload micrservice
			const response = await axios({
				method: "POST",
				url: `http://${VIDEO_UPLOAD_HOST}:${VIDEO_UPLOAD_PORT}/upload`,
				data: req, // Forward the incoming request stream/body
				responseType: "stream", // Expect a stream back
				headers: {
					"content-type": req.headers["content-type"],
					"file-name": req.headers["file-name"],
				},
			});
			// Pipe the response stream back to the client
			response.data.pipe(res);
		} catch (err) {
			console.error("Error uploading video to upload service: ", err.message);
			res.status(500).send("Failed to upload video.");
		}
	});

	app.listen(PORT, () => {
		console.log("Microservice online.");
	});
}

main()
	.catch(err => {
		console.error("Microservice failed to start.");
		console.error(err && err.stack || err);
	});