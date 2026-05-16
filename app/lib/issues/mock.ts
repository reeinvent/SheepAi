import type { TicketObject } from "@/src/entities/ticket";

const day = (offsetDays: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d;
};

export const MOCK_TICKETS: TicketObject[] = [
  {
    id: "1",
    title: "Pothole on Marmontova",
    body: "Deep pothole near the tram stop, several cars have hit it. Becoming a hazard for cyclists.",
    createdAt: day(1),
    updatedAt: day(1),
    status: "pending_approval",
    metadata: {
      category: "Roads",
      priority: "High",
      location: "Marmontova 14, Split",
    },
  },
  {
    id: "2",
    title: "Streetlight out by the park",
    body: "The streetlight in front of Park Đardin has been out for over a week.",
    createdAt: day(5),
    updatedAt: day(3),
    status: "open",
    metadata: {
      category: "Lighting",
      priority: "Medium",
      location: "Park Đardin entrance",
    },
  },
  {
    id: "3",
    title: "Overflowing waste bin",
    body: "Bin near the ferry terminal has been overflowing for several days, attracting seagulls.",
    createdAt: day(7),
    updatedAt: day(3),
    status: "rejected",
    metadata: {
      category: "Waste",
      priority: "Low",
      location: "Ferry terminal, Riva",
    },
  },
  {
    id: "4",
    title: "Water leak on the sidewalk",
    body: "Continuous water leak coming up through a manhole cover. Slippery in the evenings.",
    createdAt: day(0),
    updatedAt: day(0),
    status: "pending_approval",
    metadata: {
      category: "Water",
      priority: "High",
      location: "Hrvojeva 5",
    },
  },
  {
    id: "5",
    title: "Broken bench in the park",
    body: "The middle bench along the main path has a broken plank, dangerous to sit on.",
    createdAt: day(10),
    updatedAt: day(2),
    status: "in_progress",
    metadata: {
      category: "Parks",
      priority: "Medium",
      location: "Marjan Park, main path",
    },
  },
  {
    id: "6",
    title: "Faded crosswalk markings",
    body: "Crosswalk near the school is barely visible, especially at night or in rain.",
    createdAt: day(14),
    updatedAt: day(4),
    status: "resolved",
    metadata: {
      category: "Roads",
      priority: "Medium",
      location: "Sukoišanska, near OŠ Spinut",
    },
  },
];
