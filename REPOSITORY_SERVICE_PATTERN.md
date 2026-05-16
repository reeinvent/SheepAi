# Repository Service Pattern

This document explains the repository service pattern implemented in SheepAi for exposing database operations to the client.

## Architecture Overview

The pattern consists of three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                       │
│              (React Components using useTickets)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Client Hooks                              │
│              (useTickets - app/lib/hooks/)                   │
│         Handles state, loading, error management             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes                                │
│              (Next.js Route Handlers)                        │
│         /api/tickets, /api/tickets/[id], etc.               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Repository Service                            │
│         (TicketRepository - app/lib/repositories/)           │
│         Pure database operations using Prisma               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
│              (SQLite via Prisma ORM)                         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Repository Service (`app/lib/repositories/ticketRepository.ts`)

Static methods that encapsulate all database operations:

```typescript
// Get all tickets
TicketRepository.getAllTickets(filters?)

// Get single ticket
TicketRepository.getTicketById(id)

// Create ticket
TicketRepository.createTicket(input)

// Update ticket
TicketRepository.updateTicket(id, input)

// Delete ticket
TicketRepository.deleteTicket(id)

// Get statistics
TicketRepository.getTicketStats()
```

**Benefits:**

- Centralized database logic
- Easy to test
- Reusable across API routes and server components
- Type-safe with TypeScript

### 2. API Routes

#### `app/api/tickets/route.ts`

- `GET /api/tickets` - Fetch all tickets with optional filtering
- `POST /api/tickets` - Create a new ticket

#### `app/api/tickets/[id]/route.ts`

- `GET /api/tickets/[id]` - Fetch a single ticket
- `PATCH /api/tickets/[id]` - Update a ticket
- `DELETE /api/tickets/[id]` - Delete a ticket

#### `app/api/tickets/stats/route.ts`

- `GET /api/tickets/stats` - Get ticket statistics

**Benefits:**

- RESTful API design
- Consistent error handling
- Request validation
- Separation of concerns

### 3. Client Hook (`app/lib/hooks/useTickets.ts`)

React hook that manages client-side state and API communication:

```typescript
const {
  tickets,           // Array of tickets
  stats,            // Ticket statistics
  loading,          // Loading state
  error,            // Error message
  createTicket,     // Function to create
  updateTicket,     // Function to update
  deleteTicket,     // Function to delete
  refetch,          // Function to refetch
} = useTickets(options?)
```

**Features:**

- Automatic data fetching on mount
- State management (loading, error)
- Optimistic updates
- Automatic stats refresh after mutations
- Optional filtering by status/priority

**Usage:**

```typescript
const { tickets, createTicket, updateTicket } = useTickets();

// Create a ticket
await createTicket({
  title: "New issue",
  description: "Description",
  priority: "high",
});

// Update a ticket
await updateTicket(ticketId, {
  status: "in_progress",
});
```

## Data Flow

### Creating a Ticket

1. **Component** calls `createTicket(input)`
2. **Hook** sends POST request to `/api/tickets`
3. **API Route** validates input
4. **Repository** creates record in database
5. **API Route** returns created ticket
6. **Hook** updates local state and refetches stats
7. **Component** re-renders with new data

### Updating a Ticket

1. **Component** calls `updateTicket(id, input)`
2. **Hook** sends PATCH request to `/api/tickets/[id]`
3. **API Route** validates input
4. **Repository** updates record in database
5. **API Route** returns updated ticket
6. **Hook** updates local state and refetches stats
7. **Component** re-renders with updated data

## Migration from Hardcoded Data

### Before (Hardcoded)

```typescript
const [tickets, setTickets] = useState<TicketObject[]>(initialTickets);

const handleCreate = async (draft: IssueDraft) => {
  const newTicket = { id: nextId(tickets), ...draft };
  setTickets((curr) => [newTicket, ...curr]);
};
```

### After (Database-Driven)

```typescript
const { tickets, createTicket } = useTickets();

const handleCreate = async (draft: IssueDraft) => {
  await createTicket({
    title: draft.title,
    description: draft.body,
  });
};
```

## Adding New Operations

To add a new repository method:

1. **Add to Repository** (`app/lib/repositories/ticketRepository.ts`):

```typescript
static async getTicketsByPriority(priority: string) {
  return prisma.ticket.findMany({
    where: { priority },
    orderBy: { createdAt: "desc" }
  });
}
```

2. **Add API Route** (e.g., `app/api/tickets/by-priority/route.ts`):

```typescript
export async function GET(request: NextRequest) {
  const priority = request.nextUrl.searchParams.get("priority");
  const tickets = await TicketRepository.getTicketsByPriority(priority);
  return NextResponse.json(tickets);
}
```

3. **Add Hook Method** (`app/lib/hooks/useTickets.ts`):

```typescript
const getByPriority = useCallback(async (priority: string) => {
  const response = await fetch(`/api/tickets/by-priority?priority=${priority}`);
  return response.json();
}, []);
```

## Error Handling

All layers include error handling:

- **Repository**: Throws Prisma errors
- **API Routes**: Catches errors, returns 500 with message
- **Hook**: Catches errors, sets error state, throws to component
- **Component**: Catches errors, shows toast notification

## Type Safety

The pattern maintains type safety throughout:

- Prisma generates types from schema
- Repository methods are typed
- API routes validate input
- Hook provides typed return values
- Components use TypeScript interfaces

## Performance Considerations

- **Caching**: Hook caches data in state
- **Refetching**: Manual `refetch()` or automatic after mutations
- **Filtering**: Server-side filtering in repository
- **Pagination**: Can be added to repository methods

## Testing

Each layer can be tested independently:

```typescript
// Test repository
const ticket = await TicketRepository.createTicket({ title: "Test" });

// Test API route
const response = await fetch("/api/tickets", { method: "POST", body: ... });

// Test hook
const { createTicket } = renderHook(() => useTickets());
await createTicket({ title: "Test" });
```

## Next Steps

1. Seed database with initial data
2. Add authentication/authorization
3. Add pagination to list endpoints
4. Add filtering and sorting options
5. Add real-time updates with WebSockets
6. Add caching strategy
