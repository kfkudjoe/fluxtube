const express = require("express");
const mongodb = require("mongodb");
const amqp = require("amqplib");

if (!process.env.PORT) {
	throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.DBHOST) {
	throw new Error("Please specify the database host using the environment variable DBHOST.");
}

if (!process.env.DBNAME) {
	throw new Error("Please specify the name of the database using the environment variable DBNAME.");
}

if (!process.env.RABBIT) {
	throw new Error("Please specify the name of the RabbitMQ host using the environment variable RABBIT.");
}

const PORT = process.env.PORT;
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;


// Application entry point
async function main() {

	// Instantiates the application
	const app = express();

	// Enables JSON body parsing for HTTP requests
	app.use(express.json());

	// Connects to the database server
	const client = await mongodb.MongoClient.connect(DBHOST);

	// Gets the database for this microservice
	const db = client.db(DBNAME);

	// Gets the collection for storing video viewing history
	const historyCollection = db.collection("history");

	// Connects to the RabbitMQ server
	const messagingConnection = await amqp.connect(RABBIT);

	// Creates a RabbitMQ messaging channel
	const messageChannel = await messagingConnection.createChannel();

	// Asserts that we have a "viewed" exchange
	await messageChannel.assertExchange("viewed", "fanout");

	// Creates an anonymous queue
	const { queue } = await messageChannel.assertQueue("", { exclusive: true });
	console.log(`Create queue ${queue}, binding it to the "viewed exchange.`);

	// Binds the queue to the exchange
	await messageChannel.bindQueue(queue, "viewed", "");

	// Start receiving messages from the anonymous queue
	await messageChannel.consume(queue, async (msg) => {
		console.log("Received a 'viewed' message");

		// Parse the JSON message
		const parsedMsg = JSON.parse(msg.content.toString());

		// Record the "view" in the database
		await historyCollection.insertOne({ videoId: parsedMsg.video.id });

		console.log("Acknowledging that the message was handled.");

		// If there is no error, acknowledge the message
		messageChannel.ack(msg);
	});

	// HTTP GET route handler for retrieving video viewing history
	app.get("/history", async (req, res) => {
		// Retrieves viewing history from the database; Best practice is to paginate this
		const history = await historyCollection.find().toArray();
		res.json({ history });
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
	})