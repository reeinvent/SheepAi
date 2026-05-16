"use server";

import { TicketRepository } from "@/app/lib/repositories/ticketRepository";
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
  lat?: number | null;
  lon?: number | null;
  location?: string | null;
  approvedBy?: string | null;
  startedBy?: string | null;
  resolvedBy?: string | null;
  rejectedBy?: string | null;
}

/**
 * Get all tickets with optional filtering
 */
export async function getAllTickets(filters?: {
  status?: TicketStatus;
  priority?: string;
}) {
  try {
    return await TicketRepository.getAllTickets(filters);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    throw new Error("Failed to fetch tickets");
  }
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(id: string) {
  try {
    const ticket = await TicketRepository.getTicketById(id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    return ticket;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    throw error;
  }
}

/**
 * Create a new ticket
 */
export async function createTicket(input: CreateTicketInput) {
  try {
    if (!input.title) {
      throw new Error("Title is required");
    }
    return await TicketRepository.createTicket(input);
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
}

/**
 * Update a ticket
 */
export async function updateTicket(id: string, input: UpdateTicketInput) {
  try {
    return await TicketRepository.updateTicket(id, input);
  } catch (error) {
    console.error("Error updating ticket:", error);
    throw error;
  }
}

/**
 * Delete a ticket
 */
export async function deleteTicket(id: string) {
  try {
    return await TicketRepository.deleteTicket(id);
  } catch (error) {
    console.error("Error deleting ticket:", error);
    throw error;
  }
}

/**
 * Get tickets by status
 */
export async function getTicketsByStatus(status: TicketStatus) {
  try {
    return await TicketRepository.getTicketsByStatus(status);
  } catch (error) {
    console.error("Error fetching tickets by status:", error);
    throw error;
  }
}

/**
 * Get ticket statistics
 */
export async function getTicketStats() {
  try {
    return await TicketRepository.getTicketStats();
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    throw error;
  }
}
