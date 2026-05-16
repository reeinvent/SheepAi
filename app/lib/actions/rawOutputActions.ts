"use server";

import { RawIngestorOutputRepository } from "@/app/lib/repositories/rawIngestorOutputRepository";

export interface CreateRawOutputInput {
  dataSource: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get all raw ingester outputs
 */
export async function getAllOutputs(filters?: {
  dataSource?: string;
}) {
  try {
    return await RawIngestorOutputRepository.getAllOutputs(filters);
  } catch (error) {
    console.error("Error fetching raw outputs:", error);
    throw new Error("Failed to fetch raw outputs");
  }
}

/**
 * Get a single raw output by ID
 */
export async function getOutputById(id: string) {
  try {
    const output = await RawIngestorOutputRepository.getOutputById(id);
    if (!output) {
      throw new Error("Output not found");
    }
    return output;
  } catch (error) {
    console.error("Error fetching raw output:", error);
    throw error;
  }
}

/**
 * Create a new raw ingester output (user report)
 */
export async function createOutput(input: CreateRawOutputInput) {
  try {
    if (!input.dataSource) {
      throw new Error("dataSource is required");
    }
    if (!input.summary) {
      throw new Error("summary is required");
    }
    return await RawIngestorOutputRepository.createOutput(input);
  } catch (error) {
    console.error("Error creating raw output:", error);
    throw error;
  }
}

/**
 * Update a raw output
 */
export async function updateOutput(
  id: string,
  input: Partial<CreateRawOutputInput>
) {
  try {
    return await RawIngestorOutputRepository.updateOutput(id, input);
  } catch (error) {
    console.error("Error updating raw output:", error);
    throw error;
  }
}

/**
 * Delete a raw output
 */
export async function deleteOutput(id: string) {
  try {
    return await RawIngestorOutputRepository.deleteOutput(id);
  } catch (error) {
    console.error("Error deleting raw output:", error);
    throw error;
  }
}

/**
 * Get outputs by data source
 */
export async function getOutputsByDataSource(dataSource: string) {
  try {
    return await RawIngestorOutputRepository.getOutputsByDataSource(dataSource);
  } catch (error) {
    console.error("Error fetching outputs by data source:", error);
    throw error;
  }
}

/**
 * Get user input outputs (reports)
 */
export async function getUserInputOutputs() {
  try {
    return await RawIngestorOutputRepository.getUserInputOutputs();
  } catch (error) {
    console.error("Error fetching user input outputs:", error);
    throw error;
  }
}

/**
 * Get outputs that haven't been promoted to tickets yet
 */
export async function getUnpromotedOutputs() {
  try {
    return await RawIngestorOutputRepository.getUnpromotedOutputs();
  } catch (error) {
    console.error("Error fetching unreviewed outputs:", error);
    throw error;
  }
}

/**
 * Promote an output to a ticket
 */
export async function promoteToTicket(
  outputId: string,
  ticketData: {
    title: string;
    description?: string;
    priority?: string;
  }
) {
  try {
    return await RawIngestorOutputRepository.promoteToTicket(
      outputId,
      ticketData
    );
  } catch (error) {
    console.error("Error promoting output to ticket:", error);
    throw error;
  }
}
