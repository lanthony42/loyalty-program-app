"use strict";

function defined(obj, ...fields) {
  for (const field of fields) {
    // typeof obj[field] !== "undefined";
    if (obj[field] != null) {
      return true;
    }
  }
  return false;
}

function isoDate(date) {
  return !!date ? date.toISOString().split("T")[0] : null;
}

function isoDateTimeOffset(date) {
  if (!date) {
    return null;
  }

  const offset = -date.getTimezoneOffset();
  const pad = (x, n = 2) => String(x).padStart(n, "0");
  return (
    date.getFullYear() + "-" +
    pad(date.getMonth() + 1) + "-" +
    pad(date.getDate()) + "T" +
    pad(date.getHours()) + ":" +
    pad(date.getMinutes()) + ":" +
    pad(date.getSeconds()) + "." +
    pad(date.getMilliseconds() * 1000, 6) + (offset >= 0 ? "+" : "-") +
    pad(Math.floor(Math.abs(offset) / 60)) + ":" +
    pad(Math.abs(offset) % 60)
  );
}

module.exports = {
  defined,
  isoDate,
  isoDateTimeOffset
};
