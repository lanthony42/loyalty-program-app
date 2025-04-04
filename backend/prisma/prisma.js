"use strict";

const { PrismaClient, $Enums } = require("@prisma/client");

const Role = $Enums.Role;
const TransactionType = $Enums.TransactionType;
const PromotionType = $Enums.PromotionType;

let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

function disconnectPrisma() {
  if (prisma) {
    prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  Role,
  TransactionType,
  PromotionType,
  getPrisma,
  disconnectPrisma
};
