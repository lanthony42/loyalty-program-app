#!/usr/bin/env node
"use strict";

const port = (() => {
  const args = process.argv;

  if (args.length !== 3) {
    console.error("usage: node index.js port");
    process.exit(1);
  }

  const num = parseInt(args[2], 10);
  if (isNaN(num)) {
    console.error("error: argument must be an integer.");
    process.exit(1);
  }

  return num;
})();

require("dotenv").config();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

const { jwtAuth } = require("./middleware/auth");
app.use(jwtAuth);

const addUserEndpoints = require("./services/users");
addUserEndpoints(app);

const addTransactionEndpoints = require("./services/transactions");
addTransactionEndpoints(app);

const addEventEndpoints = require("./services/events");
addEventEndpoints(app);

const addPromotionEndpoints = require("./services/promotions");
addPromotionEndpoints(app);

app.use("/uploads", express.static("uploads"));

const addSeedEndpoint = require("./prisma/seed");
addSeedEndpoint(app);

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", err => {
  console.error(`cannot start server: ${err.message}`);
  process.exit(1);
});
