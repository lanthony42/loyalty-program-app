"use strict";

const { managerOrHigher } = require("../middleware/auth");
const { defined } = require("./utils");
const { getPrisma, Role } = require("../prisma/prisma");

const validate = require("./validate");

module.exports = app => {
  app.post("/events", managerOrHigher, async (req, res) => {
    const fields = ["name", "description", "location", "startTime", "endTime", "points"];
    if (!validate.required(req.body, ...fields)) {
      res.status(400).json({ error: "Missing required field(s)" });
      return;
    }
    else if (!validate.string(req.body, "name")) {
      res.status(400).json({ error: "Name was not a string" });
      return;
    }
    else if (!validate.string(req.body, "description")) {
      res.status(400).json({ error: "Description was not a string" });
      return;
    }
    else if (!validate.string(req.body, "location")) {
      res.status(400).json({ error: "Location was not a string" });
      return;
    }
    else if (!validate.dateTime(req.body, "startTime")) {
      res.status(400).json({ error: "Start time was not a date time" });
      return;
    }
    else if (!validate.dateTime(req.body, "endTime")) {
      res.status(400).json({ error: "End time was not a date time" });
      return;
    }
    else if (!validate.positiveInt(req.body, "capacity")) {
      res.status(400).json({ error: "Capacity was not a positive integer" });
      return;
    }
    else if (!validate.positiveInt(req.body, "points")) {
      res.status(400).json({ error: "Points was not a positive integer" });
      return;
    }
    else if (req.body.startTime >= req.body.endTime) {
      res.status(400).json({ error: "End time was not after start time" });
      return;
    }

    const event = await getPrisma().event.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        location: req.body.location,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        capacity: req.body.capacity || null,
        pointsRemain: req.body.points,
        organizers: {
          connect: {
            id: req.user.id
          }
        }
      },
      include: {
        organizers: true,
        guests: true
      }
    });
    const organizers = event.organizers.map(organizer => {
      return {
        id: organizer.id,
        utorid: organizer.username,
        name: organizer.name
      };
    });
    const guests = event.guests.map(guest => {
      return {
        id: guest.id,
        utorid: guest.username,
        name: guest.name
      };
    });

    res.status(201).json({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      capacity: event.capacity,
      pointsRemain: event.pointsRemain,
      pointsAwarded: event.pointsAwarded,
      published: event.published,
      organizers,
      guests
    });
  });

  app.get("/events", async (req, res) => {
    const valid = (
      validate.string(req.query, "name", "location") &&
      validate.boolean(req.query, "started", "ended", "showFull", "published") &&
      validate.positiveInt(req.query, "page", "limit") &&
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
    if (defined(req.query, "location")) {
      AND.push({ location: req.query.location });
    }
    if (defined(req.query, "started")) {
      AND.push({ startTime: req.query.started ? { lte: new Date() } : { gt: new Date() } });
    }
    if (defined(req.query, "ended")) {
      AND.push({ endTime: req.query.ended ? { lte: new Date() } : { gt: new Date() } });
    }
    if (manage) {
      if (defined(req.query, "published")) {
        AND.push({ published: req.query.published });
      }
    }
    else {
      AND.push({ published: true });
    }

    const events = await getPrisma().event.findMany({
      where: { AND },
      include: {
        _count: {
          select: {
            guests: true
          }
        }
      }
    });
    const filteredEvents = events.filter(event => (
      defined(req.query, "showFull") && req.query.showFull ||
      event.capacity == null || event.capacity > event._count.guests
    ));
    const take = req.query.limit || 10;
    const skip = (req.query.page || 1) * take - take;
    const pagedEvents = filteredEvents.slice(skip, skip + take);

    if (manage) {
      res.status(200).json({
        count: filteredEvents.length,
        results: pagedEvents.map(event => {
          return {
            id: event.id,
            name: event.name,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            capacity: event.capacity,
            pointsRemain: event.pointsRemain,
            pointsAwarded: event.pointsAwarded,
            published: event.published,
            numGuests: event._count.guests
          };
        })
      });
    }
    else {
      res.status(200).json({
        count: filteredEvents.length,
        results: pagedEvents.map(event => {
          return {
            id: event.id,
            name: event.name,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            capacity: event.capacity,
            numGuests: event._count.guests
          };
        })
      });
    }
  });

  app.get("/events/:eventId", async (req, res) => {
    const valid = validate.integer(req.params, "eventId");
    if (!valid) {
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

    const organizers = event.organizers.map(organizer => {
      return {
        id: organizer.id,
        utorid: organizer.username,
        name: organizer.name
      };
    });
    const guests = event.guests.map(guest => {
      return {
        id: guest.id,
        utorid: guest.username,
        name: guest.name
      };
    });
    const manage = req.user.role === Role.MANAGER || req.user.role === Role.SUPERUSER ||
                   organizers.some(x => req.user.id === x.id);
    if (!manage && !event.published) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    if (manage) {
      res.status(200).json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        pointsRemain: event.pointsRemain,
        pointsAwarded: event.pointsAwarded,
        published: event.published,
        organizers,
        guests
      });
    }
    else {
      res.status(200).json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        organizers,
        numGuests: event.guests.length
      });
    }
  });

  app.patch("/events/:eventId", async (req, res) => {
    if (!validate.integer(req.params, "eventId")) {
      res.status(400).json({ error: "Event ID was not an integer" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      },
      include: {
        organizers: true,
        _count: {
          select: {
            guests: true
          }
        }
      }
    });
    if (!event) {
      res.status(404).json({ error: "Event was not found" });
      return;
    }

    const manage = req.user.role === Role.MANAGER || req.user.role === Role.SUPERUSER;
    const own = event.organizers.some(x => req.user.id === x.id);
    if (!manage && (!own || defined(req.body, "points") || defined(req.body, "published"))) {
      res.status(403).json({ error: "User does not organize this event" });
      return;
    }

    if (!validate.string(req.body, "name")) {
      res.status(400).json({ error: "Name was not a string" });
      return;
    }
    else if (!validate.string(req.body, "description")) {
      res.status(400).json({ error: "Description was not a string" });
      return;
    }
    else if (!validate.string(req.body, "location")) {
      res.status(400).json({ error: "Location was not a string" });
      return;
    }
    else if (!validate.dateTime(req.body, "startTime")) {
      res.status(400).json({ error: "Start time was not a date time" });
      return;
    }
    else if (!validate.dateTime(req.body, "endTime")) {
      res.status(400).json({ error: "End time was not a date time" });
      return;
    }
    else if (!validate.positiveInt(req.body, "capacity")) {
      res.status(400).json({ error: "Capacity was not a positive integer" });
      return;
    }
    else if (!validate.positiveInt(req.body, "points")) {
      res.status(400).json({ error: "Points was not a positive integer" });
      return;
    }
    else if (!validate.boolean(req.body, "published")) {
      res.status(400).json({ error: "Published was not a boolean" });
      return;
    }
    else if ((req.body.startTime || event.startTime) >= (req.body.endTime || event.endTime)) {
      res.status(400).json({ error: "End time was not after start time" });
      return;
    }
    else if (defined(req.body, "published") && !req.body.published) {
      res.status(400).json({ error: "Cannot unpublish an event" });
      return;
    }
    else if (defined(req.body, "startTime") && new Date() >= req.body.startTime) {
      res.status(400).json({ error: "Start time has already passed" });
      return;
    }
    else if (defined(req.body, "endTime") && new Date() >= req.body.endTime) {
      res.status(400).json({ error: "End time has already passed" });
      return;
    }
    else if (defined(req.body, "capacity") && req.body.capacity < event._count.guests) {
      res.status(400).json({ error: "Capacity was less than amount of guests" });
      return;
    }
    else if (defined(req.body, "points") && req.body.points < event.pointsAwarded) {
      res.status(400).json({ error: "Points was less than amount of points awarded" });
      return;
    }
    else if (defined(req.body, "name", "description", "location", "startTime", "capacity") && new Date() >= event.startTime) {
      res.status(400).json({ error: "Cannot update fields after event has started" });
      return;
    }
    else if (defined(req.body, "endTime") && new Date() >= event.endTime) {
      res.status(400).json({ error: "Cannot update end time after event has ended" });
      return;
    }

    const data = {};
    if (defined(req.body, "name")) {
      data.name = req.body.name;
    }
    if (defined(req.body, "description")) {
      data.description = req.body.description;
    }
    if (defined(req.body, "location")) {
      data.location = req.body.location;
    }
    if (defined(req.body, "startTime")) {
      data.startTime = req.body.startTime;
    }
    if (defined(req.body, "endTime")) {
      data.endTime = req.body.endTime;
    }
    if (defined(req.body, "capacity")) {
      data.capacity = req.body.capacity;
    }
    if (defined(req.body, "points")) {
      data.pointsRemain = req.body.points - event.pointsAwarded;
    }
    if (defined(req.body, "published")) {
      data.published = req.body.published;
    }

    const updated = await getPrisma().event.update({
      where: {
        id: event.id
      },
      data,
      include: {
        organizers: true,
        _count: {
          select: {
            guests: true
          }
        }
      }
    });

    const result = {
      id: updated.id,
      name: updated.name,
      location: updated.location
    };
    for (const field in data) {
      result[field] = updated[field];
    }
    res.status(200).json(result);
  });

  app.delete("/events/:eventId", managerOrHigher, async (req, res) => {
    const valid = validate.integer(req.params, "eventId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      }
    });
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (event.published) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    await getPrisma().event.delete({
      where: {
        id: event.id
      }
    });
    res.status(204).json({ message: "No Content" });
  });

  app.post("/events/:eventId/organizers", managerOrHigher, async (req, res) => {
    const valid = (
      validate.integer(req.params, "eventId") &&
      validate.required(req.body, "utorid") &&
      validate.string(req.body, "utorid")
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      },
      include: {
        guests: true
      }
    });
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (event.guests.some(x => req.body.utorid === x.username)) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    else if (event.endTime < new Date()) {
      res.status(410).json({ error: "Gone" });
      return;
    }

    const organizer = await getPrisma().user.findUnique({
      where: {
        username: req.body.utorid
      }
    });
    if (!organizer) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const updated = await getPrisma().event.update({
      where: {
        id: event.id
      },
      data: {
        organizers: {
          connect: {
            id: organizer.id
          }
        }
      },
      include: {
        organizers: true
      }
    });
    res.status(201).json({
      id: updated.id,
      name: updated.name,
      location: updated.location,
      organizers: updated.organizers.map(organizer => {
        return {
          id: organizer.id,
          utorid: organizer.username,
          name: organizer.name
        };
      })
    });
  });

  app.delete("/events/:eventId/organizers/:userId", managerOrHigher, async (req, res) => {
    const valid = validate.integer(req.params, "eventId", "userId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      }
    });
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const organizer = await getPrisma().user.findUnique({
      where: {
        id: req.params.userId
      }
    });
    if (!organizer) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    await getPrisma().event.update({
      where: {
        id: event.id
      },
      data: {
        organizers: {
          disconnect: {
            id: organizer.id
          }
        }
      }
    });
    res.status(204).json({ message: "No Content" });
  });

  app.post("/events/:eventId/guests", async (req, res) => {
    const valid = (
      validate.integer(req.params, "eventId") &&
      validate.required(req.body, "utorid") &&
      validate.string(req.body, "utorid")
    );
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      },
      include: {
        organizers: true,
        _count: {
          select: {
            guests: true
          }
        }
      }
    });
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (event.organizers.some(x => req.body.utorid === x.username)) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    else if (event.capacity == event._count.guests || event.endTime < new Date()) {
      res.status(410).json({ error: "Gone" });
      return;
    }

    const guest = await getPrisma().user.findUnique({
      where: {
        username: req.body.utorid
      }
    });
    if (!guest) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const updated = await getPrisma().event.update({
      where: {
        id: event.id
      },
      data: {
        guests: {
          connect: {
            id: guest.id
          }
        }
      },
      include: {
        guests: true
      }
    });
    const guestAdded = updated.guests.find(x => guest.id === x.id);
    res.status(201).json({
      id: updated.id,
      name: updated.name,
      location: updated.location,
      guestAdded: {
        id: guestAdded.id,
        utorid: guestAdded.username,
        name: guestAdded.name
      },
      numGuests: updated.guests.length
    });
  });

  app.post("/events/:eventId/guests/me", async (req, res) => {
    const valid = validate.integer(req.params, "eventId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      },
      include: {
        guests: true
      }
    });
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (event.guests.some(x => req.user.id === x.id)) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    else if (event.capacity == event.guests.length || event.endTime < new Date()) {
      res.status(410).json({ error: "Gone" });
      return;
    }

    const updated = await getPrisma().event.update({
      where: {
        id: event.id
      },
      data: {
        guests: {
          connect: {
            id: req.user.id
          }
        }
      },
      include: {
        guests: true
      }
    });
    const guestAdded = updated.guests.find(x => req.user.id === x.id);
    res.status(201).json({
      id: updated.id,
      name: updated.name,
      location: updated.location,
      guestAdded: {
        id: guestAdded.id,
        utorid: guestAdded.username,
        name: guestAdded.name
      },
      numGuests: updated.guests.length
    });
  });

  app.delete("/events/:eventId/guests/me", async (req, res) => {
    const valid = validate.integer(req.params, "eventId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      },
      include: {
        guests: true
      }
    });
    if (!event || !event.guests.some(x => req.user.id === x.id)) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    else if (event.endTime < new Date()) {
      res.status(410).json({ error: "Gone" });
      return;
    }

    await getPrisma().event.update({
      where: {
        id: event.id
      },
      data: {
        guests: {
          disconnect: {
            id: req.user.id
          }
        }
      }
    });
    res.status(204).json({ message: "No Content" });
  });

  app.delete("/events/:eventId/guests/:userId", managerOrHigher, async (req, res) => {
    const valid = validate.integer(req.params, "eventId", "userId");
    if (!valid) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const event = await getPrisma().event.findUnique({
      where: {
        id: req.params.eventId
      }
    });
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const guest = await getPrisma().user.findUnique({
      where: {
        id: req.params.userId
      }
    });
    if (!guest) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    await getPrisma().event.update({
      where: {
        id: event.id
      },
      data: {
        guests: {
          disconnect: {
            id: guest.id
          }
        }
      }
    });
    res.status(204).json({ message: "No Content" });
  });
};
