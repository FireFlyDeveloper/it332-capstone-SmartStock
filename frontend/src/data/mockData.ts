import type { Product, Order, Delivery, User, Transaction, AIRecommendation } from '../types';

// Last touched: 2026-07-22
// Client-presentation demo dataset: deterministic, realistic simulated Glassram customers/materials.

export const initialProducts: Product[] = [
  {
    "id": "PRD-001",
    "name": "Clear Float Glass 4mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 0,
    "price": 475,
    "threshold": 50,
    "status": "active",
    "sku": "GL-001",
    "description": "Standard clear float glass 4mm thickness"
  },
  {
    "id": "PRD-002",
    "name": "Clear Float Glass 5mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 45,
    "price": 580,
    "threshold": 48,
    "status": "active",
    "sku": "GL-002",
    "description": "Standard clear float glass 5mm thickness"
  },
  {
    "id": "PRD-003",
    "name": "Clear Float Glass 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 82,
    "price": 705,
    "threshold": 50,
    "status": "active",
    "sku": "GL-003",
    "description": "Standard clear float glass 6mm thickness"
  },
  {
    "id": "PRD-004",
    "name": "Clear Float Glass 8mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 119,
    "price": 920,
    "threshold": 45,
    "status": "active",
    "sku": "GL-004",
    "description": "Standard clear float glass 8mm thickness"
  },
  {
    "id": "PRD-005",
    "name": "Clear Float Glass 10mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 156,
    "price": 1205,
    "threshold": 35,
    "status": "active",
    "sku": "GL-005",
    "description": "Heavy clear float glass 10mm thickness"
  },
  {
    "id": "PRD-006",
    "name": "Tempered Glass 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 193,
    "price": 1300,
    "threshold": 40,
    "status": "active",
    "sku": "GL-006",
    "description": "Safety tempered glass 6mm"
  },
  {
    "id": "PRD-007",
    "name": "Tempered Glass 8mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 230,
    "price": 1565,
    "threshold": 38,
    "status": "active",
    "sku": "GL-007",
    "description": "Safety tempered glass 8mm"
  },
  {
    "id": "PRD-008",
    "name": "Tempered Glass 10mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 267,
    "price": 1825,
    "threshold": 30,
    "status": "active",
    "sku": "GL-008",
    "description": "Safety tempered glass 10mm"
  },
  {
    "id": "PRD-009",
    "name": "Tempered Glass 12mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 304,
    "price": 2240,
    "threshold": 24,
    "status": "active",
    "sku": "GL-009",
    "description": "Heavy-duty tempered glass 12mm"
  },
  {
    "id": "PRD-010",
    "name": "Laminated Glass 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 341,
    "price": 1555,
    "threshold": 28,
    "status": "active",
    "sku": "GL-010",
    "description": "Safety laminated glass 6mm"
  },
  {
    "id": "PRD-011",
    "name": "Laminated Glass 8mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 378,
    "price": 1920,
    "threshold": 24,
    "status": "active",
    "sku": "GL-011",
    "description": "Safety laminated glass 8mm"
  },
  {
    "id": "PRD-012",
    "name": "Reflective Glass Bronze 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 415,
    "price": 1185,
    "threshold": 35,
    "status": "active",
    "sku": "GL-012",
    "description": "Bronze heat reflective coated glass"
  },
  {
    "id": "PRD-013",
    "name": "Reflective Glass Blue 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 452,
    "price": 1280,
    "threshold": 32,
    "status": "active",
    "sku": "GL-013",
    "description": "Blue heat reflective coated glass"
  },
  {
    "id": "PRD-014",
    "name": "Reflective Glass Silver 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 489,
    "price": 1365,
    "threshold": 30,
    "status": "active",
    "sku": "GL-014",
    "description": "Silver reflective coated glass"
  },
  {
    "id": "PRD-015",
    "name": "Frosted Glass 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 526,
    "price": 975,
    "threshold": 30,
    "status": "active",
    "sku": "GL-015",
    "description": "Frosted privacy glass 6mm"
  },
  {
    "id": "PRD-016",
    "name": "Frosted Glass 8mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 43,
    "price": 1190,
    "threshold": 26,
    "status": "active",
    "sku": "GL-016",
    "description": "Frosted privacy glass 8mm"
  },
  {
    "id": "PRD-017",
    "name": "Mirror 5mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 80,
    "price": 775,
    "threshold": 24,
    "status": "active",
    "sku": "GL-017",
    "description": "Silver mirror 5mm"
  },
  {
    "id": "PRD-018",
    "name": "Mirror 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 17,
    "price": 870,
    "threshold": 25,
    "status": "active",
    "sku": "GL-018",
    "description": "Silver mirror 6mm"
  },
  {
    "id": "PRD-019",
    "name": "Tinted Glass Gray 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 154,
    "price": 1065,
    "threshold": 32,
    "status": "active",
    "sku": "GL-019",
    "description": "Gray tinted architectural glass"
  },
  {
    "id": "PRD-020",
    "name": "Tinted Glass Bronze 6mm",
    "category": "glass",
    "unit": "sqm",
    "stock": 191,
    "price": 1090,
    "threshold": 32,
    "status": "active",
    "sku": "GL-020",
    "description": "Bronze tinted architectural glass"
  },
  {
    "id": "PRD-021",
    "name": "Double Glazed Unit 6+6",
    "category": "glass",
    "unit": "unit",
    "stock": 228,
    "price": 2915,
    "threshold": 20,
    "status": "active",
    "sku": "GL-021",
    "description": "Insulated double glazed unit"
  },
  {
    "id": "PRD-022",
    "name": "Double Glazed Low-E Unit",
    "category": "glass",
    "unit": "unit",
    "stock": 265,
    "price": 3425,
    "threshold": 18,
    "status": "active",
    "sku": "GL-022",
    "description": "Low-E insulated double glazed unit"
  },
  {
    "id": "PRD-023",
    "name": "Shower Enclosure Glass 10mm",
    "category": "glass",
    "unit": "panel",
    "stock": 302,
    "price": 2640,
    "threshold": 16,
    "status": "active",
    "sku": "GL-023",
    "description": "Tempered shower enclosure panel"
  },
  {
    "id": "PRD-024",
    "name": "Sliding Door Glass Panel",
    "category": "glass",
    "unit": "panel",
    "stock": 0,
    "price": 3155,
    "threshold": 15,
    "status": "active",
    "sku": "GL-024",
    "description": "Large tempered sliding door glass"
  },
  {
    "id": "PRD-025",
    "name": "Stair Railing Glass 12mm",
    "category": "glass",
    "unit": "panel",
    "stock": 376,
    "price": 3970,
    "threshold": 12,
    "status": "active",
    "sku": "GL-025",
    "description": "Heavy railing tempered glass"
  },
  {
    "id": "PRD-026",
    "name": "Aluminum Frame 2x4 inch",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 413,
    "price": 265,
    "threshold": 100,
    "status": "active",
    "sku": "AL-026",
    "description": "Standard aluminum frame"
  },
  {
    "id": "PRD-027",
    "name": "Aluminum Frame 3x3 inch",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 450,
    "price": 320,
    "threshold": 80,
    "status": "active",
    "sku": "AL-027",
    "description": "Heavy duty aluminum frame"
  },
  {
    "id": "PRD-028",
    "name": "Aluminum Frame 1x2 inch",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 487,
    "price": 260,
    "threshold": 120,
    "status": "active",
    "sku": "AL-028",
    "description": "Light aluminum frame profile"
  },
  {
    "id": "PRD-029",
    "name": "Aluminum Channel U-Type",
    "category": "aluminum",
    "unit": "meter",
    "stock": 524,
    "price": 110,
    "threshold": 150,
    "status": "active",
    "sku": "AL-029",
    "description": "U-type aluminum mounting channel"
  },
  {
    "id": "PRD-030",
    "name": "Aluminum Channel C-Type",
    "category": "aluminum",
    "unit": "meter",
    "stock": 41,
    "price": 135,
    "threshold": 145,
    "status": "active",
    "sku": "AL-030",
    "description": "C-type aluminum mounting channel"
  },
  {
    "id": "PRD-031",
    "name": "Aluminum Angle Bar 1x1",
    "category": "aluminum",
    "unit": "meter",
    "stock": 78,
    "price": 165,
    "threshold": 130,
    "status": "active",
    "sku": "AL-031",
    "description": "Aluminum angle bar 1x1"
  },
  {
    "id": "PRD-032",
    "name": "Aluminum Angle Bar 2x2",
    "category": "aluminum",
    "unit": "meter",
    "stock": 115,
    "price": 235,
    "threshold": 95,
    "status": "active",
    "sku": "AL-032",
    "description": "Aluminum angle bar 2x2"
  },
  {
    "id": "PRD-033",
    "name": "Aluminum Flat Bar 1 inch",
    "category": "aluminum",
    "unit": "meter",
    "stock": 152,
    "price": 175,
    "threshold": 120,
    "status": "active",
    "sku": "AL-033",
    "description": "Aluminum flat bar 1 inch"
  },
  {
    "id": "PRD-034",
    "name": "Aluminum Flat Bar 2 inch",
    "category": "aluminum",
    "unit": "meter",
    "stock": 189,
    "price": 240,
    "threshold": 90,
    "status": "active",
    "sku": "AL-034",
    "description": "Aluminum flat bar 2 inch"
  },
  {
    "id": "PRD-035",
    "name": "Aluminum Tube Round 1 inch",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 42,
    "price": 365,
    "threshold": 50,
    "status": "active",
    "sku": "AL-035",
    "description": "Round aluminum tube 1 inch"
  },
  {
    "id": "PRD-036",
    "name": "Aluminum Tube Square 1.5 inch",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 263,
    "price": 315,
    "threshold": 48,
    "status": "active",
    "sku": "AL-036",
    "description": "Square aluminum tube 1.5 inch"
  },
  {
    "id": "PRD-037",
    "name": "Aluminum Profile L-Shape",
    "category": "aluminum",
    "unit": "meter",
    "stock": 300,
    "price": 190,
    "threshold": 40,
    "status": "active",
    "sku": "AL-037",
    "description": "L-shaped aluminum profile"
  },
  {
    "id": "PRD-038",
    "name": "Aluminum Profile T-Shape",
    "category": "aluminum",
    "unit": "meter",
    "stock": 337,
    "price": 215,
    "threshold": 40,
    "status": "active",
    "sku": "AL-038",
    "description": "T-shaped aluminum profile"
  },
  {
    "id": "PRD-039",
    "name": "Aluminum Sheet 1.5mm",
    "category": "aluminum",
    "unit": "sqm",
    "stock": 374,
    "price": 720,
    "threshold": 30,
    "status": "active",
    "sku": "AL-039",
    "description": "Aluminum sheet 1.5mm thickness"
  },
  {
    "id": "PRD-040",
    "name": "Aluminum Sheet 2mm",
    "category": "aluminum",
    "unit": "sqm",
    "stock": 411,
    "price": 935,
    "threshold": 25,
    "status": "active",
    "sku": "AL-040",
    "description": "Aluminum sheet 2mm thickness"
  },
  {
    "id": "PRD-041",
    "name": "Aluminum Composite Panel White",
    "category": "aluminum",
    "unit": "sheet",
    "stock": 448,
    "price": 1350,
    "threshold": 22,
    "status": "active",
    "sku": "AL-041",
    "description": "White aluminum composite panel"
  },
  {
    "id": "PRD-042",
    "name": "Aluminum Composite Panel Black",
    "category": "aluminum",
    "unit": "sheet",
    "stock": 485,
    "price": 1395,
    "threshold": 22,
    "status": "active",
    "sku": "AL-042",
    "description": "Black aluminum composite panel"
  },
  {
    "id": "PRD-043",
    "name": "Aluminum Handle Standard",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 522,
    "price": 145,
    "threshold": 35,
    "status": "active",
    "sku": "AL-043",
    "description": "Standard door/window aluminum handle"
  },
  {
    "id": "PRD-044",
    "name": "Aluminum Handle Premium",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 39,
    "price": 225,
    "threshold": 28,
    "status": "active",
    "sku": "AL-044",
    "description": "Premium aluminum pull handle"
  },
  {
    "id": "PRD-045",
    "name": "Aluminum Hinge Heavy Duty",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 76,
    "price": 150,
    "threshold": 40,
    "status": "active",
    "sku": "AL-045",
    "description": "Heavy duty aluminum hinge"
  },
  {
    "id": "PRD-046",
    "name": "Aluminum Roller Nylon Bearing",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 113,
    "price": 250,
    "threshold": 30,
    "status": "active",
    "sku": "AL-046",
    "description": "Window/door nylon bearing roller"
  },
  {
    "id": "PRD-047",
    "name": "Aluminum Lockset Sliding",
    "category": "aluminum",
    "unit": "set",
    "stock": 0,
    "price": 605,
    "threshold": 20,
    "status": "active",
    "sku": "AL-047",
    "description": "Sliding door aluminum lockset"
  },
  {
    "id": "PRD-048",
    "name": "Aluminum Seal Strip",
    "category": "aluminum",
    "unit": "meter",
    "stock": 187,
    "price": 165,
    "threshold": 150,
    "status": "active",
    "sku": "AL-048",
    "description": "Weather seal strip for aluminum frames"
  },
  {
    "id": "PRD-049",
    "name": "Aluminum Screen Frame",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 224,
    "price": 325,
    "threshold": 55,
    "status": "active",
    "sku": "AL-049",
    "description": "Aluminum screen frame profile"
  },
  {
    "id": "PRD-050",
    "name": "Aluminum Mullion Bar",
    "category": "aluminum",
    "unit": "meter",
    "stock": 261,
    "price": 200,
    "threshold": 60,
    "status": "active",
    "sku": "AL-050",
    "description": "Aluminum mullion bar profile"
  },
  {
    "id": "PRD-051",
    "name": "Clear Float Glass 4mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 298,
    "price": 515,
    "threshold": 50,
    "status": "active",
    "sku": "GL-051",
    "description": "Standard clear float glass 4mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-052",
    "name": "Clear Float Glass 5mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 40,
    "price": 620,
    "threshold": 48,
    "status": "active",
    "sku": "GL-052",
    "description": "Standard clear float glass 5mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-053",
    "name": "Clear Float Glass 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 372,
    "price": 745,
    "threshold": 50,
    "status": "active",
    "sku": "GL-053",
    "description": "Standard clear float glass 6mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-054",
    "name": "Clear Float Glass 8mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 409,
    "price": 960,
    "threshold": 45,
    "status": "active",
    "sku": "GL-054",
    "description": "Standard clear float glass 8mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-055",
    "name": "Clear Float Glass 10mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 446,
    "price": 1245,
    "threshold": 35,
    "status": "active",
    "sku": "GL-055",
    "description": "Heavy clear float glass 10mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-056",
    "name": "Tempered Glass 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 483,
    "price": 1340,
    "threshold": 40,
    "status": "active",
    "sku": "GL-056",
    "description": "Safety tempered glass 6mm for client presentation dataset"
  },
  {
    "id": "PRD-057",
    "name": "Tempered Glass 8mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 520,
    "price": 1500,
    "threshold": 38,
    "status": "active",
    "sku": "GL-057",
    "description": "Safety tempered glass 8mm for client presentation dataset"
  },
  {
    "id": "PRD-058",
    "name": "Tempered Glass 10mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 37,
    "price": 1865,
    "threshold": 30,
    "status": "active",
    "sku": "GL-058",
    "description": "Safety tempered glass 10mm for client presentation dataset"
  },
  {
    "id": "PRD-059",
    "name": "Tempered Glass 12mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 74,
    "price": 2280,
    "threshold": 24,
    "status": "active",
    "sku": "GL-059",
    "description": "Heavy-duty tempered glass 12mm for client presentation dataset"
  },
  {
    "id": "PRD-060",
    "name": "Laminated Glass 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 111,
    "price": 1595,
    "threshold": 28,
    "status": "active",
    "sku": "GL-060",
    "description": "Safety laminated glass 6mm for client presentation dataset"
  },
  {
    "id": "PRD-061",
    "name": "Laminated Glass 8mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 148,
    "price": 1960,
    "threshold": 24,
    "status": "active",
    "sku": "GL-061",
    "description": "Safety laminated glass 8mm for client presentation dataset"
  },
  {
    "id": "PRD-062",
    "name": "Reflective Glass Bronze 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 185,
    "price": 1225,
    "threshold": 35,
    "status": "active",
    "sku": "GL-062",
    "description": "Bronze heat reflective coated glass for client presentation dataset"
  },
  {
    "id": "PRD-063",
    "name": "Reflective Glass Blue 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 222,
    "price": 1320,
    "threshold": 32,
    "status": "active",
    "sku": "GL-063",
    "description": "Blue heat reflective coated glass for client presentation dataset"
  },
  {
    "id": "PRD-064",
    "name": "Reflective Glass Silver 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 259,
    "price": 1300,
    "threshold": 30,
    "status": "active",
    "sku": "GL-064",
    "description": "Silver reflective coated glass for client presentation dataset"
  },
  {
    "id": "PRD-065",
    "name": "Frosted Glass 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 296,
    "price": 1015,
    "threshold": 30,
    "status": "active",
    "sku": "GL-065",
    "description": "Frosted privacy glass 6mm for client presentation dataset"
  },
  {
    "id": "PRD-066",
    "name": "Frosted Glass 8mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 333,
    "price": 1230,
    "threshold": 26,
    "status": "active",
    "sku": "GL-066",
    "description": "Frosted privacy glass 8mm for client presentation dataset"
  },
  {
    "id": "PRD-067",
    "name": "Mirror 5mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 370,
    "price": 815,
    "threshold": 24,
    "status": "active",
    "sku": "GL-067",
    "description": "Silver mirror 5mm for client presentation dataset"
  },
  {
    "id": "PRD-068",
    "name": "Mirror 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 407,
    "price": 910,
    "threshold": 25,
    "status": "active",
    "sku": "GL-068",
    "description": "Silver mirror 6mm for client presentation dataset"
  },
  {
    "id": "PRD-069",
    "name": "Tinted Glass Gray 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 24,
    "price": 1105,
    "threshold": 32,
    "status": "active",
    "sku": "GL-069",
    "description": "Gray tinted architectural glass for client presentation dataset"
  },
  {
    "id": "PRD-070",
    "name": "Tinted Glass Bronze 6mm - Lot B",
    "category": "glass",
    "unit": "sqm",
    "stock": 0,
    "price": 1130,
    "threshold": 32,
    "status": "active",
    "sku": "GL-070",
    "description": "Bronze tinted architectural glass for client presentation dataset"
  },
  {
    "id": "PRD-071",
    "name": "Double Glazed Unit 6+6 - Lot B",
    "category": "glass",
    "unit": "unit",
    "stock": 518,
    "price": 2850,
    "threshold": 20,
    "status": "active",
    "sku": "GL-071",
    "description": "Insulated double glazed unit for client presentation dataset"
  },
  {
    "id": "PRD-072",
    "name": "Double Glazed Low-E Unit - Lot B",
    "category": "glass",
    "unit": "unit",
    "stock": 35,
    "price": 3465,
    "threshold": 18,
    "status": "active",
    "sku": "GL-072",
    "description": "Low-E insulated double glazed unit for client presentation dataset"
  },
  {
    "id": "PRD-073",
    "name": "Shower Enclosure Glass 10mm - Lot B",
    "category": "glass",
    "unit": "panel",
    "stock": 72,
    "price": 2680,
    "threshold": 16,
    "status": "active",
    "sku": "GL-073",
    "description": "Tempered shower enclosure panel for client presentation dataset"
  },
  {
    "id": "PRD-074",
    "name": "Sliding Door Glass Panel - Lot B",
    "category": "glass",
    "unit": "panel",
    "stock": 109,
    "price": 3195,
    "threshold": 15,
    "status": "active",
    "sku": "GL-074",
    "description": "Large tempered sliding door glass for client presentation dataset"
  },
  {
    "id": "PRD-075",
    "name": "Stair Railing Glass 12mm - Lot B",
    "category": "glass",
    "unit": "panel",
    "stock": 146,
    "price": 4010,
    "threshold": 12,
    "status": "active",
    "sku": "GL-075",
    "description": "Heavy railing tempered glass for client presentation dataset"
  },
  {
    "id": "PRD-076",
    "name": "Aluminum Frame 2x4 inch - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 183,
    "price": 305,
    "threshold": 100,
    "status": "active",
    "sku": "AL-076",
    "description": "Standard aluminum frame for client presentation dataset"
  },
  {
    "id": "PRD-077",
    "name": "Aluminum Frame 3x3 inch - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 220,
    "price": 360,
    "threshold": 80,
    "status": "active",
    "sku": "AL-077",
    "description": "Heavy duty aluminum frame for client presentation dataset"
  },
  {
    "id": "PRD-078",
    "name": "Aluminum Frame 1x2 inch - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 257,
    "price": 195,
    "threshold": 120,
    "status": "active",
    "sku": "AL-078",
    "description": "Light aluminum frame profile for client presentation dataset"
  },
  {
    "id": "PRD-079",
    "name": "Aluminum Channel U-Type - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 294,
    "price": 150,
    "threshold": 150,
    "status": "active",
    "sku": "AL-079",
    "description": "U-type aluminum mounting channel for client presentation dataset"
  },
  {
    "id": "PRD-080",
    "name": "Aluminum Channel C-Type - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 331,
    "price": 175,
    "threshold": 145,
    "status": "active",
    "sku": "AL-080",
    "description": "C-type aluminum mounting channel for client presentation dataset"
  },
  {
    "id": "PRD-081",
    "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 368,
    "price": 205,
    "threshold": 130,
    "status": "active",
    "sku": "AL-081",
    "description": "Aluminum angle bar 1x1 for client presentation dataset"
  },
  {
    "id": "PRD-082",
    "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 405,
    "price": 275,
    "threshold": 95,
    "status": "active",
    "sku": "AL-082",
    "description": "Aluminum angle bar 2x2 for client presentation dataset"
  },
  {
    "id": "PRD-083",
    "name": "Aluminum Flat Bar 1 inch - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 442,
    "price": 215,
    "threshold": 120,
    "status": "active",
    "sku": "AL-083",
    "description": "Aluminum flat bar 1 inch for client presentation dataset"
  },
  {
    "id": "PRD-084",
    "name": "Aluminum Flat Bar 2 inch - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 479,
    "price": 280,
    "threshold": 90,
    "status": "active",
    "sku": "AL-084",
    "description": "Aluminum flat bar 2 inch for client presentation dataset"
  },
  {
    "id": "PRD-085",
    "name": "Aluminum Tube Round 1 inch - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 516,
    "price": 300,
    "threshold": 50,
    "status": "active",
    "sku": "AL-085",
    "description": "Round aluminum tube 1 inch for client presentation dataset"
  },
  {
    "id": "PRD-086",
    "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 40,
    "price": 355,
    "threshold": 48,
    "status": "active",
    "sku": "AL-086",
    "description": "Square aluminum tube 1.5 inch for client presentation dataset"
  },
  {
    "id": "PRD-087",
    "name": "Aluminum Profile L-Shape - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 70,
    "price": 230,
    "threshold": 40,
    "status": "active",
    "sku": "AL-087",
    "description": "L-shaped aluminum profile for client presentation dataset"
  },
  {
    "id": "PRD-088",
    "name": "Aluminum Profile T-Shape - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 107,
    "price": 255,
    "threshold": 40,
    "status": "active",
    "sku": "AL-088",
    "description": "T-shaped aluminum profile for client presentation dataset"
  },
  {
    "id": "PRD-089",
    "name": "Aluminum Sheet 1.5mm - Bronze Finish",
    "category": "aluminum",
    "unit": "sqm",
    "stock": 144,
    "price": 760,
    "threshold": 30,
    "status": "active",
    "sku": "AL-089",
    "description": "Aluminum sheet 1.5mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-090",
    "name": "Aluminum Sheet 2mm - Bronze Finish",
    "category": "aluminum",
    "unit": "sqm",
    "stock": 181,
    "price": 975,
    "threshold": 25,
    "status": "active",
    "sku": "AL-090",
    "description": "Aluminum sheet 2mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-091",
    "name": "Aluminum Composite Panel White - Bronze Finish",
    "category": "aluminum",
    "unit": "sheet",
    "stock": 218,
    "price": 1390,
    "threshold": 22,
    "status": "active",
    "sku": "AL-091",
    "description": "White aluminum composite panel for client presentation dataset"
  },
  {
    "id": "PRD-092",
    "name": "Aluminum Composite Panel Black - Bronze Finish",
    "category": "aluminum",
    "unit": "sheet",
    "stock": 255,
    "price": 1330,
    "threshold": 22,
    "status": "active",
    "sku": "AL-092",
    "description": "Black aluminum composite panel for client presentation dataset"
  },
  {
    "id": "PRD-093",
    "name": "Aluminum Handle Standard - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 0,
    "price": 185,
    "threshold": 35,
    "status": "active",
    "sku": "AL-093",
    "description": "Standard door/window aluminum handle for client presentation dataset"
  },
  {
    "id": "PRD-094",
    "name": "Aluminum Handle Premium - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 329,
    "price": 265,
    "threshold": 28,
    "status": "active",
    "sku": "AL-094",
    "description": "Premium aluminum pull handle for client presentation dataset"
  },
  {
    "id": "PRD-095",
    "name": "Aluminum Hinge Heavy Duty - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 366,
    "price": 190,
    "threshold": 40,
    "status": "active",
    "sku": "AL-095",
    "description": "Heavy duty aluminum hinge for client presentation dataset"
  },
  {
    "id": "PRD-096",
    "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 403,
    "price": 290,
    "threshold": 30,
    "status": "active",
    "sku": "AL-096",
    "description": "Window/door nylon bearing roller for client presentation dataset"
  },
  {
    "id": "PRD-097",
    "name": "Aluminum Lockset Sliding - Bronze Finish",
    "category": "aluminum",
    "unit": "set",
    "stock": 440,
    "price": 645,
    "threshold": 20,
    "status": "active",
    "sku": "AL-097",
    "description": "Sliding door aluminum lockset for client presentation dataset"
  },
  {
    "id": "PRD-098",
    "name": "Aluminum Seal Strip - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 477,
    "price": 205,
    "threshold": 150,
    "status": "discontinued",
    "sku": "AL-098",
    "description": "Weather seal strip for aluminum frames for client presentation dataset"
  },
  {
    "id": "PRD-099",
    "name": "Aluminum Screen Frame - Bronze Finish",
    "category": "aluminum",
    "unit": "pcs",
    "stock": 514,
    "price": 260,
    "threshold": 55,
    "status": "active",
    "sku": "AL-099",
    "description": "Aluminum screen frame profile for client presentation dataset"
  },
  {
    "id": "PRD-100",
    "name": "Aluminum Mullion Bar - Bronze Finish",
    "category": "aluminum",
    "unit": "meter",
    "stock": 31,
    "price": 240,
    "threshold": 60,
    "status": "active",
    "sku": "AL-100",
    "description": "Aluminum mullion bar profile for client presentation dataset"
  },
  {
    "id": "PRD-101",
    "name": "Clear Float Glass 4mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 68,
    "price": 555,
    "threshold": 50,
    "status": "active",
    "sku": "GL-101",
    "description": "Standard clear float glass 4mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-102",
    "name": "Clear Float Glass 5mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 105,
    "price": 660,
    "threshold": 48,
    "status": "active",
    "sku": "GL-102",
    "description": "Standard clear float glass 5mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-103",
    "name": "Clear Float Glass 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 42,
    "price": 785,
    "threshold": 50,
    "status": "active",
    "sku": "GL-103",
    "description": "Standard clear float glass 6mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-104",
    "name": "Clear Float Glass 8mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 179,
    "price": 1000,
    "threshold": 45,
    "status": "active",
    "sku": "GL-104",
    "description": "Standard clear float glass 8mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-105",
    "name": "Clear Float Glass 10mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 216,
    "price": 1285,
    "threshold": 35,
    "status": "active",
    "sku": "GL-105",
    "description": "Heavy clear float glass 10mm thickness for client presentation dataset"
  },
  {
    "id": "PRD-106",
    "name": "Tempered Glass 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 253,
    "price": 1275,
    "threshold": 40,
    "status": "active",
    "sku": "GL-106",
    "description": "Safety tempered glass 6mm for client presentation dataset"
  },
  {
    "id": "PRD-107",
    "name": "Tempered Glass 8mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 290,
    "price": 1540,
    "threshold": 38,
    "status": "active",
    "sku": "GL-107",
    "description": "Safety tempered glass 8mm for client presentation dataset"
  },
  {
    "id": "PRD-108",
    "name": "Tempered Glass 10mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 327,
    "price": 1905,
    "threshold": 30,
    "status": "active",
    "sku": "GL-108",
    "description": "Safety tempered glass 10mm for client presentation dataset"
  },
  {
    "id": "PRD-109",
    "name": "Tempered Glass 12mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 364,
    "price": 2320,
    "threshold": 24,
    "status": "active",
    "sku": "GL-109",
    "description": "Heavy-duty tempered glass 12mm for client presentation dataset"
  },
  {
    "id": "PRD-110",
    "name": "Laminated Glass 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 401,
    "price": 1635,
    "threshold": 28,
    "status": "active",
    "sku": "GL-110",
    "description": "Safety laminated glass 6mm for client presentation dataset"
  },
  {
    "id": "PRD-111",
    "name": "Laminated Glass 8mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 438,
    "price": 2000,
    "threshold": 24,
    "status": "active",
    "sku": "GL-111",
    "description": "Safety laminated glass 8mm for client presentation dataset"
  },
  {
    "id": "PRD-112",
    "name": "Reflective Glass Bronze 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 475,
    "price": 1265,
    "threshold": 35,
    "status": "active",
    "sku": "GL-112",
    "description": "Bronze heat reflective coated glass for client presentation dataset"
  },
  {
    "id": "PRD-113",
    "name": "Reflective Glass Blue 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 512,
    "price": 1255,
    "threshold": 32,
    "status": "active",
    "sku": "GL-113",
    "description": "Blue heat reflective coated glass for client presentation dataset"
  },
  {
    "id": "PRD-114",
    "name": "Reflective Glass Silver 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 29,
    "price": 1340,
    "threshold": 30,
    "status": "discontinued",
    "sku": "GL-114",
    "description": "Silver reflective coated glass for client presentation dataset"
  },
  {
    "id": "PRD-115",
    "name": "Frosted Glass 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 66,
    "price": 1055,
    "threshold": 30,
    "status": "active",
    "sku": "GL-115",
    "description": "Frosted privacy glass 6mm for client presentation dataset"
  },
  {
    "id": "PRD-116",
    "name": "Frosted Glass 8mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 0,
    "price": 1270,
    "threshold": 26,
    "status": "active",
    "sku": "GL-116",
    "description": "Frosted privacy glass 8mm for client presentation dataset"
  },
  {
    "id": "PRD-117",
    "name": "Mirror 5mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 140,
    "price": 855,
    "threshold": 24,
    "status": "active",
    "sku": "GL-117",
    "description": "Silver mirror 5mm for client presentation dataset"
  },
  {
    "id": "PRD-118",
    "name": "Mirror 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 177,
    "price": 950,
    "threshold": 25,
    "status": "active",
    "sku": "GL-118",
    "description": "Silver mirror 6mm for client presentation dataset"
  },
  {
    "id": "PRD-119",
    "name": "Tinted Glass Gray 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 214,
    "price": 1145,
    "threshold": 32,
    "status": "active",
    "sku": "GL-119",
    "description": "Gray tinted architectural glass for client presentation dataset"
  },
  {
    "id": "PRD-120",
    "name": "Tinted Glass Bronze 6mm - Commercial Grade",
    "category": "glass",
    "unit": "sqm",
    "stock": 24,
    "price": 1065,
    "threshold": 32,
    "status": "active",
    "sku": "GL-120",
    "description": "Bronze tinted architectural glass for client presentation dataset"
  }
];

