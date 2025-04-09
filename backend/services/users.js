"use strict";

const { createToken, cashierOrHigher, managerOrHigher } = require("../middleware/auth");
const { defined, isoDate } = require("./utils");
const { getPrisma, Role, PromotionType } = require("../prisma/prisma");

const validate = require("./validate");
const multer = require("multer");
const fs = require("fs");

const REGISTER_EXPIRY = 7 * 24 * 60 * 60;
const RESET_EXPIRY = 60 * 60;
const RATE_LIMIT = 60 * 1000;

const lastRequests = new Map();
const storage = multer.diskStorage({
  destination: (_0, _1, cb) => {
    const path = "uploads/avatars/";
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    cb(null, path);
  },
  filename: (req, file, cb) => {
    const tokens = file.originalname.split(".");
    cb(null, `${req.user.username}_${Date.now()}.${tokens[tokens.length - 1]}`);
  }
});
const upload = multer({ storage });

module.exports = app => {
  app.post("/users", cashierOrHigher, async (req, res) => {
    const fields = ["utorid", "name", "email"];

    if (!validate.required(req.body, "utorid")) {
      res.status(400).json({ error: "UTORid was required" });
      return;
    }
    else if (!validate.required(req.body, "name")) {
      res.status(400).json({ error: "Name was required" });
      return;
    }
    else if (!validate.required(req.body, "email")) {
      res.status(400).json({ error: "Email was required" });
      return;
    }
    else if (!validate.string(req.body, "utorid")) {
      res.status(400).json({ error: "UTORid was not a string" });
      return;
    }
    else if (!validate.string(req.body, "name")) {
      res.status(400).json({ error: "Name was not a string" });
      return;
    }
    else if (!validate.string(req.body, "email")) {
      res.status(400).json({ error: "Email was not a string" });
      return;
    }
    else if (!/^[a-zA-Z0-9]{8}$/.test(req.body.utorid)) {
      res.status(400).json({ error: "UTORid was invalid" });
      return;
    }
    else if (req.body.name.length > 50) {
      res.status(400).json({ error: "Name exceeded 50 characters" });
      return;
    }
    else if (!req.body.email.endsWith("@mail.utoronto.ca")) {
      res.status(400).json({ error: "Email was invalid utoronto email" });
      return;
    }

    try {
      const user = await getPrisma().user.create({
        data: {
          username: req.body.utorid,
          name: req.body.name,
          email: req.body.email
        }
      });

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + REGISTER_EXPIRY);
      const resetToken = await getPrisma().resetToken.create({
        data: {
          expiresAt,
          userId: user.id
        }
      });

      res.status(201).json({
        id: user.id,
        utorid: user.username,
        name: user.name,
        email: user.email,
        verified: user.verified,
        expiresAt: resetToken.expiresAt,
        resetToken: resetToken.token
      });
    }
    catch {
      res.status(409).json({ error: "Conflict" });
    }
  });

  app.get("/users", managerOrHigher, async (req, res) => {
    const valid = (
      validate.string(req.query, "name") &&
      validate.role(req.query, "role") &&
      validate.boolean(req.query, "verified", "activated") &&
      validate.positiveInt(req.query, "page", "limit")
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const AND = [];
    if (defined(req.query, "name")) {
      AND.push({
        OR: [
          { username: req.query.name },
          { name: req.query.name }
        ]
      });
    }
    if (defined(req.query, "role")) {
      AND.push({ role: req.query.role });
    }
    if (defined(req.query, "verified")) {
      AND.push({ verified: req.query.verified });
    }
    if (defined(req.query, "activated")) {
      AND.push({
        lastLogin: req.query.activated ? { not: null } : null
      });
    }

    const take = req.query.limit || 10;
    const skip = (req.query.page || 1) * take - take;
    const count = await getPrisma().user.count({
      where: { AND }
    });
    const users = await getPrisma().user.findMany({
      where: { AND },
      orderBy: {
        id: "desc"
      },
      skip,
      take
    });
    res.status(200).json({
      count,
      results: users.map(user => {
        return {
          id: user.id,
          utorid: user.username,
          name: user.name,
          email: user.email,
          birthday: isoDate(user.birthday),
          role: user.role.toLowerCase(),
          points: user.points,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          verified: user.verified,
          avatarUrl: user.avatarUrl
        };
      })
    });
  });

  app.patch("/users/me", upload.single("avatar"), async (req, res) => {
    const valid = (
      validate.string(req.body, "name", "email") &&
      validate.date(req.body, "birthday") &&
      (validate.notEmpty(req.body) || defined(req, "file")) &&
      (!defined(req.body, "name") || req.body.name.length <= 50) &&
      (!defined(req.body, "email") || req.body.email.endsWith("@mail.utoronto.ca"))
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const data = {};
    if (defined(req.body, "name")) {
      data.name = req.body.name;
    }
    if (defined(req.body, "email")) {
      data.email = req.body.email;
    }
    if (defined(req.body, "birthday")) {
      data.birthday = req.body.birthday;
    }
    if (defined(req, "file")) {
      data.avatarUrl = `/${req.file.path.replace(/\\/g, "/")}`;
    }

    try {
      const user = await getPrisma().user.update({
        where: {
          id: req.user.id
        },
        data
      });
      
      res.status(200).json({
        id: user.id,
        utorid: user.username,
        name: user.name,
        email: user.email,
        birthday: isoDate(user.birthday),
        role: user.role.toLowerCase(),
        points: user.points,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        verified: user.verified,
        avatarUrl: user.avatarUrl
      });
    }
    catch {
      res.status(400).json({ error: "Bad Request" });
    }
  });

  app.get("/users/me", async (req, res) => {
    const promotions = await getPrisma().promotion.findMany({
      where: {
        type: PromotionType.ONE_TIME,
        startTime: { lte: new Date() },
        endTime: { gt: new Date() },
        NOT: {
          transactions: {
            some: {
              receivedById: req.user.id
            }
          }
        }
      }
    });

    res.status(200).json({
      id: req.user.id,
      utorid: req.user.username,
      name: req.user.name,
      email: req.user.email,
      birthday: isoDate(req.user.birthday),
      role: req.user.role.toLowerCase(),
      points: req.user.points,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin,
      verified: req.user.verified,
      avatarUrl: req.user.avatarUrl,
      promotions: promotions.map(promotion => {
        return {
          id: promotion.id,
          name: promotion.name,
          minSpending: promotion.minSpending,
          rate: promotion.rate,
          points: promotion.points
        };
      })
    });
  });

  app.patch("/users/me/password", async (req, res) => {
    const fields = ["old", "new"];
    const valid = (
      validate.required(req.body, ...fields) &&
      validate.string(req.body, ...fields) &&
      /^.{8,20}$/.test(req.body.new) &&
      /[A-Z]/.test(req.body.new) &&
      /[a-z]/.test(req.body.new) &&
      /[0-9]/.test(req.body.new) &&
      /[^a-zA-Z0-9]/.test(req.body.new)
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    if (req.user.password !== req.body.old) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await getPrisma().user.update({
      where: {
        id: req.user.id
      },
      data: {
        password: req.body.new
      }
    });
    res.status(200).json({ message: "OK" });
  });

  app.get("/users/:userId", cashierOrHigher, async (req, res) => {
    const valid = validate.integer(req.params, "userId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const user = await getPrisma().user.findUnique({
      where: { id: req.params.userId }
    });
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const promotions = await getPrisma().promotion.findMany({
      where: {
        type: PromotionType.ONE_TIME,
        startTime: { lte: new Date() },
        endTime: { gt: new Date() },
        NOT: {
          transactions: {
            some: {
              receivedById: user.id
            }
          }
        }
      }
    });

    if (req.user.role !== Role.CASHIER) {
      res.status(200).json({
        id: user.id,
        utorid: user.username,
        name: user.name,
        email: user.email,
        birthday: isoDate(user.birthday),
        role: user.role.toLowerCase(),
        points: user.points,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        verified: user.verified,
        avatarUrl: user.avatarUrl,
        promotions: promotions.map(promotion => {
          return {
            id: promotion.id,
            name: promotion.name,
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points
          };
        })
      });
    }
    else {
      res.status(200).json({
        id: user.id,
        utorid: user.username,
        name: user.name,
        points: user.points,
        verified: user.verified,
        promotions: promotions.map(promotion => {
          return {
            id: promotion.id,
            name: promotion.name,
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points
          };
        })
      });
    }
  });

  app.patch("/users/:userId", managerOrHigher, async (req, res) => {
    if (!validate.integer(req.params, "userId")) {
      res.status(400).json({ error: "User ID was not an integer" });
      return;
    }    
    else if (!validate.string(req.body, "email")) {
      res.status(400).json({ error: "Email was not a string" });
      return;
    }
    else if (!validate.boolean(req.body, "verified")) {
      res.status(400).json({ error: "Verified was not a boolean" });
      return;
    }
    else if (!validate.boolean(req.body, "suspicious")) {
      res.status(400).json({ error: "Suspicious was not a boolean" });
      return;
    }
    else if (!validate.role(req.body, "role")) {
      res.status(400).json({ error: "Role was invalid" });
      return;
    }
    else if (!validate.notEmpty(req.body)) {
      res.status(400).json({ error: "No updates were made" });
      return;
    }
    else if (!(!defined(req.body, "email") || req.body.email.endsWith("@mail.utoronto.ca"))) {
      res.status(400).json({ error: "Email was invalid utoronto email" });
      return;
    }
    else if (!(!defined(req.body, "verified") || req.body.verified)) {
      res.status(400).json({ error: "Cannot unverify a user" });
      return;
    }

    if (defined(req.body, "role") && req.user.role === Role.MANAGER &&
        req.body.role !== Role.REGULAR && req.body.role !== Role.CASHIER) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const user = await getPrisma().user.findUnique({
      where: { id: req.params.userId }
    });
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const data = {};
    if (defined(req.body, "email")) {
      data.email = req.body.email;
    }
    if (defined(req.body, "verified")) {
      data.verified = req.body.verified;
    }
    if (defined(req.body, "suspicious")) {
      data.suspicious = req.body.suspicious;
    }
    if (defined(req.body, "role")) {
      data.role = req.body.role;
    }

    try {
      const updated = await getPrisma().user.update({
        where: {
          id: user.id
        },
        data
      });

      const result = {
        id: updated.id,
        utorid: updated.username,
        name: updated.name
      };
      for (const field in data) {
        result[field] = updated[field];
      }
      res.status(200).json(result);
    }
    catch {
      res.status(400).json({ error: "Bad Request" });
    }
  });

  app.post("/auth/tokens", async (req, res) => {
    const fields = ["utorid", "password"];
    const valid = (
      validate.required(req.body, ...fields) &&
      validate.string(req.body, ...fields)
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    try {
      const user = await getPrisma().user.update({
        where: {
          username: req.body.utorid,
          password: req.body.password
        },
        data: {
          lastLogin: new Date()
        }
      });

      const token = createToken(user);
      res.status(200).json(token);
    }
    catch {
      res.status(401).json({ error: "Incorrect username or password" });
    }
  });

  app.post("/auth/resets", async (req, res) => {
    const valid = (
      validate.required(req.body, "utorid") &&
      validate.string(req.body, "utorid")
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const user = await getPrisma().user.findUnique({ where: { username: req.body.utorid } });
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const now = Date.now();
    const lastRequestTime = lastRequests.get(req.ip) || 0;
    if (now - lastRequestTime < RATE_LIMIT) {
      res.status(429).json({ error: "Too Many Requests" });
      return;
    }
    lastRequests.set(req.ip, now);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + RESET_EXPIRY);
    const resetToken = await getPrisma().resetToken.create({
      data: {
        expiresAt,
        userId: user.id
      }
    });

    await getPrisma().resetToken.updateMany({
      where: {
        id: { not: resetToken.id },
        userId: user.id
      },
      data: {
        invalid: true
      }
    });

    res.status(202).json({
      expiresAt: resetToken.expiresAt,
      resetToken: resetToken.token
    });
  });

  app.post("/auth/resets/:resetToken", async (req, res) => {
    const fields = ["utorid", "password"];
    const valid = (
      validate.required(req.body, ...fields) &&
      validate.string(req.body, ...fields) &&
      /^.{8,20}$/.test(req.body.password) &&
      /[A-Z]/.test(req.body.password) &&
      /[a-z]/.test(req.body.password) &&
      /[0-9]/.test(req.body.password) &&
      /[^a-zA-Z0-9]/.test(req.body.password)
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const resetToken = await getPrisma().resetToken.findUnique({
      where: {
        token: req.params.resetToken
      },
      include: {
        user: true
      }
    });

    if (!resetToken) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    if (resetToken.user.username !== req.body.utorid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    else if (resetToken.expiresAt < new Date() || resetToken.invalid) {
      res.status(410).json({ error: "Gone" });
      return;
    }

    await getPrisma().resetToken.update({
      where: {
        id: resetToken.id
      },
      data: {
        invalid: true
      }
    });
    await getPrisma().user.update({
      where: {
        id: resetToken.userId
      },
      data: {
        password: req.body.password
      }
    });
    res.status(200).json({ message: "OK" });
  });
};
