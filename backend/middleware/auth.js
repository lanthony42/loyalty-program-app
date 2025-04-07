"use strict";

const { getPrisma, Role } = require("../prisma/prisma");

const jwt = require("jsonwebtoken");

const SECRET_KEY = require("crypto").randomBytes(64).toString("hex");
const EXPIRY_TIME = 60 * 60;

function createToken(user) {
  const token = jwt.sign({
    userId: user.id
  }, SECRET_KEY, { expiresIn: EXPIRY_TIME });

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + EXPIRY_TIME);

  return { token, expiresAt };
}

function jwtAuth(req, res, next) {
  if (req.path.startsWith("/auth") || req.path.startsWith("/uploads")) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, async (err, data) => {
    if (!err) {
      req.user = await getPrisma().user.findUnique({ where: { id: data.userId } });
      if (req.user) {
        return next();
      }
    }
    res.status(401).json({ error: "Unauthorized" });
  });
}

function cashierOrHigher(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const valid = (
    req.user.role === Role.CASHIER ||
    req.user.role === Role.MANAGER ||
    req.user.role === Role.SUPERUSER
  );
  if (!valid) {
    res.status(403).json({ error: "Forbidden" });
  }
  else {
    next();
  }
}

function managerOrHigher(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const valid = (
    req.user.role === Role.MANAGER || req.user.role === Role.SUPERUSER
  );
  if (!valid) {
    res.status(403).json({ error: "Forbidden" });
  }
  else {
    next();
  }
}

module.exports = {
  createToken,
  jwtAuth,
  cashierOrHigher,
  managerOrHigher
};
