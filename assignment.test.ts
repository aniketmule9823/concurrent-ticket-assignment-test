
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, assignTicket } from "../assignment";

let testTicketId = "";
let testTechnicianId = "";

describe("Concurrent ticket assignment", () => {
  beforeAll(async () => {
    await prisma.assignment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organisation.deleteMany();

    const organisation = await prisma.organisation.create({
      data: { name: "Test Organisation" },
    });

    const technician = await prisma.user.create({
      data: {
        name: "Test Technician",
        organisationId: organisation.id,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        title: "Concurrency Test Ticket",
        organisationId: organisation.id,
      },
    });

    testTicketId = ticket.id;
    testTechnicianId = technician.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("allows exactly one of 20 simultaneous assignments", async () => {
    const requests = Array.from({ length: 20 }, () =>
      assignTicket(testTicketId, testTechnicianId)
    );

    const results = await Promise.all(requests);

    const successful = results.filter((result) => result.success);
    const rejected = results.filter((result) => !result.success);

    const assignmentCount = await prisma.assignment.count({
      where: { ticketId: testTicketId },
    });

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: testTicketId },
    });

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(19);
    expect(rejected.every((result) => result.status === 409)).toBe(true);
    expect(assignmentCount).toBe(1);

    expect(updatedTicket).not.toBeNull();
    expect(updatedTicket?.version).toBe(1);
    expect(updatedTicket?.status).toBe("in_progress");
  });
});

