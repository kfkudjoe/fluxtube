const express = require("express");
const path = require("path");

if (!process.env.PORT) {
	throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

const PORT = process.env.PORT;
const storagePath = path.join(__dirname, "../storage");
console.log(`Storing files at ${storagePath}.`);

const app = express();


// HTTP GET route that streams a video from storage
app.get("/video", (req, res) => {

	const videoId = req.query.id;
	const localFilePath = path.join(storagePath, videoId);
	res.sendFile(localFilePath);
});

app.listen(PORT, () => {
	console.log(`Microservice online.`);
});