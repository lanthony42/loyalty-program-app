/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
"use strict";

const { getPrisma, disconnectPrisma, Role, TransactionType, PromotionType } = require("./prisma");

const seedAll = async () => {
  // Clear database first
  await getPrisma().transaction.deleteMany();
  await getPrisma().resetToken.deleteMany();
  await getPrisma().event.deleteMany();
  await getPrisma().promotion.deleteMany();
  await getPrisma().user.deleteMany();

  // Add users
  await getPrisma().user.createMany({
    data: [
      {
        username: "regular1",
        email: "regular1@mail.utoronto.ca",
        password: "123123",
        role: Role.REGULAR,
        verified: true
      },
      {
        username: "regular2",
        email: "regular2@mail.utoronto.ca",
        password: "123123",
        role: Role.REGULAR,
        verified: true
      },
      {
        username: "regular3",
        email: "regular3@mail.utoronto.ca",
        role: Role.REGULAR,
        verified: false
      },
      {
        username: "regular4",
        email: "regular4@mail.utoronto.ca",
        role: Role.REGULAR,
        verified: false
      },
      {
        username: "regular5",
        email: "regular5@mail.utoronto.ca",
        role: Role.REGULAR,
        verified: false
      },
      {
        username: "regular6",
        email: "regular6@mail.utoronto.ca",
        role: Role.REGULAR,
        verified: false
      },
      {
        username: "regular7",
        email: "regular7@mail.utoronto.ca",
        role: Role.REGULAR,
        verified: false
      },
      {
        username: "cashier1",
        email: "cashier1@mail.utoronto.ca",
        password: "123123",
        role: Role.CASHIER,
        verified: true
      },
      {
        username: "manager1",
        email: "manager1@mail.utoronto.ca",
        password: "123123",
        role: Role.MANAGER,
        verified: true
      },
      {
        username: "superusr",
        email: "superusr@mail.utoronto.ca",
        password: "123123",
        role: Role.SUPERUSER,
        verified: true
      },
    ]
  });

  // Add promotions
  await getPrisma().promotion.createMany({
    data: [
      {
        name: "Promo A",
        description: "Auto promo",
        type: PromotionType.AUTOMATIC,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(),
        rate: 0.1
      },
      {
        name: "Promo B",
        description: "Bonus time",
        type: PromotionType.AUTOMATIC,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        points: 100
      },
      {
        name: "Promo C",
        description: "Mega promo",
        type: PromotionType.AUTOMATIC,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        minSpending: 20,
        rate: 0.15,
        points: 100
      },
      {
        name: "Promo D",
        description: "Exclusive",
        type: PromotionType.ONE_TIME,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        rate: 0.2
      },
      {
        name: "Promo E",
        description: "One time deal",
        type: PromotionType.ONE_TIME,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(),
        points: 50
      },
    ]
  });

  // Add events
  await getPrisma().event.createMany({
    data: [
      {
        name: "Event A",
        description: "An old event",
        location: "BA 2250",
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(),
        capacity: 100,
        pointsAwarded: 200,
        pointsRemain: 0,
        published: true
      },
      {
        name: "Event B",
        description: "A simple event",
        location: "BA 2250",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        capacity: 50,
        pointsRemain: 500,
        published: true
      },
      {
        name: "Event C",
        description: "A new event",
        location: "BA 1130",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        pointsRemain: 100
      },
      {
        name: "Event D",
        description: "A current event",
        location: "BA 2250",
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        capacity: 50,
        pointsRemain: 200,
        published: true
      },
      {
        name: "Event E",
        description: "A current event",
        location: "BA 2270",
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        pointsRemain: 100
      },
    ]
  });

  // Find users and first valid regular and cashier
  const users = await getPrisma().user.findMany();
  const regular1 = users.find(u => u.role === Role.REGULAR && u.verified);
  const regular2 = users.find(u => u.id != regular1.id && u.role === Role.REGULAR && u.verified);
  const cashier = users.find(u => u.role === Role.CASHIER && u.verified);
  const manager = users.find(u => u.role === Role.MANAGER && u.verified);

  // Add transactions
  await getPrisma().transaction.createMany({
    data: [
      {
        type: TransactionType.PURCHASE,
        amount: 80,
        spent: 19.99,
        remark: "Seems sus",
        suspicious: true,
        receivedById: regular1.id,
        sentById: cashier.id
      },
      {
        type: TransactionType.PURCHASE,
        amount: 100,
        spent: 29.99,
        receivedById: regular1.id,
        sentById: cashier.id
      },
      {
        type: TransactionType.PURCHASE,
        amount: 50,
        spent: 6.99,
        receivedById: regular1.id,
        sentById: cashier.id
      },
      {
        type: TransactionType.PURCHASE,
        amount: 0,
        spent: 5.00,
        receivedById: regular2.id,
        sentById: cashier.id
      },
      {
        type: TransactionType.PURCHASE,
        amount: 10,
        spent: 1.99,
        receivedById: regular2.id,
        sentById: cashier.id
      },
      {
        type: TransactionType.PURCHASE,
        amount: 20,
        spent: 5.99,
        receivedById: manager.id,
        sentById: cashier.id
      },
    ]
  });
  await getPrisma().transaction.createMany({
    data: [
      {
        type: TransactionType.TRANSFER,
        amount: 50,
        relatedId: regular2.id,
        remark: "Seems sus",
        suspicious: true,
        receivedById: regular1.id,
        sentById: regular2.id
      },
      {
        type: TransactionType.TRANSFER,
        amount: -50,
        relatedId: regular1.id,
        remark: "Seems sus",
        suspicious: true,
        receivedById: regular2.id,
        sentById: regular2.id
      },
      {
        type: TransactionType.TRANSFER,
        amount: 10,
        relatedId: regular1.id,
        receivedById: regular2.id,
        sentById: regular1.id
      },
      {
        type: TransactionType.TRANSFER,
        amount: -10,
        relatedId: regular2.id,
        receivedById: regular1.id,
        sentById: regular1.id
      },
      {
        type: TransactionType.TRANSFER,
        amount: 20,
        relatedId: manager.id,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.TRANSFER,
        amount: -20,
        relatedId: regular1.id,
        receivedById: manager.id,
        sentById: manager.id
      },
    ]
  });
  await getPrisma().transaction.createMany({
    data: [
      {
        type: TransactionType.REDEMPTION,
        amount: -1000,
        relatedId: cashier.id,
        remark: "Seems sus",
        suspicious: true,
        receivedById: regular1.id,
        sentById: regular1.id
      },
      {
        type: TransactionType.REDEMPTION,
        amount: -200,
        relatedId: cashier.id,
        receivedById: regular1.id,
        sentById: regular1.id
      },
      {
        type: TransactionType.REDEMPTION,
        amount: -100,
        relatedId: cashier.id,
        receivedById: regular2.id,
        sentById: regular2.id
      },
      {
        type: TransactionType.REDEMPTION,
        amount: -100,
        receivedById: regular1.id,
        sentById: regular1.id
      },
      {
        type: TransactionType.REDEMPTION,
        amount: -200,
        receivedById: regular1.id,
        sentById: regular1.id
      },
      {
        type: TransactionType.REDEMPTION,
        amount: -200,
        receivedById: regular2.id,
        sentById: regular2.id
      },
    ]
  });
    
  // Find events and first with points awarded
  const events = await getPrisma().event.findMany();
  const event = events.find(e => e.pointsAwarded === 200);

  await getPrisma().transaction.createMany({
    data: [
      {
        type: TransactionType.EVENT,
        amount: 100,
        relatedId: event.id,
        remark: "Seems sus",
        suspicious: true,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.EVENT,
        amount: 10,
        relatedId: event.id,
        remark: event.description,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.EVENT,
        amount: 10,
        relatedId: event.id,
        remark: event.description,
        receivedById: regular2.id,
        sentById: manager.id
      },
      {
        type: TransactionType.EVENT,
        amount: 50,
        relatedId: event.id,
        remark: event.description,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.EVENT,
        amount: 50,
        relatedId: event.id,
        remark: event.description,
        receivedById: regular2.id,
        sentById: manager.id
      },
      {
        type: TransactionType.EVENT,
        amount: 80,
        relatedId: event.id,
        remark: event.description,
        receivedById: manager.id,
        sentById: manager.id
      },
    ]
  });

  // Find transactions
  const transactions = await getPrisma().transaction.findMany();

  await getPrisma().transaction.createMany({
    data: [
      {
        type: TransactionType.ADJUSTMENT,
        amount: -80,
        relatedId: transactions[0].id,
        remark: "Seems sus",
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.ADJUSTMENT,
        amount: -10,
        relatedId: transactions[1].id,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.ADJUSTMENT,
        amount: -50,
        relatedId: transactions[2].id,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.ADJUSTMENT,
        amount: 50,
        relatedId: transactions[3].id,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.ADJUSTMENT,
        amount: -10,
        relatedId: transactions[4].id,
        receivedById: regular1.id,
        sentById: manager.id
      },
      {
        type: TransactionType.ADJUSTMENT,
        amount: -10,
        relatedId: transactions[5].id,
        receivedById: regular1.id,
        sentById: manager.id
      },
    ]
  });
};

if (require.main === module) {
  seedAll().finally(disconnectPrisma);
}

module.exports = app => {
  app.get("/seed", async (_, res) => {
    try {
      await seedAll();
      res.status(200).json({ message: "OK" });
    }
    catch (error) {
      res.status(500).json({ error });
    }
  });
};
