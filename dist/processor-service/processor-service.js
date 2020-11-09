"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const amqplib_1 = __importDefault(require("amqplib"));
const app = express_1.default();
// const router = express.Router();
// app.use(router);
// Middleware
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded());
// RabbitMQ connection string
// const messageQueueConnectionString = `amqp://${process.env.AMQP_USER}:${encodeURIComponent(process.env.AMQP_PASS)}@${process.env.AMQP_HOST}`;
const messageQueueConnectionString = process.env.AMQP_SERVER + '';
function listenForMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        // connect to Rabbit MQ
        let connection = yield amqplib_1.default.connect(messageQueueConnectionString);
        // create a channel and prefetch 1 message at a time
        let channel = yield connection.createChannel();
        yield channel.prefetch(1);
        // create a second channel to send back the results
        let resultsChannel = yield connection.createConfirmChannel();
        // start consuming messages
        yield consume({ connection, channel, resultsChannel });
    });
}
// utility function to publish messages to a channel
function publishToChannel(channel, { routingKey, exchangeName, data }) {
    return new Promise((resolve, reject) => {
        channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data), 'utf-8'), { persistent: true }, function (err, ok) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
// consume messages from RabbitMQ
function consume({ connection, channel, resultsChannel }) {
    return new Promise((resolve, reject) => {
        channel.consume("requestUser.pushMessage", function (msg) {
            return __awaiter(this, void 0, void 0, function* () {
                // parse message
                let msgBody = msg.content.toString();
                if (msgBody) {
                    let data = JSON.parse(msgBody);
                    let requestId = data.requestId;
                    let requestData = data.requestData;
                    console.log("Received a request message, requestId:", requestId);
                    // process data
                    let processingResults = yield processMessage(requestData);
                    // publish results to channel
                    yield publishToChannel(resultsChannel, {
                        exchangeName: "requestUser",
                        routingKey: "sendMessage",
                        data: { requestId, processingResults }
                    });
                    console.log("Published results for requestId:", requestId);
                }
                // acknowledge message as processed successfully
                yield channel.ack(msg);
            });
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
        connection.on("close", (err) => {
            return reject(err);
        });
        // handle errors
        connection.on("error", (err) => {
            return reject(err);
        });
    });
}
// simulate data processing that takes 5 seconds
function processMessage(requestData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(requestData);
        }, 5000);
    });
}
listenForMessages();
//# sourceMappingURL=processor-service.js.map