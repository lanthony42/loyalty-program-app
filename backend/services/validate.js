"use strict";

const { defined, isoDate } = require("./utils");
const { Role, TransactionType, PromotionType } = require("../prisma/prisma");

function required(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    valid = valid && defined(payload, field);
  });
  return valid;
}

function string(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    valid = valid && (
      !defined(payload, field) || typeof payload[field] === "string" && !!payload[field]
    );
  });
  return valid;
}

function boolean(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] === "string") {
        const bool = payload[field].toLowerCase();
        payload[field] = bool === "true" ? true : bool === "false" ? false : null;
      }
      valid = valid && typeof payload[field] === "boolean";
    }
  });
  return valid;
}

function integer(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] !== "number") {
        payload[field] = parseFloat(payload[field]);
      }
      valid = valid && Number.isInteger(payload[field]);
    }
  });
  return valid;
}

function positiveInt(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] !== "number") {
        payload[field] = parseFloat(payload[field]);
      }
      valid = valid && Number.isInteger(payload[field]) && payload[field] > 0;
    }
  });
  return valid;
}

function positiveNum(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] !== "number") {
        payload[field] = parseFloat(payload[field]);
      }
      valid = valid && !isNaN(payload[field]) && payload[field] > 0;
    }
  });
  return valid;
}

function date(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] === "string") {
        const time = Date.parse(payload[field]);
        const date = !isNaN(time) ? new Date(time) : null;
        valid = valid && payload[field] === isoDate(date);
        payload[field] = date;
      }
      valid = valid && payload[field] instanceof Date;
    }
  });
  return valid;
}

function dateTime(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] === "string") {
        const time = Date.parse(payload[field]);
        const date = !isNaN(time) ? new Date(time) : null;
        // I guess this is fine...
        // valid = valid && payload[field] === isoDateTimeOffset(date);
        payload[field] = date;
      }
      valid = valid && payload[field] instanceof Date;
    }
  });
  return valid;
}

function intArray(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (Array.isArray(payload[field])) {
        payload[field].forEach((x, i) => {
          if (typeof x !== "number") {
            payload[field][i] = parseFloat(x);
          }
          valid = valid && Number.isInteger(payload[field][i]);
        });
      }
      else {
        valid = false;
      }
    }
  });
  return valid;
}

function role(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] === "string") {
        payload[field] = Role[payload[field].toUpperCase()];
        valid = valid && !!payload[field];
      }
      else {
        valid = false;
      }
    }
  });
  return valid;
}

function transactionType(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] === "string") {
        payload[field] = TransactionType[payload[field].toUpperCase()];
        valid = valid && !!payload[field];
      }
      else {
        valid = false;
      }
    }
  });
  return valid;
}

function promotionType(payload, ...fields) {
  let valid = true;
  fields.forEach(field => {
    if (defined(payload, field)) {
      if (typeof payload[field] === "string") {
        payload[field] = PromotionType[payload[field].replace("-", "_").toUpperCase()];
        valid = valid && !!payload[field];
      }
      else {
        valid = false;
      }
    }
  });
  return valid;
}

function notEmpty(payload) {
  for (const field in payload) {
    if (payload[field] != null) {
      return true;
    }
  }
  return false;
}

module.exports = {
  defined,
  required,
  string,
  boolean,
  integer,
  positiveInt,
  positiveNum,
  date,
  dateTime,
  intArray,
  role,
  transactionType,
  promotionType,
  notEmpty
};
