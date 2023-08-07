// imports
const express = require("express");
const morgan = require("morgan");
const amqp = require("amqplib");
// init express app
const app = express();

// use morgan middleware
app.use(morgan("combined"));
app.use(express.json());

const rabbitmqUrl = "amqp://rabbitmq-service";

app.get("/", (req, res) => {
    res.send("Hello World");
});

// ! BILLING CRUD OPERATIONS
app.get("/billing", (req, res) => {
    res.send("GET BILLING");
});

app.post("/billing", async(req, res) => {
    console.log(req.body);

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
    };

    try {
        const connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();

        const exchange = "data_exchange";
        await channel.assertExchange(exchange, "fanout", { durable: false });

        const payload = JSON.stringify(req.body);

        channel.publish(exchange, "", Buffer.from(payload), {
            headers: { "x-forwarded-message": true }
        });

        console.log("Forwarded payload to RabbitMQ:", payload);

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error("Error forwarding payload to data-service:", error);
    }

    res.send({ "msg": "POST BILLING" });
});

app.put("/billing", (req, res) => {
    res.send("PUT BILLING");
});

app.delete("/billing", (req, res) => {
    res.send("DELETE BILLING");
});

app.listen(3000, () => {
    console.log('Billing Server listening on port 3000');
});
