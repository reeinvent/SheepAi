# Quick Start for UI Development

## Overview

The backend is ready. All database operations are exposed through **Server Actions** and **React Hooks**. You just need to build the UI components.

## Available Hooks

### useTickets()

```typescript
import { useTickets } from "@/app/lib/hooks/useTickets";

const {
  tickets, // Array of tickets
  stats, // { total, pending_approval, open, in_progress, resolved, rejected }
  loading, // true while fetching
  error, // error message or null
  createTicket, // async function
  updateTicket, // async function
  deleteTicket, // async function
  refetch, // manual refresh
} = useTickets();
```

### useRawOutputs()

```typescript
import { useRawOutputs } from "@/app/lib/hooks/useRawOutputs";

const {
  outputs, // Array of raw outputs (user reports)
  loading, // true while fetching
  error, // error message or null
  createOutput, // async function
  updateOutput, // async function
  deleteOutput, // async function
  refetch, // manual refresh
} = useRawOutputs();
```

## Common Patterns

### Display Tickets

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";

export function TicketList() {
  const { tickets, loading, error } = useTickets();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id}>
          <h3>{ticket.title}</h3>
          <p>{ticket.description}</p>
          <span>{ticket.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### Create Ticket

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";
import { useState } from "react";

export function CreateTicketForm() {
  const { createTicket } = useTickets();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createTicket({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        priority: formData.get("priority") as string,
      });
      e.currentTarget.reset();
      alert("Ticket created!");
    } catch (error) {
      alert("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required placeholder="Title" />
      <textarea name="description" placeholder="Description" />
      <select name="priority">
        <option>low</option>
        <option>medium</option>
        <option>high</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### Update Ticket Status

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";

export function TicketCard({ ticket }) {
  const { updateTicket } = useTickets();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateTicket(ticket.id, { status: newStatus });
      alert("Updated!");
    } catch (error) {
      alert("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>{ticket.title}</h3>
      <select
        value={ticket.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
      >
        <option value="pending_approval">Pending</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}
```

### Display User Reports

```typescript
"use client";

import { useRawOutputs } from "@/app/lib/hooks/useRawOutputs";

export function UserReportsList() {
  const { outputs, loading, error } = useRawOutputs({
    dataSource: "userInput"
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>User Reports ({outputs.length})</h2>
      {outputs.map(output => (
        <div key={output.id}>
          <p>{output.summary}</p>
          <small>{new Date(output.timestamp).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}
```

### Create User Report

```typescript
"use client";

import { useRawOutputs } from "@/app/lib/hooks/useRawOutputs";
import { useState } from "react";

export function ReportIssueForm() {
  const { createOutput } = useRawOutputs();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createOutput({
        summary: formData.get("summary") as string,
      });
      e.currentTarget.reset();
      alert("Report submitted!");
    } catch (error) {
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        name="summary"
        required
        placeholder="Describe the issue..."
        rows={4}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
```

### Promote Report to Ticket

```typescript
"use client";

import { promoteToTicket } from "@/app/lib/actions/rawOutputActions";
import { useState } from "react";

export function PromoteReportButton({ outputId, summary }) {
  const [loading, setLoading] = useState(false);

  const handlePromote = async () => {
    setLoading(true);
    try {
      await promoteToTicket(outputId, {
        title: summary.substring(0, 50), // Use first 50 chars as title
        description: summary,
        priority: "medium",
      });
      alert("Promoted to ticket!");
    } catch (error) {
      alert("Failed to promote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePromote} disabled={loading}>
      {loading ? "Promoting..." : "Promote to Ticket"}
    </button>
  );
}
```

### Display Statistics

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";

export function TicketStats() {
  const { stats } = useTickets();

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <div>Total: {stats.total}</div>
      <div>Pending: {stats.pending_approval}</div>
      <div>Open: {stats.open}</div>
      <div>In Progress: {stats.in_progress}</div>
      <div>Resolved: {stats.resolved}</div>
      <div>Rejected: {stats.rejected}</div>
    </div>
  );
}
```

### Filter Tickets

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";

export function OpenTickets() {
  const { tickets } = useTickets({
    status: "open",
    priority: "high"
  });

  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id}>{ticket.title}</div>
      ))}
    </div>
  );
}
```

## Error Handling

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";

export function SafeTicketList() {
  const { tickets, loading, error, refetch } = useTickets();

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id}>{ticket.title}</div>
      ))}
    </div>
  );
}
```

## Loading States

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";

export function TicketListWithSkeleton() {
  const { tickets, loading } = useTickets();

  if (loading) {
    return (
      <div>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 h-12 mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket.id}>{ticket.title}</div>
      ))}
    </div>
  );
}
```

## Optimistic Updates

```typescript
"use client";

import { useTickets } from "@/app/lib/hooks/useTickets";
import { useState } from "react";

export function OptimisticTicketUpdate({ ticket }) {
  const { updateTicket } = useTickets();
  const [optimisticStatus, setOptimisticStatus] = useState(ticket.status);

  const handleStatusChange = async (newStatus: string) => {
    // Optimistic update
    setOptimisticStatus(newStatus);

    try {
      await updateTicket(ticket.id, { status: newStatus });
    } catch (error) {
      // Revert on error
      setOptimisticStatus(ticket.status);
      alert("Failed to update");
    }
  };

  return (
    <select
      value={optimisticStatus}
      onChange={(e) => handleStatusChange(e.target.value)}
    >
      <option value="open">Open</option>
      <option value="in_progress">In Progress</option>
      <option value="resolved">Resolved</option>
    </select>
  );
}
```

## Tips

1. **Always use "use client"** - These hooks are client components
2. **Handle loading state** - Show loading indicator while fetching
3. **Handle errors** - Show error message and retry button
4. **Use try/catch** - Wrap async operations in try/catch
5. **Disable buttons during loading** - Prevent double submissions
6. **Show feedback** - Toast or alert after operations
7. **Refetch when needed** - Call `refetch()` to manually refresh

## Available Data

### Ticket Fields

- `id` - Unique identifier
- `title` - Ticket title
- `description` - Full description
- `status` - pending_approval, open, in_progress, resolved, rejected
- `priority` - low, medium, high, critical
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `rawOutputs` - Related raw outputs

### RawOutput Fields

- `id` - Unique identifier
- `dataSource` - "userInput", "reddit", "twitter", etc.
- `summary` - Issue description
- `timestamp` - When reported
- `metadata` - JSON string of additional data
- `ticketId` - Link to promoted ticket (if any)
- `ticket` - Related ticket object
- `createdAt` - Creation date
- `updatedAt` - Last update date

## Questions?

Check the backend files:

- `app/lib/repositories/` - Database operations
- `app/lib/actions/` - Server actions
- `app/lib/hooks/` - React hooks
