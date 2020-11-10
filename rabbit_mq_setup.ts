require('dotenv').config();

import amqp from 'amqplib';

// RabbitMQ connection string
const messageQueueConnectionString = process.env.AMQP_SERVER;
// const messageQueueConnectionString = `amqp://${process.env.AMQP_USER}:${encodeURIComponent(process.env.AMQP_PASS)}@${process.env.AMQP_HOST}`;

async function setup() {
  console.log("Setting up RabbitMQ Exchanges/Queues");
  // connect to RabbitMQ Instance
  let connection = await amqp.connect(messageQueueConnectionString);

  // create a channel
  let channel = await connection.createChannel();

  // create exchange
  await channel.assertExchange("processing", "direct", { durable: true });

  // create queues
  await channel.assertQueue("processing.requests", { durable: true });
  await channel.assertQueue("processing.results", { durable: true });

  // bind queues
  await channel.bindQueue("processing.requests","processing", "request");
  await channel.bindQueue("processing.results","processing", "result");

  console.log("Setup DONE");
  process.exit();
}

setup();