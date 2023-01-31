import amqp from "amqplib";
import { getKnex } from '../db_knex';
import moment from 'moment';

// Keep track of the connection and channel.
let connection;
let channels = {};

const knex = getKnex();

// Export an init connection function that establishes a single connection that all channels and queues will use.
export async function initConnection() {
	// The first time through we will establish the connection
	if ( connection === undefined ) {
		connection = await amqp.connect(process.env.AMQPLIB_SERVER);
	}

	return connection;
}

// Boiler plate function to initialize a queue for consumption.
export async function registerQueue(queue, queueProcessor) {
	if (process.env.AMQPLIB_SERVER === undefined) {
		console.log("Missing AMQPLIB_SERVER setting, can not register queue: ", queue);
		return;
	} else {
		try {

			// If the connection has yet to be created, create it.
			if ( connection === undefined ) {
				await initConnection();
			}

			// Each queue will get its own channel, create one for this queue if it doesn't exist.
			if ( channels.hasOwnProperty(queue) === false) {
				channels[queue] = await connection.createConfirmChannel();
			}

			// Get the channel for the speific queue.
			const channel = channels[queue];

			// Verify that the queue has been created or create it.
			channel.assertQueue(queue, {durable: false});

			//channel.purgeQueue(queue);

			// Set up the channel to consume the events. When one consumed, call the given process function with the message.
			channel.consume(queue, (msg) => queueProcessor(msg, channel), { noAck: false });

			console.log("Registered Queue: ", queue);
		} catch(e) {
			console.log(`Could Not Registered Queue: ${queue} ${e.cause}`);
		}
	}
}

// Function to add a message to the specified queue
export async function enqueueMessage(queue, message, props = {}) {
	// console.log({queue})
	// console.log({message})
	// console.log({props})
	// The message needs to be a string.  If it is an object we will automatically convert it to JSON
	if ( typeof message === "object" ) {
		message = JSON.stringify(message);
	}
	// console.log('amqp: ', amqp.connect)
	// console.log('env: ', process.env.AMQPLIB_SERVER)
	// Create the connection to the RabbitMQ server.
	const connection = await amqp.connect(process.env.AMQPLIB_SERVER);
	// console.log({connection})
	// Create the confirm channel to send the message to.
	const channel = await connection.createConfirmChannel();
	// console.log({channel})
	// Send the message to the queue, when the message is enqueued, close the connection.
	await channel.sendToQueue(queue, Buffer.from(message), { persistent: true, timestamp: new Date().getTime(), ...props }, () => connection.close());

	console.log("Message Enqueued: ", queue);
}

// Function to check if a queue is stuck due to an error and purge the queue
export async function purgeStuckQueue(queue) {
	if (process.env.AMQPLIB_SERVER === undefined) {
		console.log("Missing AMQPLIB_SERVER setting, can not check to purge stuck queue: ", queue);
		return;
	} else {
		try {
			//console.log("Called Rabbit MQ purgeStuckQueue cron job");
			// If the connection has yet to be created, create it.
			if ( connection === undefined ) {
				await initConnection();
			}

			// Each queue will get its own channel, create one for this queue if it doesn't exist.
			if ( channels.hasOwnProperty(queue) === false) {
				channels[queue] = await connection.createConfirmChannel();
			}

			// Get the channel for the speific queue.
			const channel = channels[queue];

			// Verify that the queue has been created or create it.
			channel.assertQueue(queue, {durable: false}).then(async function(info){
				//console.log("queue messageCount: ", info.messageCount);

				// check how many messages are in the queue and check how old the oldest pending job in the db is
				let oldestPendingJob = await knex("jobs").where({ status: "pending", queue: queue }).orderBy('dateCreated', 'ASC').first();
				// figure out how many minutes ago the oldestPendingJob was
				let days = 0;
				let hours = 0;
				let minutes = 0;
				if(oldestPendingJob !== undefined) {
					let diff = moment.duration(moment(oldestPendingJob.dateCreated).diff(moment()));
					days = parseInt(diff.asDays()); //84
					hours = parseInt(diff.asHours()); //2039 hours, but it gives total hours in given miliseconds which is not expacted.
					hours = hours - days*24;  // 23 hours
					minutes = parseInt(diff.asMinutes()); // total minutes in given milliseconds which is not expacted.
					minutes = minutes - (days*24*60 + hours*60); // converted to minutes.
				}

				//console.log("Oldest Job days ", days);
				//console.log("Oldest Job hours ", hours);
				//console.log("Oldest Job minutes ", minutes);
				if(info.messageCount !== undefined && (info.messageCount > 20 || days !== 0 || hours !== 0 || minutes < -10)) {
					// clear pending jobs so they don't get stuck in a loop
					await knex("jobs").update({ status: "error" }).where({ status: "pending", queue: queue });

					// purge the queue in Rabbit
					channel.purgeQueue(queue);
					//console.log("Purged Queue: ", queue);
				}
			});



		} catch(e) {
			console.log(`Could Not Purge Check Queue: ${queue} ${e.cause}`);
		}
	}
}
