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
require('dotenv').config();
const amqplib_1 = __importDefault(require("amqplib"));
// RabbitMQ connection string
const messageQueueConnectionString = process.env.AMQP_SERVER + '';
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Setting up RabbitMQ Exchanges/Queues");
        // connect to RabbitMQ Instance
        let connection = yield amqplib_1.default.connect(messageQueueConnectionString);
        // create a channel
        let channel = yield connection.createChannel();
        // create exchange
        yield channel.assertExchange("processing", "direct", { durable: true });
        // create queues
        yield channel.assertQueue("processing.requests", { durable: true });
        yield channel.assertQueue("processing.results", { durable: true });
        // bind queues
        yield channel.bindQueue("processing.requests", "processing", "request");
        yield channel.bindQueue("processing.results", "processing", "result");
        console.log("Setup DONE");
        process.exit();
    });
}
setup();
//# sourceMappingURL=rabbit_mq_setup.js.map