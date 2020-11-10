require("dotenv").config();
import express from "express";

import amqp from 'amqplib';
import { Response, Request } from "express";
const app = express();
// const router = express.Router();

// app.use(router);
// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded());

// RabbitMQ connection string
const messageQueueConnectionString = `amqp://${process.env.AMQP_USER}:${encodeURIComponent(process.env.AMQP_PASS)}@${process.env.AMQP_HOST}`;
// const messageQueueConnectionString = process.env.AMQP_SERVER+'';
async function listenForMessages() {
  // connect to Rabbit MQ
  let connection = await amqp.connect(messageQueueConnectionString);

  // create a channel and prefetch 1 message at a time
  let channel = await connection.createChannel();
  await channel.prefetch(1);

  // create a second channel to send back the results
  let resultsChannel = await connection.createConfirmChannel();


  // start consuming messages
  await consume({ connection, channel, resultsChannel });
}

// utility function to publish messages to a channel
function publishToChannel(channel: any, { routingKey, exchangeName, data }: { routingKey: string, exchangeName: string, data: any }) {
  return new Promise((resolve, reject) => {
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data), 'utf-8'), { persistent: true }, function (err: any, ok: any) {
      if (err) {
        return reject(err);
      }

      resolve();
    })
  });
}

// consume messages from RabbitMQ
function consume({ connection, channel, resultsChannel }: { connection: any, channel: any, resultsChannel: any }) {
  return new Promise((resolve, reject) => {
    channel.consume("requestUser.pushMessage", async function (msg: any) {
      // parse message
      let msgBody = msg.content.toString();

      if (msgBody) {
        let data = JSON.parse(msgBody);
        let requestId = data.requestId;
        let requestData = data.requestData;
        console.log("Received a request message, requestId:", requestId);

        // process data
        let processingResults = await processMessage(requestData);
        // publish results to channel
        await publishToChannel(resultsChannel, {
          exchangeName: "requestUser",
          routingKey: "sendMessage",
          data: { requestId, processingResults }
        });
        console.log("Published results for requestId:", requestId);
      }
      // acknowledge message as processed successfully
      await channel.ack(msg);
    });

    // channel.consume("scanVehicle.pushScanLicenseplate", async function (msg: any) {
    //   // parse message
    //   let msgBody = msg.content.toString();
    //   console.log(msg);

    //   if (msgBody) {
    //     let data = JSON.parse(msgBody);
    //     let requestId = data.requestId;
    //     let requestData = data.requestData;
    //     console.log("Received a request message, requestId:", requestId);

    //     // process data
    //     let processingResults = await processMessage(requestData);

    //     // publish results to channel
    //     await publishToChannel(resultsChannel, {
    //       exchangeName: "scanVehicle",
    //       routingKey: "sendScanLicenseplate",
    //       data: { requestId, processingResults }
    //     });
    //     console.log("Published results for requestId:", requestId);
    //   }
    //   // acknowledge message as processed successfully
    //   await channel.ack(msg);
    // });

    // handle connection closed
    connection.on("close", (err: any) => {
      return reject(err);
    });

    // handle errors
    connection.on("error", (err: any) => {
      return reject(err);
    });
  });
}

// simulate data processing that takes 5 seconds
function processMessage(requestData: any) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(requestData)
    }, 5000);
  });
}

listenForMessages();