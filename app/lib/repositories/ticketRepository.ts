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
        categories: "[]",
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
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.description !== undefined && { description: input.description }),
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
    const [total, pending_approval, open, in_progress, resolved, rejected] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "pending_approval" } }),
        prisma.ticket.count({ where: { status: "open" } }),
        prisma.ticket.count({ where: { status: "in_progress" } }),
        prisma.ticket.count({ where: { status: "resolved" } }),
        prisma.ticket.count({ where: { status: "rejected" } }),
      ]);
    return { total, pending_approval, open, in_progress, resolved, rejected };
  }
}
