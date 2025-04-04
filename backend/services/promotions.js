"use strict";

const { managerOrHigher } = require("../middleware/auth");
const { defined } = require("./utils");
const { getPrisma, Role } = require("../prisma/prisma");

const validate = require("./validate");

module.exports = app => {
  app.post("/promotions", managerOrHigher, async (req, res) => {
    const valid = (
      validate.required(req.body, "name", "description", "type", "startTime", "endTime") &&
      validate.string(req.body, "name", "description") &&
      validate.promotionType(req.body, "type") &&
      validate.dateTime(req.body, "startTime", "endTime") &&
      validate.positiveNum(req.body, "minSpending", "rate") &&
      validate.integer(req.body, "points") &&
      new Date() < req.body.startTime &&
      req.body.startTime < req.body.endTime &&
      (!defined(req.body, "points") || req.body.points >= 0)
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const data = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      startTime: req.body.startTime,
      endTime: req.body.endTime
    };
    if (defined(req.body, "minSpending")) {
      data.minSpending = req.body.minSpending;
    }
    if (defined(req.body, "rate")) {
      data.rate = req.body.rate;
    }
    if (defined(req.body, "points")) {
      data.points = req.body.points;
    }

    const promotion = await getPrisma().promotion.create({ data });
    res.status(201).json({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type.replace("_", "-").toLowerCase(),
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      minSpending: promotion.minSpending,
      rate: promotion.rate,
      points: promotion.points
    });
  });

  app.get("/promotions", async (req, res) => {
    const valid = (
      validate.string(req.query, "name") &&
      validate.promotionType(req.query, "type") &&
      validate.positiveInt(req.query, "page", "limit") &&
      validate.boolean(req.query, "started", "ended") &&
      (!defined(req.query, "started") || !defined(req.query, "ended"))
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const manage = req.user.role === Role.MANAGER || req.user.role === Role.SUPERUSER;
    const AND = [];
    if (defined(req.query, "name")) {
      AND.push({ name: req.query.name });
    }
    if (defined(req.query, "type")) {
      AND.push({ type: req.query.type });
    }
    if (manage) {
      if (defined(req.query, "started")) {
        AND.push({ startTime: req.query.started ? { lte: new Date() } : { gt: new Date() } });
      }
      if (defined(req.query, "ended")) {
        AND.push({ endTime: req.query.ended ? { lte: new Date() } : { gt: new Date() } });
      }
    }
    else {
      AND.push({ startTime: { lte: new Date() } });
      AND.push({ endTime: { gt: new Date() } });
      AND.push({
        NOT: {
          transactions: {
            some: {
              receivedById: req.user.id
            }
          }
        }
      });
    }

    const take = req.query.limit || 10;
    const skip = (req.query.page || 1) * take - take;
    const count = await getPrisma().promotion.count({
      where: { AND }
    });
    const promotions = await getPrisma().promotion.findMany({
      where: { AND },
      skip,
      take
    });

    if (manage) {
      res.status(200).json({
        count,
        results: promotions.map(promotion => {
          return {
            id: promotion.id,
            name: promotion.name,
            type: promotion.type.replace("_", "-").toLowerCase(),
            startTime: promotion.startTime,
            endTime: promotion.endTime,
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points
          };
        })
      });
    }
    else {
      res.status(200).json({
        count,
        results: promotions.map(promotion => {
          return {
            id: promotion.id,
            name: promotion.name,
            type: promotion.type.replace("_", "-").toLowerCase(),
            endTime: promotion.endTime,
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points
          };
        })
      });
    }
  });

  app.get("/promotions/:promotionId", async (req, res) => {
    const valid = validate.integer(req.params, "promotionId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const promotion = await getPrisma().promotion.findUnique({
      where: {
        id: req.params.promotionId
      }
    });
    const manage = req.user.role === Role.MANAGER || req.user.role === Role.SUPERUSER;
    if (!promotion || !manage && (new Date() < promotion.startTime || promotion.endTime < new Date())) {      
      res.status(404).json({ error: "Not Found" });
      return;
    }

    if (manage) {
      res.status(200).json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type.replace("_", "-").toLowerCase(),
        startTime: promotion.startTime,
        endTime: promotion.endTime,
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points
      });
    }
    else {
      res.status(200).json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type.replace("_", "-").toLowerCase(),
        endTime: promotion.endTime,
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points
      });
    }
  });

  app.patch("/promotions/:promotionId", managerOrHigher, async (req, res) => {
    if (!validate.integer(req.params, "promotionId")) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const promotion = await getPrisma().promotion.findUnique({
      where: {
        id: req.params.promotionId
      }
    });
    if (!promotion) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const valid = (
      validate.string(req.body, "name", "description") &&
      validate.promotionType(req.body, "type") &&
      validate.dateTime(req.body, "startTime", "endTime") &&
      validate.positiveNum(req.body, "minSpending", "rate") &&
      validate.integer(req.body, "points") &&
      (req.body.startTime || promotion.startTime) < (req.body.endTime || promotion.endTime) &&
      (!defined(req.body, "points") || req.body.points >= 0) &&
      (!defined(req.body, "startTime") || new Date() < req.body.startTime) &&
      (!defined(req.body, "endTime") || new Date() < req.body.endTime) &&
      (!defined(req.body, "name", "description", "type", "startTime", "minSpending", "rate", "points") || new Date() < promotion.startTime) &&
      (!defined(req.body, "endTime") || new Date() < promotion.endTime)
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    
    const data = {};
    if (defined(req.body, "name")) {
      data.name = req.body.name;
    }
    if (defined(req.body, "description")) {
      data.description = req.body.description;
    }
    if (defined(req.body, "type")) {
      data.type = req.body.type;
    }
    if (defined(req.body, "startTime")) {
      data.startTime = req.body.startTime;
    }
    if (defined(req.body, "endTime")) {
      data.endTime = req.body.endTime;
    }
    if (defined(req.body, "minSpending")) {
      data.minSpending = req.body.minSpending;
    }
    if (defined(req.body, "rate")) {
      data.rate = req.body.rate;
    }
    if (defined(req.body, "points")) {
      data.points = req.body.points;
    }

    const updated = await getPrisma().promotion.update({
      where: {
        id: promotion.id
      },
      data
    });

    const result = {
      id: updated.id,
      name: updated.name,
      type: updated.type
    };
    for (const field in data) {
      result[field] = updated[field];
    }
    res.status(200).json(result);
  });

  app.delete("/promotions/:promotionId", managerOrHigher, async (req, res) => {
    const valid = validate.integer(req.params, "promotionId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const promotion = await getPrisma().promotion.findUnique({
      where: {
        id: req.params.promotionId
      }
    });
    if (!promotion) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (promotion.startTime < new Date()) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await getPrisma().promotion.delete({
      where: {
        id: promotion.id
      }
    });
    res.status(204).json({ message: "No Content" });
  });
};
