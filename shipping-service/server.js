// imports
const express = require("express");
const morgan = require("morgan");
const fetch = require("node-fetch");
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

// ! SHIPPING OPERATIONS
app.get("/shipping", (req, res) => {
    res.send("GET SHIPPING");
});

app.post("/shipping", async(req, res) => {
    const url = 'http://billing-service:3000/billing/';

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
    };

    try {
        const response = await fetch(url, requestOptions);
        const responseData = await response.json();
        console.log("Billing service called");
    } catch (error) {
        console.error('Error calling billing-service:', error);
    }

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

    res.send("POST SHIPPING");
});

app.put("/shipping", (req, res) => {
    res.send("PUT SHIPPING");
});

app.delete("/shipping", (req, res) => {
    res.send("DELETE SHIPPING");
});

app.listen(3002, () => {
    console.log('Shipping Server listening on port 3002');
});
