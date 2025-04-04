/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
"use strict";

const { getPrisma, disconnectPrisma, Role } = require("./prisma");

async function createSuperuser() {
  const args = process.argv;
  if (args.length !== 5) {
    console.error("usage: node prisma/createsu.js utorid email password");
    return;
  }

  await getPrisma().user.create({
    data: {
      username: args[2],
      email: args[3],
      password: args[4],
      role: Role.SUPERUSER,
      verified: true
    }
  });
}

createSuperuser().finally(disconnectPrisma);
