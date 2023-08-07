const amqp = require("amqplib");

async function start() {
    let connection;
    let channel;

    while (true) {
        try {
            connection = await amqp.connect("amqp://rabbitmq-service");
            channel = await connection.createChannel();
            break;
        } catch (error) {
            console.error("Error connecting to RabbitMQ. Retrying in 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    const exchange = "data_exchange";
    await channel.assertExchange(exchange, "fanout", { durable: false });

    const queue = await channel.assertQueue("", { exclusive: true });
    channel.bindQueue(queue.queue, exchange, "");

    console.log("data-service listening for messages...");

    channel.consume(queue.queue, (msg) => {
        const payload = msg.content.toString();
        console.log("Received message:", payload);

        if (!msg.properties.headers || !msg.properties.headers["x-forwarded-message"]) {
            channel.publish(exchange, "", Buffer.from(payload), {
                headers: { "x-forwarded-message": true }
            });
        }
    }, { noAck: true });
}

start();
