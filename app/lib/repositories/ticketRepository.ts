import { prisma } from "@/app/lib/db";
import type { TicketStatus } from "../issues/types";

export interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: string;
  description?: string;
}

export class TicketRepository {
  /**
   * Get all tickets with optional filtering
   */
  static async getAllTickets(filters?: {
    status?: TicketStatus;
    priority?: string;
  }) {
    return prisma.ticket.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
      },
      include: {
        rawOutputs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get a single ticket by ID
   */
  static async getTicketById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        rawOutputs: true,
      },
    });
  }

  /**
   * Create a new ticket
   */
  static async createTicket(input: CreateTicketInput) {
    return prisma.ticket.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority || "medium",
        status: "pending_approval",
      },
      include: {
        rawOutputs: true,
      },
    });
  }

  /**
   * Update a ticket
   */
  static async updateTicket(id: string, input: UpdateTicketInput) {
    return prisma.ticket.update({
      where: { id },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.priority && { priority: input.priority }),
        ...(input.description && { description: input.description }),
      },
      include: {
        rawOutputs: true,
      },
    });
  }

  /**
   * Delete a ticket
   */
  static async deleteTicket(id: string) {
    return prisma.ticket.delete({
      where: { id },
    });
  }

  /**
   * Get tickets by status
   */
  static async getTicketsByStatus(status: TicketStatus) {
    return prisma.ticket.findMany({
      where: { status },
      include: {
        rawOutputs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStats() {
    const tickets = await prisma.ticket.findMany();
    return {
      total: tickets.length,
      pending_approval: tickets.filter((t) => t.status === "pending_approval")
        .length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      rejected: tickets.filter((t) => t.status === "rejected").length,
    };
  }
}