export const initialOrders: Order[] = [
  {
    "id": "ORD-001",
    "referenceNumber": "SS-2026-00001",
    "customerName": "Aurelia Builders",
    "contact": "0910-300-2000",
    "address": "100 Rizal Avenue, Manila",
    "items": [
      {
        "productId": "PRD-001",
        "productName": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "total": 950
      }
    ],
    "total": 950,
    "paidAmount": 475,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-01-01",
    "createdAt": "2026-01-01T08:00:00",
    "refundAmount": 142,
    "refundStatus": "completed",
    "refundReason": "Client changed cut-size specification"
  },
  {
    "id": "ORD-002",
    "referenceNumber": "SS-2026-00002",
    "customerName": "Northbay Glass Works",
    "contact": "0911-307-2019",
    "address": "101 Mabini Street, Pasig",
    "items": [
      {
        "productId": "PRD-006",
        "productName": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "total": 3900
      },
      {
        "productId": "PRD-017",
        "productName": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "total": 7750
      }
    ],
    "total": 11650,
    "paidAmount": 11650,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-02-04",
    "createdAt": "2026-02-04T09:07:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-003",
    "referenceNumber": "SS-2026-00003",
    "customerName": "Mendoza Aluminum Supply",
    "contact": "0912-314-2038",
    "address": "102 Quezon Avenue, Marikina",
    "items": [
      {
        "productId": "PRD-011",
        "productName": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "total": 7680
      },
      {
        "productId": "PRD-022",
        "productName": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "total": 37675
      },
      {
        "productId": "PRD-033",
        "productName": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "total": 6300
      }
    ],
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-03-07",
    "createdAt": "2026-03-07T10:14:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-004",
    "referenceNumber": "SS-2026-00004",
    "customerName": "San Pedro Construction",
    "contact": "0913-321-2057",
    "address": "103 Ortigas Extension, Para\u00f1aque",
    "items": [
      {
        "productId": "PRD-016",
        "productName": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "total": 5950
      }
    ],
    "total": 5950,
    "paidAmount": 5950,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-04-10",
    "createdAt": "2026-04-10T11:21:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-005",
    "referenceNumber": "SS-2026-00005",
    "customerName": "Everline Interiors",
    "contact": "0914-328-2076",
    "address": "104 EDSA Service Road, Antipolo",
    "items": [
      {
        "productId": "PRD-021",
        "productName": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "total": 17490
      },
      {
        "productId": "PRD-032",
        "productName": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "total": 6110
      }
    ],
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-05-13",
    "createdAt": "2026-05-13T12:28:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-006",
    "referenceNumber": "SS-2026-00006",
    "customerName": "JRM Glass Center",
    "contact": "0915-335-2095",
    "address": "105 Commerce Avenue, Bacoor",
    "items": [
      {
        "productId": "PRD-026",
        "productName": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "total": 3710
      },
      {
        "productId": "PRD-037",
        "productName": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "total": 5320
      },
      {
        "productId": "PRD-048",
        "productName": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "total": 6930
      }
    ],
    "total": 15960,
    "paidAmount": 8778,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-06-16",
    "createdAt": "2026-06-16T13:35:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-007",
    "referenceNumber": "SS-2026-00007",
    "customerName": "Prime Arc Developers",
    "contact": "0916-342-2114",
    "address": "106 Industrial Road, San Pedro",
    "items": [
      {
        "productId": "PRD-031",
        "productName": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "total": 2640
      }
    ],
    "total": 2640,
    "paidAmount": 2640,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-07-19",
    "createdAt": "2026-07-19T14:42:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-008",
    "referenceNumber": "SS-2026-00008",
    "customerName": "Cavite Window Systems",
    "contact": "0917-349-2133",
    "address": "107 National Highway, Quezon City",
    "items": [
      {
        "productId": "PRD-036",
        "productName": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "total": 5670
      },
      {
        "productId": "PRD-047",
        "productName": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "total": 9680
      }
    ],
    "total": 15350,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-01-22",
    "createdAt": "2026-01-22T15:49:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-009",
    "referenceNumber": "SS-2026-00009",
    "customerName": "Lucena Home Builders",
    "contact": "0918-356-2152",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-041",
        "productName": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "total": 13500
      },
      {
        "productId": "PRD-052",
        "productName": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "total": 10540
      },
      {
        "productId": "PRD-063",
        "productName": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "total": 31680
      }
    ],
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-02-25",
    "createdAt": "2026-02-25T16:56:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-010",
    "referenceNumber": "SS-2026-00010",
    "customerName": "Quezon Facade Studio",
    "contact": "0919-363-2171",
    "address": "109 Shaw Boulevard, Caloocan",
    "items": [
      {
        "productId": "PRD-046",
        "productName": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "total": 5500
      }
    ],
    "total": 5500,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-03-01",
    "createdAt": "2026-03-01T17:03:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-011",
    "referenceNumber": "SS-2026-00011",
    "customerName": "BGC Fit-Out Group",
    "contact": "0920-370-2190",
    "address": "110 C5 Road, Las Pi\u00f1as",
    "items": [
      {
        "productId": "PRD-051",
        "productName": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "total": 6180
      },
      {
        "productId": "PRD-062",
        "productName": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "total": 23275
      }
    ],
    "total": 29455,
    "paidAmount": 16200,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-04-04",
    "createdAt": "2026-04-04T08:10:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-012",
    "referenceNumber": "SS-2026-00012",
    "customerName": "Valenzuela Glass Depot",
    "contact": "0921-377-2209",
    "address": "111 Aguinaldo Highway, Cavite City",
    "items": [
      {
        "productId": "PRD-056",
        "productName": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "total": 17420
      },
      {
        "productId": "PRD-067",
        "productName": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "total": 16300
      },
      {
        "productId": "PRD-078",
        "productName": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "total": 1170
      }
    ],
    "total": 34890,
    "paidAmount": 34890,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-05-07",
    "createdAt": "2026-05-07T09:17:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-013",
    "referenceNumber": "SS-2026-00013",
    "customerName": "Laguna Aluminum Works",
    "contact": "0922-384-2228",
    "address": "112 Alabang-Zapote Road, Calamba",
    "items": [
      {
        "productId": "PRD-061",
        "productName": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "total": 27440
      }
    ],
    "total": 27440,
    "paidAmount": 27440,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-06-10",
    "createdAt": "2026-06-10T10:24:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-014",
    "referenceNumber": "SS-2026-00014",
    "customerName": "Rizal Door and Window",
    "contact": "0923-391-2247",
    "address": "113 Marcos Highway, Malabon",
    "items": [
      {
        "productId": "PRD-066",
        "productName": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "total": 18450
      },
      {
        "productId": "PRD-077",
        "productName": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "total": 15840
      }
    ],
    "total": 34290,
    "paidAmount": 34290,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-07-13",
    "createdAt": "2026-07-13T11:31:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-015",
    "referenceNumber": "SS-2026-00015",
    "customerName": "Makati Renovation Co.",
    "contact": "0924-398-2266",
    "address": "114 MacArthur Highway, Makati",
    "items": [
      {
        "productId": "PRD-071",
        "productName": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "total": 45600
      },
      {
        "productId": "PRD-082",
        "productName": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "total": 12650
      },
      {
        "productId": "PRD-093",
        "productName": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "total": 2220
      }
    ],
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-01-16",
    "createdAt": "2026-01-16T12:38:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-016",
    "referenceNumber": "SS-2026-00016",
    "customerName": "Calamba Commercial Builders",
    "contact": "0925-405-2285",
    "address": "115 Gil Puyat Avenue, Mandaluyong",
    "items": [
      {
        "productId": "PRD-076",
        "productName": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "total": 10370
      }
    ],
    "total": 10370,
    "paidAmount": 5704,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-02-19",
    "createdAt": "2026-02-19T13:45:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-017",
    "referenceNumber": "SS-2026-00017",
    "customerName": "Pasig Partition Systems",
    "contact": "0926-412-2304",
    "address": "116 Ayala Avenue, Valenzuela",
    "items": [
      {
        "productId": "PRD-081",
        "productName": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "total": 7380
      },
      {
        "productId": "PRD-092",
        "productName": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "total": 33250
      }
    ],
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-03-22",
    "createdAt": "2026-03-22T14:52:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-018",
    "referenceNumber": "SS-2026-00018",
    "customerName": "Caloocan Hardware Center",
    "contact": "0927-419-2323",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-086",
        "productName": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "total": 13490
      },
      {
        "productId": "PRD-097",
        "productName": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "total": 1290
      },
      {
        "productId": "PRD-108",
        "productName": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "total": 17145
      }
    ],
    "total": 31925,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-04-25",
    "createdAt": "2026-04-25T15:59:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-019",
    "referenceNumber": "SS-2026-00019",
    "customerName": "Marikina Fabrication",
    "contact": "0928-426-2342",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-091",
        "productName": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "total": 27800
      }
    ],
    "total": 27800,
    "paidAmount": 13900,
    "paymentStatus": "partial",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-05-01",
    "createdAt": "2026-05-01T16:06:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-020",
    "referenceNumber": "SS-2026-00020",
    "customerName": "Taguig Residential Builds",
    "contact": "0929-433-2361",
    "address": "119 Congressional Avenue, Sta. Rosa",
    "items": [
      {
        "productId": "PRD-096",
        "productName": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "total": 12180
      },
      {
        "productId": "PRD-107",
        "productName": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "total": 6160
      }
    ],
    "total": 18340,
    "paidAmount": 18340,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-06-04",
    "createdAt": "2026-06-04T17:13:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-021",
    "referenceNumber": "SS-2026-00021",
    "customerName": "Manila Skylight Studio",
    "contact": "0930-440-2380",
    "address": "120 Rizal Avenue, Manila",
    "items": [
      {
        "productId": "PRD-101",
        "productName": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "total": 12210
      },
      {
        "productId": "PRD-112",
        "productName": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "total": 6325
      },
      {
        "productId": "PRD-003",
        "productName": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "total": 8460
      }
    ],
    "total": 26995,
    "paidAmount": 14847,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-07-07",
    "createdAt": "2026-07-07T08:20:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-022",
    "referenceNumber": "SS-2026-00022",
    "customerName": "Para\u00f1aque Modular Glass",
    "contact": "0931-447-2399",
    "address": "121 Mabini Street, Pasig",
    "items": [
      {
        "productId": "PRD-106",
        "productName": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "total": 29325
      }
    ],
    "total": 29325,
    "paidAmount": 29325,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-01-10",
    "createdAt": "2026-01-10T09:27:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-023",
    "referenceNumber": "SS-2026-00023",
    "customerName": "Antipolo Home Concepts",
    "contact": "0932-454-2418",
    "address": "122 Quezon Avenue, Marikina",
    "items": [
      {
        "productId": "PRD-111",
        "productName": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "total": 48000
      },
      {
        "productId": "PRD-002",
        "productName": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "total": 4060
      }
    ],
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-02-13",
    "createdAt": "2026-02-13T10:34:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-024",
    "referenceNumber": "SS-2026-00024",
    "customerName": "Ortigas Office Fit-Out",
    "contact": "0933-461-2437",
    "address": "123 Ortigas Extension, Para\u00f1aque",
    "items": [
      {
        "productId": "PRD-116",
        "productName": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "total": 31750
      },
      {
        "productId": "PRD-007",
        "productName": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "total": 12520
      },
      {
        "productId": "PRD-018",
        "productName": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "total": 13050
      }
    ],
    "total": 57320,
    "paidAmount": 57320,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-03-16",
    "createdAt": "2026-03-16T11:41:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-025",
    "referenceNumber": "SS-2026-00025",
    "customerName": "Las Pi\u00f1as Aluminum Craft",
    "contact": "0934-468-2456",
    "address": "124 EDSA Service Road, Antipolo",
    "items": [
      {
        "productId": "PRD-001",
        "productName": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "total": 950
      }
    ],
    "total": 950,
    "paidAmount": 950,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-04-19",
    "createdAt": "2026-04-19T12:48:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-026",
    "referenceNumber": "SS-2026-00026",
    "customerName": "Fairview Glass Traders",
    "contact": "0935-475-2475",
    "address": "125 Commerce Avenue, Bacoor",
    "items": [
      {
        "productId": "PRD-006",
        "productName": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "total": 3900
      },
      {
        "productId": "PRD-017",
        "productName": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "total": 7750
      }
    ],
    "total": 11650,
    "paidAmount": 6408,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-05-22",
    "createdAt": "2026-05-22T13:55:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-027",
    "referenceNumber": "SS-2026-00027",
    "customerName": "Sta. Rosa Buildmart",
    "contact": "0936-482-2494",
    "address": "126 Industrial Road, San Pedro",
    "items": [
      {
        "productId": "PRD-011",
        "productName": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "total": 7680
      },
      {
        "productId": "PRD-022",
        "productName": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "total": 37675
      },
      {
        "productId": "PRD-033",
        "productName": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "total": 6300
      }
    ],
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-06-25",
    "createdAt": "2026-06-25T14:02:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-028",
    "referenceNumber": "SS-2026-00028",
    "customerName": "Alabang Interior Works",
    "contact": "0937-489-2513",
    "address": "127 National Highway, Quezon City",
    "items": [
      {
        "productId": "PRD-016",
        "productName": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "total": 5950
      }
    ],
    "total": 5950,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-07-01",
    "createdAt": "2026-07-01T15:09:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-029",
    "referenceNumber": "SS-2026-00029",
    "customerName": "Navotas Industrial Supply",
    "contact": "0938-496-2532",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-021",
        "productName": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "total": 17490
      },
      {
        "productId": "PRD-032",
        "productName": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "total": 6110
      }
    ],
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-01-04",
    "createdAt": "2026-01-04T16:16:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-030",
    "referenceNumber": "SS-2026-00030",
    "customerName": "Malabon Glasshouse",
    "contact": "0939-503-2551",
    "address": "129 Shaw Boulevard, Caloocan",
    "items": [
      {
        "productId": "PRD-026",
        "productName": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "total": 3710
      },
      {
        "productId": "PRD-037",
        "productName": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "total": 5320
      },
      {
        "productId": "PRD-048",
        "productName": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "total": 6930
      }
    ],
    "total": 15960,
    "paidAmount": 15960,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-02-07",
    "createdAt": "2026-02-07T17:23:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-031",
    "referenceNumber": "SS-2026-00031",
    "customerName": "Aurelia Builders",
    "contact": "0940-510-2570",
    "address": "130 C5 Road, Las Pi\u00f1as",
    "items": [
      {
        "productId": "PRD-031",
        "productName": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "total": 2640
      }
    ],
    "total": 2640,
    "paidAmount": 1452,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-03-10",
    "createdAt": "2026-03-10T08:30:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-032",
    "referenceNumber": "SS-2026-00032",
    "customerName": "Northbay Glass Works",
    "contact": "0941-517-2589",
    "address": "131 Aguinaldo Highway, Cavite City",
    "items": [
      {
        "productId": "PRD-036",
        "productName": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "total": 5670
      },
      {
        "productId": "PRD-047",
        "productName": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "total": 9680
      }
    ],
    "total": 15350,
    "paidAmount": 15350,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-04-13",
    "createdAt": "2026-04-13T09:37:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-033",
    "referenceNumber": "SS-2026-00033",
    "customerName": "Mendoza Aluminum Supply",
    "contact": "0942-524-2608",
    "address": "132 Alabang-Zapote Road, Calamba",
    "items": [
      {
        "productId": "PRD-041",
        "productName": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "total": 13500
      },
      {
        "productId": "PRD-052",
        "productName": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "total": 10540
      },
      {
        "productId": "PRD-063",
        "productName": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "total": 31680
      }
    ],
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-05-16",
    "createdAt": "2026-05-16T10:44:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-034",
    "referenceNumber": "SS-2026-00034",
    "customerName": "San Pedro Construction",
    "contact": "0943-531-2627",
    "address": "133 Marcos Highway, Malabon",
    "items": [
      {
        "productId": "PRD-046",
        "productName": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "total": 5500
      }
    ],
    "total": 5500,
    "paidAmount": 5500,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-06-19",
    "createdAt": "2026-06-19T11:51:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-035",
    "referenceNumber": "SS-2026-00035",
    "customerName": "Everline Interiors",
    "contact": "0944-538-2646",
    "address": "134 MacArthur Highway, Makati",
    "items": [
      {
        "productId": "PRD-051",
        "productName": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "total": 6180
      },
      {
        "productId": "PRD-062",
        "productName": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "total": 23275
      }
    ],
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-07-22",
    "createdAt": "2026-07-22T12:58:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-036",
    "referenceNumber": "SS-2026-00036",
    "customerName": "JRM Glass Center",
    "contact": "0945-545-2665",
    "address": "135 Gil Puyat Avenue, Mandaluyong",
    "items": [
      {
        "productId": "PRD-056",
        "productName": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "total": 17420
      },
      {
        "productId": "PRD-067",
        "productName": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "total": 16300
      },
      {
        "productId": "PRD-078",
        "productName": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "total": 1170
      }
    ],
    "total": 34890,
    "paidAmount": 19190,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-01-25",
    "createdAt": "2026-01-25T13:05:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-037",
    "referenceNumber": "SS-2026-00037",
    "customerName": "Prime Arc Developers",
    "contact": "0946-552-2684",
    "address": "136 Ayala Avenue, Valenzuela",
    "items": [
      {
        "productId": "PRD-061",
        "productName": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "total": 27440
      }
    ],
    "total": 27440,
    "paidAmount": 13720,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-02-01",
    "createdAt": "2026-02-01T14:12:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-038",
    "referenceNumber": "SS-2026-00038",
    "customerName": "Cavite Window Systems",
    "contact": "0947-559-2703",
    "address": "137 Katipunan Avenue, Muntinlupa",
    "items": [
      {
        "productId": "PRD-066",
        "productName": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "total": 18450
      },
      {
        "productId": "PRD-077",
        "productName": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "total": 15840
      }
    ],
    "total": 34290,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-03-04",
    "createdAt": "2026-03-04T15:19:00",
    "refundAmount": 5144,
    "refundStatus": "completed",
    "refundReason": "Client changed cut-size specification"
  },
  {
    "id": "ORD-039",
    "referenceNumber": "SS-2026-00039",
    "customerName": "Lucena Home Builders",
    "contact": "0948-566-2722",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-071",
        "productName": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "total": 45600
      },
      {
        "productId": "PRD-082",
        "productName": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "total": 12650
      },
      {
        "productId": "PRD-093",
        "productName": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "total": 2220
      }
    ],
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-04-07",
    "createdAt": "2026-04-07T16:26:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-040",
    "referenceNumber": "SS-2026-00040",
    "customerName": "Quezon Facade Studio",
    "contact": "0949-573-2741",
    "address": "139 Congressional Avenue, Sta. Rosa",
    "items": [
      {
        "productId": "PRD-076",
        "productName": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "total": 10370
      }
    ],
    "total": 10370,
    "paidAmount": 10370,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-05-10",
    "createdAt": "2026-05-10T17:33:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-041",
    "referenceNumber": "SS-2026-00041",
    "customerName": "BGC Fit-Out Group",
    "contact": "0950-580-2760",
    "address": "140 Rizal Avenue, Manila",
    "items": [
      {
        "productId": "PRD-081",
        "productName": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "total": 7380
      },
      {
        "productId": "PRD-092",
        "productName": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "total": 33250
      }
    ],
    "total": 40630,
    "paidAmount": 22346,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-06-13",
    "createdAt": "2026-06-13T08:40:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-042",
    "referenceNumber": "SS-2026-00042",
    "customerName": "Valenzuela Glass Depot",
    "contact": "0951-587-2779",
    "address": "141 Mabini Street, Pasig",
    "items": [
      {
        "productId": "PRD-086",
        "productName": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "total": 13490
      },
      {
        "productId": "PRD-097",
        "productName": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "total": 1290
      },
      {
        "productId": "PRD-108",
        "productName": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "total": 17145
      }
    ],
    "total": 31925,
    "paidAmount": 31925,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-07-16",
    "createdAt": "2026-07-16T09:47:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-043",
    "referenceNumber": "SS-2026-00043",
    "customerName": "Laguna Aluminum Works",
    "contact": "0952-594-2798",
    "address": "142 Quezon Avenue, Marikina",
    "items": [
      {
        "productId": "PRD-091",
        "productName": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "total": 27800
      }
    ],
    "total": 27800,
    "paidAmount": 27800,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-01-19",
    "createdAt": "2026-01-19T10:54:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-044",
    "referenceNumber": "SS-2026-00044",
    "customerName": "Rizal Door and Window",
    "contact": "0953-601-2817",
    "address": "143 Ortigas Extension, Para\u00f1aque",
    "items": [
      {
        "productId": "PRD-096",
        "productName": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "total": 12180
      },
      {
        "productId": "PRD-107",
        "productName": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "total": 6160
      }
    ],
    "total": 18340,
    "paidAmount": 18340,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-02-22",
    "createdAt": "2026-02-22T11:01:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-045",
    "referenceNumber": "SS-2026-00045",
    "customerName": "Makati Renovation Co.",
    "contact": "0954-608-2836",
    "address": "144 EDSA Service Road, Antipolo",
    "items": [
      {
        "productId": "PRD-101",
        "productName": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "total": 12210
      },
      {
        "productId": "PRD-112",
        "productName": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "total": 6325
      },
      {
        "productId": "PRD-003",
        "productName": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "total": 8460
      }
    ],
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-03-25",
    "createdAt": "2026-03-25T12:08:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-046",
    "referenceNumber": "SS-2026-00046",
    "customerName": "Calamba Commercial Builders",
    "contact": "0955-615-2855",
    "address": "145 Commerce Avenue, Bacoor",
    "items": [
      {
        "productId": "PRD-106",
        "productName": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "total": 29325
      }
    ],
    "total": 29325,
    "paidAmount": 14662,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-04-01",
    "createdAt": "2026-04-01T13:15:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-047",
    "referenceNumber": "SS-2026-00047",
    "customerName": "Pasig Partition Systems",
    "contact": "0956-622-2874",
    "address": "146 Industrial Road, San Pedro",
    "items": [
      {
        "productId": "PRD-111",
        "productName": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "total": 48000
      },
      {
        "productId": "PRD-002",
        "productName": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "total": 4060
      }
    ],
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-05-04",
    "createdAt": "2026-05-04T14:22:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-048",
    "referenceNumber": "SS-2026-00048",
    "customerName": "Caloocan Hardware Center",
    "contact": "0957-629-2893",
    "address": "147 National Highway, Quezon City",
    "items": [
      {
        "productId": "PRD-116",
        "productName": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "total": 31750
      },
      {
        "productId": "PRD-007",
        "productName": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "total": 12520
      },
      {
        "productId": "PRD-018",
        "productName": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "total": 13050
      }
    ],
    "total": 57320,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-06-07",
    "createdAt": "2026-06-07T15:29:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-049",
    "referenceNumber": "SS-2026-00049",
    "customerName": "Marikina Fabrication",
    "contact": "0958-636-2912",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-001",
        "productName": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "total": 950
      }
    ],
    "total": 950,
    "paidAmount": 950,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-07-10",
    "createdAt": "2026-07-10T16:36:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-050",
    "referenceNumber": "SS-2026-00050",
    "customerName": "Taguig Residential Builds",
    "contact": "0959-643-2931",
    "address": "149 Shaw Boulevard, Caloocan",
    "items": [
      {
        "productId": "PRD-006",
        "productName": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "total": 3900
      },
      {
        "productId": "PRD-017",
        "productName": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "total": 7750
      }
    ],
    "total": 11650,
    "paidAmount": 11650,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-01-13",
    "createdAt": "2026-01-13T17:43:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-051",
    "referenceNumber": "SS-2026-00051",
    "customerName": "Manila Skylight Studio",
    "contact": "0960-650-2950",
    "address": "150 C5 Road, Las Pi\u00f1as",
    "items": [
      {
        "productId": "PRD-011",
        "productName": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "total": 7680
      },
      {
        "productId": "PRD-022",
        "productName": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "total": 37675
      },
      {
        "productId": "PRD-033",
        "productName": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "total": 6300
      }
    ],
    "total": 51655,
    "paidAmount": 28410,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-02-16",
    "createdAt": "2026-02-16T08:50:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-052",
    "referenceNumber": "SS-2026-00052",
    "customerName": "Para\u00f1aque Modular Glass",
    "contact": "0961-657-2969",
    "address": "151 Aguinaldo Highway, Cavite City",
    "items": [
      {
        "productId": "PRD-016",
        "productName": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "total": 5950
      }
    ],
    "total": 5950,
    "paidAmount": 5950,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-03-19",
    "createdAt": "2026-03-19T09:57:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-053",
    "referenceNumber": "SS-2026-00053",
    "customerName": "Antipolo Home Concepts",
    "contact": "0962-664-2988",
    "address": "152 Alabang-Zapote Road, Calamba",
    "items": [
      {
        "productId": "PRD-021",
        "productName": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "total": 17490
      },
      {
        "productId": "PRD-032",
        "productName": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "total": 6110
      }
    ],
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-04-22",
    "createdAt": "2026-04-22T10:04:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-054",
    "referenceNumber": "SS-2026-00054",
    "customerName": "Ortigas Office Fit-Out",
    "contact": "0963-671-3007",
    "address": "153 Marcos Highway, Malabon",
    "items": [
      {
        "productId": "PRD-026",
        "productName": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "total": 3710
      },
      {
        "productId": "PRD-037",
        "productName": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "total": 5320
      },
      {
        "productId": "PRD-048",
        "productName": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "total": 6930
      }
    ],
    "total": 15960,
    "paidAmount": 15960,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-05-25",
    "createdAt": "2026-05-25T11:11:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-055",
    "referenceNumber": "SS-2026-00055",
    "customerName": "Las Pi\u00f1as Aluminum Craft",
    "contact": "0964-678-3026",
    "address": "154 MacArthur Highway, Makati",
    "items": [
      {
        "productId": "PRD-031",
        "productName": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "total": 2640
      }
    ],
    "total": 2640,
    "paidAmount": 1320,
    "paymentStatus": "partial",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-06-01",
    "createdAt": "2026-06-01T12:18:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-056",
    "referenceNumber": "SS-2026-00056",
    "customerName": "Fairview Glass Traders",
    "contact": "0965-685-3045",
    "address": "155 Gil Puyat Avenue, Mandaluyong",
    "items": [
      {
        "productId": "PRD-036",
        "productName": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "total": 5670
      },
      {
        "productId": "PRD-047",
        "productName": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "total": 9680
      }
    ],
    "total": 15350,
    "paidAmount": 8442,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-07-04",
    "createdAt": "2026-07-04T13:25:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-057",
    "referenceNumber": "SS-2026-00057",
    "customerName": "Sta. Rosa Buildmart",
    "contact": "0966-692-3064",
    "address": "156 Ayala Avenue, Valenzuela",
    "items": [
      {
        "productId": "PRD-041",
        "productName": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "total": 13500
      },
      {
        "productId": "PRD-052",
        "productName": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "total": 10540
      },
      {
        "productId": "PRD-063",
        "productName": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "total": 31680
      }
    ],
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-01-07",
    "createdAt": "2026-01-07T14:32:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-058",
    "referenceNumber": "SS-2026-00058",
    "customerName": "Alabang Interior Works",
    "contact": "0967-699-3083",
    "address": "157 Katipunan Avenue, Muntinlupa",
    "items": [
      {
        "productId": "PRD-046",
        "productName": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "total": 5500
      }
    ],
    "total": 5500,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-02-10",
    "createdAt": "2026-02-10T15:39:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-059",
    "referenceNumber": "SS-2026-00059",
    "customerName": "Navotas Industrial Supply",
    "contact": "0968-706-3102",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-051",
        "productName": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "total": 6180
      },
      {
        "productId": "PRD-062",
        "productName": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "total": 23275
      }
    ],
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-03-13",
    "createdAt": "2026-03-13T16:46:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-060",
    "referenceNumber": "SS-2026-00060",
    "customerName": "Malabon Glasshouse",
    "contact": "0969-713-3121",
    "address": "159 Congressional Avenue, Sta. Rosa",
    "items": [
      {
        "productId": "PRD-056",
        "productName": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "total": 17420
      },
      {
        "productId": "PRD-067",
        "productName": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "total": 16300
      },
      {
        "productId": "PRD-078",
        "productName": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "total": 1170
      }
    ],
    "total": 34890,
    "paidAmount": 34890,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-04-16",
    "createdAt": "2026-04-16T17:53:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-061",
    "referenceNumber": "SS-2026-00061",
    "customerName": "Aurelia Builders",
    "contact": "0970-720-3140",
    "address": "160 Rizal Avenue, Manila",
    "items": [
      {
        "productId": "PRD-061",
        "productName": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "total": 27440
      }
    ],
    "total": 27440,
    "paidAmount": 15092,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-05-19",
    "createdAt": "2026-05-19T08:00:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-062",
    "referenceNumber": "SS-2026-00062",
    "customerName": "Northbay Glass Works",
    "contact": "0971-727-3159",
    "address": "161 Mabini Street, Pasig",
    "items": [
      {
        "productId": "PRD-066",
        "productName": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "total": 18450
      },
      {
        "productId": "PRD-077",
        "productName": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "total": 15840
      }
    ],
    "total": 34290,
    "paidAmount": 34290,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-06-22",
    "createdAt": "2026-06-22T09:07:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-063",
    "referenceNumber": "SS-2026-00063",
    "customerName": "Mendoza Aluminum Supply",
    "contact": "0972-734-3178",
    "address": "162 Quezon Avenue, Marikina",
    "items": [
      {
        "productId": "PRD-071",
        "productName": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "total": 45600
      },
      {
        "productId": "PRD-082",
        "productName": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "total": 12650
      },
      {
        "productId": "PRD-093",
        "productName": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "total": 2220
      }
    ],
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-07-25",
    "createdAt": "2026-07-25T10:14:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-064",
    "referenceNumber": "SS-2026-00064",
    "customerName": "San Pedro Construction",
    "contact": "0973-741-3197",
    "address": "163 Ortigas Extension, Para\u00f1aque",
    "items": [
      {
        "productId": "PRD-076",
        "productName": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "total": 10370
      }
    ],
    "total": 10370,
    "paidAmount": 5185,
    "paymentStatus": "partial",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-01-01",
    "createdAt": "2026-01-01T11:21:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-065",
    "referenceNumber": "SS-2026-00065",
    "customerName": "Everline Interiors",
    "contact": "0974-748-3216",
    "address": "164 EDSA Service Road, Antipolo",
    "items": [
      {
        "productId": "PRD-081",
        "productName": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "total": 7380
      },
      {
        "productId": "PRD-092",
        "productName": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "total": 33250
      }
    ],
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-02-04",
    "createdAt": "2026-02-04T12:28:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-066",
    "referenceNumber": "SS-2026-00066",
    "customerName": "JRM Glass Center",
    "contact": "0975-755-3235",
    "address": "165 Commerce Avenue, Bacoor",
    "items": [
      {
        "productId": "PRD-086",
        "productName": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "total": 13490
      },
      {
        "productId": "PRD-097",
        "productName": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "total": 1290
      },
      {
        "productId": "PRD-108",
        "productName": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "total": 17145
      }
    ],
    "total": 31925,
    "paidAmount": 17559,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-03-07",
    "createdAt": "2026-03-07T13:35:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-067",
    "referenceNumber": "SS-2026-00067",
    "customerName": "Prime Arc Developers",
    "contact": "0976-762-3254",
    "address": "166 Industrial Road, San Pedro",
    "items": [
      {
        "productId": "PRD-091",
        "productName": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "total": 27800
      }
    ],
    "total": 27800,
    "paidAmount": 27800,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-04-10",
    "createdAt": "2026-04-10T14:42:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-068",
    "referenceNumber": "SS-2026-00068",
    "customerName": "Cavite Window Systems",
    "contact": "0977-769-3273",
    "address": "167 National Highway, Quezon City",
    "items": [
      {
        "productId": "PRD-096",
        "productName": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "total": 12180
      },
      {
        "productId": "PRD-107",
        "productName": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "total": 6160
      }
    ],
    "total": 18340,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-05-13",
    "createdAt": "2026-05-13T15:49:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-069",
    "referenceNumber": "SS-2026-00069",
    "customerName": "Lucena Home Builders",
    "contact": "0978-776-3292",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-101",
        "productName": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "total": 12210
      },
      {
        "productId": "PRD-112",
        "productName": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "total": 6325
      },
      {
        "productId": "PRD-003",
        "productName": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "total": 8460
      }
    ],
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-06-16",
    "createdAt": "2026-06-16T16:56:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-070",
    "referenceNumber": "SS-2026-00070",
    "customerName": "Quezon Facade Studio",
    "contact": "0979-783-3311",
    "address": "169 Shaw Boulevard, Caloocan",
    "items": [
      {
        "productId": "PRD-106",
        "productName": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "total": 29325
      }
    ],
    "total": 29325,
    "paidAmount": 29325,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-07-19",
    "createdAt": "2026-07-19T17:03:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-071",
    "referenceNumber": "SS-2026-00071",
    "customerName": "BGC Fit-Out Group",
    "contact": "0980-790-3330",
    "address": "170 C5 Road, Las Pi\u00f1as",
    "items": [
      {
        "productId": "PRD-111",
        "productName": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "total": 48000
      },
      {
        "productId": "PRD-002",
        "productName": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "total": 4060
      }
    ],
    "total": 52060,
    "paidAmount": 28633,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-01-22",
    "createdAt": "2026-01-22T08:10:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-072",
    "referenceNumber": "SS-2026-00072",
    "customerName": "Valenzuela Glass Depot",
    "contact": "0981-797-3349",
    "address": "171 Aguinaldo Highway, Cavite City",
    "items": [
      {
        "productId": "PRD-116",
        "productName": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "total": 31750
      },
      {
        "productId": "PRD-007",
        "productName": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "total": 12520
      },
      {
        "productId": "PRD-018",
        "productName": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "total": 13050
      }
    ],
    "total": 57320,
    "paidAmount": 57320,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-02-25",
    "createdAt": "2026-02-25T09:17:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-073",
    "referenceNumber": "SS-2026-00073",
    "customerName": "Laguna Aluminum Works",
    "contact": "0982-804-3368",
    "address": "172 Alabang-Zapote Road, Calamba",
    "items": [
      {
        "productId": "PRD-001",
        "productName": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "total": 950
      }
    ],
    "total": 950,
    "paidAmount": 475,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-03-01",
    "createdAt": "2026-03-01T10:24:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-074",
    "referenceNumber": "SS-2026-00074",
    "customerName": "Rizal Door and Window",
    "contact": "0983-811-3387",
    "address": "173 Marcos Highway, Malabon",
    "items": [
      {
        "productId": "PRD-006",
        "productName": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "total": 3900
      },
      {
        "productId": "PRD-017",
        "productName": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "total": 7750
      }
    ],
    "total": 11650,
    "paidAmount": 11650,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-04-04",
    "createdAt": "2026-04-04T11:31:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-075",
    "referenceNumber": "SS-2026-00075",
    "customerName": "Makati Renovation Co.",
    "contact": "0984-818-3406",
    "address": "174 MacArthur Highway, Makati",
    "items": [
      {
        "productId": "PRD-011",
        "productName": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "total": 7680
      },
      {
        "productId": "PRD-022",
        "productName": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "total": 37675
      },
      {
        "productId": "PRD-033",
        "productName": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "total": 6300
      }
    ],
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-05-07",
    "createdAt": "2026-05-07T12:38:00",
    "refundAmount": 7748,
    "refundStatus": "completed",
    "refundReason": "Client changed cut-size specification"
  },
  {
    "id": "ORD-076",
    "referenceNumber": "SS-2026-00076",
    "customerName": "Calamba Commercial Builders",
    "contact": "0985-825-3425",
    "address": "175 Gil Puyat Avenue, Mandaluyong",
    "items": [
      {
        "productId": "PRD-016",
        "productName": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "total": 5950
      }
    ],
    "total": 5950,
    "paidAmount": 3273,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-06-10",
    "createdAt": "2026-06-10T13:45:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-077",
    "referenceNumber": "SS-2026-00077",
    "customerName": "Pasig Partition Systems",
    "contact": "0986-832-3444",
    "address": "176 Ayala Avenue, Valenzuela",
    "items": [
      {
        "productId": "PRD-021",
        "productName": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "total": 17490
      },
      {
        "productId": "PRD-032",
        "productName": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "total": 6110
      }
    ],
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-07-13",
    "createdAt": "2026-07-13T14:52:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-078",
    "referenceNumber": "SS-2026-00078",
    "customerName": "Caloocan Hardware Center",
    "contact": "0987-839-3463",
    "address": "177 Katipunan Avenue, Muntinlupa",
    "items": [
      {
        "productId": "PRD-026",
        "productName": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "total": 3710
      },
      {
        "productId": "PRD-037",
        "productName": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "total": 5320
      },
      {
        "productId": "PRD-048",
        "productName": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "total": 6930
      }
    ],
    "total": 15960,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-01-16",
    "createdAt": "2026-01-16T15:59:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-079",
    "referenceNumber": "SS-2026-00079",
    "customerName": "Marikina Fabrication",
    "contact": "0988-846-3482",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-031",
        "productName": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "total": 2640
      }
    ],
    "total": 2640,
    "paidAmount": 2640,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-02-19",
    "createdAt": "2026-02-19T16:06:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-080",
    "referenceNumber": "SS-2026-00080",
    "customerName": "Taguig Residential Builds",
    "contact": "0989-853-3501",
    "address": "179 Congressional Avenue, Sta. Rosa",
    "items": [
      {
        "productId": "PRD-036",
        "productName": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "total": 5670
      },
      {
        "productId": "PRD-047",
        "productName": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "total": 9680
      }
    ],
    "total": 15350,
    "paidAmount": 15350,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-03-22",
    "createdAt": "2026-03-22T17:13:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-081",
    "referenceNumber": "SS-2026-00081",
    "customerName": "Manila Skylight Studio",
    "contact": "0900-860-3520",
    "address": "180 Rizal Avenue, Manila",
    "items": [
      {
        "productId": "PRD-041",
        "productName": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "total": 13500
      },
      {
        "productId": "PRD-052",
        "productName": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "total": 10540
      },
      {
        "productId": "PRD-063",
        "productName": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "total": 31680
      }
    ],
    "total": 55720,
    "paidAmount": 30646,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-04-25",
    "createdAt": "2026-04-25T08:20:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-082",
    "referenceNumber": "SS-2026-00082",
    "customerName": "Para\u00f1aque Modular Glass",
    "contact": "0901-867-3539",
    "address": "181 Mabini Street, Pasig",
    "items": [
      {
        "productId": "PRD-046",
        "productName": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "total": 5500
      }
    ],
    "total": 5500,
    "paidAmount": 2750,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-05-01",
    "createdAt": "2026-05-01T09:27:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-083",
    "referenceNumber": "SS-2026-00083",
    "customerName": "Antipolo Home Concepts",
    "contact": "0902-874-3558",
    "address": "182 Quezon Avenue, Marikina",
    "items": [
      {
        "productId": "PRD-051",
        "productName": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "total": 6180
      },
      {
        "productId": "PRD-062",
        "productName": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "total": 23275
      }
    ],
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-06-04",
    "createdAt": "2026-06-04T10:34:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-084",
    "referenceNumber": "SS-2026-00084",
    "customerName": "Ortigas Office Fit-Out",
    "contact": "0903-881-3577",
    "address": "183 Ortigas Extension, Para\u00f1aque",
    "items": [
      {
        "productId": "PRD-056",
        "productName": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "total": 17420
      },
      {
        "productId": "PRD-067",
        "productName": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "total": 16300
      },
      {
        "productId": "PRD-078",
        "productName": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "total": 1170
      }
    ],
    "total": 34890,
    "paidAmount": 34890,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-07-07",
    "createdAt": "2026-07-07T11:41:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-085",
    "referenceNumber": "SS-2026-00085",
    "customerName": "Las Pi\u00f1as Aluminum Craft",
    "contact": "0904-888-3596",
    "address": "184 EDSA Service Road, Antipolo",
    "items": [
      {
        "productId": "PRD-061",
        "productName": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "total": 27440
      }
    ],
    "total": 27440,
    "paidAmount": 27440,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-01-10",
    "createdAt": "2026-01-10T12:48:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-086",
    "referenceNumber": "SS-2026-00086",
    "customerName": "Fairview Glass Traders",
    "contact": "0905-895-3615",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-066",
        "productName": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "total": 18450
      },
      {
        "productId": "PRD-077",
        "productName": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "total": 15840
      }
    ],
    "total": 34290,
    "paidAmount": 18860,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-02-13",
    "createdAt": "2026-02-13T13:55:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-087",
    "referenceNumber": "SS-2026-00087",
    "customerName": "Sta. Rosa Buildmart",
    "contact": "0906-902-3634",
    "address": "186 Industrial Road, San Pedro",
    "items": [
      {
        "productId": "PRD-071",
        "productName": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "total": 45600
      },
      {
        "productId": "PRD-082",
        "productName": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "total": 12650
      },
      {
        "productId": "PRD-093",
        "productName": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "total": 2220
      }
    ],
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-03-16",
    "createdAt": "2026-03-16T14:02:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-088",
    "referenceNumber": "SS-2026-00088",
    "customerName": "Alabang Interior Works",
    "contact": "0907-909-3653",
    "address": "187 National Highway, Quezon City",
    "items": [
      {
        "productId": "PRD-076",
        "productName": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "total": 10370
      }
    ],
    "total": 10370,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-04-19",
    "createdAt": "2026-04-19T15:09:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-089",
    "referenceNumber": "SS-2026-00089",
    "customerName": "Navotas Industrial Supply",
    "contact": "0908-916-3672",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-081",
        "productName": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "total": 7380
      },
      {
        "productId": "PRD-092",
        "productName": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "total": 33250
      }
    ],
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-05-22",
    "createdAt": "2026-05-22T16:16:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-090",
    "referenceNumber": "SS-2026-00090",
    "customerName": "Malabon Glasshouse",
    "contact": "0909-923-3691",
    "address": "189 Shaw Boulevard, Caloocan",
    "items": [
      {
        "productId": "PRD-086",
        "productName": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "total": 13490
      },
      {
        "productId": "PRD-097",
        "productName": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "total": 1290
      },
      {
        "productId": "PRD-108",
        "productName": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "total": 17145
      }
    ],
    "total": 31925,
    "paidAmount": 31925,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-06-25",
    "createdAt": "2026-06-25T17:23:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-091",
    "referenceNumber": "SS-2026-00091",
    "customerName": "Aurelia Builders",
    "contact": "0910-930-3710",
    "address": "190 C5 Road, Las Pi\u00f1as",
    "items": [
      {
        "productId": "PRD-091",
        "productName": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "total": 27800
      }
    ],
    "total": 27800,
    "paidAmount": 13900,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-07-01",
    "createdAt": "2026-07-01T08:30:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-092",
    "referenceNumber": "SS-2026-00092",
    "customerName": "Northbay Glass Works",
    "contact": "0911-937-3729",
    "address": "191 Aguinaldo Highway, Cavite City",
    "items": [
      {
        "productId": "PRD-096",
        "productName": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "total": 12180
      },
      {
        "productId": "PRD-107",
        "productName": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "total": 6160
      }
    ],
    "total": 18340,
    "paidAmount": 18340,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-01-04",
    "createdAt": "2026-01-04T09:37:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-093",
    "referenceNumber": "SS-2026-00093",
    "customerName": "Mendoza Aluminum Supply",
    "contact": "0912-944-3748",
    "address": "192 Alabang-Zapote Road, Calamba",
    "items": [
      {
        "productId": "PRD-101",
        "productName": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "total": 12210
      },
      {
        "productId": "PRD-112",
        "productName": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "total": 6325
      },
      {
        "productId": "PRD-003",
        "productName": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "total": 8460
      }
    ],
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2026-02-07",
    "createdAt": "2026-02-07T10:44:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-094",
    "referenceNumber": "SS-2026-00094",
    "customerName": "San Pedro Construction",
    "contact": "0913-951-3767",
    "address": "193 Marcos Highway, Malabon",
    "items": [
      {
        "productId": "PRD-106",
        "productName": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "total": 29325
      }
    ],
    "total": 29325,
    "paidAmount": 29325,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-03-10",
    "createdAt": "2026-03-10T11:51:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-095",
    "referenceNumber": "SS-2026-00095",
    "customerName": "Everline Interiors",
    "contact": "0914-958-3786",
    "address": "194 MacArthur Highway, Makati",
    "items": [
      {
        "productId": "PRD-111",
        "productName": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "total": 48000
      },
      {
        "productId": "PRD-002",
        "productName": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "total": 4060
      }
    ],
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2026-04-13",
    "createdAt": "2026-04-13T12:58:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-096",
    "referenceNumber": "SS-2026-00096",
    "customerName": "JRM Glass Center",
    "contact": "0915-965-3805",
    "address": "195 Gil Puyat Avenue, Mandaluyong",
    "items": [
      {
        "productId": "PRD-116",
        "productName": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "total": 31750
      },
      {
        "productId": "PRD-007",
        "productName": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "total": 12520
      },
      {
        "productId": "PRD-018",
        "productName": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "total": 13050
      }
    ],
    "total": 57320,
    "paidAmount": 31526,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-05-16",
    "createdAt": "2026-05-16T13:05:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-097",
    "referenceNumber": "SS-2026-00097",
    "customerName": "Prime Arc Developers",
    "contact": "0916-972-3824",
    "address": "196 Ayala Avenue, Valenzuela",
    "items": [
      {
        "productId": "PRD-001",
        "productName": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "total": 950
      }
    ],
    "total": 950,
    "paidAmount": 950,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-06-19",
    "createdAt": "2026-06-19T14:12:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-098",
    "referenceNumber": "SS-2026-00098",
    "customerName": "Cavite Window Systems",
    "contact": "0917-979-3843",
    "address": "197 Katipunan Avenue, Muntinlupa",
    "items": [
      {
        "productId": "PRD-006",
        "productName": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "total": 3900
      },
      {
        "productId": "PRD-017",
        "productName": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "total": 7750
      }
    ],
    "total": 11650,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2026-07-22",
    "createdAt": "2026-07-22T15:19:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-099",
    "referenceNumber": "SS-2026-00099",
    "customerName": "Lucena Home Builders",
    "contact": "0918-986-3862",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-011",
        "productName": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "total": 7680
      },
      {
        "productId": "PRD-022",
        "productName": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "total": 37675
      },
      {
        "productId": "PRD-033",
        "productName": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "total": 6300
      }
    ],
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2026-01-25",
    "createdAt": "2026-01-25T16:26:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-100",
    "referenceNumber": "SS-2026-00100",
    "customerName": "Quezon Facade Studio",
    "contact": "0919-993-3881",
    "address": "199 Congressional Avenue, Sta. Rosa",
    "items": [
      {
        "productId": "PRD-016",
        "productName": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "total": 5950
      }
    ],
    "total": 5950,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2026-02-01",
    "createdAt": "2026-02-01T17:33:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-101",
    "referenceNumber": "SS-2025-00101",
    "customerName": "BGC Fit-Out Group",
    "contact": "0920-100-3900",
    "address": "200 Rizal Avenue, Manila",
    "items": [
      {
        "productId": "PRD-021",
        "productName": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "total": 17490
      },
      {
        "productId": "PRD-032",
        "productName": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "total": 6110
      }
    ],
    "total": 23600,
    "paidAmount": 12980,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2025-11-04",
    "createdAt": "2025-11-04T08:40:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-102",
    "referenceNumber": "SS-2025-00102",
    "customerName": "Valenzuela Glass Depot",
    "contact": "0921-107-3919",
    "address": "201 Mabini Street, Pasig",
    "items": [
      {
        "productId": "PRD-026",
        "productName": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "total": 3710
      },
      {
        "productId": "PRD-037",
        "productName": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "total": 5320
      },
      {
        "productId": "PRD-048",
        "productName": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "total": 6930
      }
    ],
    "total": 15960,
    "paidAmount": 15960,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2025-12-07",
    "createdAt": "2025-12-07T09:47:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-103",
    "referenceNumber": "SS-2025-00103",
    "customerName": "Laguna Aluminum Works",
    "contact": "0922-114-3938",
    "address": "202 Quezon Avenue, Marikina",
    "items": [
      {
        "productId": "PRD-031",
        "productName": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "total": 2640
      }
    ],
    "total": 2640,
    "paidAmount": 2640,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2025-11-10",
    "createdAt": "2025-11-10T10:54:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-104",
    "referenceNumber": "SS-2025-00104",
    "customerName": "Rizal Door and Window",
    "contact": "0923-121-3957",
    "address": "203 Ortigas Extension, Para\u00f1aque",
    "items": [
      {
        "productId": "PRD-036",
        "productName": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "total": 5670
      },
      {
        "productId": "PRD-047",
        "productName": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "total": 9680
      }
    ],
    "total": 15350,
    "paidAmount": 15350,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2025-12-13",
    "createdAt": "2025-12-13T11:01:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-105",
    "referenceNumber": "SS-2025-00105",
    "customerName": "Makati Renovation Co.",
    "contact": "0924-128-3976",
    "address": "204 EDSA Service Road, Antipolo",
    "items": [
      {
        "productId": "PRD-041",
        "productName": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "total": 13500
      },
      {
        "productId": "PRD-052",
        "productName": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "total": 10540
      },
      {
        "productId": "PRD-063",
        "productName": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "total": 31680
      }
    ],
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2025-11-16",
    "createdAt": "2025-11-16T12:08:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-106",
    "referenceNumber": "SS-2025-00106",
    "customerName": "Calamba Commercial Builders",
    "contact": "0925-135-3995",
    "address": "205 Commerce Avenue, Bacoor",
    "items": [
      {
        "productId": "PRD-046",
        "productName": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "total": 5500
      }
    ],
    "total": 5500,
    "paidAmount": 3025,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2025-12-19",
    "createdAt": "2025-12-19T13:15:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-107",
    "referenceNumber": "SS-2025-00107",
    "customerName": "Pasig Partition Systems",
    "contact": "0926-142-4014",
    "address": "206 Industrial Road, San Pedro",
    "items": [
      {
        "productId": "PRD-051",
        "productName": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "total": 6180
      },
      {
        "productId": "PRD-062",
        "productName": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "total": 23275
      }
    ],
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2025-11-22",
    "createdAt": "2025-11-22T14:22:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-108",
    "referenceNumber": "SS-2025-00108",
    "customerName": "Caloocan Hardware Center",
    "contact": "0927-149-4033",
    "address": "207 National Highway, Quezon City",
    "items": [
      {
        "productId": "PRD-056",
        "productName": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "total": 17420
      },
      {
        "productId": "PRD-067",
        "productName": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "total": 16300
      },
      {
        "productId": "PRD-078",
        "productName": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "total": 1170
      }
    ],
    "total": 34890,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2025-12-25",
    "createdAt": "2025-12-25T15:29:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-109",
    "referenceNumber": "SS-2025-00109",
    "customerName": "Marikina Fabrication",
    "contact": "0928-156-4052",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-061",
        "productName": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "total": 27440
      }
    ],
    "total": 27440,
    "paidAmount": 13720,
    "paymentStatus": "partial",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2025-11-01",
    "createdAt": "2025-11-01T16:36:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-110",
    "referenceNumber": "SS-2025-00110",
    "customerName": "Taguig Residential Builds",
    "contact": "0929-163-4071",
    "address": "209 Shaw Boulevard, Caloocan",
    "items": [
      {
        "productId": "PRD-066",
        "productName": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "total": 18450
      },
      {
        "productId": "PRD-077",
        "productName": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "total": 15840
      }
    ],
    "total": 34290,
    "paidAmount": 34290,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "delivery",
    "date": "2025-12-04",
    "createdAt": "2025-12-04T17:43:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-111",
    "referenceNumber": "SS-2025-00111",
    "customerName": "Manila Skylight Studio",
    "contact": "0930-170-4090",
    "address": "210 C5 Road, Las Pi\u00f1as",
    "items": [
      {
        "productId": "PRD-071",
        "productName": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "total": 45600
      },
      {
        "productId": "PRD-082",
        "productName": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "total": 12650
      },
      {
        "productId": "PRD-093",
        "productName": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "total": 2220
      }
    ],
    "total": 60470,
    "paidAmount": 33258,
    "paymentStatus": "partial",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2025-11-07",
    "createdAt": "2025-11-07T08:50:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-112",
    "referenceNumber": "SS-2025-00112",
    "customerName": "Para\u00f1aque Modular Glass",
    "contact": "0931-177-4109",
    "address": "211 Aguinaldo Highway, Cavite City",
    "items": [
      {
        "productId": "PRD-076",
        "productName": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "total": 10370
      }
    ],
    "total": 10370,
    "paidAmount": 10370,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2025-12-10",
    "createdAt": "2025-12-10T09:57:00",
    "refundAmount": 1556,
    "refundStatus": "completed",
    "refundReason": "Client changed cut-size specification"
  },
  {
    "id": "ORD-113",
    "referenceNumber": "SS-2025-00113",
    "customerName": "Antipolo Home Concepts",
    "contact": "0932-184-4128",
    "address": "212 Alabang-Zapote Road, Calamba",
    "items": [
      {
        "productId": "PRD-081",
        "productName": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "total": 7380
      },
      {
        "productId": "PRD-092",
        "productName": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "total": 33250
      }
    ],
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "completed",
    "deliveryStatus": "delivered",
    "orderType": "delivery",
    "date": "2025-11-13",
    "createdAt": "2025-11-13T10:04:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-114",
    "referenceNumber": "SS-2025-00114",
    "customerName": "Ortigas Office Fit-Out",
    "contact": "0933-191-4147",
    "address": "213 Marcos Highway, Malabon",
    "items": [
      {
        "productId": "PRD-086",
        "productName": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "total": 13490
      },
      {
        "productId": "PRD-097",
        "productName": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "total": 1290
      },
      {
        "productId": "PRD-108",
        "productName": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "total": 17145
      }
    ],
    "total": 31925,
    "paidAmount": 31925,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2025-12-16",
    "createdAt": "2025-12-16T11:11:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-115",
    "referenceNumber": "SS-2025-00115",
    "customerName": "Las Pi\u00f1as Aluminum Craft",
    "contact": "0934-198-4166",
    "address": "214 MacArthur Highway, Makati",
    "items": [
      {
        "productId": "PRD-091",
        "productName": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "total": 27800
      }
    ],
    "total": 27800,
    "paidAmount": 27800,
    "paymentStatus": "paid",
    "orderStatus": "out_for_delivery",
    "deliveryStatus": "in_transit",
    "orderType": "delivery",
    "date": "2025-11-19",
    "createdAt": "2025-11-19T12:18:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-116",
    "referenceNumber": "SS-2025-00116",
    "customerName": "Fairview Glass Traders",
    "contact": "0935-205-4185",
    "address": "215 Gil Puyat Avenue, Mandaluyong",
    "items": [
      {
        "productId": "PRD-096",
        "productName": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "total": 12180
      },
      {
        "productId": "PRD-107",
        "productName": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "total": 6160
      }
    ],
    "total": 18340,
    "paidAmount": 10087,
    "paymentStatus": "partial",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2025-12-22",
    "createdAt": "2025-12-22T13:25:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-117",
    "referenceNumber": "SS-2025-00117",
    "customerName": "Sta. Rosa Buildmart",
    "contact": "0936-212-4204",
    "address": "216 Ayala Avenue, Valenzuela",
    "items": [
      {
        "productId": "PRD-101",
        "productName": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "total": 12210
      },
      {
        "productId": "PRD-112",
        "productName": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "total": 6325
      },
      {
        "productId": "PRD-003",
        "productName": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "total": 8460
      }
    ],
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "packed",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2025-11-25",
    "createdAt": "2025-11-25T14:32:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-118",
    "referenceNumber": "SS-2025-00118",
    "customerName": "Alabang Interior Works",
    "contact": "0937-219-4223",
    "address": "217 Katipunan Avenue, Muntinlupa",
    "items": [
      {
        "productId": "PRD-106",
        "productName": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "total": 29325
      }
    ],
    "total": 29325,
    "paidAmount": 0,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "deliveryStatus": "scheduled",
    "orderType": "delivery",
    "date": "2025-12-01",
    "createdAt": "2025-12-01T15:39:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-119",
    "referenceNumber": "SS-2025-00119",
    "customerName": "Navotas Industrial Supply",
    "contact": "0938-226-4242",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-111",
        "productName": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "total": 48000
      },
      {
        "productId": "PRD-002",
        "productName": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "total": 4060
      }
    ],
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "ready_for_pickup",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2025-11-04",
    "createdAt": "2025-11-04T16:46:00",
    "refundAmount": 0,
    "refundStatus": "none"
  },
  {
    "id": "ORD-120",
    "referenceNumber": "SS-2025-00120",
    "customerName": "Malabon Glasshouse",
    "contact": "0939-233-4261",
    "address": "Pickup",
    "items": [
      {
        "productId": "PRD-116",
        "productName": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "total": 31750
      },
      {
        "productId": "PRD-007",
        "productName": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "total": 12520
      },
      {
        "productId": "PRD-018",
        "productName": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "total": 13050
      }
    ],
    "total": 57320,
    "paidAmount": 57320,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "deliveryStatus": "not_required",
    "orderType": "pickup",
    "date": "2025-12-07",
    "createdAt": "2025-12-07T17:53:00",
    "refundAmount": 0,
    "refundStatus": "none"
  }
];

