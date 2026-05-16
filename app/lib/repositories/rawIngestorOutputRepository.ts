import { prisma } from "@/app/lib/db";

export interface CreateRawIngestorOutputInput {
  dataSource: string; // "userInput", "reddit", "twitter", etc.
  summary: string; // The issue description/summary
  metadata?: Record<string, unknown>; // Optional metadata
}

export class RawIngestorOutputRepository {
  /**
   * Get all raw ingester outputs
   */
  static async getAllOutputs(filters?: {
    dataSource?: string;
  }) {
    return prisma.rawIngestorOutput.findMany({
      where: {
        ...(filters?.dataSource && { dataSource: filters.dataSource }),
      },
      include: {
        ticket: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * Get a single raw ingester output by ID
   */
  static async getOutputById(id: string) {
    return prisma.rawIngestorOutput.findUnique({
      where: { id },
      include: {
        ticket: true,
      },
    });
  }

  /**
   * Create a new raw ingester output
   */
  static async createOutput(input: CreateRawIngestorOutputInput) {
    return prisma.rawIngestorOutput.create({
      data: {
        dataSource: input.dataSource,
        summary: input.summary,
        timestamp: new Date(),
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
      include: {
        ticket: true,
      },
    });
  }

  /**
   * Update a raw ingester output
   */
  static async updateOutput(
    id: string,
    input: Partial<CreateRawIngestorOutputInput>
  ) {
    return prisma.rawIngestorOutput.update({
      where: { id },
      data: {
        ...(input.dataSource && { dataSource: input.dataSource }),
        ...(input.summary && { summary: input.summary }),
        ...(input.metadata && { metadata: JSON.stringify(input.metadata) }),
      },
      include: {
        ticket: true,
      },
    });
  }

  /**
   * Delete a raw ingester output
   */
  static async deleteOutput(id: string) {
    return prisma.rawIngestorOutput.delete({
      where: { id },
    });
  }

  /**
   * Get outputs by data source
   */
  static async getOutputsByDataSource(dataSource: string) {
    return prisma.rawIngestorOutput.findMany({
      where: { dataSource },
      include: {
        ticket: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * Get user input outputs (reports)
   */
  static async getUserInputOutputs() {
    return this.getOutputsByDataSource("userInput");
  }

  /**
   * Get outputs that haven't been promoted to tickets yet
   */
  static async getUnpromotedOutputs() {
    return prisma.rawIngestorOutput.findMany({
      where: {
        ticketId: null,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * Promote an output to a ticket
   */
  static async promoteToTicket(
    outputId: string,
    ticketData: {
      title: string;
      description?: string;
      priority?: string;
    }
  ) {
    // Create ticket and link it to the output
    const ticket = await prisma.ticket.create({
      data: {
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority || "medium",
        status: "open",
      },
    });

    // Update the output to link to the ticket
    return prisma.rawIngestorOutput.update({
      where: { id: outputId },
      data: { ticketId: ticket.id },
      include: { ticket: true },
    });
  }
}
