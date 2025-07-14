const express = require("express");
const mongodb = require("mongodb");
const amqp = require("amqplib");
const axios = require("axios");


if (!process.env.PORT) {
	throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.RABBIT) {
	throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT.");
}

if (!process.env.VIDEO_STORAGE_HOST) {
	throw new Error("Please specify the name of the video storage host container using the environment variable VIDEO_STORAGE_HOST.")
}

if (!process.env.VIDEO_STORAGE_PORT) {
	throw new Error("Please specify the port number of the video storage container using the envioronment variable VIDEO_STORAGE_PORT.")
}


const PORT = process.env.PORT;
const RABBIT = process.env.RABBIT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = process.env.VIDEO_STORAGE_PORT;

// Application entry point
async function main() {

	// Connects to the RabbitMQ server
	const messagingConnection = await amqp.connect(RABBIT);
	// Creates a RabbitMQ messaging channel
	const messageChannel = await messagingConnection.createChannel();
	// Assert that we have a "viewed" RabbitMQ exchange
	await messageChannel.assertExchange("video-uploaded","fanout");
	// Initialize the applciation
	const app = express();


	// Broadcasts the "video-uploaded" message
	function broadcastVideoUploadedMessage(videoMetadata) {
		console.log(`Publishing message on "video-uploaded" exchange.`);
		const msg = { video: videoMetadata };
		const jsonMsg = JSON.stringify(msg);
		// Publishes the message to the "video-uploaded" exchange
		messageChannel.publish("video-uploaded", "", Buffer.from(jsonMsg));
	};

	// Route handler for uploading videos
	app.post("/upload", async (req, res) => {
		
		const fileName = req.headers["file-name"];
		// Creates a new unique ID for the video
		const videoId = new mongodb.ObjectId();
		// Forwards the request to the video-storage microservice
		const response = await axios({
			method: "POST",
			url: `http://${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}/upload`,
			data: req,
			responseType: "stream",
			headers: {
				"content-type": req.headers["content-type"],
				"id": videoId,
			},
		});
		
		response.data.pipe(res);

		// Broadcasts the message to other microservices
		broadcastVideoUploadedMessage({id: videoId, name: fileName});
	});

	// Other handler functions go here


	// Start the HTTP server
	app.listen(PORT, () => {
		console.log("Microservice online.");
	});
}

main()
	.catch(err => {
		console.error("Microservice failed to start.");
		console.error(err && err.stack || err);
	});