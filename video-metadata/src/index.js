const express = require("express");
const mongodb = require("mongodb");
const amqp = require("amqplib");

// Starts the microservice.
async function startMicroservice(dbHost, dbName, rabbitHost, port) {
	// Connects to the database server
	const client = await mongodb.MongoClient.connect(dbHost, { useUnifiedTopology: true });
	// Creates a MongoDB database
	const db = client.db(dbName);
	const videosCollection = db.collection("videos");

	// Connects to the RabbitMQ server
	const messagingConnection = await amqp.connect(rabbitHost);
	// Create a RabbitMQ messaging channel
	const messageChannel = await messagingConnection.createChannel();

	// Instantiate the appliction
	const app = express();
	// Enable JSON body for HTTP requests
	app.use(express.json());


	// HTTP GET route handler to retrieve list of videos from the database; Best practice is to paginate results
	app.get("/videos", async (req, res) => {
		const videos = await videosCollection.find().toArray();
		res.json({
			videos: videos
		});
	});

	// HTTP GET route handler to retrieve details for a particular video
	app.get("/video", async (req, res) => {
		const videoId = new mongodb.ObjectId(req.query.id);
		// Returns a promise so we can await the result in the test
		const video = await videosCollection.findOne({ _id: videoId });

		if (!video) {
			// Video with the requested ID doesn't exist
			res.sendStatus(404);
		}
		else {
			res.json({ video });
		}
	});

	// Helper function to handle incoming RabbitMQ messages
	async function consumeVideoUploadedMessage(msg) {
		console.log("Received a 'viewed-uploaded' message");

		// Parse the JSON message
		const parsedMsg = JSON.parse(msg.content.toString());

		const videoMetadata = {
			_id: new mongodb.ObjectId(parsedMsg.video.id),
			name: parsedMsg.video.name,
		};

		// Record the video metadata
		await videosCollection.insertOne(videoMetadata);

		console.log("Acknowledging message was handled.");
		// If there is no error, acknowledge the message
		messageChannel.ack(msg);
	};

	// Other route handlers here


	// Asserts that there is a "video-uploaded" exchange
	await messageChannel.assertExchange("video-uploaded", "fanout");
	// Creates an anonymous queue
	const { queue } = await messageChannel.assertQueue("", {});
	// Bind the queue to the exchange
	await messageChannel.bindQueue(queue, "video-uploaded", "");
	// Start receiving messages frmo the anonymous queue
	await messageChannel.consume(queue, consumeVideoUploadedMessage);


	// Start the HTTP server
	app.listen(port, () => {
		console.log("Microservice online.");
	});

}


// Application entry point
async function main() {
	if (!process.env.PORT) {
		throw new Error("Please specify the port number for HTTP server with the environment variable PORT.");
	}

	if (!process.env.DBHOST) {
		throw new Error("Please specify the database host using environment variable DBHOST.");
	}

	if (!process.env.DBNAME) {
		throw new Error("Please specify the database name using environment variable DBNAME.");
	}

	if (!process.env.RABBIT) {
		throw new Error("Please specify the name of the RabbitMQ host using the environment variable RABBIT.");
	}

	const PORT = process.env.PORT;
	const DBHOST = process.env.DBHOST;
	const DBNAME = process.env.DBNAME;
	const RABBIT = process.env.RABBIT;

	await startMicroservice(DBHOST, DBNAME, RABBIT, PORT);
}


if (require.main === module) {
	// Only start the microservice normally if this script is the "main" module
	main()
		.catch(err => {
			console.error("Microservice failed to start.");
			console.error(err && err.stack || err);
		});
}
else {
	// Otherwise run under test
	module.exports = {
		startMicroservice,
	};
}