export const initialDeliveries: Delivery[] = [
  {
    "id": "DEL-001",
    "orderId": "ORD-001",
    "driver": "Carlos Mendoza",
    "truckNumber": "Truck-101",
    "destination": "100 Rizal Avenue, Manila",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-002",
    "orderId": "ORD-002",
    "driver": "Roberto Santos",
    "truckNumber": "Truck-102",
    "destination": "101 Mabini Street, Pasig",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-003",
    "orderId": "ORD-003",
    "driver": "Juan Dela Cruz",
    "truckNumber": "Truck-103",
    "destination": "102 Quezon Avenue, Marikina",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-004",
    "orderId": "ORD-004",
    "driver": "Maria Garcia",
    "truckNumber": "Truck-104",
    "destination": "103 Ortigas Extension, Para\u00f1aque",
    "status": "in_transit",
    "location": "NLEX Balintawak",
    "currentStep": 3,
    "currentLocation": {
      "x": 21,
      "y": 33
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 71,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-005",
    "orderId": "ORD-005",
    "driver": "Pedro Reyes",
    "truckNumber": "Truck-105",
    "destination": "104 EDSA Service Road, Antipolo",
    "status": "in_transit",
    "location": "Taguig service road",
    "currentStep": 3,
    "currentLocation": {
      "x": 28,
      "y": 44
    },
    "trafficLevel": "medium",
    "predictedDelay": true,
    "routeEfficiencyScore": 74,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-006",
    "orderId": "ORD-006",
    "driver": "Ana Santos",
    "truckNumber": "Truck-106",
    "destination": "105 Commerce Avenue, Bacoor",
    "status": "picked_up",
    "location": "Warehouse dispatch bay",
    "currentStep": 2,
    "currentLocation": {
      "x": 35,
      "y": 55
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 77,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-007",
    "orderId": "ORD-007",
    "driver": "Mario Cruz",
    "truckNumber": "Truck-107",
    "destination": "106 Industrial Road, San Pedro",
    "status": "assigned",
    "location": "Ortigas Center",
    "currentStep": 1,
    "currentLocation": {
      "x": 42,
      "y": 66
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 80,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-008",
    "orderId": "ORD-008",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "107 National Highway, Quezon City",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 49,
      "y": 77
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 83,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-009",
    "orderId": "ORD-011",
    "driver": "Danny Garcia",
    "truckNumber": "Truck-109",
    "destination": "110 C5 Road, Las Pi\u00f1as",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-010",
    "orderId": "ORD-012",
    "driver": "Rico Martinez",
    "truckNumber": "Truck-110",
    "destination": "111 Aguinaldo Highway, Cavite City",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-011",
    "orderId": "ORD-013",
    "driver": "Felipe Torres",
    "truckNumber": "Truck-111",
    "destination": "112 Alabang-Zapote Road, Calamba",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-012",
    "orderId": "ORD-014",
    "driver": "Marco Lim",
    "truckNumber": "Truck-112",
    "destination": "113 Marcos Highway, Malabon",
    "status": "in_transit",
    "location": "Ortigas Center",
    "currentStep": 3,
    "currentLocation": {
      "x": 77,
      "y": 25
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 95,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-013",
    "orderId": "ORD-015",
    "driver": "Joseph Navarro",
    "truckNumber": "Truck-113",
    "destination": "114 MacArthur Highway, Makati",
    "status": "in_transit",
    "location": "SLEX Alabang",
    "currentStep": 3,
    "currentLocation": {
      "x": 84,
      "y": 36
    },
    "trafficLevel": "low",
    "predictedDelay": true,
    "routeEfficiencyScore": 63,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-014",
    "orderId": "ORD-016",
    "driver": "Edwin Bautista",
    "truckNumber": "Truck-114",
    "destination": "115 Gil Puyat Avenue, Mandaluyong",
    "status": "picked_up",
    "location": "NLEX Balintawak",
    "currentStep": 2,
    "currentLocation": {
      "x": 91,
      "y": 47
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 66,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-015",
    "orderId": "ORD-017",
    "driver": "Lito Fernandez",
    "truckNumber": "Truck-115",
    "destination": "116 Ayala Avenue, Valenzuela",
    "status": "assigned",
    "location": "Taguig service road",
    "currentStep": 1,
    "currentLocation": {
      "x": 2,
      "y": 58
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 69,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-016",
    "orderId": "ORD-021",
    "driver": "Arnel Ramos",
    "truckNumber": "Truck-116",
    "destination": "120 Rizal Avenue, Manila",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-017",
    "orderId": "ORD-022",
    "driver": "Paolo Santiago",
    "truckNumber": "Truck-117",
    "destination": "121 Mabini Street, Pasig",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-018",
    "orderId": "ORD-023",
    "driver": "Nestor Aquino",
    "truckNumber": "Truck-118",
    "destination": "122 Quezon Avenue, Marikina",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-019",
    "orderId": "ORD-024",
    "driver": "Victor Salazar",
    "truckNumber": "Truck-119",
    "destination": "123 Ortigas Extension, Para\u00f1aque",
    "status": "in_transit",
    "location": "NLEX Balintawak",
    "currentStep": 3,
    "currentLocation": {
      "x": 30,
      "y": 6
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 81,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-020",
    "orderId": "ORD-025",
    "driver": "Renato Flores",
    "truckNumber": "Truck-120",
    "destination": "124 EDSA Service Road, Antipolo",
    "status": "in_transit",
    "location": "Taguig service road",
    "currentStep": 3,
    "currentLocation": {
      "x": 37,
      "y": 17
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 84,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-021",
    "orderId": "ORD-026",
    "driver": "Carlos Mendoza",
    "truckNumber": "Truck-121",
    "destination": "125 Commerce Avenue, Bacoor",
    "status": "assigned",
    "location": "Warehouse dispatch bay",
    "currentStep": 1,
    "currentLocation": {
      "x": 44,
      "y": 28
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 87,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-022",
    "orderId": "ORD-027",
    "driver": "Roberto Santos",
    "truckNumber": "Truck-122",
    "destination": "126 Industrial Road, San Pedro",
    "status": "picked_up",
    "location": "Ortigas Center",
    "currentStep": 2,
    "currentLocation": {
      "x": 51,
      "y": 39
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 90,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-023",
    "orderId": "ORD-028",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "127 National Highway, Quezon City",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 58,
      "y": 50
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 93,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-024",
    "orderId": "ORD-031",
    "driver": "Maria Garcia",
    "truckNumber": "Truck-124",
    "destination": "130 C5 Road, Las Pi\u00f1as",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-025",
    "orderId": "ORD-032",
    "driver": "Pedro Reyes",
    "truckNumber": "Truck-101",
    "destination": "131 Aguinaldo Highway, Cavite City",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-026",
    "orderId": "ORD-033",
    "driver": "Ana Santos",
    "truckNumber": "Truck-102",
    "destination": "132 Alabang-Zapote Road, Calamba",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-027",
    "orderId": "ORD-034",
    "driver": "Mario Cruz",
    "truckNumber": "Truck-103",
    "destination": "133 Marcos Highway, Malabon",
    "status": "in_transit",
    "location": "Ortigas Center",
    "currentStep": 3,
    "currentLocation": {
      "x": 86,
      "y": 94
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 70,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-028",
    "orderId": "ORD-035",
    "driver": "Ramon Villanueva",
    "truckNumber": "Truck-104",
    "destination": "134 MacArthur Highway, Makati",
    "status": "in_transit",
    "location": "SLEX Alabang",
    "currentStep": 3,
    "currentLocation": {
      "x": 93,
      "y": 9
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 73,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-029",
    "orderId": "ORD-036",
    "driver": "Danny Garcia",
    "truckNumber": "Truck-105",
    "destination": "135 Gil Puyat Avenue, Mandaluyong",
    "status": "assigned",
    "location": "NLEX Balintawak",
    "currentStep": 1,
    "currentLocation": {
      "x": 4,
      "y": 20
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 76,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-030",
    "orderId": "ORD-037",
    "driver": "Rico Martinez",
    "truckNumber": "Truck-106",
    "destination": "136 Ayala Avenue, Valenzuela",
    "status": "picked_up",
    "location": "Taguig service road",
    "currentStep": 2,
    "currentLocation": {
      "x": 11,
      "y": 31
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 79,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-031",
    "orderId": "ORD-038",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "137 Katipunan Avenue, Muntinlupa",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 18,
      "y": 42
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 82,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-032",
    "orderId": "ORD-041",
    "driver": "Marco Lim",
    "truckNumber": "Truck-108",
    "destination": "140 Rizal Avenue, Manila",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-033",
    "orderId": "ORD-042",
    "driver": "Joseph Navarro",
    "truckNumber": "Truck-109",
    "destination": "141 Mabini Street, Pasig",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-034",
    "orderId": "ORD-043",
    "driver": "Edwin Bautista",
    "truckNumber": "Truck-110",
    "destination": "142 Quezon Avenue, Marikina",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-035",
    "orderId": "ORD-044",
    "driver": "Lito Fernandez",
    "truckNumber": "Truck-111",
    "destination": "143 Ortigas Extension, Para\u00f1aque",
    "status": "in_transit",
    "location": "Taguig service road",
    "currentStep": 3,
    "currentLocation": {
      "x": 46,
      "y": 86
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 94,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-036",
    "orderId": "ORD-045",
    "driver": "Arnel Ramos",
    "truckNumber": "Truck-112",
    "destination": "144 EDSA Service Road, Antipolo",
    "status": "in_transit",
    "location": "Warehouse dispatch bay",
    "currentStep": 3,
    "currentLocation": {
      "x": 53,
      "y": 1
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 62,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-037",
    "orderId": "ORD-046",
    "driver": "Paolo Santiago",
    "truckNumber": "Truck-113",
    "destination": "145 Commerce Avenue, Bacoor",
    "status": "assigned",
    "location": "Ortigas Center",
    "currentStep": 1,
    "currentLocation": {
      "x": 60,
      "y": 12
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 65,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-038",
    "orderId": "ORD-047",
    "driver": "Nestor Aquino",
    "truckNumber": "Truck-114",
    "destination": "146 Industrial Road, San Pedro",
    "status": "picked_up",
    "location": "SLEX Alabang",
    "currentStep": 2,
    "currentLocation": {
      "x": 67,
      "y": 23
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 68,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-039",
    "orderId": "ORD-048",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "147 National Highway, Quezon City",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 74,
      "y": 34
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 71,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-040",
    "orderId": "ORD-051",
    "driver": "Renato Flores",
    "truckNumber": "Truck-116",
    "destination": "150 C5 Road, Las Pi\u00f1as",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-041",
    "orderId": "ORD-052",
    "driver": "Carlos Mendoza",
    "truckNumber": "Truck-117",
    "destination": "151 Aguinaldo Highway, Cavite City",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-042",
    "orderId": "ORD-053",
    "driver": "Roberto Santos",
    "truckNumber": "Truck-118",
    "destination": "152 Alabang-Zapote Road, Calamba",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-043",
    "orderId": "ORD-054",
    "driver": "Juan Dela Cruz",
    "truckNumber": "Truck-119",
    "destination": "153 Marcos Highway, Malabon",
    "status": "in_transit",
    "location": "SLEX Alabang",
    "currentStep": 3,
    "currentLocation": {
      "x": 6,
      "y": 78
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 83,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-044",
    "orderId": "ORD-055",
    "driver": "Maria Garcia",
    "truckNumber": "Truck-120",
    "destination": "154 MacArthur Highway, Makati",
    "status": "in_transit",
    "location": "NLEX Balintawak",
    "currentStep": 3,
    "currentLocation": {
      "x": 13,
      "y": 89
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 86,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-045",
    "orderId": "ORD-056",
    "driver": "Pedro Reyes",
    "truckNumber": "Truck-121",
    "destination": "155 Gil Puyat Avenue, Mandaluyong",
    "status": "assigned",
    "location": "Taguig service road",
    "currentStep": 1,
    "currentLocation": {
      "x": 20,
      "y": 4
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 89,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-046",
    "orderId": "ORD-057",
    "driver": "Ana Santos",
    "truckNumber": "Truck-122",
    "destination": "156 Ayala Avenue, Valenzuela",
    "status": "picked_up",
    "location": "Warehouse dispatch bay",
    "currentStep": 2,
    "currentLocation": {
      "x": 27,
      "y": 15
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 92,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-047",
    "orderId": "ORD-058",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "157 Katipunan Avenue, Muntinlupa",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 34,
      "y": 26
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 95,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-048",
    "orderId": "ORD-061",
    "driver": "Ramon Villanueva",
    "truckNumber": "Truck-124",
    "destination": "160 Rizal Avenue, Manila",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-049",
    "orderId": "ORD-062",
    "driver": "Danny Garcia",
    "truckNumber": "Truck-101",
    "destination": "161 Mabini Street, Pasig",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-050",
    "orderId": "ORD-063",
    "driver": "Rico Martinez",
    "truckNumber": "Truck-102",
    "destination": "162 Quezon Avenue, Marikina",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-051",
    "orderId": "ORD-064",
    "driver": "Felipe Torres",
    "truckNumber": "Truck-103",
    "destination": "163 Ortigas Extension, Para\u00f1aque",
    "status": "in_transit",
    "location": "Warehouse dispatch bay",
    "currentStep": 3,
    "currentLocation": {
      "x": 62,
      "y": 70
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 72,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-052",
    "orderId": "ORD-065",
    "driver": "Marco Lim",
    "truckNumber": "Truck-104",
    "destination": "164 EDSA Service Road, Antipolo",
    "status": "in_transit",
    "location": "Ortigas Center",
    "currentStep": 3,
    "currentLocation": {
      "x": 69,
      "y": 81
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 75,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-053",
    "orderId": "ORD-066",
    "driver": "Joseph Navarro",
    "truckNumber": "Truck-105",
    "destination": "165 Commerce Avenue, Bacoor",
    "status": "assigned",
    "location": "SLEX Alabang",
    "currentStep": 1,
    "currentLocation": {
      "x": 76,
      "y": 92
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 78,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-054",
    "orderId": "ORD-067",
    "driver": "Edwin Bautista",
    "truckNumber": "Truck-106",
    "destination": "166 Industrial Road, San Pedro",
    "status": "picked_up",
    "location": "NLEX Balintawak",
    "currentStep": 2,
    "currentLocation": {
      "x": 83,
      "y": 7
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 81,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-055",
    "orderId": "ORD-068",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "167 National Highway, Quezon City",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 90,
      "y": 18
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 84,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-056",
    "orderId": "ORD-071",
    "driver": "Arnel Ramos",
    "truckNumber": "Truck-108",
    "destination": "170 C5 Road, Las Pi\u00f1as",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-057",
    "orderId": "ORD-072",
    "driver": "Paolo Santiago",
    "truckNumber": "Truck-109",
    "destination": "171 Aguinaldo Highway, Cavite City",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-058",
    "orderId": "ORD-073",
    "driver": "Nestor Aquino",
    "truckNumber": "Truck-110",
    "destination": "172 Alabang-Zapote Road, Calamba",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-059",
    "orderId": "ORD-074",
    "driver": "Victor Salazar",
    "truckNumber": "Truck-111",
    "destination": "173 Marcos Highway, Malabon",
    "status": "in_transit",
    "location": "NLEX Balintawak",
    "currentStep": 3,
    "currentLocation": {
      "x": 22,
      "y": 62
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-060",
    "orderId": "ORD-075",
    "driver": "Renato Flores",
    "truckNumber": "Truck-112",
    "destination": "174 MacArthur Highway, Makati",
    "status": "in_transit",
    "location": "Taguig service road",
    "currentStep": 3,
    "currentLocation": {
      "x": 29,
      "y": 73
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 64,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-061",
    "orderId": "ORD-076",
    "driver": "Carlos Mendoza",
    "truckNumber": "Truck-113",
    "destination": "175 Gil Puyat Avenue, Mandaluyong",
    "status": "assigned",
    "location": "Warehouse dispatch bay",
    "currentStep": 1,
    "currentLocation": {
      "x": 36,
      "y": 84
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 67,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-062",
    "orderId": "ORD-077",
    "driver": "Roberto Santos",
    "truckNumber": "Truck-114",
    "destination": "176 Ayala Avenue, Valenzuela",
    "status": "picked_up",
    "location": "Ortigas Center",
    "currentStep": 2,
    "currentLocation": {
      "x": 43,
      "y": 95
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 70,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-063",
    "orderId": "ORD-078",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "177 Katipunan Avenue, Muntinlupa",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 50,
      "y": 10
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 73,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-064",
    "orderId": "ORD-081",
    "driver": "Maria Garcia",
    "truckNumber": "Truck-116",
    "destination": "180 Rizal Avenue, Manila",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-065",
    "orderId": "ORD-082",
    "driver": "Pedro Reyes",
    "truckNumber": "Truck-117",
    "destination": "181 Mabini Street, Pasig",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-066",
    "orderId": "ORD-083",
    "driver": "Ana Santos",
    "truckNumber": "Truck-118",
    "destination": "182 Quezon Avenue, Marikina",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-067",
    "orderId": "ORD-084",
    "driver": "Mario Cruz",
    "truckNumber": "Truck-119",
    "destination": "183 Ortigas Extension, Para\u00f1aque",
    "status": "in_transit",
    "location": "Ortigas Center",
    "currentStep": 3,
    "currentLocation": {
      "x": 78,
      "y": 54
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 85,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-068",
    "orderId": "ORD-085",
    "driver": "Ramon Villanueva",
    "truckNumber": "Truck-120",
    "destination": "184 EDSA Service Road, Antipolo",
    "status": "in_transit",
    "location": "SLEX Alabang",
    "currentStep": 3,
    "currentLocation": {
      "x": 85,
      "y": 65
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 88,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-069",
    "orderId": "ORD-087",
    "driver": "Danny Garcia",
    "truckNumber": "Truck-121",
    "destination": "186 Industrial Road, San Pedro",
    "status": "assigned",
    "location": "NLEX Balintawak",
    "currentStep": 1,
    "currentLocation": {
      "x": 92,
      "y": 76
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 91,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-070",
    "orderId": "ORD-088",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "187 National Highway, Quezon City",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 3,
      "y": 87
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 94,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-071",
    "orderId": "ORD-091",
    "driver": "Felipe Torres",
    "truckNumber": "Truck-123",
    "destination": "190 C5 Road, Las Pi\u00f1as",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-072",
    "orderId": "ORD-092",
    "driver": "Marco Lim",
    "truckNumber": "Truck-124",
    "destination": "191 Aguinaldo Highway, Cavite City",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-073",
    "orderId": "ORD-093",
    "driver": "Joseph Navarro",
    "truckNumber": "Truck-101",
    "destination": "192 Alabang-Zapote Road, Calamba",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-074",
    "orderId": "ORD-094",
    "driver": "Edwin Bautista",
    "truckNumber": "Truck-102",
    "destination": "193 Marcos Highway, Malabon",
    "status": "in_transit",
    "location": "NLEX Balintawak",
    "currentStep": 3,
    "currentLocation": {
      "x": 31,
      "y": 35
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 71,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-075",
    "orderId": "ORD-095",
    "driver": "Lito Fernandez",
    "truckNumber": "Truck-103",
    "destination": "194 MacArthur Highway, Makati",
    "status": "in_transit",
    "location": "Taguig service road",
    "currentStep": 3,
    "currentLocation": {
      "x": 38,
      "y": 46
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 74,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-076",
    "orderId": "ORD-096",
    "driver": "Arnel Ramos",
    "truckNumber": "Truck-104",
    "destination": "195 Gil Puyat Avenue, Mandaluyong",
    "status": "picked_up",
    "location": "Warehouse dispatch bay",
    "currentStep": 2,
    "currentLocation": {
      "x": 45,
      "y": 57
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 77,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-077",
    "orderId": "ORD-097",
    "driver": "Paolo Santiago",
    "truckNumber": "Truck-105",
    "destination": "196 Ayala Avenue, Valenzuela",
    "status": "assigned",
    "location": "Ortigas Center",
    "currentStep": 1,
    "currentLocation": {
      "x": 52,
      "y": 68
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 80,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-078",
    "orderId": "ORD-098",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "197 Katipunan Avenue, Muntinlupa",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 59,
      "y": 79
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 83,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-079",
    "orderId": "ORD-101",
    "driver": "Victor Salazar",
    "truckNumber": "Truck-107",
    "destination": "200 Rizal Avenue, Manila",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-080",
    "orderId": "ORD-102",
    "driver": "Renato Flores",
    "truckNumber": "Truck-108",
    "destination": "201 Mabini Street, Pasig",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-081",
    "orderId": "ORD-103",
    "driver": "Carlos Mendoza",
    "truckNumber": "Truck-109",
    "destination": "202 Quezon Avenue, Marikina",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-082",
    "orderId": "ORD-104",
    "driver": "Roberto Santos",
    "truckNumber": "Truck-110",
    "destination": "203 Ortigas Extension, Para\u00f1aque",
    "status": "in_transit",
    "location": "Ortigas Center",
    "currentStep": 3,
    "currentLocation": {
      "x": 87,
      "y": 27
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 95,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-083",
    "orderId": "ORD-105",
    "driver": "Juan Dela Cruz",
    "truckNumber": "Truck-111",
    "destination": "204 EDSA Service Road, Antipolo",
    "status": "in_transit",
    "location": "SLEX Alabang",
    "currentStep": 3,
    "currentLocation": {
      "x": 94,
      "y": 38
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 63,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-084",
    "orderId": "ORD-106",
    "driver": "Maria Garcia",
    "truckNumber": "Truck-112",
    "destination": "205 Commerce Avenue, Bacoor",
    "status": "picked_up",
    "location": "NLEX Balintawak",
    "currentStep": 2,
    "currentLocation": {
      "x": 5,
      "y": 49
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 66,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-085",
    "orderId": "ORD-107",
    "driver": "Pedro Reyes",
    "truckNumber": "Truck-113",
    "destination": "206 Industrial Road, San Pedro",
    "status": "assigned",
    "location": "Taguig service road",
    "currentStep": 1,
    "currentLocation": {
      "x": 12,
      "y": 60
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 69,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-086",
    "orderId": "ORD-108",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "207 National Highway, Quezon City",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 19,
      "y": 71
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 72,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-087",
    "orderId": "ORD-111",
    "driver": "Mario Cruz",
    "truckNumber": "Truck-115",
    "destination": "210 C5 Road, Las Pi\u00f1as",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-088",
    "orderId": "ORD-112",
    "driver": "Ramon Villanueva",
    "truckNumber": "Truck-116",
    "destination": "211 Aguinaldo Highway, Cavite City",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-089",
    "orderId": "ORD-113",
    "driver": "Danny Garcia",
    "truckNumber": "Truck-117",
    "destination": "212 Alabang-Zapote Road, Calamba",
    "status": "delivered",
    "location": "Delivered",
    "currentStep": 5,
    "currentLocation": {
      "x": 100,
      "y": 100
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-090",
    "orderId": "ORD-114",
    "driver": "Rico Martinez",
    "truckNumber": "Truck-118",
    "destination": "213 Marcos Highway, Malabon",
    "status": "in_transit",
    "location": "Taguig service road",
    "currentStep": 3,
    "currentLocation": {
      "x": 47,
      "y": 19
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 84,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-091",
    "orderId": "ORD-115",
    "driver": "Felipe Torres",
    "truckNumber": "Truck-119",
    "destination": "214 MacArthur Highway, Makati",
    "status": "in_transit",
    "location": "Warehouse dispatch bay",
    "currentStep": 3,
    "currentLocation": {
      "x": 54,
      "y": 30
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 87,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-092",
    "orderId": "ORD-116",
    "driver": "Marco Lim",
    "truckNumber": "Truck-120",
    "destination": "215 Gil Puyat Avenue, Mandaluyong",
    "status": "picked_up",
    "location": "Ortigas Center",
    "currentStep": 2,
    "currentLocation": {
      "x": 61,
      "y": 41
    },
    "trafficLevel": "medium",
    "predictedDelay": false,
    "routeEfficiencyScore": 90,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-093",
    "orderId": "ORD-117",
    "driver": "Joseph Navarro",
    "truckNumber": "Truck-121",
    "destination": "216 Ayala Avenue, Valenzuela",
    "status": "assigned",
    "location": "SLEX Alabang",
    "currentStep": 1,
    "currentLocation": {
      "x": 68,
      "y": 52
    },
    "trafficLevel": "high",
    "predictedDelay": false,
    "routeEfficiencyScore": 93,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-094",
    "orderId": "ORD-118",
    "driver": "Unassigned delivery",
    "truckNumber": "TBD",
    "destination": "217 Katipunan Avenue, Muntinlupa",
    "status": "pending",
    "location": "Warehouse dispatch bay",
    "currentStep": 0,
    "currentLocation": {
      "x": 75,
      "y": 63
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 96,
    "notes": "Client-presentation simulated delivery route"
  },
  {
    "id": "DEL-095",
    "orderId": "ORD-010",
    "driver": "Lito Fernandez",
    "truckNumber": "Truck-123",
    "destination": "109 Shaw Boulevard, Caloocan",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-096",
    "orderId": "ORD-020",
    "driver": "Arnel Ramos",
    "truckNumber": "Truck-124",
    "destination": "119 Congressional Avenue, Sta. Rosa",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-097",
    "orderId": "ORD-030",
    "driver": "Paolo Santiago",
    "truckNumber": "Truck-101",
    "destination": "129 Shaw Boulevard, Caloocan",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-098",
    "orderId": "ORD-040",
    "driver": "Nestor Aquino",
    "truckNumber": "Truck-102",
    "destination": "139 Congressional Avenue, Sta. Rosa",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-099",
    "orderId": "ORD-050",
    "driver": "Victor Salazar",
    "truckNumber": "Truck-103",
    "destination": "149 Shaw Boulevard, Caloocan",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-100",
    "orderId": "ORD-060",
    "driver": "Renato Flores",
    "truckNumber": "Truck-104",
    "destination": "159 Congressional Avenue, Sta. Rosa",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-101",
    "orderId": "ORD-070",
    "driver": "Carlos Mendoza",
    "truckNumber": "Truck-105",
    "destination": "169 Shaw Boulevard, Caloocan",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-102",
    "orderId": "ORD-080",
    "driver": "Roberto Santos",
    "truckNumber": "Truck-106",
    "destination": "179 Congressional Avenue, Sta. Rosa",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-103",
    "orderId": "ORD-090",
    "driver": "Juan Dela Cruz",
    "truckNumber": "Truck-107",
    "destination": "189 Shaw Boulevard, Caloocan",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-104",
    "orderId": "ORD-100",
    "driver": "Maria Garcia",
    "truckNumber": "Truck-108",
    "destination": "199 Congressional Avenue, Sta. Rosa",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  },
  {
    "id": "DEL-105",
    "orderId": "ORD-110",
    "driver": "Pedro Reyes",
    "truckNumber": "Truck-109",
    "destination": "209 Shaw Boulevard, Caloocan",
    "status": "failed",
    "location": "Cancelled before dispatch",
    "currentStep": 0,
    "currentLocation": {
      "x": 0,
      "y": 0
    },
    "trafficLevel": "low",
    "predictedDelay": false,
    "routeEfficiencyScore": 0,
    "notes": "Cancelled client-presentation simulated delivery"
  }
];

// Initial mock users - solo account for capstone
export const initialUsers: User[] = [
  { id: '1', username: 'admin', role: 'admin', name: 'Administrator', password: 'admin123' }
];

// Analytics mock data
export const monthlySalesData = [
  {
    "month": "2025-11",
    "sales": 239030,
    "orders": 8
  },
  {
    "month": "2025-12",
    "sales": 242900,
    "orders": 9
  },
  {
    "month": "2026-01",
    "sales": 435580,
    "orders": 15
  },
  {
    "month": "2026-02",
    "sales": 416520,
    "orders": 15
  },
  {
    "month": "2026-03",
    "sales": 392455,
    "orders": 14
  },
  {
    "month": "2026-04",
    "sales": 389515,
    "orders": 14
  },
  {
    "month": "2026-05",
    "sales": 432935,
    "orders": 14
  },
  {
    "month": "2026-06",
    "sales": 349050,
    "orders": 14
  }
];

export const topItemsData = [
  {
    "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
    "quantity": 230,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Frame 3x3 inch - Bronze Finish",
    "quantity": 220,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Seal Strip",
    "quantity": 210,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
    "quantity": 210,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
    "quantity": 190,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Flat Bar 1 inch",
    "quantity": 180,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
    "quantity": 180,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Frame 2x4 inch - Bronze Finish",
    "quantity": 170,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Profile L-Shape",
    "quantity": 140,
    "category": "aluminum"
  },
  {
    "name": "Aluminum Angle Bar 2x2",
    "quantity": 130,
    "category": "aluminum"
  }
];

export const fastMovingItems = [
  {
    "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
    "stock": 230,
    "threshold": 50,
    "status": "healthy"
  },
  {
    "name": "Aluminum Frame 3x3 inch - Bronze Finish",
    "stock": 220,
    "threshold": 50,
    "status": "healthy"
  },
  {
    "name": "Aluminum Seal Strip",
    "stock": 210,
    "threshold": 50,
    "status": "healthy"
  },
  {
    "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
    "stock": 210,
    "threshold": 50,
    "status": "healthy"
  },
  {
    "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
    "stock": 190,
    "threshold": 50,
    "status": "healthy"
  },
  {
    "name": "Aluminum Flat Bar 1 inch",
    "stock": 180,
    "threshold": 50,
    "status": "healthy"
  },
  {
    "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
    "stock": 180,
    "threshold": 50,
    "status": "healthy"
  },
  {
    "name": "Aluminum Frame 2x4 inch - Bronze Finish",
    "stock": 170,
    "threshold": 50,
    "status": "healthy"
  }
];

export const slowMovingItems = [
  {
    "name": "Clear Float Glass 4mm",
    "stock": 0,
    "threshold": 50,
    "status": "critical"
  },
  {
    "name": "Sliding Door Glass Panel",
    "stock": 0,
    "threshold": 15,
    "status": "critical"
  },
  {
    "name": "Aluminum Lockset Sliding",
    "stock": 0,
    "threshold": 20,
    "status": "critical"
  },
  {
    "name": "Tinted Glass Bronze 6mm - Lot B",
    "stock": 0,
    "threshold": 32,
    "status": "critical"
  },
  {
    "name": "Aluminum Handle Standard - Bronze Finish",
    "stock": 0,
    "threshold": 35,
    "status": "critical"
  },
  {
    "name": "Frosted Glass 8mm - Commercial Grade",
    "stock": 0,
    "threshold": 26,
    "status": "critical"
  },
  {
    "name": "Mirror 6mm",
    "stock": 17,
    "threshold": 25,
    "status": "critical"
  },
  {
    "name": "Tinted Glass Gray 6mm - Lot B",
    "stock": 24,
    "threshold": 32,
    "status": "critical"
  }
];

// Transaction history
export const transactionHistory: Transaction[] = [
  {
    "id": "TXN-001",
    "type": "sale",
    "reference": "ORD-001",
    "items": [
      {
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "amount": 950
      }
    ],
    "total": 950,
    "date": "2026-01-01",
    "status": "pending"
  },
  {
    "id": "TXN-002",
    "type": "sale",
    "reference": "ORD-002",
    "items": [
      {
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "amount": 3900
      },
      {
        "name": "Mirror 5mm",
        "quantity": 10,
        "amount": 7750
      }
    ],
    "total": 11650,
    "date": "2026-02-04",
    "status": "completed"
  },
  {
    "id": "TXN-003",
    "type": "sale",
    "reference": "ORD-003",
    "items": [
      {
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "amount": 7680
      },
      {
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "amount": 37675
      },
      {
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "amount": 6300
      }
    ],
    "total": 51655,
    "date": "2026-03-07",
    "status": "completed"
  },
  {
    "id": "TXN-004",
    "type": "sale",
    "reference": "ORD-004",
    "items": [
      {
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "amount": 5950
      }
    ],
    "total": 5950,
    "date": "2026-04-10",
    "status": "pending"
  },
  {
    "id": "TXN-005",
    "type": "sale",
    "reference": "ORD-005",
    "items": [
      {
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "amount": 17490
      },
      {
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "amount": 6110
      }
    ],
    "total": 23600,
    "date": "2026-05-13",
    "status": "pending"
  },
  {
    "id": "TXN-006",
    "type": "sale",
    "reference": "ORD-006",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "amount": 3710
      },
      {
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "amount": 5320
      },
      {
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "amount": 6930
      }
    ],
    "total": 15960,
    "date": "2026-06-16",
    "status": "pending"
  },
  {
    "id": "TXN-007",
    "type": "sale",
    "reference": "ORD-007",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "amount": 2640
      }
    ],
    "total": 2640,
    "date": "2026-07-19",
    "status": "cancelled"
  },
  {
    "id": "TXN-008",
    "type": "sale",
    "reference": "ORD-008",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "amount": 5670
      },
      {
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "amount": 9680
      }
    ],
    "total": 15350,
    "date": "2026-01-22",
    "status": "completed"
  },
  {
    "id": "TXN-009",
    "type": "sale",
    "reference": "ORD-009",
    "items": [
      {
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "amount": 13500
      },
      {
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "amount": 10540
      },
      {
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "amount": 31680
      }
    ],
    "total": 55720,
    "date": "2026-02-25",
    "status": "pending"
  },
  {
    "id": "TXN-010",
    "type": "sale",
    "reference": "ORD-010",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "amount": 5500
      }
    ],
    "total": 5500,
    "date": "2026-03-01",
    "status": "completed"
  },
  {
    "id": "TXN-011",
    "type": "sale",
    "reference": "ORD-011",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "amount": 6180
      },
      {
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "amount": 23275
      }
    ],
    "total": 29455,
    "date": "2026-04-04",
    "status": "pending"
  },
  {
    "id": "TXN-012",
    "type": "sale",
    "reference": "ORD-012",
    "items": [
      {
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "amount": 17420
      },
      {
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "amount": 16300
      },
      {
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "amount": 1170
      }
    ],
    "total": 34890,
    "date": "2026-05-07",
    "status": "pending"
  },
  {
    "id": "TXN-013",
    "type": "sale",
    "reference": "ORD-013",
    "items": [
      {
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "amount": 27440
      }
    ],
    "total": 27440,
    "date": "2026-06-10",
    "status": "pending"
  },
  {
    "id": "TXN-014",
    "type": "sale",
    "reference": "ORD-014",
    "items": [
      {
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "amount": 18450
      },
      {
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "amount": 15840
      }
    ],
    "total": 34290,
    "date": "2026-07-13",
    "status": "cancelled"
  },
  {
    "id": "TXN-015",
    "type": "sale",
    "reference": "ORD-015",
    "items": [
      {
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "amount": 45600
      },
      {
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "amount": 12650
      },
      {
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "amount": 2220
      }
    ],
    "total": 60470,
    "date": "2026-01-16",
    "status": "completed"
  },
  {
    "id": "TXN-016",
    "type": "sale",
    "reference": "ORD-016",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "amount": 10370
      }
    ],
    "total": 10370,
    "date": "2026-02-19",
    "status": "completed"
  },
  {
    "id": "TXN-017",
    "type": "sale",
    "reference": "ORD-017",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "amount": 7380
      },
      {
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "amount": 33250
      }
    ],
    "total": 40630,
    "date": "2026-03-22",
    "status": "pending"
  },
  {
    "id": "TXN-018",
    "type": "sale",
    "reference": "ORD-018",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "amount": 13490
      },
      {
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "amount": 1290
      },
      {
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "amount": 17145
      }
    ],
    "total": 31925,
    "date": "2026-04-25",
    "status": "pending"
  },
  {
    "id": "TXN-019",
    "type": "sale",
    "reference": "ORD-019",
    "items": [
      {
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "amount": 27800
      }
    ],
    "total": 27800,
    "date": "2026-05-01",
    "status": "pending"
  },
  {
    "id": "TXN-020",
    "type": "sale",
    "reference": "ORD-020",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "amount": 12180
      },
      {
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "amount": 6160
      }
    ],
    "total": 18340,
    "date": "2026-06-04",
    "status": "pending"
  },
  {
    "id": "TXN-021",
    "type": "sale",
    "reference": "ORD-021",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "amount": 12210
      },
      {
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "amount": 6325
      },
      {
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "amount": 8460
      }
    ],
    "total": 26995,
    "date": "2026-07-07",
    "status": "cancelled"
  },
  {
    "id": "TXN-022",
    "type": "sale",
    "reference": "ORD-022",
    "items": [
      {
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "amount": 29325
      }
    ],
    "total": 29325,
    "date": "2026-01-10",
    "status": "completed"
  },
  {
    "id": "TXN-023",
    "type": "sale",
    "reference": "ORD-023",
    "items": [
      {
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "amount": 48000
      },
      {
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "amount": 4060
      }
    ],
    "total": 52060,
    "date": "2026-02-13",
    "status": "completed"
  },
  {
    "id": "TXN-024",
    "type": "sale",
    "reference": "ORD-024",
    "items": [
      {
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "amount": 31750
      },
      {
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "amount": 12520
      },
      {
        "name": "Mirror 6mm",
        "quantity": 15,
        "amount": 13050
      }
    ],
    "total": 57320,
    "date": "2026-03-16",
    "status": "completed"
  },
  {
    "id": "TXN-025",
    "type": "sale",
    "reference": "ORD-025",
    "items": [
      {
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "amount": 950
      }
    ],
    "total": 950,
    "date": "2026-04-19",
    "status": "pending"
  },
  {
    "id": "TXN-026",
    "type": "sale",
    "reference": "ORD-026",
    "items": [
      {
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "amount": 3900
      },
      {
        "name": "Mirror 5mm",
        "quantity": 10,
        "amount": 7750
      }
    ],
    "total": 11650,
    "date": "2026-05-22",
    "status": "pending"
  },
  {
    "id": "TXN-027",
    "type": "sale",
    "reference": "ORD-027",
    "items": [
      {
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "amount": 7680
      },
      {
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "amount": 37675
      },
      {
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "amount": 6300
      }
    ],
    "total": 51655,
    "date": "2026-06-25",
    "status": "pending"
  },
  {
    "id": "TXN-028",
    "type": "sale",
    "reference": "ORD-028",
    "items": [
      {
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "amount": 5950
      }
    ],
    "total": 5950,
    "date": "2026-07-01",
    "status": "cancelled"
  },
  {
    "id": "TXN-029",
    "type": "sale",
    "reference": "ORD-029",
    "items": [
      {
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "amount": 17490
      },
      {
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "amount": 6110
      }
    ],
    "total": 23600,
    "date": "2026-01-04",
    "status": "completed"
  },
  {
    "id": "TXN-030",
    "type": "sale",
    "reference": "ORD-030",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "amount": 3710
      },
      {
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "amount": 5320
      },
      {
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "amount": 6930
      }
    ],
    "total": 15960,
    "date": "2026-02-07",
    "status": "completed"
  },
  {
    "id": "TXN-031",
    "type": "sale",
    "reference": "ORD-031",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "amount": 2640
      }
    ],
    "total": 2640,
    "date": "2026-03-10",
    "status": "completed"
  },
  {
    "id": "TXN-032",
    "type": "sale",
    "reference": "ORD-032",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "amount": 5670
      },
      {
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "amount": 9680
      }
    ],
    "total": 15350,
    "date": "2026-04-13",
    "status": "pending"
  },
  {
    "id": "TXN-033",
    "type": "sale",
    "reference": "ORD-033",
    "items": [
      {
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "amount": 13500
      },
      {
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "amount": 10540
      },
      {
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "amount": 31680
      }
    ],
    "total": 55720,
    "date": "2026-05-16",
    "status": "pending"
  },
  {
    "id": "TXN-034",
    "type": "sale",
    "reference": "ORD-034",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "amount": 5500
      }
    ],
    "total": 5500,
    "date": "2026-06-19",
    "status": "pending"
  },
  {
    "id": "TXN-035",
    "type": "sale",
    "reference": "ORD-035",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "amount": 6180
      },
      {
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "amount": 23275
      }
    ],
    "total": 29455,
    "date": "2026-07-22",
    "status": "cancelled"
  },
  {
    "id": "TXN-036",
    "type": "sale",
    "reference": "ORD-036",
    "items": [
      {
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "amount": 17420
      },
      {
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "amount": 16300
      },
      {
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "amount": 1170
      }
    ],
    "total": 34890,
    "date": "2026-01-25",
    "status": "completed"
  },
  {
    "id": "TXN-037",
    "type": "sale",
    "reference": "ORD-037",
    "items": [
      {
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "amount": 27440
      }
    ],
    "total": 27440,
    "date": "2026-02-01",
    "status": "completed"
  },
  {
    "id": "TXN-038",
    "type": "sale",
    "reference": "ORD-038",
    "items": [
      {
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "amount": 18450
      },
      {
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "amount": 15840
      }
    ],
    "total": 34290,
    "date": "2026-03-04",
    "status": "completed"
  },
  {
    "id": "TXN-039",
    "type": "sale",
    "reference": "ORD-039",
    "items": [
      {
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "amount": 45600
      },
      {
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "amount": 12650
      },
      {
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "amount": 2220
      }
    ],
    "total": 60470,
    "date": "2026-04-07",
    "status": "pending"
  },
  {
    "id": "TXN-040",
    "type": "sale",
    "reference": "ORD-040",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "amount": 10370
      }
    ],
    "total": 10370,
    "date": "2026-05-10",
    "status": "pending"
  },
  {
    "id": "TXN-041",
    "type": "sale",
    "reference": "ORD-041",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "amount": 7380
      },
      {
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "amount": 33250
      }
    ],
    "total": 40630,
    "date": "2026-06-13",
    "status": "pending"
  },
  {
    "id": "TXN-042",
    "type": "sale",
    "reference": "ORD-042",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "amount": 13490
      },
      {
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "amount": 1290
      },
      {
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "amount": 17145
      }
    ],
    "total": 31925,
    "date": "2026-07-16",
    "status": "cancelled"
  },
  {
    "id": "TXN-043",
    "type": "sale",
    "reference": "ORD-043",
    "items": [
      {
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "amount": 27800
      }
    ],
    "total": 27800,
    "date": "2026-01-19",
    "status": "completed"
  },
  {
    "id": "TXN-044",
    "type": "sale",
    "reference": "ORD-044",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "amount": 12180
      },
      {
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "amount": 6160
      }
    ],
    "total": 18340,
    "date": "2026-02-22",
    "status": "completed"
  },
  {
    "id": "TXN-045",
    "type": "sale",
    "reference": "ORD-045",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "amount": 12210
      },
      {
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "amount": 6325
      },
      {
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "amount": 8460
      }
    ],
    "total": 26995,
    "date": "2026-03-25",
    "status": "completed"
  },
  {
    "id": "TXN-046",
    "type": "sale",
    "reference": "ORD-046",
    "items": [
      {
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "amount": 29325
      }
    ],
    "total": 29325,
    "date": "2026-04-01",
    "status": "pending"
  },
  {
    "id": "TXN-047",
    "type": "sale",
    "reference": "ORD-047",
    "items": [
      {
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "amount": 48000
      },
      {
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "amount": 4060
      }
    ],
    "total": 52060,
    "date": "2026-05-04",
    "status": "pending"
  },
  {
    "id": "TXN-048",
    "type": "sale",
    "reference": "ORD-048",
    "items": [
      {
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "amount": 31750
      },
      {
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "amount": 12520
      },
      {
        "name": "Mirror 6mm",
        "quantity": 15,
        "amount": 13050
      }
    ],
    "total": 57320,
    "date": "2026-06-07",
    "status": "pending"
  },
  {
    "id": "TXN-049",
    "type": "sale",
    "reference": "ORD-049",
    "items": [
      {
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "amount": 950
      }
    ],
    "total": 950,
    "date": "2026-07-10",
    "status": "cancelled"
  },
  {
    "id": "TXN-050",
    "type": "sale",
    "reference": "ORD-050",
    "items": [
      {
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "amount": 3900
      },
      {
        "name": "Mirror 5mm",
        "quantity": 10,
        "amount": 7750
      }
    ],
    "total": 11650,
    "date": "2026-01-13",
    "status": "completed"
  },
  {
    "id": "TXN-051",
    "type": "sale",
    "reference": "ORD-051",
    "items": [
      {
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "amount": 7680
      },
      {
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "amount": 37675
      },
      {
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "amount": 6300
      }
    ],
    "total": 51655,
    "date": "2026-02-16",
    "status": "completed"
  },
  {
    "id": "TXN-052",
    "type": "sale",
    "reference": "ORD-052",
    "items": [
      {
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "amount": 5950
      }
    ],
    "total": 5950,
    "date": "2026-03-19",
    "status": "completed"
  },
  {
    "id": "TXN-053",
    "type": "sale",
    "reference": "ORD-053",
    "items": [
      {
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "amount": 17490
      },
      {
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "amount": 6110
      }
    ],
    "total": 23600,
    "date": "2026-04-22",
    "status": "pending"
  },
  {
    "id": "TXN-054",
    "type": "sale",
    "reference": "ORD-054",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "amount": 3710
      },
      {
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "amount": 5320
      },
      {
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "amount": 6930
      }
    ],
    "total": 15960,
    "date": "2026-05-25",
    "status": "pending"
  },
  {
    "id": "TXN-055",
    "type": "sale",
    "reference": "ORD-055",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "amount": 2640
      }
    ],
    "total": 2640,
    "date": "2026-06-01",
    "status": "pending"
  },
  {
    "id": "TXN-056",
    "type": "sale",
    "reference": "ORD-056",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "amount": 5670
      },
      {
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "amount": 9680
      }
    ],
    "total": 15350,
    "date": "2026-07-04",
    "status": "cancelled"
  },
  {
    "id": "TXN-057",
    "type": "sale",
    "reference": "ORD-057",
    "items": [
      {
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "amount": 13500
      },
      {
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "amount": 10540
      },
      {
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "amount": 31680
      }
    ],
    "total": 55720,
    "date": "2026-01-07",
    "status": "pending"
  },
  {
    "id": "TXN-058",
    "type": "sale",
    "reference": "ORD-058",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "amount": 5500
      }
    ],
    "total": 5500,
    "date": "2026-02-10",
    "status": "completed"
  },
  {
    "id": "TXN-059",
    "type": "sale",
    "reference": "ORD-059",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "amount": 6180
      },
      {
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "amount": 23275
      }
    ],
    "total": 29455,
    "date": "2026-03-13",
    "status": "completed"
  },
  {
    "id": "TXN-060",
    "type": "sale",
    "reference": "ORD-060",
    "items": [
      {
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "amount": 17420
      },
      {
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "amount": 16300
      },
      {
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "amount": 1170
      }
    ],
    "total": 34890,
    "date": "2026-04-16",
    "status": "pending"
  },
  {
    "id": "TXN-061",
    "type": "sale",
    "reference": "ORD-061",
    "items": [
      {
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "amount": 27440
      }
    ],
    "total": 27440,
    "date": "2026-05-19",
    "status": "pending"
  },
  {
    "id": "TXN-062",
    "type": "sale",
    "reference": "ORD-062",
    "items": [
      {
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "amount": 18450
      },
      {
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "amount": 15840
      }
    ],
    "total": 34290,
    "date": "2026-06-22",
    "status": "pending"
  },
  {
    "id": "TXN-063",
    "type": "sale",
    "reference": "ORD-063",
    "items": [
      {
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "amount": 45600
      },
      {
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "amount": 12650
      },
      {
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "amount": 2220
      }
    ],
    "total": 60470,
    "date": "2026-07-25",
    "status": "cancelled"
  },
  {
    "id": "TXN-064",
    "type": "sale",
    "reference": "ORD-064",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "amount": 10370
      }
    ],
    "total": 10370,
    "date": "2026-01-01",
    "status": "completed"
  },
  {
    "id": "TXN-065",
    "type": "sale",
    "reference": "ORD-065",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "amount": 7380
      },
      {
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "amount": 33250
      }
    ],
    "total": 40630,
    "date": "2026-02-04",
    "status": "pending"
  },
  {
    "id": "TXN-066",
    "type": "sale",
    "reference": "ORD-066",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "amount": 13490
      },
      {
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "amount": 1290
      },
      {
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "amount": 17145
      }
    ],
    "total": 31925,
    "date": "2026-03-07",
    "status": "completed"
  },
  {
    "id": "TXN-067",
    "type": "sale",
    "reference": "ORD-067",
    "items": [
      {
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "amount": 27800
      }
    ],
    "total": 27800,
    "date": "2026-04-10",
    "status": "pending"
  },
  {
    "id": "TXN-068",
    "type": "sale",
    "reference": "ORD-068",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "amount": 12180
      },
      {
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "amount": 6160
      }
    ],
    "total": 18340,
    "date": "2026-05-13",
    "status": "pending"
  },
  {
    "id": "TXN-069",
    "type": "sale",
    "reference": "ORD-069",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "amount": 12210
      },
      {
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "amount": 6325
      },
      {
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "amount": 8460
      }
    ],
    "total": 26995,
    "date": "2026-06-16",
    "status": "pending"
  },
  {
    "id": "TXN-070",
    "type": "sale",
    "reference": "ORD-070",
    "items": [
      {
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "amount": 29325
      }
    ],
    "total": 29325,
    "date": "2026-07-19",
    "status": "cancelled"
  },
  {
    "id": "TXN-071",
    "type": "sale",
    "reference": "ORD-071",
    "items": [
      {
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "amount": 48000
      },
      {
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "amount": 4060
      }
    ],
    "total": 52060,
    "date": "2026-01-22",
    "status": "completed"
  },
  {
    "id": "TXN-072",
    "type": "sale",
    "reference": "ORD-072",
    "items": [
      {
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "amount": 31750
      },
      {
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "amount": 12520
      },
      {
        "name": "Mirror 6mm",
        "quantity": 15,
        "amount": 13050
      }
    ],
    "total": 57320,
    "date": "2026-02-25",
    "status": "completed"
  },
  {
    "id": "TXN-073",
    "type": "sale",
    "reference": "ORD-073",
    "items": [
      {
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "amount": 950
      }
    ],
    "total": 950,
    "date": "2026-03-01",
    "status": "pending"
  },
  {
    "id": "TXN-074",
    "type": "sale",
    "reference": "ORD-074",
    "items": [
      {
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "amount": 3900
      },
      {
        "name": "Mirror 5mm",
        "quantity": 10,
        "amount": 7750
      }
    ],
    "total": 11650,
    "date": "2026-04-04",
    "status": "pending"
  },
  {
    "id": "TXN-075",
    "type": "sale",
    "reference": "ORD-075",
    "items": [
      {
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "amount": 7680
      },
      {
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "amount": 37675
      },
      {
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "amount": 6300
      }
    ],
    "total": 51655,
    "date": "2026-05-07",
    "status": "pending"
  },
  {
    "id": "TXN-076",
    "type": "sale",
    "reference": "ORD-076",
    "items": [
      {
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "amount": 5950
      }
    ],
    "total": 5950,
    "date": "2026-06-10",
    "status": "pending"
  },
  {
    "id": "TXN-077",
    "type": "sale",
    "reference": "ORD-077",
    "items": [
      {
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "amount": 17490
      },
      {
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "amount": 6110
      }
    ],
    "total": 23600,
    "date": "2026-07-13",
    "status": "cancelled"
  },
  {
    "id": "TXN-078",
    "type": "sale",
    "reference": "ORD-078",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "amount": 3710
      },
      {
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "amount": 5320
      },
      {
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "amount": 6930
      }
    ],
    "total": 15960,
    "date": "2026-01-16",
    "status": "completed"
  },
  {
    "id": "TXN-079",
    "type": "sale",
    "reference": "ORD-079",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "amount": 2640
      }
    ],
    "total": 2640,
    "date": "2026-02-19",
    "status": "completed"
  },
  {
    "id": "TXN-080",
    "type": "sale",
    "reference": "ORD-080",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "amount": 5670
      },
      {
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "amount": 9680
      }
    ],
    "total": 15350,
    "date": "2026-03-22",
    "status": "completed"
  },
  {
    "id": "TXN-081",
    "type": "sale",
    "reference": "ORD-081",
    "items": [
      {
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "amount": 13500
      },
      {
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "amount": 10540
      },
      {
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "amount": 31680
      }
    ],
    "total": 55720,
    "date": "2026-04-25",
    "status": "pending"
  },
  {
    "id": "TXN-082",
    "type": "sale",
    "reference": "ORD-082",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "amount": 5500
      }
    ],
    "total": 5500,
    "date": "2026-05-01",
    "status": "pending"
  },
  {
    "id": "TXN-083",
    "type": "sale",
    "reference": "ORD-083",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "amount": 6180
      },
      {
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "amount": 23275
      }
    ],
    "total": 29455,
    "date": "2026-06-04",
    "status": "pending"
  },
  {
    "id": "TXN-084",
    "type": "sale",
    "reference": "ORD-084",
    "items": [
      {
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "amount": 17420
      },
      {
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "amount": 16300
      },
      {
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "amount": 1170
      }
    ],
    "total": 34890,
    "date": "2026-07-07",
    "status": "cancelled"
  },
  {
    "id": "TXN-085",
    "type": "sale",
    "reference": "ORD-085",
    "items": [
      {
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "amount": 27440
      }
    ],
    "total": 27440,
    "date": "2026-01-10",
    "status": "completed"
  },
  {
    "id": "TXN-086",
    "type": "sale",
    "reference": "ORD-086",
    "items": [
      {
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "amount": 18450
      },
      {
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "amount": 15840
      }
    ],
    "total": 34290,
    "date": "2026-02-13",
    "status": "completed"
  },
  {
    "id": "TXN-087",
    "type": "sale",
    "reference": "ORD-087",
    "items": [
      {
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "amount": 45600
      },
      {
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "amount": 12650
      },
      {
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "amount": 2220
      }
    ],
    "total": 60470,
    "date": "2026-03-16",
    "status": "completed"
  },
  {
    "id": "TXN-088",
    "type": "sale",
    "reference": "ORD-088",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "amount": 10370
      }
    ],
    "total": 10370,
    "date": "2026-04-19",
    "status": "pending"
  },
  {
    "id": "TXN-089",
    "type": "sale",
    "reference": "ORD-089",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "amount": 7380
      },
      {
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "amount": 33250
      }
    ],
    "total": 40630,
    "date": "2026-05-22",
    "status": "pending"
  },
  {
    "id": "TXN-090",
    "type": "sale",
    "reference": "ORD-090",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "amount": 13490
      },
      {
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "amount": 1290
      },
      {
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "amount": 17145
      }
    ],
    "total": 31925,
    "date": "2026-06-25",
    "status": "pending"
  },
  {
    "id": "TXN-091",
    "type": "sale",
    "reference": "ORD-091",
    "items": [
      {
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "amount": 27800
      }
    ],
    "total": 27800,
    "date": "2026-07-01",
    "status": "cancelled"
  },
  {
    "id": "TXN-092",
    "type": "sale",
    "reference": "ORD-092",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "amount": 12180
      },
      {
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "amount": 6160
      }
    ],
    "total": 18340,
    "date": "2026-01-04",
    "status": "completed"
  },
  {
    "id": "TXN-093",
    "type": "sale",
    "reference": "ORD-093",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "amount": 12210
      },
      {
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "amount": 6325
      },
      {
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "amount": 8460
      }
    ],
    "total": 26995,
    "date": "2026-02-07",
    "status": "completed"
  },
  {
    "id": "TXN-094",
    "type": "sale",
    "reference": "ORD-094",
    "items": [
      {
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "amount": 29325
      }
    ],
    "total": 29325,
    "date": "2026-03-10",
    "status": "completed"
  },
  {
    "id": "TXN-095",
    "type": "sale",
    "reference": "ORD-095",
    "items": [
      {
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "amount": 48000
      },
      {
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "amount": 4060
      }
    ],
    "total": 52060,
    "date": "2026-04-13",
    "status": "pending"
  },
  {
    "id": "TXN-096",
    "type": "sale",
    "reference": "ORD-096",
    "items": [
      {
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "amount": 31750
      },
      {
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "amount": 12520
      },
      {
        "name": "Mirror 6mm",
        "quantity": 15,
        "amount": 13050
      }
    ],
    "total": 57320,
    "date": "2026-05-16",
    "status": "pending"
  },
  {
    "id": "TXN-097",
    "type": "sale",
    "reference": "ORD-097",
    "items": [
      {
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "amount": 950
      }
    ],
    "total": 950,
    "date": "2026-06-19",
    "status": "pending"
  },
  {
    "id": "TXN-098",
    "type": "sale",
    "reference": "ORD-098",
    "items": [
      {
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "amount": 3900
      },
      {
        "name": "Mirror 5mm",
        "quantity": 10,
        "amount": 7750
      }
    ],
    "total": 11650,
    "date": "2026-07-22",
    "status": "cancelled"
  },
  {
    "id": "TXN-099",
    "type": "sale",
    "reference": "ORD-099",
    "items": [
      {
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "amount": 7680
      },
      {
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "amount": 37675
      },
      {
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "amount": 6300
      }
    ],
    "total": 51655,
    "date": "2026-01-25",
    "status": "completed"
  },
  {
    "id": "TXN-100",
    "type": "sale",
    "reference": "ORD-100",
    "items": [
      {
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "amount": 5950
      }
    ],
    "total": 5950,
    "date": "2026-02-01",
    "status": "completed"
  },
  {
    "id": "TXN-101",
    "type": "sale",
    "reference": "ORD-101",
    "items": [
      {
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "amount": 17490
      },
      {
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "amount": 6110
      }
    ],
    "total": 23600,
    "date": "2025-11-04",
    "status": "completed"
  },
  {
    "id": "TXN-102",
    "type": "sale",
    "reference": "ORD-102",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "amount": 3710
      },
      {
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "amount": 5320
      },
      {
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "amount": 6930
      }
    ],
    "total": 15960,
    "date": "2025-12-07",
    "status": "pending"
  },
  {
    "id": "TXN-103",
    "type": "sale",
    "reference": "ORD-103",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "amount": 2640
      }
    ],
    "total": 2640,
    "date": "2025-11-10",
    "status": "pending"
  },
  {
    "id": "TXN-104",
    "type": "sale",
    "reference": "ORD-104",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "amount": 5670
      },
      {
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "amount": 9680
      }
    ],
    "total": 15350,
    "date": "2025-12-13",
    "status": "pending"
  },
  {
    "id": "TXN-105",
    "type": "sale",
    "reference": "ORD-105",
    "items": [
      {
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "amount": 13500
      },
      {
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "amount": 10540
      },
      {
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "amount": 31680
      }
    ],
    "total": 55720,
    "date": "2025-11-16",
    "status": "cancelled"
  },
  {
    "id": "TXN-106",
    "type": "sale",
    "reference": "ORD-106",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "amount": 5500
      }
    ],
    "total": 5500,
    "date": "2025-12-19",
    "status": "completed"
  },
  {
    "id": "TXN-107",
    "type": "sale",
    "reference": "ORD-107",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "amount": 6180
      },
      {
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "amount": 23275
      }
    ],
    "total": 29455,
    "date": "2025-11-22",
    "status": "completed"
  },
  {
    "id": "TXN-108",
    "type": "sale",
    "reference": "ORD-108",
    "items": [
      {
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "amount": 17420
      },
      {
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "amount": 16300
      },
      {
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "amount": 1170
      }
    ],
    "total": 34890,
    "date": "2025-12-25",
    "status": "completed"
  },
  {
    "id": "TXN-109",
    "type": "sale",
    "reference": "ORD-109",
    "items": [
      {
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "amount": 27440
      }
    ],
    "total": 27440,
    "date": "2025-11-01",
    "status": "pending"
  },
  {
    "id": "TXN-110",
    "type": "sale",
    "reference": "ORD-110",
    "items": [
      {
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "amount": 18450
      },
      {
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "amount": 15840
      }
    ],
    "total": 34290,
    "date": "2025-12-04",
    "status": "pending"
  },
  {
    "id": "TXN-111",
    "type": "sale",
    "reference": "ORD-111",
    "items": [
      {
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "amount": 45600
      },
      {
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "amount": 12650
      },
      {
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "amount": 2220
      }
    ],
    "total": 60470,
    "date": "2025-11-07",
    "status": "pending"
  },
  {
    "id": "TXN-112",
    "type": "sale",
    "reference": "ORD-112",
    "items": [
      {
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "amount": 10370
      }
    ],
    "total": 10370,
    "date": "2025-12-10",
    "status": "cancelled"
  },
  {
    "id": "TXN-113",
    "type": "sale",
    "reference": "ORD-113",
    "items": [
      {
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "amount": 7380
      },
      {
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "amount": 33250
      }
    ],
    "total": 40630,
    "date": "2025-11-13",
    "status": "pending"
  },
  {
    "id": "TXN-114",
    "type": "sale",
    "reference": "ORD-114",
    "items": [
      {
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "amount": 13490
      },
      {
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "amount": 1290
      },
      {
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "amount": 17145
      }
    ],
    "total": 31925,
    "date": "2025-12-16",
    "status": "completed"
  },
  {
    "id": "TXN-115",
    "type": "sale",
    "reference": "ORD-115",
    "items": [
      {
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "amount": 27800
      }
    ],
    "total": 27800,
    "date": "2025-11-19",
    "status": "completed"
  },
  {
    "id": "TXN-116",
    "type": "sale",
    "reference": "ORD-116",
    "items": [
      {
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "amount": 12180
      },
      {
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "amount": 6160
      }
    ],
    "total": 18340,
    "date": "2025-12-22",
    "status": "pending"
  },
  {
    "id": "TXN-117",
    "type": "sale",
    "reference": "ORD-117",
    "items": [
      {
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "amount": 12210
      },
      {
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "amount": 6325
      },
      {
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "amount": 8460
      }
    ],
    "total": 26995,
    "date": "2025-11-25",
    "status": "pending"
  },
  {
    "id": "TXN-118",
    "type": "sale",
    "reference": "ORD-118",
    "items": [
      {
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "amount": 29325
      }
    ],
    "total": 29325,
    "date": "2025-12-01",
    "status": "pending"
  },
  {
    "id": "TXN-119",
    "type": "sale",
    "reference": "ORD-119",
    "items": [
      {
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "amount": 48000
      },
      {
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "amount": 4060
      }
    ],
    "total": 52060,
    "date": "2025-11-04",
    "status": "cancelled"
  },
  {
    "id": "TXN-120",
    "type": "sale",
    "reference": "ORD-120",
    "items": [
      {
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "amount": 31750
      },
      {
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "amount": 12520
      },
      {
        "name": "Mirror 6mm",
        "quantity": 15,
        "amount": 13050
      }
    ],
    "total": 57320,
    "date": "2025-12-07",
    "status": "completed"
  }
];

