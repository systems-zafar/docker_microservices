const amqp = require("amqplib");

async function start() {
    const connection = await amqp.connect("amqp://rabbitmq-service");
    const channel = await connection.createChannel();

    const exchange = "data_exchange";
    await channel.assertExchange(exchange, "fanout", { durable: false });

    const queue = await channel.assertQueue("", { exclusive: true });
    channel.bindQueue(queue.queue, exchange, "");

    console.log("webhook-service listening for messages...");

    channel.consume(queue.queue, (msg) => {
        const payload = msg.content.toString();
        console.log("Received message:", payload);

    }, { noAck: true });
}

start();
