"use strict";

const { cashierOrHigher, managerOrHigher } = require("../middleware/auth");
const { defined } = require("./utils");
const { getPrisma, Role, TransactionType } = require("../prisma/prisma");

const validate = require("./validate");

module.exports = app => {
  app.post("/transactions", cashierOrHigher, async (req, res, next) => {
    const type_valid = (
      validate.required(req.body, "type") &&
      validate.transactionType(req.body, "type") &&
      req.body.type === TransactionType.PURCHASE
    );
    if (!type_valid) {
      next();
      return;
    }

    const input_valid = (
      validate.required(req.body, "utorid", "spent") &&
      validate.string(req.body, "utorid", "remark") &&
      validate.positiveNum(req.body, "spent") &&
      validate.intArray(req.body, "promotionIds")
    );
    if (!input_valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const user = await getPrisma().user.findUnique({
      where: {
        username: req.body.utorid
      }
    });
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const promotions = [];
    let promotionRate = 0.04;
    let promotionPoints = 0;
    for (const promotionId of (req.body.promotionIds || [])) {
      const promotion = await getPrisma().promotion.findUnique({
        where: {
          id: promotionId,
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
      if (!promotion) {
        res.status(400).json({ error: "Bad Request" });
        return;
      }
      else if (promotion.minSpending == null || req.body.spent >= promotion.minSpending) {
        promotionRate += promotion.rate || 0;
        promotionPoints += promotion.points || 0;
        promotions.push(promotion);
      }
    }

    const pointsEarned = Math.round(req.body.spent * 100 * promotionRate) + promotionPoints;
    const transaction = await getPrisma().transaction.create({
      data: {
        type: req.body.type,
        amount: pointsEarned,
        spent: req.body.spent,
        remark: req.body.remark || "",
        suspicious: req.user.suspicious,
        receivedById: user.id,
        sentById: req.user.id,
        promotions: {
          connect: promotions.map(promotion => {
            return {
              id: promotion.id
            };
          })
        }
      },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      }
    });
    if (!req.user.suspicious) {
      await getPrisma().user.update({
        where: {
          id: user.id
        },
        data: {
          points: user.points + pointsEarned
        }
      });
    }

    res.status(201).json({
      id: transaction.id,
      utorid: transaction.receivedBy.username,
      type: transaction.type.toLowerCase(),
      spent: transaction.spent,
      earned: !transaction.suspicious ? transaction.amount : 0,
      remark: transaction.remark,
      promotionIds: transaction.promotions.map(x => x.id),
      createdBy: transaction.sentBy.username
    });
  });

  app.post("/transactions", managerOrHigher, async (req, res) => {
    const valid = (
      validate.required(req.body, "utorid", "type", "amount", "relatedId") &&
      validate.string(req.body, "utorid", "remark") &&
      validate.transactionType(req.body, "type") &&
      validate.integer(req.body, "amount", "relatedId") &&
      validate.intArray(req.body, "promotionIds") &&
      req.body.type === TransactionType.ADJUSTMENT
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const user = await getPrisma().user.findUnique({
      where: {
        username: req.body.utorid
      }
    });
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (user.points + req.body.amount < 0) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const related = await getPrisma().transaction.findUnique({
      where: {
        id: req.body.relatedId
      }
    });
    if (!related) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const transaction = await getPrisma().transaction.create({
      data: {
        type: req.body.type,
        amount: req.body.amount,
        relatedId: related.id,
        remark: req.body.remark || "",
        receivedById: user.id,
        sentById: req.user.id
      },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      }
    });
    await getPrisma().user.update({
      where: {
        id: user.id
      },
      data: {
        points: user.points + req.body.amount
      }
    });

    res.status(201).json({
      id: transaction.id,
      utorid: transaction.receivedBy.username,
      amount: transaction.amount,
      type: transaction.type.toLowerCase(),
      relatedId: transaction.relatedId,
      remark: transaction.remark,
      promotionIds: transaction.promotions.map(x => x.id),
      createdBy: transaction.sentBy.username
    });
  });

  app.get("/transactions", managerOrHigher, async (req, res) => {
    const valid = (
      validate.string(req.query, "name", "createdBy", "operator") &&
      validate.boolean(req.query, "suspicious") &&
      validate.integer(req.query, "promotionId", "relatedId", "amount") &&
      validate.transactionType(req.query, "type") &&
      validate.positiveInt(req.query, "page", "limit") &&
      (!defined(req.query, "relatedId") || defined(req.query, "type")) &&
      (!defined(req.query, "amount") || defined(req.query, "operator")) &&
      (!defined(req.query, "operator") || req.query.operator === "gte" || req.query.operator === "lte")
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const AND = [];
    if (defined(req.query, "name")) {
      AND.push({
        receivedBy: {
          OR: [
            { username: req.query.name },
            { name: req.query.name }
          ]
        }
      });
    }
    if (defined(req.query, "createdBy")) {
      AND.push({
        sentBy: {
          OR: [
            { username: req.query.createdBy },
            { name: req.query.createdBy }
          ]
        }
      });
    }
    if (defined(req.query, "suspicious")) {
      AND.push({ suspicious: req.query.suspicious });
    }
    if (defined(req.query, "promotionId")) {
      AND.push({
        promotions: {
          some: {
            id: req.query.promotionId
          }
        }
      });
    }
    if (defined(req.query, "type")) {
      AND.push({ type: req.query.type });
    }
    if (defined(req.query, "relatedId")) {
      AND.push({ relatedId: req.query.relatedId });
    }
    if (defined(req.query, "amount")) {
      AND.push({ amount: { [req.query.operator]: req.query.amount } });
    }

    const take = req.query.limit || 10;
    const skip = (req.query.page || 1) * take - take;
    const count = await getPrisma().transaction.count({
      where: { AND }
    });
    const transactions = await getPrisma().transaction.findMany({
      where: { AND },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      },
      skip,
      take
    });

    res.status(200).json({
      count,
      results: transactions.map(transaction => {
        switch (transaction.type) {
          case TransactionType.PURCHASE:
            return {
              id: transaction.id,
              utorid: transaction.receivedBy.username,
              amount: transaction.amount,
              type: transaction.type.toLowerCase(),
              spent: transaction.spent,
              promotionIds: transaction.promotions.map(x => x.id),
              suspicious: transaction.suspicious,
              remark: transaction.remark,
              createdBy: transaction.sentBy.username
            };
          default:
            return {
              id: transaction.id,
              utorid: transaction.receivedBy.username,
              amount: transaction.amount,
              type: transaction.type.toLowerCase(),
              relatedId: transaction.relatedId,
              promotionIds: transaction.promotions.map(x => x.id),
              suspicious: transaction.suspicious,
              remark: transaction.remark,
              createdBy: transaction.sentBy.username
            };
        }
      })
    });
  });
  
  app.get("/transactions/:transactionId", managerOrHigher, async (req, res) => {
    const valid = validate.integer(req.params, "transactionId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const transaction = await getPrisma().transaction.findUnique({
      where: {
        id: req.params.transactionId
      },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      }
    });
    if (!transaction) {      
      res.status(404).json({ error: "Not Found" });
      return;
    }

    switch (transaction.type) {
      case TransactionType.PURCHASE:
        res.status(200).json({
          id: transaction.id,
          utorid: transaction.receivedBy.username,
          type: transaction.type.toLowerCase(),
          spent: transaction.spent,
          amount: transaction.amount,
          promotionIds: transaction.promotions.map(x => x.id),
          suspicious: transaction.suspicious,
          remark: transaction.remark,
          createdBy: transaction.sentBy.username
        });
        break;
      default:
        res.status(200).json({
          id: transaction.id,
          utorid: transaction.receivedBy.username,
          amount: transaction.amount,
          type: transaction.type.toLowerCase(),
          relatedId: transaction.relatedId,
          promotionIds: transaction.promotions.map(x => x.id),
          suspicious: transaction.suspicious,
          remark: transaction.remark,
          createdBy: transaction.sentBy.username
        });
        break;
    }
  });
  
  app.patch("/transactions/:transactionId/suspicious", managerOrHigher, async (req, res) => {
    const valid = (
      validate.integer(req.params, "transactionId") &&
      validate.required(req.body, "suspicious") &&
      validate.boolean(req.body, "suspicious")
    )
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const transaction = await getPrisma().transaction.findUnique({
      where: {
        id: req.params.transactionId
      }
    });
    if (!transaction) {      
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const updated = await getPrisma().transaction.update({
      where: {
        id: transaction.id
      },
      data: {
        suspicious: req.body.suspicious
      },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      }
    });
    if (transaction.suspicious != updated.suspicious) {
      await getPrisma().user.update({
        where: {
          id: updated.receivedBy.id
        },
        data: {
          points: {
            increment: transaction.amount * (updated.suspicious ? -1 : 1)
          }
        }
      });
    }
    
    switch (updated.type) {
      case TransactionType.PURCHASE:
        res.status(200).json({
          id: updated.id,
          utorid: updated.receivedBy.username,
          type: updated.type.toLowerCase(),
          spent: updated.spent,
          amount: updated.amount,
          promotionIds: updated.promotions.map(x => x.id),
          suspicious: updated.suspicious,
          remark: updated.remark,
          createdBy: updated.sentBy.username
        });
        break;
      default:
        res.status(200).json({
          id: updated.id,
          utorid: updated.receivedBy.username,
          amount: updated.amount,
          type: updated.type.toLowerCase(),
          relatedId: updated.relatedId,
          promotionIds: updated.promotions.map(x => x.id),
          suspicious: updated.suspicious,
          remark: updated.remark,
          createdBy: updated.sentBy.username
        });
        break;
    }
  });

  app.post("/users/me/transactions", async (req, res) => {
    const valid = (
      validate.required(req.body, "type") &&
      validate.transactionType(req.body, "type") &&
      validate.positiveInt(req.body, "amount") &&
      validate.string(req.body, "remark") &&
      req.body.type === TransactionType.REDEMPTION &&
      (!defined(req.body, "amount") || req.user.points >= req.body.amount)
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    else if (!req.user.verified) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const transaction = await getPrisma().transaction.create({
      data: {
        type: req.body.type,
        amount: req.body.amount || 0,
        remark: req.body.remark || "",
        receivedById: req.user.id,
        sentById: req.user.id
      },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      }
    });

    res.status(201).json({
      id: transaction.id,
      utorid: transaction.receivedBy.username,
      type: transaction.type.toLowerCase(),
      processedBy: transaction.relatedId,
      amount: transaction.amount,
      remark: transaction.remark,
      createdBy: transaction.sentBy.username
    });
  });

  app.get("/users/me/transactions", async (req, res) => {
    const valid = (
      validate.transactionType(req.query, "type") &&
      validate.integer(req.query, "relatedId", "promotionId", "amount") &&
      validate.string(req.query, "operator") &&
      validate.positiveInt(req.query, "page", "limit") &&
      (!defined(req.query, "relatedId") || defined(req.query, "type")) &&
      (!defined(req.query, "amount") || defined(req.query, "operator")) &&
      (!defined(req.query, "operator") || req.query.operator === "gte" || req.query.operator === "lte")
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const AND = [ { receivedById: req.user.id } ];
    if (defined(req.query, "type")) {
      AND.push({ type: req.query.type });
    }
    if (defined(req.query, "relatedId")) {
      AND.push({ relatedId: req.query.relatedId });
    }
    if (defined(req.query, "promotionId")) {
      AND.push({
        promotions: {
          some: {
            id: req.query.promotionId
          }
        }
      });
    }
    if (defined(req.query, "amount")) {
      AND.push({ amount: { [req.query.operator]: req.query.amount } });
    }

    const take = req.query.limit || 10;
    const skip = (req.query.page || 1) * take - take;
    const count = await getPrisma().transaction.count({
      where: { AND }
    });
    const transactions = await getPrisma().transaction.findMany({
      where: { AND },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      },
      skip,
      take
    });

    res.status(200).json({
      count,
      results: transactions.map(transaction => {
        switch (transaction.type) {
          case TransactionType.PURCHASE:
            return {
              id: transaction.id,
              type: transaction.type.toLowerCase(),
              spent: transaction.spent,
              amount: transaction.amount,
              promotionIds: transaction.promotions.map(x => x.id),
              remark: transaction.remark,
              createdBy: transaction.sentBy.username
            };
          default:
            return {
              id: transaction.id,
              amount: transaction.amount,
              type: transaction.type.toLowerCase(),
              relatedId: transaction.relatedId,
              promotionIds: transaction.promotions.map(x => x.id),
              remark: transaction.remark,
              createdBy: transaction.sentBy.username
            };
        }
      })
    });
  });

  app.post("/users/:userId/transactions", async (req, res) => {
    const valid = (
      validate.integer(req.params, "userId") &&
      validate.required(req.body, "type", "amount") &&
      validate.transactionType(req.body, "type") &&
      validate.positiveInt(req.body, "amount") &&
      validate.string(req.body, "remark") &&
      req.body.type === TransactionType.TRANSFER &&
      req.user.points >= req.body.amount
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    else if (!req.user.verified) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const user = await getPrisma().user.findUnique({
      where: {
        id: req.params.userId
      }
    });
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const transaction = await getPrisma().transaction.create({
      data: {
        type: req.body.type,
        amount: req.body.amount,
        relatedId: req.user.id,
        remark: req.body.remark || "",
        receivedById: user.id,
        sentById: req.user.id
      },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      }
    });
    await getPrisma().transaction.create({
      data: {
        type: req.body.type,
        amount: -req.body.amount,
        relatedId: user.id,
        remark: req.body.remark || "",
        receivedById: req.user.id,
        sentById: req.user.id
      }
    });
    await getPrisma().user.update({
      where: {
        id: req.user.id
      },
      data: {
        points: req.user.points - transaction.amount
      }
    });
    await getPrisma().user.update({
      where: {
        id: user.id
      },
      data: {
        points: user.points + transaction.amount
      }
    });

    res.status(201).json({
      id: transaction.id,
      sender: transaction.sentBy.username,
      recipient: transaction.receivedBy.username,
      type: transaction.type.toLowerCase(),
      sent: transaction.amount,
      remark: transaction.remark,
      createdBy: transaction.sentBy.username
    });
  });

  app.patch("/transactions/:transactionId/processed", cashierOrHigher, async (req, res) => {
    const valid = (
      validate.integer(req.params, "transactionId") &&
      validate.required(req.body, "processed") &&
      validate.boolean(req.body, "processed")
    )
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const transaction = await getPrisma().transaction.findUnique({
      where: {
        id: req.params.transactionId
      }
    });
    if (!transaction) {      
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (transaction.type !== TransactionType.REDEMPTION || transaction.relatedId != null) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const updated = await getPrisma().transaction.update({
      where: {
        id: transaction.id
      },
      data: {
        relatedId: req.user.id
      },
      include: {
        receivedBy: true,
        sentBy: true,
        promotions: true
      }
    });
    await getPrisma().user.update({
      where: {
        id: updated.receivedBy.id
      },
      data: {
        points: {
          increment: -updated.amount
        }
      }
    });
    
    res.status(200).json({
      id: updated.id,
      utorid: updated.receivedBy.username,
      type: updated.type.toLowerCase(),
      processedBy: req.user.username,
      redeemed: updated.amount,
      remark: updated.remark,
      createdBy: updated.sentBy.username
    });
  });

  app.post("/events/:eventId/transactions", async (req, res) => {
    const input_valid = (
      validate.integer(req.params, "eventId") &&
      validate.required(req.body, "type", "amount") &&
      validate.transactionType(req.body, "type") &&
      validate.string(req.body, "utorid") &&
      validate.positiveInt(req.body, "amount") &&
      req.body.type === TransactionType.EVENT
    );
    if (!input_valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      },
      include: {
        organizers: true,
        guests: true
      }
    });
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    
    const manage = req.user.role === Role.MANAGER || req.user.role === Role.SUPERUSER ||
                   event.organizers.some(x => req.user.id === x.id);
    if (!manage) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    
    const pointsToAward = !defined(req.body, "utorid") ? req.body.amount * event.guests.length : req.body.amount;
    const data_valid = (
      (!defined(req.body, "utorid") || event.guests.some(x => req.body.utorid === x.username)) &&
      event.pointsRemain >= pointsToAward
    );
    if (!data_valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const data = [];
    const makeTransaction = user => {
      return {
        type: req.body.type,
        amount: req.body.amount,
        relatedId: event.id,
        remark: event.description,
        receivedById: user.id,
        sentById: req.user.id
      };
    };
    if (defined(req.body, "utorid")) {
      const user = await getPrisma().user.findUnique({
        where: {
          username: req.body.utorid
        }
      });
      if (!user) {
        res.status(404).json({ error: "Not Found" });
        return;
      }
      data.push(makeTransaction(user));
    }
    else {
      event.guests.forEach(guest => data.push(makeTransaction(guest)));
    }

    const transactions = await getPrisma().transaction.createManyAndReturn({
      data,
      include: {
        receivedBy: true,
        sentBy: true
      }
    });
    await getPrisma().event.update({
      where: {
        id: event.id
      },
      data: {
        pointsRemain: event.pointsRemain - pointsToAward,
        pointsAwarded: event.pointsAwarded + pointsToAward
      }
    });
    transactions.forEach(async transaction => {
      await getPrisma().user.update({
        where: {
          id: transaction.receivedById
        },
        data: {
          points: {
            increment: transaction.amount
          }
        }
      });
    });

    const makeResult = transaction => {
      return {
        id: transaction.id,
        recipient: transaction.receivedBy.username,
        awarded: transaction.amount,
        type: transaction.type.toLowerCase(),
        relatedId: transaction.relatedId,
        remark: transaction.remark,
        createdBy: transaction.sentBy.username
      };
    };
    if (defined(req.body, "utorid")) {
      res.status(201).json(makeResult(transactions[0]));
    }
    else {
      res.status(201).json(transactions.map(makeResult));
    }
  });
};
