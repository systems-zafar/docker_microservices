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

// ! USERS CRUD OPERATIONS
app.get("/users", (req, res) => {
    res.send("GET USERS");
});

app.post("/users", async(req, res) => {
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

    res.send("POST USERS");
});

app.put("/users", (req, res) => {
    res.send("PUT USERS");
});

app.delete("/users", (req, res) => {
    res.send("DELETE USERS");
});

app.listen(3003, () => {
    console.log('Users Server listening on port 3003');
});