// Mock AI Recommendations
export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec-restock-mirror',
    type: 'restock',
    priority: 'high',
    title: 'Restock Mirror 6mm',
    description: 'AI predicts stockout in 5 days based on current demand of 3 units/week. Only 6 units remaining.',
    action: 'Order 15 units',
    estimatedImpact: 'Prevent ₱12,000 in lost sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-restock-dgu',
    type: 'restock',
    priority: 'high',
    title: 'Restock Double Glazed Unit',
    description: 'Stock critically low at 8 units. Average monthly demand is 20 units with increasing trend.',
    action: 'Order 24 units',
    estimatedImpact: 'Prevent ₱56,000 in lost sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-demand-frosted',
    type: 'demand',
    priority: 'medium',
    title: 'Increase Frosted Glass stock',
    description: 'AI detects 20% demand increase from 3 large orders this quarter. Recommended buffer.',
    action: 'Increase stock by 15 units',
    estimatedImpact: 'Capture ₱14,250 additional sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-demand-aluminum',
    type: 'demand',
    priority: 'medium',
    title: 'Increase Aluminum Sheet 2mm stock',
    description: 'AI detects 15% upward trend in aluminum orders. Only 10 sheets remaining.',
    action: 'Order 20 sheets',
    estimatedImpact: 'Capture ₱17,000 additional sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-pricing-high-demand',
    type: 'pricing',
    priority: 'low',
    title: 'Consider premium pricing for high-demand items',
    description: 'Reflective Glass, Laminated Glass, and Double Glazed Units showing sustained high demand.',
    action: 'Review pricing strategy',
    estimatedImpact: 'Potential 5-10% revenue increase',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-restock-lam',
    type: 'restock',
    priority: 'low',
    title: 'Restock Laminated Glass 6mm',
    description: 'Current stock at 18 units. Predicted demand of 25 units for next month.',
    action: 'Order 20 units',
    estimatedImpact: 'Maintain healthy stock levels',
    timestamp: new Date().toISOString()
  }
];