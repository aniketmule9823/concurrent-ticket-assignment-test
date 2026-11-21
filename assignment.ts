
import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export async function assignTicket(
  ticketId: string,
  technicianId: string
) {
  try {
    const assignment = await prisma.$transaction(async (tx) => {
      // Lock the ticket row until this transaction finishes.
      const tickets = await tx.$queryRaw<
        { id: string; version: number }[]
      >`
        SELECT id, version
        FROM "Ticket"
        WHERE id = ${ticketId}
        FOR UPDATE
      `;

      if (tickets.length === 0) {
        throw new Error("TICKET_NOT_FOUND");
      }

      const ticket = tickets[0]!;

      // Reject if another request has already assigned this ticket.
      const existingAssignment = await tx.assignment.findUnique({
        where: { ticketId },
      });

      if (existingAssignment) {
        throw new Error("TICKET_ALREADY_ASSIGNED");
      }

      // Optimistic locking: update only if the version still matches.
      const updated = await tx.ticket.updateMany({
        where: {
          id: ticketId,
          version: Number(ticket.version),
        },
        data: {
          status: "in_progress",
          version: { increment: 1 },
        },
      });

      if (updated.count !== 1) {
        throw new Error("VERSION_CONFLICT");
      }

      return tx.assignment.create({
        data: {
          ticketId,
          technicianId,
        },
      });
    });

    return {
      success: true,
      status: 200,
      assignment,
    };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      [
        "TICKET_ALREADY_ASSIGNED",
        "VERSION_CONFLICT",
      ].includes(error.message)
    ) {
      return {
        success: false,
        status: 409,
        message: "Ticket is already assigned or was updated by another request.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          status: 409,
          message: "Ticket is already assigned.",
        };
      }
    }

    throw error;
  }
}


