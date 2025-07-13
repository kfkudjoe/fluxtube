const express = require("express");
const amqp = require("amqplib");
const axios = require("axios");

if (!process.env.PORT) {
	throw new Error("Please specify the port number for the HTTP server with the environment varible PORT.")
}

if (!process.env.RABBIT) {
	throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT.")
}

const PORT = process.env.PORT;
const RABBIT = process.env.RABBIT;

// Application entry point
async function main() {
	// Connects to the RabbitMQ server
	const messagingConnection = await amqp.connect(RABBIT);
	// Creates a RabbitMQ messaging channel
	const messageChannel = await messagingConnection.createChannel();
	// Asserts that we have a "viewed" exchange
	await messageChannel.assertExchange("viewed", "fanout");

	// Broadcasts the "viewed" message to other microservices
	function broadcastViewedMessage(messageChannel, videoId) {
		console.log (`Publishing message on "viewed" exchange.`);
		const msg = { video: { id: videoId } };
		const jsonMsg = JSON.stringify(msg);

		// Publishes the message to the "viewed" exchange.
		messageChannel.publish("viewed", "", Buffer.from(jsonMsg));
	}

	// Instantiate the application
	const app = express();

	// Route for streaming video
	app.get("/video", async (req, res) => {

		const videoId = req.query.id;

		// Forwards the request to the video-storage microservice
		const response = await axios({
			method: "GET",
			url: `http://video-storage-fluxtube/video?id=${videoId}`,
			data: req,
			responseType: "stream",
		});
		
		response.data.pipe(res);

		// Sends the "viewed" message to indicate this video has been watched.
		broadcastViewedMessage(messageChannel, videoId);
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