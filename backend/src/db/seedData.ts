/**
 * Seed data for Glassram Glass & Aluminum Supply
 * 120 Products, 360 Orders, 210 Deliveries, and Stock Movements
 */
import type { Product, StockMovement } from '../inventory/store.js';
import type { Order } from '../orders/store.js';
import type { Delivery } from '../delivery/store.js';

export const seedProducts: Product[] = [
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

export const seedOrders: Order[] = [
  {
    "id": "ORD-001",
    "referenceNumber": "SS-2026-00001",
    "customerName": "Aurelia Builders",
    "customerPhone": "0910-300-2000",
    "deliveryAddress": "100 Rizal Avenue, Manila",
    "deliveryDate": "2026-01-01",
    "items": [
      {
        "productId": "PRD-001",
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "lineTotal": 950
      }
    ],
    "subtotal": 950,
    "total": 950,
    "paidAmount": 475,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 142,
    "refundReason": "Client changed cut-size specification",
    "refundType": "partial",
    "createdAt": "2026-01-01T08:00:00",
    "updatedAt": "2026-01-01T08:00:00"
  },
  {
    "id": "ORD-002",
    "referenceNumber": "SS-2026-00002",
    "customerName": "Northbay Glass Works",
    "customerPhone": "0911-307-2019",
    "deliveryAddress": "101 Mabini Street, Pasig",
    "deliveryDate": "2026-02-04",
    "items": [
      {
        "productId": "PRD-006",
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "lineTotal": 3900
      },
      {
        "productId": "PRD-017",
        "name": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "lineTotal": 7750
      }
    ],
    "subtotal": 11650,
    "total": 11650,
    "paidAmount": 11650,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-02-04T09:07:00",
    "updatedAt": "2026-02-04T09:07:00"
  },
  {
    "id": "ORD-003",
    "referenceNumber": "SS-2026-00003",
    "customerName": "Mendoza Aluminum Supply",
    "customerPhone": "0912-314-2038",
    "deliveryAddress": "102 Quezon Avenue, Marikina",
    "deliveryDate": "2026-03-07",
    "items": [
      {
        "productId": "PRD-011",
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "lineTotal": 7680
      },
      {
        "productId": "PRD-022",
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "lineTotal": 37675
      },
      {
        "productId": "PRD-033",
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "lineTotal": 6300
      }
    ],
    "subtotal": 51655,
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-03-07T10:14:00",
    "updatedAt": "2026-03-07T10:14:00"
  },
  {
    "id": "ORD-004",
    "referenceNumber": "SS-2026-00004",
    "customerName": "San Pedro Construction",
    "customerPhone": "0913-321-2057",
    "deliveryAddress": "103 Ortigas Extension, Parañaque",
    "deliveryDate": "2026-04-10",
    "items": [
      {
        "productId": "PRD-016",
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "lineTotal": 5950
      }
    ],
    "subtotal": 5950,
    "total": 5950,
    "paidAmount": 5950,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-04-10T11:21:00",
    "updatedAt": "2026-04-10T11:21:00"
  },
  {
    "id": "ORD-005",
    "referenceNumber": "SS-2026-00005",
    "customerName": "Everline Interiors",
    "customerPhone": "0914-328-2076",
    "deliveryAddress": "104 EDSA Service Road, Antipolo",
    "deliveryDate": "2026-05-13",
    "items": [
      {
        "productId": "PRD-021",
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "lineTotal": 17490
      },
      {
        "productId": "PRD-032",
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "lineTotal": 6110
      }
    ],
    "subtotal": 23600,
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-05-13T12:28:00",
    "updatedAt": "2026-05-13T12:28:00"
  },
  {
    "id": "ORD-006",
    "referenceNumber": "SS-2026-00006",
    "customerName": "JRM Glass Center",
    "customerPhone": "0915-335-2095",
    "deliveryAddress": "105 Commerce Avenue, Bacoor",
    "deliveryDate": "2026-06-16",
    "items": [
      {
        "productId": "PRD-026",
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "lineTotal": 3710
      },
      {
        "productId": "PRD-037",
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "lineTotal": 5320
      },
      {
        "productId": "PRD-048",
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "lineTotal": 6930
      }
    ],
    "subtotal": 15960,
    "total": 15960,
    "paidAmount": 8778,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-06-16T13:35:00",
    "updatedAt": "2026-06-16T13:35:00"
  },
  {
    "id": "ORD-007",
    "referenceNumber": "SS-2026-00007",
    "customerName": "Prime Arc Developers",
    "customerPhone": "0916-342-2114",
    "deliveryAddress": "106 Industrial Road, San Pedro",
    "deliveryDate": "2026-07-19",
    "items": [
      {
        "productId": "PRD-031",
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "lineTotal": 2640
      }
    ],
    "subtotal": 2640,
    "total": 2640,
    "paidAmount": 2640,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-07-19T14:42:00",
    "updatedAt": "2026-07-19T14:42:00"
  },
  {
    "id": "ORD-008",
    "referenceNumber": "SS-2026-00008",
    "customerName": "Cavite Window Systems",
    "customerPhone": "0917-349-2133",
    "deliveryAddress": "107 National Highway, Quezon City",
    "deliveryDate": "2026-01-22",
    "items": [
      {
        "productId": "PRD-036",
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "lineTotal": 5670
      },
      {
        "productId": "PRD-047",
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "lineTotal": 9680
      }
    ],
    "subtotal": 15350,
    "total": 15350,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-01-22T15:49:00",
    "updatedAt": "2026-01-22T15:49:00"
  },
  {
    "id": "ORD-009",
    "referenceNumber": "SS-2026-00009",
    "customerName": "Lucena Home Builders",
    "customerPhone": "0918-356-2152",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-02-25",
    "items": [
      {
        "productId": "PRD-041",
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "lineTotal": 13500
      },
      {
        "productId": "PRD-052",
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "lineTotal": 10540
      },
      {
        "productId": "PRD-063",
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "lineTotal": 31680
      }
    ],
    "subtotal": 55720,
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-02-25T16:56:00",
    "updatedAt": "2026-02-25T16:56:00"
  },
  {
    "id": "ORD-010",
    "referenceNumber": "SS-2026-00010",
    "customerName": "Quezon Facade Studio",
    "customerPhone": "0919-363-2171",
    "deliveryAddress": "109 Shaw Boulevard, Caloocan",
    "deliveryDate": "2026-03-01",
    "items": [
      {
        "productId": "PRD-046",
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "lineTotal": 5500
      }
    ],
    "subtotal": 5500,
    "total": 5500,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-03-01T17:03:00",
    "updatedAt": "2026-03-01T17:03:00"
  },
  {
    "id": "ORD-011",
    "referenceNumber": "SS-2026-00011",
    "customerName": "BGC Fit-Out Group",
    "customerPhone": "0920-370-2190",
    "deliveryAddress": "110 C5 Road, Las Piñas",
    "deliveryDate": "2026-04-04",
    "items": [
      {
        "productId": "PRD-051",
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "lineTotal": 6180
      },
      {
        "productId": "PRD-062",
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "lineTotal": 23275
      }
    ],
    "subtotal": 29455,
    "total": 29455,
    "paidAmount": 16200,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-04-04T08:10:00",
    "updatedAt": "2026-04-04T08:10:00"
  },
  {
    "id": "ORD-012",
    "referenceNumber": "SS-2026-00012",
    "customerName": "Valenzuela Glass Depot",
    "customerPhone": "0921-377-2209",
    "deliveryAddress": "111 Aguinaldo Highway, Cavite City",
    "deliveryDate": "2026-05-07",
    "items": [
      {
        "productId": "PRD-056",
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "lineTotal": 17420
      },
      {
        "productId": "PRD-067",
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "lineTotal": 16300
      },
      {
        "productId": "PRD-078",
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "lineTotal": 1170
      }
    ],
    "subtotal": 34890,
    "total": 34890,
    "paidAmount": 34890,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-05-07T09:17:00",
    "updatedAt": "2026-05-07T09:17:00"
  },
  {
    "id": "ORD-013",
    "referenceNumber": "SS-2026-00013",
    "customerName": "Laguna Aluminum Works",
    "customerPhone": "0922-384-2228",
    "deliveryAddress": "112 Alabang-Zapote Road, Calamba",
    "deliveryDate": "2026-06-10",
    "items": [
      {
        "productId": "PRD-061",
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "lineTotal": 27440
      }
    ],
    "subtotal": 27440,
    "total": 27440,
    "paidAmount": 27440,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-06-10T10:24:00",
    "updatedAt": "2026-06-10T10:24:00"
  },
  {
    "id": "ORD-014",
    "referenceNumber": "SS-2026-00014",
    "customerName": "Rizal Door and Window",
    "customerPhone": "0923-391-2247",
    "deliveryAddress": "113 Marcos Highway, Malabon",
    "deliveryDate": "2026-07-13",
    "items": [
      {
        "productId": "PRD-066",
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "lineTotal": 18450
      },
      {
        "productId": "PRD-077",
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "lineTotal": 15840
      }
    ],
    "subtotal": 34290,
    "total": 34290,
    "paidAmount": 34290,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-07-13T11:31:00",
    "updatedAt": "2026-07-13T11:31:00"
  },
  {
    "id": "ORD-015",
    "referenceNumber": "SS-2026-00015",
    "customerName": "Makati Renovation Co.",
    "customerPhone": "0924-398-2266",
    "deliveryAddress": "114 MacArthur Highway, Makati",
    "deliveryDate": "2026-01-16",
    "items": [
      {
        "productId": "PRD-071",
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "lineTotal": 45600
      },
      {
        "productId": "PRD-082",
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "lineTotal": 12650
      },
      {
        "productId": "PRD-093",
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "lineTotal": 2220
      }
    ],
    "subtotal": 60470,
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-01-16T12:38:00",
    "updatedAt": "2026-01-16T12:38:00"
  },
  {
    "id": "ORD-016",
    "referenceNumber": "SS-2026-00016",
    "customerName": "Calamba Commercial Builders",
    "customerPhone": "0925-405-2285",
    "deliveryAddress": "115 Gil Puyat Avenue, Mandaluyong",
    "deliveryDate": "2026-02-19",
    "items": [
      {
        "productId": "PRD-076",
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "lineTotal": 10370
      }
    ],
    "subtotal": 10370,
    "total": 10370,
    "paidAmount": 5704,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-02-19T13:45:00",
    "updatedAt": "2026-02-19T13:45:00"
  },
  {
    "id": "ORD-017",
    "referenceNumber": "SS-2026-00017",
    "customerName": "Pasig Partition Systems",
    "customerPhone": "0926-412-2304",
    "deliveryAddress": "116 Ayala Avenue, Valenzuela",
    "deliveryDate": "2026-03-22",
    "items": [
      {
        "productId": "PRD-081",
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "lineTotal": 7380
      },
      {
        "productId": "PRD-092",
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "lineTotal": 33250
      }
    ],
    "subtotal": 40630,
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-03-22T14:52:00",
    "updatedAt": "2026-03-22T14:52:00"
  },
  {
    "id": "ORD-018",
    "referenceNumber": "SS-2026-00018",
    "customerName": "Caloocan Hardware Center",
    "customerPhone": "0927-419-2323",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-04-25",
    "items": [
      {
        "productId": "PRD-086",
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "lineTotal": 13490
      },
      {
        "productId": "PRD-097",
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "lineTotal": 1290
      },
      {
        "productId": "PRD-108",
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "lineTotal": 17145
      }
    ],
    "subtotal": 31925,
    "total": 31925,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-04-25T15:59:00",
    "updatedAt": "2026-04-25T15:59:00"
  },
  {
    "id": "ORD-019",
    "referenceNumber": "SS-2026-00019",
    "customerName": "Marikina Fabrication",
    "customerPhone": "0928-426-2342",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-05-01",
    "items": [
      {
        "productId": "PRD-091",
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "lineTotal": 27800
      }
    ],
    "subtotal": 27800,
    "total": 27800,
    "paidAmount": 13900,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-05-01T16:06:00",
    "updatedAt": "2026-05-01T16:06:00"
  },
  {
    "id": "ORD-020",
    "referenceNumber": "SS-2026-00020",
    "customerName": "Taguig Residential Builds",
    "customerPhone": "0929-433-2361",
    "deliveryAddress": "119 Congressional Avenue, Sta. Rosa",
    "deliveryDate": "2026-06-04",
    "items": [
      {
        "productId": "PRD-096",
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "lineTotal": 12180
      },
      {
        "productId": "PRD-107",
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "lineTotal": 6160
      }
    ],
    "subtotal": 18340,
    "total": 18340,
    "paidAmount": 18340,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-06-04T17:13:00",
    "updatedAt": "2026-06-04T17:13:00"
  },
  {
    "id": "ORD-021",
    "referenceNumber": "SS-2026-00021",
    "customerName": "Manila Skylight Studio",
    "customerPhone": "0930-440-2380",
    "deliveryAddress": "120 Rizal Avenue, Manila",
    "deliveryDate": "2026-07-07",
    "items": [
      {
        "productId": "PRD-101",
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "lineTotal": 12210
      },
      {
        "productId": "PRD-112",
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "lineTotal": 6325
      },
      {
        "productId": "PRD-003",
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "lineTotal": 8460
      }
    ],
    "subtotal": 26995,
    "total": 26995,
    "paidAmount": 14847,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-07-07T08:20:00",
    "updatedAt": "2026-07-07T08:20:00"
  },
  {
    "id": "ORD-022",
    "referenceNumber": "SS-2026-00022",
    "customerName": "Parañaque Modular Glass",
    "customerPhone": "0931-447-2399",
    "deliveryAddress": "121 Mabini Street, Pasig",
    "deliveryDate": "2026-01-10",
    "items": [
      {
        "productId": "PRD-106",
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "lineTotal": 29325
      }
    ],
    "subtotal": 29325,
    "total": 29325,
    "paidAmount": 29325,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-01-10T09:27:00",
    "updatedAt": "2026-01-10T09:27:00"
  },
  {
    "id": "ORD-023",
    "referenceNumber": "SS-2026-00023",
    "customerName": "Antipolo Home Concepts",
    "customerPhone": "0932-454-2418",
    "deliveryAddress": "122 Quezon Avenue, Marikina",
    "deliveryDate": "2026-02-13",
    "items": [
      {
        "productId": "PRD-111",
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "lineTotal": 48000
      },
      {
        "productId": "PRD-002",
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "lineTotal": 4060
      }
    ],
    "subtotal": 52060,
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-02-13T10:34:00",
    "updatedAt": "2026-02-13T10:34:00"
  },
  {
    "id": "ORD-024",
    "referenceNumber": "SS-2026-00024",
    "customerName": "Ortigas Office Fit-Out",
    "customerPhone": "0933-461-2437",
    "deliveryAddress": "123 Ortigas Extension, Parañaque",
    "deliveryDate": "2026-03-16",
    "items": [
      {
        "productId": "PRD-116",
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "lineTotal": 31750
      },
      {
        "productId": "PRD-007",
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "lineTotal": 12520
      },
      {
        "productId": "PRD-018",
        "name": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "lineTotal": 13050
      }
    ],
    "subtotal": 57320,
    "total": 57320,
    "paidAmount": 57320,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-03-16T11:41:00",
    "updatedAt": "2026-03-16T11:41:00"
  },
  {
    "id": "ORD-025",
    "referenceNumber": "SS-2026-00025",
    "customerName": "Las Piñas Aluminum Craft",
    "customerPhone": "0934-468-2456",
    "deliveryAddress": "124 EDSA Service Road, Antipolo",
    "deliveryDate": "2026-04-19",
    "items": [
      {
        "productId": "PRD-001",
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "lineTotal": 950
      }
    ],
    "subtotal": 950,
    "total": 950,
    "paidAmount": 950,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-04-19T12:48:00",
    "updatedAt": "2026-04-19T12:48:00"
  },
  {
    "id": "ORD-026",
    "referenceNumber": "SS-2026-00026",
    "customerName": "Fairview Glass Traders",
    "customerPhone": "0935-475-2475",
    "deliveryAddress": "125 Commerce Avenue, Bacoor",
    "deliveryDate": "2026-05-22",
    "items": [
      {
        "productId": "PRD-006",
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "lineTotal": 3900
      },
      {
        "productId": "PRD-017",
        "name": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "lineTotal": 7750
      }
    ],
    "subtotal": 11650,
    "total": 11650,
    "paidAmount": 6408,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-05-22T13:55:00",
    "updatedAt": "2026-05-22T13:55:00"
  },
  {
    "id": "ORD-027",
    "referenceNumber": "SS-2026-00027",
    "customerName": "Sta. Rosa Buildmart",
    "customerPhone": "0936-482-2494",
    "deliveryAddress": "126 Industrial Road, San Pedro",
    "deliveryDate": "2026-06-25",
    "items": [
      {
        "productId": "PRD-011",
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "lineTotal": 7680
      },
      {
        "productId": "PRD-022",
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "lineTotal": 37675
      },
      {
        "productId": "PRD-033",
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "lineTotal": 6300
      }
    ],
    "subtotal": 51655,
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-06-25T14:02:00",
    "updatedAt": "2026-06-25T14:02:00"
  },
  {
    "id": "ORD-028",
    "referenceNumber": "SS-2026-00028",
    "customerName": "Alabang Interior Works",
    "customerPhone": "0937-489-2513",
    "deliveryAddress": "127 National Highway, Quezon City",
    "deliveryDate": "2026-07-01",
    "items": [
      {
        "productId": "PRD-016",
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "lineTotal": 5950
      }
    ],
    "subtotal": 5950,
    "total": 5950,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-07-01T15:09:00",
    "updatedAt": "2026-07-01T15:09:00"
  },
  {
    "id": "ORD-029",
    "referenceNumber": "SS-2026-00029",
    "customerName": "Navotas Industrial Supply",
    "customerPhone": "0938-496-2532",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-01-04",
    "items": [
      {
        "productId": "PRD-021",
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "lineTotal": 17490
      },
      {
        "productId": "PRD-032",
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "lineTotal": 6110
      }
    ],
    "subtotal": 23600,
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-01-04T16:16:00",
    "updatedAt": "2026-01-04T16:16:00"
  },
  {
    "id": "ORD-030",
    "referenceNumber": "SS-2026-00030",
    "customerName": "Malabon Glasshouse",
    "customerPhone": "0939-503-2551",
    "deliveryAddress": "129 Shaw Boulevard, Caloocan",
    "deliveryDate": "2026-02-07",
    "items": [
      {
        "productId": "PRD-026",
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "lineTotal": 3710
      },
      {
        "productId": "PRD-037",
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "lineTotal": 5320
      },
      {
        "productId": "PRD-048",
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "lineTotal": 6930
      }
    ],
    "subtotal": 15960,
    "total": 15960,
    "paidAmount": 15960,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-02-07T17:23:00",
    "updatedAt": "2026-02-07T17:23:00"
  },
  {
    "id": "ORD-031",
    "referenceNumber": "SS-2026-00031",
    "customerName": "Aurelia Builders",
    "customerPhone": "0940-510-2570",
    "deliveryAddress": "130 C5 Road, Las Piñas",
    "deliveryDate": "2026-03-10",
    "items": [
      {
        "productId": "PRD-031",
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "lineTotal": 2640
      }
    ],
    "subtotal": 2640,
    "total": 2640,
    "paidAmount": 1452,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-03-10T08:30:00",
    "updatedAt": "2026-03-10T08:30:00"
  },
  {
    "id": "ORD-032",
    "referenceNumber": "SS-2026-00032",
    "customerName": "Northbay Glass Works",
    "customerPhone": "0941-517-2589",
    "deliveryAddress": "131 Aguinaldo Highway, Cavite City",
    "deliveryDate": "2026-04-13",
    "items": [
      {
        "productId": "PRD-036",
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "lineTotal": 5670
      },
      {
        "productId": "PRD-047",
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "lineTotal": 9680
      }
    ],
    "subtotal": 15350,
    "total": 15350,
    "paidAmount": 15350,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-04-13T09:37:00",
    "updatedAt": "2026-04-13T09:37:00"
  },
  {
    "id": "ORD-033",
    "referenceNumber": "SS-2026-00033",
    "customerName": "Mendoza Aluminum Supply",
    "customerPhone": "0942-524-2608",
    "deliveryAddress": "132 Alabang-Zapote Road, Calamba",
    "deliveryDate": "2026-05-16",
    "items": [
      {
        "productId": "PRD-041",
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "lineTotal": 13500
      },
      {
        "productId": "PRD-052",
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "lineTotal": 10540
      },
      {
        "productId": "PRD-063",
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "lineTotal": 31680
      }
    ],
    "subtotal": 55720,
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-05-16T10:44:00",
    "updatedAt": "2026-05-16T10:44:00"
  },
  {
    "id": "ORD-034",
    "referenceNumber": "SS-2026-00034",
    "customerName": "San Pedro Construction",
    "customerPhone": "0943-531-2627",
    "deliveryAddress": "133 Marcos Highway, Malabon",
    "deliveryDate": "2026-06-19",
    "items": [
      {
        "productId": "PRD-046",
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "lineTotal": 5500
      }
    ],
    "subtotal": 5500,
    "total": 5500,
    "paidAmount": 5500,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-06-19T11:51:00",
    "updatedAt": "2026-06-19T11:51:00"
  },
  {
    "id": "ORD-035",
    "referenceNumber": "SS-2026-00035",
    "customerName": "Everline Interiors",
    "customerPhone": "0944-538-2646",
    "deliveryAddress": "134 MacArthur Highway, Makati",
    "deliveryDate": "2026-07-22",
    "items": [
      {
        "productId": "PRD-051",
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "lineTotal": 6180
      },
      {
        "productId": "PRD-062",
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "lineTotal": 23275
      }
    ],
    "subtotal": 29455,
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-07-22T12:58:00",
    "updatedAt": "2026-07-22T12:58:00"
  },
  {
    "id": "ORD-036",
    "referenceNumber": "SS-2026-00036",
    "customerName": "JRM Glass Center",
    "customerPhone": "0945-545-2665",
    "deliveryAddress": "135 Gil Puyat Avenue, Mandaluyong",
    "deliveryDate": "2026-01-25",
    "items": [
      {
        "productId": "PRD-056",
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "lineTotal": 17420
      },
      {
        "productId": "PRD-067",
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "lineTotal": 16300
      },
      {
        "productId": "PRD-078",
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "lineTotal": 1170
      }
    ],
    "subtotal": 34890,
    "total": 34890,
    "paidAmount": 19190,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-01-25T13:05:00",
    "updatedAt": "2026-01-25T13:05:00"
  },
  {
    "id": "ORD-037",
    "referenceNumber": "SS-2026-00037",
    "customerName": "Prime Arc Developers",
    "customerPhone": "0946-552-2684",
    "deliveryAddress": "136 Ayala Avenue, Valenzuela",
    "deliveryDate": "2026-02-01",
    "items": [
      {
        "productId": "PRD-061",
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "lineTotal": 27440
      }
    ],
    "subtotal": 27440,
    "total": 27440,
    "paidAmount": 13720,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-02-01T14:12:00",
    "updatedAt": "2026-02-01T14:12:00"
  },
  {
    "id": "ORD-038",
    "referenceNumber": "SS-2026-00038",
    "customerName": "Cavite Window Systems",
    "customerPhone": "0947-559-2703",
    "deliveryAddress": "137 Katipunan Avenue, Muntinlupa",
    "deliveryDate": "2026-03-04",
    "items": [
      {
        "productId": "PRD-066",
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "lineTotal": 18450
      },
      {
        "productId": "PRD-077",
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "lineTotal": 15840
      }
    ],
    "subtotal": 34290,
    "total": 34290,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 5144,
    "refundReason": "Client changed cut-size specification",
    "refundType": "partial",
    "createdAt": "2026-03-04T15:19:00",
    "updatedAt": "2026-03-04T15:19:00"
  },
  {
    "id": "ORD-039",
    "referenceNumber": "SS-2026-00039",
    "customerName": "Lucena Home Builders",
    "customerPhone": "0948-566-2722",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-04-07",
    "items": [
      {
        "productId": "PRD-071",
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "lineTotal": 45600
      },
      {
        "productId": "PRD-082",
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "lineTotal": 12650
      },
      {
        "productId": "PRD-093",
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "lineTotal": 2220
      }
    ],
    "subtotal": 60470,
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-04-07T16:26:00",
    "updatedAt": "2026-04-07T16:26:00"
  },
  {
    "id": "ORD-040",
    "referenceNumber": "SS-2026-00040",
    "customerName": "Quezon Facade Studio",
    "customerPhone": "0949-573-2741",
    "deliveryAddress": "139 Congressional Avenue, Sta. Rosa",
    "deliveryDate": "2026-05-10",
    "items": [
      {
        "productId": "PRD-076",
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "lineTotal": 10370
      }
    ],
    "subtotal": 10370,
    "total": 10370,
    "paidAmount": 10370,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-05-10T17:33:00",
    "updatedAt": "2026-05-10T17:33:00"
  },
  {
    "id": "ORD-041",
    "referenceNumber": "SS-2026-00041",
    "customerName": "BGC Fit-Out Group",
    "customerPhone": "0950-580-2760",
    "deliveryAddress": "140 Rizal Avenue, Manila",
    "deliveryDate": "2026-06-13",
    "items": [
      {
        "productId": "PRD-081",
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "lineTotal": 7380
      },
      {
        "productId": "PRD-092",
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "lineTotal": 33250
      }
    ],
    "subtotal": 40630,
    "total": 40630,
    "paidAmount": 22346,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-06-13T08:40:00",
    "updatedAt": "2026-06-13T08:40:00"
  },
  {
    "id": "ORD-042",
    "referenceNumber": "SS-2026-00042",
    "customerName": "Valenzuela Glass Depot",
    "customerPhone": "0951-587-2779",
    "deliveryAddress": "141 Mabini Street, Pasig",
    "deliveryDate": "2026-07-16",
    "items": [
      {
        "productId": "PRD-086",
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "lineTotal": 13490
      },
      {
        "productId": "PRD-097",
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "lineTotal": 1290
      },
      {
        "productId": "PRD-108",
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "lineTotal": 17145
      }
    ],
    "subtotal": 31925,
    "total": 31925,
    "paidAmount": 31925,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-07-16T09:47:00",
    "updatedAt": "2026-07-16T09:47:00"
  },
  {
    "id": "ORD-043",
    "referenceNumber": "SS-2026-00043",
    "customerName": "Laguna Aluminum Works",
    "customerPhone": "0952-594-2798",
    "deliveryAddress": "142 Quezon Avenue, Marikina",
    "deliveryDate": "2026-01-19",
    "items": [
      {
        "productId": "PRD-091",
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "lineTotal": 27800
      }
    ],
    "subtotal": 27800,
    "total": 27800,
    "paidAmount": 27800,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-01-19T10:54:00",
    "updatedAt": "2026-01-19T10:54:00"
  },
  {
    "id": "ORD-044",
    "referenceNumber": "SS-2026-00044",
    "customerName": "Rizal Door and Window",
    "customerPhone": "0953-601-2817",
    "deliveryAddress": "143 Ortigas Extension, Parañaque",
    "deliveryDate": "2026-02-22",
    "items": [
      {
        "productId": "PRD-096",
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "lineTotal": 12180
      },
      {
        "productId": "PRD-107",
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "lineTotal": 6160
      }
    ],
    "subtotal": 18340,
    "total": 18340,
    "paidAmount": 18340,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-02-22T11:01:00",
    "updatedAt": "2026-02-22T11:01:00"
  },
  {
    "id": "ORD-045",
    "referenceNumber": "SS-2026-00045",
    "customerName": "Makati Renovation Co.",
    "customerPhone": "0954-608-2836",
    "deliveryAddress": "144 EDSA Service Road, Antipolo",
    "deliveryDate": "2026-03-25",
    "items": [
      {
        "productId": "PRD-101",
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "lineTotal": 12210
      },
      {
        "productId": "PRD-112",
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "lineTotal": 6325
      },
      {
        "productId": "PRD-003",
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "lineTotal": 8460
      }
    ],
    "subtotal": 26995,
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-03-25T12:08:00",
    "updatedAt": "2026-03-25T12:08:00"
  },
  {
    "id": "ORD-046",
    "referenceNumber": "SS-2026-00046",
    "customerName": "Calamba Commercial Builders",
    "customerPhone": "0955-615-2855",
    "deliveryAddress": "145 Commerce Avenue, Bacoor",
    "deliveryDate": "2026-04-01",
    "items": [
      {
        "productId": "PRD-106",
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "lineTotal": 29325
      }
    ],
    "subtotal": 29325,
    "total": 29325,
    "paidAmount": 14662,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-04-01T13:15:00",
    "updatedAt": "2026-04-01T13:15:00"
  },
  {
    "id": "ORD-047",
    "referenceNumber": "SS-2026-00047",
    "customerName": "Pasig Partition Systems",
    "customerPhone": "0956-622-2874",
    "deliveryAddress": "146 Industrial Road, San Pedro",
    "deliveryDate": "2026-05-04",
    "items": [
      {
        "productId": "PRD-111",
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "lineTotal": 48000
      },
      {
        "productId": "PRD-002",
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "lineTotal": 4060
      }
    ],
    "subtotal": 52060,
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-05-04T14:22:00",
    "updatedAt": "2026-05-04T14:22:00"
  },
  {
    "id": "ORD-048",
    "referenceNumber": "SS-2026-00048",
    "customerName": "Caloocan Hardware Center",
    "customerPhone": "0957-629-2893",
    "deliveryAddress": "147 National Highway, Quezon City",
    "deliveryDate": "2026-06-07",
    "items": [
      {
        "productId": "PRD-116",
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "lineTotal": 31750
      },
      {
        "productId": "PRD-007",
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "lineTotal": 12520
      },
      {
        "productId": "PRD-018",
        "name": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "lineTotal": 13050
      }
    ],
    "subtotal": 57320,
    "total": 57320,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-06-07T15:29:00",
    "updatedAt": "2026-06-07T15:29:00"
  },
  {
    "id": "ORD-049",
    "referenceNumber": "SS-2026-00049",
    "customerName": "Marikina Fabrication",
    "customerPhone": "0958-636-2912",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-07-10",
    "items": [
      {
        "productId": "PRD-001",
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "lineTotal": 950
      }
    ],
    "subtotal": 950,
    "total": 950,
    "paidAmount": 950,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-07-10T16:36:00",
    "updatedAt": "2026-07-10T16:36:00"
  },
  {
    "id": "ORD-050",
    "referenceNumber": "SS-2026-00050",
    "customerName": "Taguig Residential Builds",
    "customerPhone": "0959-643-2931",
    "deliveryAddress": "149 Shaw Boulevard, Caloocan",
    "deliveryDate": "2026-01-13",
    "items": [
      {
        "productId": "PRD-006",
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "lineTotal": 3900
      },
      {
        "productId": "PRD-017",
        "name": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "lineTotal": 7750
      }
    ],
    "subtotal": 11650,
    "total": 11650,
    "paidAmount": 11650,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-01-13T17:43:00",
    "updatedAt": "2026-01-13T17:43:00"
  },
  {
    "id": "ORD-051",
    "referenceNumber": "SS-2026-00051",
    "customerName": "Manila Skylight Studio",
    "customerPhone": "0960-650-2950",
    "deliveryAddress": "150 C5 Road, Las Piñas",
    "deliveryDate": "2026-02-16",
    "items": [
      {
        "productId": "PRD-011",
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "lineTotal": 7680
      },
      {
        "productId": "PRD-022",
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "lineTotal": 37675
      },
      {
        "productId": "PRD-033",
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "lineTotal": 6300
      }
    ],
    "subtotal": 51655,
    "total": 51655,
    "paidAmount": 28410,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-02-16T08:50:00",
    "updatedAt": "2026-02-16T08:50:00"
  },
  {
    "id": "ORD-052",
    "referenceNumber": "SS-2026-00052",
    "customerName": "Parañaque Modular Glass",
    "customerPhone": "0961-657-2969",
    "deliveryAddress": "151 Aguinaldo Highway, Cavite City",
    "deliveryDate": "2026-03-19",
    "items": [
      {
        "productId": "PRD-016",
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "lineTotal": 5950
      }
    ],
    "subtotal": 5950,
    "total": 5950,
    "paidAmount": 5950,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-03-19T09:57:00",
    "updatedAt": "2026-03-19T09:57:00"
  },
  {
    "id": "ORD-053",
    "referenceNumber": "SS-2026-00053",
    "customerName": "Antipolo Home Concepts",
    "customerPhone": "0962-664-2988",
    "deliveryAddress": "152 Alabang-Zapote Road, Calamba",
    "deliveryDate": "2026-04-22",
    "items": [
      {
        "productId": "PRD-021",
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "lineTotal": 17490
      },
      {
        "productId": "PRD-032",
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "lineTotal": 6110
      }
    ],
    "subtotal": 23600,
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-04-22T10:04:00",
    "updatedAt": "2026-04-22T10:04:00"
  },
  {
    "id": "ORD-054",
    "referenceNumber": "SS-2026-00054",
    "customerName": "Ortigas Office Fit-Out",
    "customerPhone": "0963-671-3007",
    "deliveryAddress": "153 Marcos Highway, Malabon",
    "deliveryDate": "2026-05-25",
    "items": [
      {
        "productId": "PRD-026",
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "lineTotal": 3710
      },
      {
        "productId": "PRD-037",
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "lineTotal": 5320
      },
      {
        "productId": "PRD-048",
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "lineTotal": 6930
      }
    ],
    "subtotal": 15960,
    "total": 15960,
    "paidAmount": 15960,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-05-25T11:11:00",
    "updatedAt": "2026-05-25T11:11:00"
  },
  {
    "id": "ORD-055",
    "referenceNumber": "SS-2026-00055",
    "customerName": "Las Piñas Aluminum Craft",
    "customerPhone": "0964-678-3026",
    "deliveryAddress": "154 MacArthur Highway, Makati",
    "deliveryDate": "2026-06-01",
    "items": [
      {
        "productId": "PRD-031",
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "lineTotal": 2640
      }
    ],
    "subtotal": 2640,
    "total": 2640,
    "paidAmount": 1320,
    "paymentStatus": "partial",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-06-01T12:18:00",
    "updatedAt": "2026-06-01T12:18:00"
  },
  {
    "id": "ORD-056",
    "referenceNumber": "SS-2026-00056",
    "customerName": "Fairview Glass Traders",
    "customerPhone": "0965-685-3045",
    "deliveryAddress": "155 Gil Puyat Avenue, Mandaluyong",
    "deliveryDate": "2026-07-04",
    "items": [
      {
        "productId": "PRD-036",
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "lineTotal": 5670
      },
      {
        "productId": "PRD-047",
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "lineTotal": 9680
      }
    ],
    "subtotal": 15350,
    "total": 15350,
    "paidAmount": 8442,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-07-04T13:25:00",
    "updatedAt": "2026-07-04T13:25:00"
  },
  {
    "id": "ORD-057",
    "referenceNumber": "SS-2026-00057",
    "customerName": "Sta. Rosa Buildmart",
    "customerPhone": "0966-692-3064",
    "deliveryAddress": "156 Ayala Avenue, Valenzuela",
    "deliveryDate": "2026-01-07",
    "items": [
      {
        "productId": "PRD-041",
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "lineTotal": 13500
      },
      {
        "productId": "PRD-052",
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "lineTotal": 10540
      },
      {
        "productId": "PRD-063",
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "lineTotal": 31680
      }
    ],
    "subtotal": 55720,
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-01-07T14:32:00",
    "updatedAt": "2026-01-07T14:32:00"
  },
  {
    "id": "ORD-058",
    "referenceNumber": "SS-2026-00058",
    "customerName": "Alabang Interior Works",
    "customerPhone": "0967-699-3083",
    "deliveryAddress": "157 Katipunan Avenue, Muntinlupa",
    "deliveryDate": "2026-02-10",
    "items": [
      {
        "productId": "PRD-046",
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "lineTotal": 5500
      }
    ],
    "subtotal": 5500,
    "total": 5500,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-02-10T15:39:00",
    "updatedAt": "2026-02-10T15:39:00"
  },
  {
    "id": "ORD-059",
    "referenceNumber": "SS-2026-00059",
    "customerName": "Navotas Industrial Supply",
    "customerPhone": "0968-706-3102",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-03-13",
    "items": [
      {
        "productId": "PRD-051",
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "lineTotal": 6180
      },
      {
        "productId": "PRD-062",
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "lineTotal": 23275
      }
    ],
    "subtotal": 29455,
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-03-13T16:46:00",
    "updatedAt": "2026-03-13T16:46:00"
  },
  {
    "id": "ORD-060",
    "referenceNumber": "SS-2026-00060",
    "customerName": "Malabon Glasshouse",
    "customerPhone": "0969-713-3121",
    "deliveryAddress": "159 Congressional Avenue, Sta. Rosa",
    "deliveryDate": "2026-04-16",
    "items": [
      {
        "productId": "PRD-056",
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "lineTotal": 17420
      },
      {
        "productId": "PRD-067",
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "lineTotal": 16300
      },
      {
        "productId": "PRD-078",
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "lineTotal": 1170
      }
    ],
    "subtotal": 34890,
    "total": 34890,
    "paidAmount": 34890,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-04-16T17:53:00",
    "updatedAt": "2026-04-16T17:53:00"
  },
  {
    "id": "ORD-061",
    "referenceNumber": "SS-2026-00061",
    "customerName": "Aurelia Builders",
    "customerPhone": "0970-720-3140",
    "deliveryAddress": "160 Rizal Avenue, Manila",
    "deliveryDate": "2026-05-19",
    "items": [
      {
        "productId": "PRD-061",
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "lineTotal": 27440
      }
    ],
    "subtotal": 27440,
    "total": 27440,
    "paidAmount": 15092,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-05-19T08:00:00",
    "updatedAt": "2026-05-19T08:00:00"
  },
  {
    "id": "ORD-062",
    "referenceNumber": "SS-2026-00062",
    "customerName": "Northbay Glass Works",
    "customerPhone": "0971-727-3159",
    "deliveryAddress": "161 Mabini Street, Pasig",
    "deliveryDate": "2026-06-22",
    "items": [
      {
        "productId": "PRD-066",
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "lineTotal": 18450
      },
      {
        "productId": "PRD-077",
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "lineTotal": 15840
      }
    ],
    "subtotal": 34290,
    "total": 34290,
    "paidAmount": 34290,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-06-22T09:07:00",
    "updatedAt": "2026-06-22T09:07:00"
  },
  {
    "id": "ORD-063",
    "referenceNumber": "SS-2026-00063",
    "customerName": "Mendoza Aluminum Supply",
    "customerPhone": "0972-734-3178",
    "deliveryAddress": "162 Quezon Avenue, Marikina",
    "deliveryDate": "2026-07-25",
    "items": [
      {
        "productId": "PRD-071",
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "lineTotal": 45600
      },
      {
        "productId": "PRD-082",
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "lineTotal": 12650
      },
      {
        "productId": "PRD-093",
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "lineTotal": 2220
      }
    ],
    "subtotal": 60470,
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-07-25T10:14:00",
    "updatedAt": "2026-07-25T10:14:00"
  },
  {
    "id": "ORD-064",
    "referenceNumber": "SS-2026-00064",
    "customerName": "San Pedro Construction",
    "customerPhone": "0973-741-3197",
    "deliveryAddress": "163 Ortigas Extension, Parañaque",
    "deliveryDate": "2026-01-01",
    "items": [
      {
        "productId": "PRD-076",
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "lineTotal": 10370
      }
    ],
    "subtotal": 10370,
    "total": 10370,
    "paidAmount": 5185,
    "paymentStatus": "partial",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-01-01T11:21:00",
    "updatedAt": "2026-01-01T11:21:00"
  },
  {
    "id": "ORD-065",
    "referenceNumber": "SS-2026-00065",
    "customerName": "Everline Interiors",
    "customerPhone": "0974-748-3216",
    "deliveryAddress": "164 EDSA Service Road, Antipolo",
    "deliveryDate": "2026-02-04",
    "items": [
      {
        "productId": "PRD-081",
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "lineTotal": 7380
      },
      {
        "productId": "PRD-092",
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "lineTotal": 33250
      }
    ],
    "subtotal": 40630,
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-02-04T12:28:00",
    "updatedAt": "2026-02-04T12:28:00"
  },
  {
    "id": "ORD-066",
    "referenceNumber": "SS-2026-00066",
    "customerName": "JRM Glass Center",
    "customerPhone": "0975-755-3235",
    "deliveryAddress": "165 Commerce Avenue, Bacoor",
    "deliveryDate": "2026-03-07",
    "items": [
      {
        "productId": "PRD-086",
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "lineTotal": 13490
      },
      {
        "productId": "PRD-097",
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "lineTotal": 1290
      },
      {
        "productId": "PRD-108",
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "lineTotal": 17145
      }
    ],
    "subtotal": 31925,
    "total": 31925,
    "paidAmount": 17559,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-03-07T13:35:00",
    "updatedAt": "2026-03-07T13:35:00"
  },
  {
    "id": "ORD-067",
    "referenceNumber": "SS-2026-00067",
    "customerName": "Prime Arc Developers",
    "customerPhone": "0976-762-3254",
    "deliveryAddress": "166 Industrial Road, San Pedro",
    "deliveryDate": "2026-04-10",
    "items": [
      {
        "productId": "PRD-091",
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "lineTotal": 27800
      }
    ],
    "subtotal": 27800,
    "total": 27800,
    "paidAmount": 27800,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-04-10T14:42:00",
    "updatedAt": "2026-04-10T14:42:00"
  },
  {
    "id": "ORD-068",
    "referenceNumber": "SS-2026-00068",
    "customerName": "Cavite Window Systems",
    "customerPhone": "0977-769-3273",
    "deliveryAddress": "167 National Highway, Quezon City",
    "deliveryDate": "2026-05-13",
    "items": [
      {
        "productId": "PRD-096",
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "lineTotal": 12180
      },
      {
        "productId": "PRD-107",
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "lineTotal": 6160
      }
    ],
    "subtotal": 18340,
    "total": 18340,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-05-13T15:49:00",
    "updatedAt": "2026-05-13T15:49:00"
  },
  {
    "id": "ORD-069",
    "referenceNumber": "SS-2026-00069",
    "customerName": "Lucena Home Builders",
    "customerPhone": "0978-776-3292",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-06-16",
    "items": [
      {
        "productId": "PRD-101",
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "lineTotal": 12210
      },
      {
        "productId": "PRD-112",
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "lineTotal": 6325
      },
      {
        "productId": "PRD-003",
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "lineTotal": 8460
      }
    ],
    "subtotal": 26995,
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-06-16T16:56:00",
    "updatedAt": "2026-06-16T16:56:00"
  },
  {
    "id": "ORD-070",
    "referenceNumber": "SS-2026-00070",
    "customerName": "Quezon Facade Studio",
    "customerPhone": "0979-783-3311",
    "deliveryAddress": "169 Shaw Boulevard, Caloocan",
    "deliveryDate": "2026-07-19",
    "items": [
      {
        "productId": "PRD-106",
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "lineTotal": 29325
      }
    ],
    "subtotal": 29325,
    "total": 29325,
    "paidAmount": 29325,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-07-19T17:03:00",
    "updatedAt": "2026-07-19T17:03:00"
  },
  {
    "id": "ORD-071",
    "referenceNumber": "SS-2026-00071",
    "customerName": "BGC Fit-Out Group",
    "customerPhone": "0980-790-3330",
    "deliveryAddress": "170 C5 Road, Las Piñas",
    "deliveryDate": "2026-01-22",
    "items": [
      {
        "productId": "PRD-111",
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "lineTotal": 48000
      },
      {
        "productId": "PRD-002",
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "lineTotal": 4060
      }
    ],
    "subtotal": 52060,
    "total": 52060,
    "paidAmount": 28633,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-01-22T08:10:00",
    "updatedAt": "2026-01-22T08:10:00"
  },
  {
    "id": "ORD-072",
    "referenceNumber": "SS-2026-00072",
    "customerName": "Valenzuela Glass Depot",
    "customerPhone": "0981-797-3349",
    "deliveryAddress": "171 Aguinaldo Highway, Cavite City",
    "deliveryDate": "2026-02-25",
    "items": [
      {
        "productId": "PRD-116",
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "lineTotal": 31750
      },
      {
        "productId": "PRD-007",
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "lineTotal": 12520
      },
      {
        "productId": "PRD-018",
        "name": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "lineTotal": 13050
      }
    ],
    "subtotal": 57320,
    "total": 57320,
    "paidAmount": 57320,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-02-25T09:17:00",
    "updatedAt": "2026-02-25T09:17:00"
  },
  {
    "id": "ORD-073",
    "referenceNumber": "SS-2026-00073",
    "customerName": "Laguna Aluminum Works",
    "customerPhone": "0982-804-3368",
    "deliveryAddress": "172 Alabang-Zapote Road, Calamba",
    "deliveryDate": "2026-03-01",
    "items": [
      {
        "productId": "PRD-001",
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "lineTotal": 950
      }
    ],
    "subtotal": 950,
    "total": 950,
    "paidAmount": 475,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-03-01T10:24:00",
    "updatedAt": "2026-03-01T10:24:00"
  },
  {
    "id": "ORD-074",
    "referenceNumber": "SS-2026-00074",
    "customerName": "Rizal Door and Window",
    "customerPhone": "0983-811-3387",
    "deliveryAddress": "173 Marcos Highway, Malabon",
    "deliveryDate": "2026-04-04",
    "items": [
      {
        "productId": "PRD-006",
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "lineTotal": 3900
      },
      {
        "productId": "PRD-017",
        "name": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "lineTotal": 7750
      }
    ],
    "subtotal": 11650,
    "total": 11650,
    "paidAmount": 11650,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-04-04T11:31:00",
    "updatedAt": "2026-04-04T11:31:00"
  },
  {
    "id": "ORD-075",
    "referenceNumber": "SS-2026-00075",
    "customerName": "Makati Renovation Co.",
    "customerPhone": "0984-818-3406",
    "deliveryAddress": "174 MacArthur Highway, Makati",
    "deliveryDate": "2026-05-07",
    "items": [
      {
        "productId": "PRD-011",
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "lineTotal": 7680
      },
      {
        "productId": "PRD-022",
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "lineTotal": 37675
      },
      {
        "productId": "PRD-033",
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "lineTotal": 6300
      }
    ],
    "subtotal": 51655,
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 7748,
    "refundReason": "Client changed cut-size specification",
    "refundType": "partial",
    "createdAt": "2026-05-07T12:38:00",
    "updatedAt": "2026-05-07T12:38:00"
  },
  {
    "id": "ORD-076",
    "referenceNumber": "SS-2026-00076",
    "customerName": "Calamba Commercial Builders",
    "customerPhone": "0985-825-3425",
    "deliveryAddress": "175 Gil Puyat Avenue, Mandaluyong",
    "deliveryDate": "2026-06-10",
    "items": [
      {
        "productId": "PRD-016",
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "lineTotal": 5950
      }
    ],
    "subtotal": 5950,
    "total": 5950,
    "paidAmount": 3273,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-06-10T13:45:00",
    "updatedAt": "2026-06-10T13:45:00"
  },
  {
    "id": "ORD-077",
    "referenceNumber": "SS-2026-00077",
    "customerName": "Pasig Partition Systems",
    "customerPhone": "0986-832-3444",
    "deliveryAddress": "176 Ayala Avenue, Valenzuela",
    "deliveryDate": "2026-07-13",
    "items": [
      {
        "productId": "PRD-021",
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "lineTotal": 17490
      },
      {
        "productId": "PRD-032",
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "lineTotal": 6110
      }
    ],
    "subtotal": 23600,
    "total": 23600,
    "paidAmount": 23600,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-07-13T14:52:00",
    "updatedAt": "2026-07-13T14:52:00"
  },
  {
    "id": "ORD-078",
    "referenceNumber": "SS-2026-00078",
    "customerName": "Caloocan Hardware Center",
    "customerPhone": "0987-839-3463",
    "deliveryAddress": "177 Katipunan Avenue, Muntinlupa",
    "deliveryDate": "2026-01-16",
    "items": [
      {
        "productId": "PRD-026",
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "lineTotal": 3710
      },
      {
        "productId": "PRD-037",
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "lineTotal": 5320
      },
      {
        "productId": "PRD-048",
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "lineTotal": 6930
      }
    ],
    "subtotal": 15960,
    "total": 15960,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-01-16T15:59:00",
    "updatedAt": "2026-01-16T15:59:00"
  },
  {
    "id": "ORD-079",
    "referenceNumber": "SS-2026-00079",
    "customerName": "Marikina Fabrication",
    "customerPhone": "0988-846-3482",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-02-19",
    "items": [
      {
        "productId": "PRD-031",
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "lineTotal": 2640
      }
    ],
    "subtotal": 2640,
    "total": 2640,
    "paidAmount": 2640,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-02-19T16:06:00",
    "updatedAt": "2026-02-19T16:06:00"
  },
  {
    "id": "ORD-080",
    "referenceNumber": "SS-2026-00080",
    "customerName": "Taguig Residential Builds",
    "customerPhone": "0989-853-3501",
    "deliveryAddress": "179 Congressional Avenue, Sta. Rosa",
    "deliveryDate": "2026-03-22",
    "items": [
      {
        "productId": "PRD-036",
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "lineTotal": 5670
      },
      {
        "productId": "PRD-047",
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "lineTotal": 9680
      }
    ],
    "subtotal": 15350,
    "total": 15350,
    "paidAmount": 15350,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-03-22T17:13:00",
    "updatedAt": "2026-03-22T17:13:00"
  },
  {
    "id": "ORD-081",
    "referenceNumber": "SS-2026-00081",
    "customerName": "Manila Skylight Studio",
    "customerPhone": "0900-860-3520",
    "deliveryAddress": "180 Rizal Avenue, Manila",
    "deliveryDate": "2026-04-25",
    "items": [
      {
        "productId": "PRD-041",
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "lineTotal": 13500
      },
      {
        "productId": "PRD-052",
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "lineTotal": 10540
      },
      {
        "productId": "PRD-063",
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "lineTotal": 31680
      }
    ],
    "subtotal": 55720,
    "total": 55720,
    "paidAmount": 30646,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-04-25T08:20:00",
    "updatedAt": "2026-04-25T08:20:00"
  },
  {
    "id": "ORD-082",
    "referenceNumber": "SS-2026-00082",
    "customerName": "Parañaque Modular Glass",
    "customerPhone": "0901-867-3539",
    "deliveryAddress": "181 Mabini Street, Pasig",
    "deliveryDate": "2026-05-01",
    "items": [
      {
        "productId": "PRD-046",
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "lineTotal": 5500
      }
    ],
    "subtotal": 5500,
    "total": 5500,
    "paidAmount": 2750,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-05-01T09:27:00",
    "updatedAt": "2026-05-01T09:27:00"
  },
  {
    "id": "ORD-083",
    "referenceNumber": "SS-2026-00083",
    "customerName": "Antipolo Home Concepts",
    "customerPhone": "0902-874-3558",
    "deliveryAddress": "182 Quezon Avenue, Marikina",
    "deliveryDate": "2026-06-04",
    "items": [
      {
        "productId": "PRD-051",
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "lineTotal": 6180
      },
      {
        "productId": "PRD-062",
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "lineTotal": 23275
      }
    ],
    "subtotal": 29455,
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-06-04T10:34:00",
    "updatedAt": "2026-06-04T10:34:00"
  },
  {
    "id": "ORD-084",
    "referenceNumber": "SS-2026-00084",
    "customerName": "Ortigas Office Fit-Out",
    "customerPhone": "0903-881-3577",
    "deliveryAddress": "183 Ortigas Extension, Parañaque",
    "deliveryDate": "2026-07-07",
    "items": [
      {
        "productId": "PRD-056",
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "lineTotal": 17420
      },
      {
        "productId": "PRD-067",
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "lineTotal": 16300
      },
      {
        "productId": "PRD-078",
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "lineTotal": 1170
      }
    ],
    "subtotal": 34890,
    "total": 34890,
    "paidAmount": 34890,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-07-07T11:41:00",
    "updatedAt": "2026-07-07T11:41:00"
  },
  {
    "id": "ORD-085",
    "referenceNumber": "SS-2026-00085",
    "customerName": "Las Piñas Aluminum Craft",
    "customerPhone": "0904-888-3596",
    "deliveryAddress": "184 EDSA Service Road, Antipolo",
    "deliveryDate": "2026-01-10",
    "items": [
      {
        "productId": "PRD-061",
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "lineTotal": 27440
      }
    ],
    "subtotal": 27440,
    "total": 27440,
    "paidAmount": 27440,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-01-10T12:48:00",
    "updatedAt": "2026-01-10T12:48:00"
  },
  {
    "id": "ORD-086",
    "referenceNumber": "SS-2026-00086",
    "customerName": "Fairview Glass Traders",
    "customerPhone": "0905-895-3615",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-02-13",
    "items": [
      {
        "productId": "PRD-066",
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "lineTotal": 18450
      },
      {
        "productId": "PRD-077",
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "lineTotal": 15840
      }
    ],
    "subtotal": 34290,
    "total": 34290,
    "paidAmount": 18860,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-02-13T13:55:00",
    "updatedAt": "2026-02-13T13:55:00"
  },
  {
    "id": "ORD-087",
    "referenceNumber": "SS-2026-00087",
    "customerName": "Sta. Rosa Buildmart",
    "customerPhone": "0906-902-3634",
    "deliveryAddress": "186 Industrial Road, San Pedro",
    "deliveryDate": "2026-03-16",
    "items": [
      {
        "productId": "PRD-071",
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "lineTotal": 45600
      },
      {
        "productId": "PRD-082",
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "lineTotal": 12650
      },
      {
        "productId": "PRD-093",
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "lineTotal": 2220
      }
    ],
    "subtotal": 60470,
    "total": 60470,
    "paidAmount": 60470,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-03-16T14:02:00",
    "updatedAt": "2026-03-16T14:02:00"
  },
  {
    "id": "ORD-088",
    "referenceNumber": "SS-2026-00088",
    "customerName": "Alabang Interior Works",
    "customerPhone": "0907-909-3653",
    "deliveryAddress": "187 National Highway, Quezon City",
    "deliveryDate": "2026-04-19",
    "items": [
      {
        "productId": "PRD-076",
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "lineTotal": 10370
      }
    ],
    "subtotal": 10370,
    "total": 10370,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-04-19T15:09:00",
    "updatedAt": "2026-04-19T15:09:00"
  },
  {
    "id": "ORD-089",
    "referenceNumber": "SS-2026-00089",
    "customerName": "Navotas Industrial Supply",
    "customerPhone": "0908-916-3672",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-05-22",
    "items": [
      {
        "productId": "PRD-081",
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "lineTotal": 7380
      },
      {
        "productId": "PRD-092",
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "lineTotal": 33250
      }
    ],
    "subtotal": 40630,
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-05-22T16:16:00",
    "updatedAt": "2026-05-22T16:16:00"
  },
  {
    "id": "ORD-090",
    "referenceNumber": "SS-2026-00090",
    "customerName": "Malabon Glasshouse",
    "customerPhone": "0909-923-3691",
    "deliveryAddress": "189 Shaw Boulevard, Caloocan",
    "deliveryDate": "2026-06-25",
    "items": [
      {
        "productId": "PRD-086",
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "lineTotal": 13490
      },
      {
        "productId": "PRD-097",
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "lineTotal": 1290
      },
      {
        "productId": "PRD-108",
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "lineTotal": 17145
      }
    ],
    "subtotal": 31925,
    "total": 31925,
    "paidAmount": 31925,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-06-25T17:23:00",
    "updatedAt": "2026-06-25T17:23:00"
  },
  {
    "id": "ORD-091",
    "referenceNumber": "SS-2026-00091",
    "customerName": "Aurelia Builders",
    "customerPhone": "0910-930-3710",
    "deliveryAddress": "190 C5 Road, Las Piñas",
    "deliveryDate": "2026-07-01",
    "items": [
      {
        "productId": "PRD-091",
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "lineTotal": 27800
      }
    ],
    "subtotal": 27800,
    "total": 27800,
    "paidAmount": 13900,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-07-01T08:30:00",
    "updatedAt": "2026-07-01T08:30:00"
  },
  {
    "id": "ORD-092",
    "referenceNumber": "SS-2026-00092",
    "customerName": "Northbay Glass Works",
    "customerPhone": "0911-937-3729",
    "deliveryAddress": "191 Aguinaldo Highway, Cavite City",
    "deliveryDate": "2026-01-04",
    "items": [
      {
        "productId": "PRD-096",
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "lineTotal": 12180
      },
      {
        "productId": "PRD-107",
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "lineTotal": 6160
      }
    ],
    "subtotal": 18340,
    "total": 18340,
    "paidAmount": 18340,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-01-04T09:37:00",
    "updatedAt": "2026-01-04T09:37:00"
  },
  {
    "id": "ORD-093",
    "referenceNumber": "SS-2026-00093",
    "customerName": "Mendoza Aluminum Supply",
    "customerPhone": "0912-944-3748",
    "deliveryAddress": "192 Alabang-Zapote Road, Calamba",
    "deliveryDate": "2026-02-07",
    "items": [
      {
        "productId": "PRD-101",
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "lineTotal": 12210
      },
      {
        "productId": "PRD-112",
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "lineTotal": 6325
      },
      {
        "productId": "PRD-003",
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "lineTotal": 8460
      }
    ],
    "subtotal": 26995,
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2026-02-07T10:44:00",
    "updatedAt": "2026-02-07T10:44:00"
  },
  {
    "id": "ORD-094",
    "referenceNumber": "SS-2026-00094",
    "customerName": "San Pedro Construction",
    "customerPhone": "0913-951-3767",
    "deliveryAddress": "193 Marcos Highway, Malabon",
    "deliveryDate": "2026-03-10",
    "items": [
      {
        "productId": "PRD-106",
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "lineTotal": 29325
      }
    ],
    "subtotal": 29325,
    "total": 29325,
    "paidAmount": 29325,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-03-10T11:51:00",
    "updatedAt": "2026-03-10T11:51:00"
  },
  {
    "id": "ORD-095",
    "referenceNumber": "SS-2026-00095",
    "customerName": "Everline Interiors",
    "customerPhone": "0914-958-3786",
    "deliveryAddress": "194 MacArthur Highway, Makati",
    "deliveryDate": "2026-04-13",
    "items": [
      {
        "productId": "PRD-111",
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "lineTotal": 48000
      },
      {
        "productId": "PRD-002",
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "lineTotal": 4060
      }
    ],
    "subtotal": 52060,
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2026-04-13T12:58:00",
    "updatedAt": "2026-04-13T12:58:00"
  },
  {
    "id": "ORD-096",
    "referenceNumber": "SS-2026-00096",
    "customerName": "JRM Glass Center",
    "customerPhone": "0915-965-3805",
    "deliveryAddress": "195 Gil Puyat Avenue, Mandaluyong",
    "deliveryDate": "2026-05-16",
    "items": [
      {
        "productId": "PRD-116",
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "lineTotal": 31750
      },
      {
        "productId": "PRD-007",
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "lineTotal": 12520
      },
      {
        "productId": "PRD-018",
        "name": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "lineTotal": 13050
      }
    ],
    "subtotal": 57320,
    "total": 57320,
    "paidAmount": 31526,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-05-16T13:05:00",
    "updatedAt": "2026-05-16T13:05:00"
  },
  {
    "id": "ORD-097",
    "referenceNumber": "SS-2026-00097",
    "customerName": "Prime Arc Developers",
    "customerPhone": "0916-972-3824",
    "deliveryAddress": "196 Ayala Avenue, Valenzuela",
    "deliveryDate": "2026-06-19",
    "items": [
      {
        "productId": "PRD-001",
        "name": "Clear Float Glass 4mm",
        "quantity": 2,
        "unitPrice": 475,
        "lineTotal": 950
      }
    ],
    "subtotal": 950,
    "total": 950,
    "paidAmount": 950,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-06-19T14:12:00",
    "updatedAt": "2026-06-19T14:12:00"
  },
  {
    "id": "ORD-098",
    "referenceNumber": "SS-2026-00098",
    "customerName": "Cavite Window Systems",
    "customerPhone": "0917-979-3843",
    "deliveryAddress": "197 Katipunan Avenue, Muntinlupa",
    "deliveryDate": "2026-07-22",
    "items": [
      {
        "productId": "PRD-006",
        "name": "Tempered Glass 6mm",
        "quantity": 3,
        "unitPrice": 1300,
        "lineTotal": 3900
      },
      {
        "productId": "PRD-017",
        "name": "Mirror 5mm",
        "quantity": 10,
        "unitPrice": 775,
        "lineTotal": 7750
      }
    ],
    "subtotal": 11650,
    "total": 11650,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-07-22T15:19:00",
    "updatedAt": "2026-07-22T15:19:00"
  },
  {
    "id": "ORD-099",
    "referenceNumber": "SS-2026-00099",
    "customerName": "Lucena Home Builders",
    "customerPhone": "0918-986-3862",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2026-01-25",
    "items": [
      {
        "productId": "PRD-011",
        "name": "Laminated Glass 8mm",
        "quantity": 4,
        "unitPrice": 1920,
        "lineTotal": 7680
      },
      {
        "productId": "PRD-022",
        "name": "Double Glazed Low-E Unit",
        "quantity": 11,
        "unitPrice": 3425,
        "lineTotal": 37675
      },
      {
        "productId": "PRD-033",
        "name": "Aluminum Flat Bar 1 inch",
        "quantity": 36,
        "unitPrice": 175,
        "lineTotal": 6300
      }
    ],
    "subtotal": 51655,
    "total": 51655,
    "paidAmount": 51655,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2026-01-25T16:26:00",
    "updatedAt": "2026-01-25T16:26:00"
  },
  {
    "id": "ORD-100",
    "referenceNumber": "SS-2026-00100",
    "customerName": "Quezon Facade Studio",
    "customerPhone": "0919-993-3881",
    "deliveryAddress": "199 Congressional Avenue, Sta. Rosa",
    "deliveryDate": "2026-02-01",
    "items": [
      {
        "productId": "PRD-016",
        "name": "Frosted Glass 8mm",
        "quantity": 5,
        "unitPrice": 1190,
        "lineTotal": 5950
      }
    ],
    "subtotal": 5950,
    "total": 5950,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2026-02-01T17:33:00",
    "updatedAt": "2026-02-01T17:33:00"
  },
  {
    "id": "ORD-101",
    "referenceNumber": "SS-2025-00101",
    "customerName": "BGC Fit-Out Group",
    "customerPhone": "0920-100-3900",
    "deliveryAddress": "200 Rizal Avenue, Manila",
    "deliveryDate": "2025-11-04",
    "items": [
      {
        "productId": "PRD-021",
        "name": "Double Glazed Unit 6+6",
        "quantity": 6,
        "unitPrice": 2915,
        "lineTotal": 17490
      },
      {
        "productId": "PRD-032",
        "name": "Aluminum Angle Bar 2x2",
        "quantity": 26,
        "unitPrice": 235,
        "lineTotal": 6110
      }
    ],
    "subtotal": 23600,
    "total": 23600,
    "paidAmount": 12980,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2025-11-04T08:40:00",
    "updatedAt": "2025-11-04T08:40:00"
  },
  {
    "id": "ORD-102",
    "referenceNumber": "SS-2025-00102",
    "customerName": "Valenzuela Glass Depot",
    "customerPhone": "0921-107-3919",
    "deliveryAddress": "201 Mabini Street, Pasig",
    "deliveryDate": "2025-12-07",
    "items": [
      {
        "productId": "PRD-026",
        "name": "Aluminum Frame 2x4 inch",
        "quantity": 14,
        "unitPrice": 265,
        "lineTotal": 3710
      },
      {
        "productId": "PRD-037",
        "name": "Aluminum Profile L-Shape",
        "quantity": 28,
        "unitPrice": 190,
        "lineTotal": 5320
      },
      {
        "productId": "PRD-048",
        "name": "Aluminum Seal Strip",
        "quantity": 42,
        "unitPrice": 165,
        "lineTotal": 6930
      }
    ],
    "subtotal": 15960,
    "total": 15960,
    "paidAmount": 15960,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2025-12-07T09:47:00",
    "updatedAt": "2025-12-07T09:47:00"
  },
  {
    "id": "ORD-103",
    "referenceNumber": "SS-2025-00103",
    "customerName": "Laguna Aluminum Works",
    "customerPhone": "0922-114-3938",
    "deliveryAddress": "202 Quezon Avenue, Marikina",
    "deliveryDate": "2025-11-10",
    "items": [
      {
        "productId": "PRD-031",
        "name": "Aluminum Angle Bar 1x1",
        "quantity": 16,
        "unitPrice": 165,
        "lineTotal": 2640
      }
    ],
    "subtotal": 2640,
    "total": 2640,
    "paidAmount": 2640,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2025-11-10T10:54:00",
    "updatedAt": "2025-11-10T10:54:00"
  },
  {
    "id": "ORD-104",
    "referenceNumber": "SS-2025-00104",
    "customerName": "Rizal Door and Window",
    "customerPhone": "0923-121-3957",
    "deliveryAddress": "203 Ortigas Extension, Parañaque",
    "deliveryDate": "2025-12-13",
    "items": [
      {
        "productId": "PRD-036",
        "name": "Aluminum Tube Square 1.5 inch",
        "quantity": 18,
        "unitPrice": 315,
        "lineTotal": 5670
      },
      {
        "productId": "PRD-047",
        "name": "Aluminum Lockset Sliding",
        "quantity": 16,
        "unitPrice": 605,
        "lineTotal": 9680
      }
    ],
    "subtotal": 15350,
    "total": 15350,
    "paidAmount": 15350,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2025-12-13T11:01:00",
    "updatedAt": "2025-12-13T11:01:00"
  },
  {
    "id": "ORD-105",
    "referenceNumber": "SS-2025-00105",
    "customerName": "Makati Renovation Co.",
    "customerPhone": "0924-128-3976",
    "deliveryAddress": "204 EDSA Service Road, Antipolo",
    "deliveryDate": "2025-11-16",
    "items": [
      {
        "productId": "PRD-041",
        "name": "Aluminum Composite Panel White",
        "quantity": 10,
        "unitPrice": 1350,
        "lineTotal": 13500
      },
      {
        "productId": "PRD-052",
        "name": "Clear Float Glass 5mm - Lot B",
        "quantity": 17,
        "unitPrice": 620,
        "lineTotal": 10540
      },
      {
        "productId": "PRD-063",
        "name": "Reflective Glass Blue 6mm - Lot B",
        "quantity": 24,
        "unitPrice": 1320,
        "lineTotal": 31680
      }
    ],
    "subtotal": 55720,
    "total": 55720,
    "paidAmount": 55720,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2025-11-16T12:08:00",
    "updatedAt": "2025-11-16T12:08:00"
  },
  {
    "id": "ORD-106",
    "referenceNumber": "SS-2025-00106",
    "customerName": "Calamba Commercial Builders",
    "customerPhone": "0925-135-3995",
    "deliveryAddress": "205 Commerce Avenue, Bacoor",
    "deliveryDate": "2025-12-19",
    "items": [
      {
        "productId": "PRD-046",
        "name": "Aluminum Roller Nylon Bearing",
        "quantity": 22,
        "unitPrice": 250,
        "lineTotal": 5500
      }
    ],
    "subtotal": 5500,
    "total": 5500,
    "paidAmount": 3025,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-12-19T13:15:00",
    "updatedAt": "2025-12-19T13:15:00"
  },
  {
    "id": "ORD-107",
    "referenceNumber": "SS-2025-00107",
    "customerName": "Pasig Partition Systems",
    "customerPhone": "0926-142-4014",
    "deliveryAddress": "206 Industrial Road, San Pedro",
    "deliveryDate": "2025-11-22",
    "items": [
      {
        "productId": "PRD-051",
        "name": "Clear Float Glass 4mm - Lot B",
        "quantity": 12,
        "unitPrice": 515,
        "lineTotal": 6180
      },
      {
        "productId": "PRD-062",
        "name": "Reflective Glass Bronze 6mm - Lot B",
        "quantity": 19,
        "unitPrice": 1225,
        "lineTotal": 23275
      }
    ],
    "subtotal": 29455,
    "total": 29455,
    "paidAmount": 29455,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-11-22T14:22:00",
    "updatedAt": "2025-11-22T14:22:00"
  },
  {
    "id": "ORD-108",
    "referenceNumber": "SS-2025-00108",
    "customerName": "Caloocan Hardware Center",
    "customerPhone": "0927-149-4033",
    "deliveryAddress": "207 National Highway, Quezon City",
    "deliveryDate": "2025-12-25",
    "items": [
      {
        "productId": "PRD-056",
        "name": "Tempered Glass 6mm - Lot B",
        "quantity": 13,
        "unitPrice": 1340,
        "lineTotal": 17420
      },
      {
        "productId": "PRD-067",
        "name": "Mirror 5mm - Lot B",
        "quantity": 20,
        "unitPrice": 815,
        "lineTotal": 16300
      },
      {
        "productId": "PRD-078",
        "name": "Aluminum Frame 1x2 inch - Bronze Finish",
        "quantity": 6,
        "unitPrice": 195,
        "lineTotal": 1170
      }
    ],
    "subtotal": 34890,
    "total": 34890,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-12-25T15:29:00",
    "updatedAt": "2025-12-25T15:29:00"
  },
  {
    "id": "ORD-109",
    "referenceNumber": "SS-2025-00109",
    "customerName": "Marikina Fabrication",
    "customerPhone": "0928-156-4052",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2025-11-01",
    "items": [
      {
        "productId": "PRD-061",
        "name": "Laminated Glass 8mm - Lot B",
        "quantity": 14,
        "unitPrice": 1960,
        "lineTotal": 27440
      }
    ],
    "subtotal": 27440,
    "total": 27440,
    "paidAmount": 13720,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-11-01T16:36:00",
    "updatedAt": "2025-11-01T16:36:00"
  },
  {
    "id": "ORD-110",
    "referenceNumber": "SS-2025-00110",
    "customerName": "Taguig Residential Builds",
    "customerPhone": "0929-163-4071",
    "deliveryAddress": "209 Shaw Boulevard, Caloocan",
    "deliveryDate": "2025-12-04",
    "items": [
      {
        "productId": "PRD-066",
        "name": "Frosted Glass 8mm - Lot B",
        "quantity": 15,
        "unitPrice": 1230,
        "lineTotal": 18450
      },
      {
        "productId": "PRD-077",
        "name": "Aluminum Frame 3x3 inch - Bronze Finish",
        "quantity": 44,
        "unitPrice": 360,
        "lineTotal": 15840
      }
    ],
    "subtotal": 34290,
    "total": 34290,
    "paidAmount": 34290,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2025-12-04T17:43:00",
    "updatedAt": "2025-12-04T17:43:00"
  },
  {
    "id": "ORD-111",
    "referenceNumber": "SS-2025-00111",
    "customerName": "Manila Skylight Studio",
    "customerPhone": "0930-170-4090",
    "deliveryAddress": "210 C5 Road, Las Piñas",
    "deliveryDate": "2025-11-07",
    "items": [
      {
        "productId": "PRD-071",
        "name": "Double Glazed Unit 6+6 - Lot B",
        "quantity": 16,
        "unitPrice": 2850,
        "lineTotal": 45600
      },
      {
        "productId": "PRD-082",
        "name": "Aluminum Angle Bar 2x2 - Bronze Finish",
        "quantity": 46,
        "unitPrice": 275,
        "lineTotal": 12650
      },
      {
        "productId": "PRD-093",
        "name": "Aluminum Handle Standard - Bronze Finish",
        "quantity": 12,
        "unitPrice": 185,
        "lineTotal": 2220
      }
    ],
    "subtotal": 60470,
    "total": 60470,
    "paidAmount": 33258,
    "paymentStatus": "partial",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2025-11-07T08:50:00",
    "updatedAt": "2025-11-07T08:50:00"
  },
  {
    "id": "ORD-112",
    "referenceNumber": "SS-2025-00112",
    "customerName": "Parañaque Modular Glass",
    "customerPhone": "0931-177-4109",
    "deliveryAddress": "211 Aguinaldo Highway, Cavite City",
    "deliveryDate": "2025-12-10",
    "items": [
      {
        "productId": "PRD-076",
        "name": "Aluminum Frame 2x4 inch - Bronze Finish",
        "quantity": 34,
        "unitPrice": 305,
        "lineTotal": 10370
      }
    ],
    "subtotal": 10370,
    "total": 10370,
    "paidAmount": 10370,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 1556,
    "refundReason": "Client changed cut-size specification",
    "refundType": "partial",
    "createdAt": "2025-12-10T09:57:00",
    "updatedAt": "2025-12-10T09:57:00"
  },
  {
    "id": "ORD-113",
    "referenceNumber": "SS-2025-00113",
    "customerName": "Antipolo Home Concepts",
    "customerPhone": "0932-184-4128",
    "deliveryAddress": "212 Alabang-Zapote Road, Calamba",
    "deliveryDate": "2025-11-13",
    "items": [
      {
        "productId": "PRD-081",
        "name": "Aluminum Angle Bar 1x1 - Bronze Finish",
        "quantity": 36,
        "unitPrice": 205,
        "lineTotal": 7380
      },
      {
        "productId": "PRD-092",
        "name": "Aluminum Composite Panel Black - Bronze Finish",
        "quantity": 25,
        "unitPrice": 1330,
        "lineTotal": 33250
      }
    ],
    "subtotal": 40630,
    "total": 40630,
    "paidAmount": 40630,
    "paymentStatus": "paid",
    "orderStatus": "delivered",
    "refundedAmount": 0,
    "createdAt": "2025-11-13T10:04:00",
    "updatedAt": "2025-11-13T10:04:00"
  },
  {
    "id": "ORD-114",
    "referenceNumber": "SS-2025-00114",
    "customerName": "Ortigas Office Fit-Out",
    "customerPhone": "0933-191-4147",
    "deliveryAddress": "213 Marcos Highway, Malabon",
    "deliveryDate": "2025-12-16",
    "items": [
      {
        "productId": "PRD-086",
        "name": "Aluminum Tube Square 1.5 inch - Bronze Finish",
        "quantity": 38,
        "unitPrice": 355,
        "lineTotal": 13490
      },
      {
        "productId": "PRD-097",
        "name": "Aluminum Lockset Sliding - Bronze Finish",
        "quantity": 2,
        "unitPrice": 645,
        "lineTotal": 1290
      },
      {
        "productId": "PRD-108",
        "name": "Tempered Glass 10mm - Commercial Grade",
        "quantity": 9,
        "unitPrice": 1905,
        "lineTotal": 17145
      }
    ],
    "subtotal": 31925,
    "total": 31925,
    "paidAmount": 31925,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2025-12-16T11:11:00",
    "updatedAt": "2025-12-16T11:11:00"
  },
  {
    "id": "ORD-115",
    "referenceNumber": "SS-2025-00115",
    "customerName": "Las Piñas Aluminum Craft",
    "customerPhone": "0934-198-4166",
    "deliveryAddress": "214 MacArthur Highway, Makati",
    "deliveryDate": "2025-11-19",
    "items": [
      {
        "productId": "PRD-091",
        "name": "Aluminum Composite Panel White - Bronze Finish",
        "quantity": 20,
        "unitPrice": 1390,
        "lineTotal": 27800
      }
    ],
    "subtotal": 27800,
    "total": 27800,
    "paidAmount": 27800,
    "paymentStatus": "paid",
    "orderStatus": "in_transit",
    "refundedAmount": 0,
    "createdAt": "2025-11-19T12:18:00",
    "updatedAt": "2025-11-19T12:18:00"
  },
  {
    "id": "ORD-116",
    "referenceNumber": "SS-2025-00116",
    "customerName": "Fairview Glass Traders",
    "customerPhone": "0935-205-4185",
    "deliveryAddress": "215 Gil Puyat Avenue, Mandaluyong",
    "deliveryDate": "2025-12-22",
    "items": [
      {
        "productId": "PRD-096",
        "name": "Aluminum Roller Nylon Bearing - Bronze Finish",
        "quantity": 42,
        "unitPrice": 290,
        "lineTotal": 12180
      },
      {
        "productId": "PRD-107",
        "name": "Tempered Glass 8mm - Commercial Grade",
        "quantity": 4,
        "unitPrice": 1540,
        "lineTotal": 6160
      }
    ],
    "subtotal": 18340,
    "total": 18340,
    "paidAmount": 10087,
    "paymentStatus": "partial",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-12-22T13:25:00",
    "updatedAt": "2025-12-22T13:25:00"
  },
  {
    "id": "ORD-117",
    "referenceNumber": "SS-2025-00117",
    "customerName": "Sta. Rosa Buildmart",
    "customerPhone": "0936-212-4204",
    "deliveryAddress": "216 Ayala Avenue, Valenzuela",
    "deliveryDate": "2025-11-25",
    "items": [
      {
        "productId": "PRD-101",
        "name": "Clear Float Glass 4mm - Commercial Grade",
        "quantity": 22,
        "unitPrice": 555,
        "lineTotal": 12210
      },
      {
        "productId": "PRD-112",
        "name": "Reflective Glass Bronze 6mm - Commercial Grade",
        "quantity": 5,
        "unitPrice": 1265,
        "lineTotal": 6325
      },
      {
        "productId": "PRD-003",
        "name": "Clear Float Glass 6mm",
        "quantity": 12,
        "unitPrice": 705,
        "lineTotal": 8460
      }
    ],
    "subtotal": 26995,
    "total": 26995,
    "paidAmount": 26995,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-11-25T14:32:00",
    "updatedAt": "2025-11-25T14:32:00"
  },
  {
    "id": "ORD-118",
    "referenceNumber": "SS-2025-00118",
    "customerName": "Alabang Interior Works",
    "customerPhone": "0937-219-4223",
    "deliveryAddress": "217 Katipunan Avenue, Muntinlupa",
    "deliveryDate": "2025-12-01",
    "items": [
      {
        "productId": "PRD-106",
        "name": "Tempered Glass 6mm - Commercial Grade",
        "quantity": 23,
        "unitPrice": 1275,
        "lineTotal": 29325
      }
    ],
    "subtotal": 29325,
    "total": 29325,
    "paidAmount": 0,
    "paymentStatus": "unpaid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-12-01T15:39:00",
    "updatedAt": "2025-12-01T15:39:00"
  },
  {
    "id": "ORD-119",
    "referenceNumber": "SS-2025-00119",
    "customerName": "Navotas Industrial Supply",
    "customerPhone": "0938-226-4242",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2025-11-04",
    "items": [
      {
        "productId": "PRD-111",
        "name": "Laminated Glass 8mm - Commercial Grade",
        "quantity": 24,
        "unitPrice": 2000,
        "lineTotal": 48000
      },
      {
        "productId": "PRD-002",
        "name": "Clear Float Glass 5mm",
        "quantity": 7,
        "unitPrice": 580,
        "lineTotal": 4060
      }
    ],
    "subtotal": 52060,
    "total": 52060,
    "paidAmount": 52060,
    "paymentStatus": "paid",
    "orderStatus": "processing",
    "refundedAmount": 0,
    "createdAt": "2025-11-04T16:46:00",
    "updatedAt": "2025-11-04T16:46:00"
  },
  {
    "id": "ORD-120",
    "referenceNumber": "SS-2025-00120",
    "customerName": "Malabon Glasshouse",
    "customerPhone": "0939-233-4261",
    "deliveryAddress": "Pickup",
    "deliveryDate": "2025-12-07",
    "items": [
      {
        "productId": "PRD-116",
        "name": "Frosted Glass 8mm - Commercial Grade",
        "quantity": 25,
        "unitPrice": 1270,
        "lineTotal": 31750
      },
      {
        "productId": "PRD-007",
        "name": "Tempered Glass 8mm",
        "quantity": 8,
        "unitPrice": 1565,
        "lineTotal": 12520
      },
      {
        "productId": "PRD-018",
        "name": "Mirror 6mm",
        "quantity": 15,
        "unitPrice": 870,
        "lineTotal": 13050
      }
    ],
    "subtotal": 57320,
    "total": 57320,
    "paidAmount": 57320,
    "paymentStatus": "paid",
    "orderStatus": "cancelled",
    "refundedAmount": 0,
    "createdAt": "2025-12-07T17:53:00",
    "updatedAt": "2025-12-07T17:53:00"
  }
];

export const seedDeliveries: Delivery[] = [
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
    "destination": "103 Ortigas Extension, Parañaque",
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
    "destination": "110 C5 Road, Las Piñas",
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
    "destination": "123 Ortigas Extension, Parañaque",
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
    "destination": "130 C5 Road, Las Piñas",
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
    "destination": "143 Ortigas Extension, Parañaque",
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
    "destination": "150 C5 Road, Las Piñas",
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
    "destination": "163 Ortigas Extension, Parañaque",
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
    "destination": "170 C5 Road, Las Piñas",
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
    "destination": "183 Ortigas Extension, Parañaque",
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
    "destination": "190 C5 Road, Las Piñas",
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
    "destination": "203 Ortigas Extension, Parañaque",
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
    "destination": "210 C5 Road, Las Piñas",
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

export const seedMovements: StockMovement[] = [
  {
    "id": "MOV-000001",
    "productId": "PRD-001",
    "type": "inbound",
    "quantity": 60,
    "referenceNo": "PO-2026-0001",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000002",
    "productId": "PRD-001",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0001",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000003",
    "productId": "PRD-002",
    "type": "inbound",
    "quantity": 105,
    "referenceNo": "PO-2026-0002",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000004",
    "productId": "PRD-002",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0002",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000005",
    "productId": "PRD-003",
    "type": "inbound",
    "quantity": 142,
    "referenceNo": "PO-2026-0003",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000006",
    "productId": "PRD-003",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0003",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000007",
    "productId": "PRD-004",
    "type": "inbound",
    "quantity": 179,
    "referenceNo": "PO-2026-0004",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000008",
    "productId": "PRD-004",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0004",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000009",
    "productId": "PRD-005",
    "type": "inbound",
    "quantity": 216,
    "referenceNo": "PO-2026-0005",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000010",
    "productId": "PRD-005",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0005",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000011",
    "productId": "PRD-006",
    "type": "inbound",
    "quantity": 253,
    "referenceNo": "PO-2026-0006",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000012",
    "productId": "PRD-006",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0006",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000013",
    "productId": "PRD-007",
    "type": "inbound",
    "quantity": 290,
    "referenceNo": "PO-2026-0007",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000014",
    "productId": "PRD-007",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0007",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000015",
    "productId": "PRD-008",
    "type": "inbound",
    "quantity": 327,
    "referenceNo": "PO-2026-0008",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000016",
    "productId": "PRD-008",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0008",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000017",
    "productId": "PRD-009",
    "type": "inbound",
    "quantity": 364,
    "referenceNo": "PO-2026-0009",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000018",
    "productId": "PRD-009",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0009",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000019",
    "productId": "PRD-010",
    "type": "inbound",
    "quantity": 401,
    "referenceNo": "PO-2026-0010",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000020",
    "productId": "PRD-010",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0010",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000021",
    "productId": "PRD-011",
    "type": "inbound",
    "quantity": 438,
    "referenceNo": "PO-2026-0011",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000022",
    "productId": "PRD-011",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0011",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000023",
    "productId": "PRD-012",
    "type": "inbound",
    "quantity": 475,
    "referenceNo": "PO-2026-0012",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000024",
    "productId": "PRD-012",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0012",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000025",
    "productId": "PRD-013",
    "type": "inbound",
    "quantity": 512,
    "referenceNo": "PO-2026-0013",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000026",
    "productId": "PRD-013",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0013",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000027",
    "productId": "PRD-014",
    "type": "inbound",
    "quantity": 549,
    "referenceNo": "PO-2026-0014",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000028",
    "productId": "PRD-014",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0014",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000029",
    "productId": "PRD-015",
    "type": "inbound",
    "quantity": 586,
    "referenceNo": "PO-2026-0015",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000030",
    "productId": "PRD-015",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0015",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000031",
    "productId": "PRD-016",
    "type": "inbound",
    "quantity": 103,
    "referenceNo": "PO-2026-0016",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000032",
    "productId": "PRD-016",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0016",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000033",
    "productId": "PRD-017",
    "type": "inbound",
    "quantity": 140,
    "referenceNo": "PO-2026-0017",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000034",
    "productId": "PRD-017",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0017",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000035",
    "productId": "PRD-018",
    "type": "inbound",
    "quantity": 77,
    "referenceNo": "PO-2026-0018",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000036",
    "productId": "PRD-018",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0018",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000037",
    "productId": "PRD-019",
    "type": "inbound",
    "quantity": 214,
    "referenceNo": "PO-2026-0019",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000038",
    "productId": "PRD-019",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0019",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000039",
    "productId": "PRD-020",
    "type": "inbound",
    "quantity": 251,
    "referenceNo": "PO-2026-0020",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000040",
    "productId": "PRD-020",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0020",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000041",
    "productId": "PRD-021",
    "type": "inbound",
    "quantity": 288,
    "referenceNo": "PO-2026-0021",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000042",
    "productId": "PRD-021",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0021",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000043",
    "productId": "PRD-022",
    "type": "inbound",
    "quantity": 325,
    "referenceNo": "PO-2026-0022",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000044",
    "productId": "PRD-022",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0022",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000045",
    "productId": "PRD-023",
    "type": "inbound",
    "quantity": 362,
    "referenceNo": "PO-2026-0023",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000046",
    "productId": "PRD-023",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0023",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000047",
    "productId": "PRD-024",
    "type": "inbound",
    "quantity": 60,
    "referenceNo": "PO-2026-0024",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000048",
    "productId": "PRD-024",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0024",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000049",
    "productId": "PRD-025",
    "type": "inbound",
    "quantity": 436,
    "referenceNo": "PO-2026-0025",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000050",
    "productId": "PRD-025",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0025",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000051",
    "productId": "PRD-026",
    "type": "inbound",
    "quantity": 473,
    "referenceNo": "PO-2026-0026",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000052",
    "productId": "PRD-026",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0026",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000053",
    "productId": "PRD-027",
    "type": "inbound",
    "quantity": 510,
    "referenceNo": "PO-2026-0027",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000054",
    "productId": "PRD-027",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0027",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000055",
    "productId": "PRD-028",
    "type": "inbound",
    "quantity": 547,
    "referenceNo": "PO-2026-0028",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000056",
    "productId": "PRD-028",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0028",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000057",
    "productId": "PRD-029",
    "type": "inbound",
    "quantity": 584,
    "referenceNo": "PO-2026-0029",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000058",
    "productId": "PRD-029",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0029",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000059",
    "productId": "PRD-030",
    "type": "inbound",
    "quantity": 101,
    "referenceNo": "PO-2026-0030",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000060",
    "productId": "PRD-030",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0030",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000061",
    "productId": "PRD-031",
    "type": "inbound",
    "quantity": 138,
    "referenceNo": "PO-2026-0031",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000062",
    "productId": "PRD-031",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0031",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000063",
    "productId": "PRD-032",
    "type": "inbound",
    "quantity": 175,
    "referenceNo": "PO-2026-0032",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000064",
    "productId": "PRD-032",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0032",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000065",
    "productId": "PRD-033",
    "type": "inbound",
    "quantity": 212,
    "referenceNo": "PO-2026-0033",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000066",
    "productId": "PRD-033",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0033",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000067",
    "productId": "PRD-034",
    "type": "inbound",
    "quantity": 249,
    "referenceNo": "PO-2026-0034",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000068",
    "productId": "PRD-034",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0034",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000069",
    "productId": "PRD-035",
    "type": "inbound",
    "quantity": 102,
    "referenceNo": "PO-2026-0035",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000070",
    "productId": "PRD-035",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0035",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000071",
    "productId": "PRD-036",
    "type": "inbound",
    "quantity": 323,
    "referenceNo": "PO-2026-0036",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000072",
    "productId": "PRD-036",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0036",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000073",
    "productId": "PRD-037",
    "type": "inbound",
    "quantity": 360,
    "referenceNo": "PO-2026-0037",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000074",
    "productId": "PRD-037",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0037",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000075",
    "productId": "PRD-038",
    "type": "inbound",
    "quantity": 397,
    "referenceNo": "PO-2026-0038",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000076",
    "productId": "PRD-038",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0038",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000077",
    "productId": "PRD-039",
    "type": "inbound",
    "quantity": 434,
    "referenceNo": "PO-2026-0039",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000078",
    "productId": "PRD-039",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0039",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000079",
    "productId": "PRD-040",
    "type": "inbound",
    "quantity": 471,
    "referenceNo": "PO-2026-0040",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000080",
    "productId": "PRD-040",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0040",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000081",
    "productId": "PRD-041",
    "type": "inbound",
    "quantity": 508,
    "referenceNo": "PO-2026-0041",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000082",
    "productId": "PRD-041",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0041",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000083",
    "productId": "PRD-042",
    "type": "inbound",
    "quantity": 545,
    "referenceNo": "PO-2026-0042",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000084",
    "productId": "PRD-042",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0042",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000085",
    "productId": "PRD-043",
    "type": "inbound",
    "quantity": 582,
    "referenceNo": "PO-2026-0043",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000086",
    "productId": "PRD-043",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0043",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000087",
    "productId": "PRD-044",
    "type": "inbound",
    "quantity": 99,
    "referenceNo": "PO-2026-0044",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000088",
    "productId": "PRD-044",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0044",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000089",
    "productId": "PRD-045",
    "type": "inbound",
    "quantity": 136,
    "referenceNo": "PO-2026-0045",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000090",
    "productId": "PRD-045",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0045",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000091",
    "productId": "PRD-046",
    "type": "inbound",
    "quantity": 173,
    "referenceNo": "PO-2026-0046",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000092",
    "productId": "PRD-046",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0046",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000093",
    "productId": "PRD-047",
    "type": "inbound",
    "quantity": 60,
    "referenceNo": "PO-2026-0047",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000094",
    "productId": "PRD-047",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0047",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000095",
    "productId": "PRD-048",
    "type": "inbound",
    "quantity": 247,
    "referenceNo": "PO-2026-0048",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000096",
    "productId": "PRD-048",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0048",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000097",
    "productId": "PRD-049",
    "type": "inbound",
    "quantity": 284,
    "referenceNo": "PO-2026-0049",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000098",
    "productId": "PRD-049",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0049",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000099",
    "productId": "PRD-050",
    "type": "inbound",
    "quantity": 321,
    "referenceNo": "PO-2026-0050",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000100",
    "productId": "PRD-050",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0050",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000101",
    "productId": "PRD-051",
    "type": "inbound",
    "quantity": 358,
    "referenceNo": "PO-2026-0051",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000102",
    "productId": "PRD-051",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0051",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000103",
    "productId": "PRD-052",
    "type": "inbound",
    "quantity": 100,
    "referenceNo": "PO-2026-0052",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000104",
    "productId": "PRD-052",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0052",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000105",
    "productId": "PRD-053",
    "type": "inbound",
    "quantity": 432,
    "referenceNo": "PO-2026-0053",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000106",
    "productId": "PRD-053",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0053",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000107",
    "productId": "PRD-054",
    "type": "inbound",
    "quantity": 469,
    "referenceNo": "PO-2026-0054",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000108",
    "productId": "PRD-054",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0054",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000109",
    "productId": "PRD-055",
    "type": "inbound",
    "quantity": 506,
    "referenceNo": "PO-2026-0055",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000110",
    "productId": "PRD-055",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0055",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000111",
    "productId": "PRD-056",
    "type": "inbound",
    "quantity": 543,
    "referenceNo": "PO-2026-0056",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000112",
    "productId": "PRD-056",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0056",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000113",
    "productId": "PRD-057",
    "type": "inbound",
    "quantity": 580,
    "referenceNo": "PO-2026-0057",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000114",
    "productId": "PRD-057",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0057",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000115",
    "productId": "PRD-058",
    "type": "inbound",
    "quantity": 97,
    "referenceNo": "PO-2026-0058",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000116",
    "productId": "PRD-058",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0058",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000117",
    "productId": "PRD-059",
    "type": "inbound",
    "quantity": 134,
    "referenceNo": "PO-2026-0059",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000118",
    "productId": "PRD-059",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0059",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000119",
    "productId": "PRD-060",
    "type": "inbound",
    "quantity": 171,
    "referenceNo": "PO-2026-0060",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000120",
    "productId": "PRD-060",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0060",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000121",
    "productId": "PRD-061",
    "type": "inbound",
    "quantity": 208,
    "referenceNo": "PO-2026-0061",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000122",
    "productId": "PRD-061",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0061",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000123",
    "productId": "PRD-062",
    "type": "inbound",
    "quantity": 245,
    "referenceNo": "PO-2026-0062",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000124",
    "productId": "PRD-062",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0062",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000125",
    "productId": "PRD-063",
    "type": "inbound",
    "quantity": 282,
    "referenceNo": "PO-2026-0063",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000126",
    "productId": "PRD-063",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0063",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000127",
    "productId": "PRD-064",
    "type": "inbound",
    "quantity": 319,
    "referenceNo": "PO-2026-0064",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000128",
    "productId": "PRD-064",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0064",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000129",
    "productId": "PRD-065",
    "type": "inbound",
    "quantity": 356,
    "referenceNo": "PO-2026-0065",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000130",
    "productId": "PRD-065",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0065",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000131",
    "productId": "PRD-066",
    "type": "inbound",
    "quantity": 393,
    "referenceNo": "PO-2026-0066",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000132",
    "productId": "PRD-066",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0066",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000133",
    "productId": "PRD-067",
    "type": "inbound",
    "quantity": 430,
    "referenceNo": "PO-2026-0067",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000134",
    "productId": "PRD-067",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0067",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000135",
    "productId": "PRD-068",
    "type": "inbound",
    "quantity": 467,
    "referenceNo": "PO-2026-0068",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000136",
    "productId": "PRD-068",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0068",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000137",
    "productId": "PRD-069",
    "type": "inbound",
    "quantity": 84,
    "referenceNo": "PO-2026-0069",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000138",
    "productId": "PRD-069",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0069",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000139",
    "productId": "PRD-070",
    "type": "inbound",
    "quantity": 60,
    "referenceNo": "PO-2026-0070",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000140",
    "productId": "PRD-070",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0070",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000141",
    "productId": "PRD-071",
    "type": "inbound",
    "quantity": 578,
    "referenceNo": "PO-2026-0071",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000142",
    "productId": "PRD-071",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0071",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000143",
    "productId": "PRD-072",
    "type": "inbound",
    "quantity": 95,
    "referenceNo": "PO-2026-0072",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000144",
    "productId": "PRD-072",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0072",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000145",
    "productId": "PRD-073",
    "type": "inbound",
    "quantity": 132,
    "referenceNo": "PO-2026-0073",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000146",
    "productId": "PRD-073",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0073",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000147",
    "productId": "PRD-074",
    "type": "inbound",
    "quantity": 169,
    "referenceNo": "PO-2026-0074",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000148",
    "productId": "PRD-074",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0074",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000149",
    "productId": "PRD-075",
    "type": "inbound",
    "quantity": 206,
    "referenceNo": "PO-2026-0075",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000150",
    "productId": "PRD-075",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0075",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000151",
    "productId": "PRD-076",
    "type": "inbound",
    "quantity": 243,
    "referenceNo": "PO-2026-0076",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000152",
    "productId": "PRD-076",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0076",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000153",
    "productId": "PRD-077",
    "type": "inbound",
    "quantity": 280,
    "referenceNo": "PO-2026-0077",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000154",
    "productId": "PRD-077",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0077",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000155",
    "productId": "PRD-078",
    "type": "inbound",
    "quantity": 317,
    "referenceNo": "PO-2026-0078",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000156",
    "productId": "PRD-078",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0078",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000157",
    "productId": "PRD-079",
    "type": "inbound",
    "quantity": 354,
    "referenceNo": "PO-2026-0079",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000158",
    "productId": "PRD-079",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0079",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000159",
    "productId": "PRD-080",
    "type": "inbound",
    "quantity": 391,
    "referenceNo": "PO-2026-0080",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000160",
    "productId": "PRD-080",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0080",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000161",
    "productId": "PRD-081",
    "type": "inbound",
    "quantity": 428,
    "referenceNo": "PO-2026-0081",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000162",
    "productId": "PRD-081",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0081",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000163",
    "productId": "PRD-082",
    "type": "inbound",
    "quantity": 465,
    "referenceNo": "PO-2026-0082",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000164",
    "productId": "PRD-082",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0082",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000165",
    "productId": "PRD-083",
    "type": "inbound",
    "quantity": 502,
    "referenceNo": "PO-2026-0083",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000166",
    "productId": "PRD-083",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0083",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000167",
    "productId": "PRD-084",
    "type": "inbound",
    "quantity": 539,
    "referenceNo": "PO-2026-0084",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000168",
    "productId": "PRD-084",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0084",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000169",
    "productId": "PRD-085",
    "type": "inbound",
    "quantity": 576,
    "referenceNo": "PO-2026-0085",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000170",
    "productId": "PRD-085",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0085",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000171",
    "productId": "PRD-086",
    "type": "inbound",
    "quantity": 100,
    "referenceNo": "PO-2026-0086",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000172",
    "productId": "PRD-086",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0086",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000173",
    "productId": "PRD-087",
    "type": "inbound",
    "quantity": 130,
    "referenceNo": "PO-2026-0087",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000174",
    "productId": "PRD-087",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0087",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000175",
    "productId": "PRD-088",
    "type": "inbound",
    "quantity": 167,
    "referenceNo": "PO-2026-0088",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000176",
    "productId": "PRD-088",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0088",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000177",
    "productId": "PRD-089",
    "type": "inbound",
    "quantity": 204,
    "referenceNo": "PO-2026-0089",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000178",
    "productId": "PRD-089",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0089",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000179",
    "productId": "PRD-090",
    "type": "inbound",
    "quantity": 241,
    "referenceNo": "PO-2026-0090",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000180",
    "productId": "PRD-090",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0090",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000181",
    "productId": "PRD-091",
    "type": "inbound",
    "quantity": 278,
    "referenceNo": "PO-2026-0091",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000182",
    "productId": "PRD-091",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0091",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000183",
    "productId": "PRD-092",
    "type": "inbound",
    "quantity": 315,
    "referenceNo": "PO-2026-0092",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000184",
    "productId": "PRD-092",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0092",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000185",
    "productId": "PRD-093",
    "type": "inbound",
    "quantity": 60,
    "referenceNo": "PO-2026-0093",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000186",
    "productId": "PRD-093",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0093",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000187",
    "productId": "PRD-094",
    "type": "inbound",
    "quantity": 389,
    "referenceNo": "PO-2026-0094",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000188",
    "productId": "PRD-094",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0094",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000189",
    "productId": "PRD-095",
    "type": "inbound",
    "quantity": 426,
    "referenceNo": "PO-2026-0095",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000190",
    "productId": "PRD-095",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0095",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000191",
    "productId": "PRD-096",
    "type": "inbound",
    "quantity": 463,
    "referenceNo": "PO-2026-0096",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000192",
    "productId": "PRD-096",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0096",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000193",
    "productId": "PRD-097",
    "type": "inbound",
    "quantity": 500,
    "referenceNo": "PO-2026-0097",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000194",
    "productId": "PRD-097",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0097",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000195",
    "productId": "PRD-098",
    "type": "inbound",
    "quantity": 537,
    "referenceNo": "PO-2026-0098",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000196",
    "productId": "PRD-098",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0098",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000197",
    "productId": "PRD-099",
    "type": "inbound",
    "quantity": 574,
    "referenceNo": "PO-2026-0099",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000198",
    "productId": "PRD-099",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0099",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000199",
    "productId": "PRD-100",
    "type": "inbound",
    "quantity": 91,
    "referenceNo": "PO-2026-0100",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000200",
    "productId": "PRD-100",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0100",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000201",
    "productId": "PRD-101",
    "type": "inbound",
    "quantity": 128,
    "referenceNo": "PO-2026-0101",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000202",
    "productId": "PRD-101",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0101",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000203",
    "productId": "PRD-102",
    "type": "inbound",
    "quantity": 165,
    "referenceNo": "PO-2026-0102",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000204",
    "productId": "PRD-102",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0102",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000205",
    "productId": "PRD-103",
    "type": "inbound",
    "quantity": 102,
    "referenceNo": "PO-2026-0103",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000206",
    "productId": "PRD-103",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0103",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000207",
    "productId": "PRD-104",
    "type": "inbound",
    "quantity": 239,
    "referenceNo": "PO-2026-0104",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000208",
    "productId": "PRD-104",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0104",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000209",
    "productId": "PRD-105",
    "type": "inbound",
    "quantity": 276,
    "referenceNo": "PO-2026-0105",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000210",
    "productId": "PRD-105",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0105",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000211",
    "productId": "PRD-106",
    "type": "inbound",
    "quantity": 313,
    "referenceNo": "PO-2026-0106",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000212",
    "productId": "PRD-106",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0106",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000213",
    "productId": "PRD-107",
    "type": "inbound",
    "quantity": 350,
    "referenceNo": "PO-2026-0107",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000214",
    "productId": "PRD-107",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0107",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000215",
    "productId": "PRD-108",
    "type": "inbound",
    "quantity": 387,
    "referenceNo": "PO-2026-0108",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000216",
    "productId": "PRD-108",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0108",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000217",
    "productId": "PRD-109",
    "type": "inbound",
    "quantity": 424,
    "referenceNo": "PO-2026-0109",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000218",
    "productId": "PRD-109",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0109",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000219",
    "productId": "PRD-110",
    "type": "inbound",
    "quantity": 461,
    "referenceNo": "PO-2026-0110",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000220",
    "productId": "PRD-110",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0110",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000221",
    "productId": "PRD-111",
    "type": "inbound",
    "quantity": 498,
    "referenceNo": "PO-2026-0111",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000222",
    "productId": "PRD-111",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0111",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000223",
    "productId": "PRD-112",
    "type": "inbound",
    "quantity": 535,
    "referenceNo": "PO-2026-0112",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000224",
    "productId": "PRD-112",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0112",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000225",
    "productId": "PRD-113",
    "type": "inbound",
    "quantity": 572,
    "referenceNo": "PO-2026-0113",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000226",
    "productId": "PRD-113",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0113",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000227",
    "productId": "PRD-114",
    "type": "inbound",
    "quantity": 89,
    "referenceNo": "PO-2026-0114",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000228",
    "productId": "PRD-114",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0114",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000229",
    "productId": "PRD-115",
    "type": "inbound",
    "quantity": 126,
    "referenceNo": "PO-2026-0115",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000230",
    "productId": "PRD-115",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0115",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000231",
    "productId": "PRD-116",
    "type": "inbound",
    "quantity": 60,
    "referenceNo": "PO-2026-0116",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000232",
    "productId": "PRD-116",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0116",
    "supplier": "Asahi Glass Philippines",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000233",
    "productId": "PRD-117",
    "type": "inbound",
    "quantity": 200,
    "referenceNo": "PO-2026-0117",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000234",
    "productId": "PRD-117",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0117",
    "supplier": "AGC Flat Glass",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000235",
    "productId": "PRD-118",
    "type": "inbound",
    "quantity": 237,
    "referenceNo": "PO-2026-0118",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000236",
    "productId": "PRD-118",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0118",
    "supplier": "Pioneer Aluminum Inc",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000237",
    "productId": "PRD-119",
    "type": "inbound",
    "quantity": 274,
    "referenceNo": "PO-2026-0119",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000238",
    "productId": "PRD-119",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0119",
    "supplier": "Republic Glass & Aluminum",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000239",
    "productId": "PRD-120",
    "type": "inbound",
    "quantity": 84,
    "referenceNo": "PO-2026-0120",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-01-05T09:00:00Z",
    "createdBy": "admin@smartstock.local"
  },
  {
    "id": "MOV-000240",
    "productId": "PRD-120",
    "type": "inbound",
    "quantity": 40,
    "referenceNo": "PO-2026-RESTOCK-0120",
    "supplier": "Apex Extrusions Corp",
    "occurredAt": "2026-04-12T10:30:00Z",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000241",
    "productId": "PRD-001",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00001-1",
    "occurredAt": "2026-01-01T08:00:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000242",
    "productId": "PRD-006",
    "type": "outbound",
    "quantity": 3,
    "referenceNo": "SO-SS-2026-00002-1",
    "occurredAt": "2026-02-04T09:07:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000243",
    "productId": "PRD-017",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00002-2",
    "occurredAt": "2026-02-04T09:07:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000244",
    "productId": "PRD-011",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00003-1",
    "occurredAt": "2026-03-07T10:14:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000245",
    "productId": "PRD-022",
    "type": "outbound",
    "quantity": 11,
    "referenceNo": "SO-SS-2026-00003-2",
    "occurredAt": "2026-03-07T10:14:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000246",
    "productId": "PRD-033",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00003-3",
    "occurredAt": "2026-03-07T10:14:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000247",
    "productId": "PRD-016",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00004-1",
    "occurredAt": "2026-04-10T11:21:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000248",
    "productId": "PRD-021",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2026-00005-1",
    "occurredAt": "2026-05-13T12:28:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000249",
    "productId": "PRD-032",
    "type": "outbound",
    "quantity": 26,
    "referenceNo": "SO-SS-2026-00005-2",
    "occurredAt": "2026-05-13T12:28:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000250",
    "productId": "PRD-026",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2026-00006-1",
    "occurredAt": "2026-06-16T13:35:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000251",
    "productId": "PRD-037",
    "type": "outbound",
    "quantity": 28,
    "referenceNo": "SO-SS-2026-00006-2",
    "occurredAt": "2026-06-16T13:35:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000252",
    "productId": "PRD-048",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2026-00006-3",
    "occurredAt": "2026-06-16T13:35:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000253",
    "productId": "PRD-031",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00007-1",
    "occurredAt": "2026-07-19T14:42:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000254",
    "productId": "PRD-036",
    "type": "outbound",
    "quantity": 18,
    "referenceNo": "SO-SS-2026-00008-1",
    "occurredAt": "2026-01-22T15:49:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000255",
    "productId": "PRD-047",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00008-2",
    "occurredAt": "2026-01-22T15:49:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000256",
    "productId": "PRD-041",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00009-1",
    "occurredAt": "2026-02-25T16:56:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000257",
    "productId": "PRD-052",
    "type": "outbound",
    "quantity": 17,
    "referenceNo": "SO-SS-2026-00009-2",
    "occurredAt": "2026-02-25T16:56:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000258",
    "productId": "PRD-063",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00009-3",
    "occurredAt": "2026-02-25T16:56:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000259",
    "productId": "PRD-051",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00011-1",
    "occurredAt": "2026-04-04T08:10:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000260",
    "productId": "PRD-062",
    "type": "outbound",
    "quantity": 19,
    "referenceNo": "SO-SS-2026-00011-2",
    "occurredAt": "2026-04-04T08:10:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000261",
    "productId": "PRD-056",
    "type": "outbound",
    "quantity": 13,
    "referenceNo": "SO-SS-2026-00012-1",
    "occurredAt": "2026-05-07T09:17:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000262",
    "productId": "PRD-067",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2026-00012-2",
    "occurredAt": "2026-05-07T09:17:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000263",
    "productId": "PRD-078",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2026-00012-3",
    "occurredAt": "2026-05-07T09:17:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000264",
    "productId": "PRD-061",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2026-00013-1",
    "occurredAt": "2026-06-10T10:24:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000265",
    "productId": "PRD-066",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00014-1",
    "occurredAt": "2026-07-13T11:31:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000266",
    "productId": "PRD-077",
    "type": "outbound",
    "quantity": 44,
    "referenceNo": "SO-SS-2026-00014-2",
    "occurredAt": "2026-07-13T11:31:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000267",
    "productId": "PRD-071",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00015-1",
    "occurredAt": "2026-01-16T12:38:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000268",
    "productId": "PRD-082",
    "type": "outbound",
    "quantity": 46,
    "referenceNo": "SO-SS-2026-00015-2",
    "occurredAt": "2026-01-16T12:38:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000269",
    "productId": "PRD-093",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00015-3",
    "occurredAt": "2026-01-16T12:38:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000270",
    "productId": "PRD-076",
    "type": "outbound",
    "quantity": 34,
    "referenceNo": "SO-SS-2026-00016-1",
    "occurredAt": "2026-02-19T13:45:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000271",
    "productId": "PRD-081",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00017-1",
    "occurredAt": "2026-03-22T14:52:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000272",
    "productId": "PRD-092",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00017-2",
    "occurredAt": "2026-03-22T14:52:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000273",
    "productId": "PRD-086",
    "type": "outbound",
    "quantity": 38,
    "referenceNo": "SO-SS-2026-00018-1",
    "occurredAt": "2026-04-25T15:59:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000274",
    "productId": "PRD-097",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00018-2",
    "occurredAt": "2026-04-25T15:59:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000275",
    "productId": "PRD-108",
    "type": "outbound",
    "quantity": 9,
    "referenceNo": "SO-SS-2026-00018-3",
    "occurredAt": "2026-04-25T15:59:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000276",
    "productId": "PRD-091",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2026-00019-1",
    "occurredAt": "2026-05-01T16:06:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000277",
    "productId": "PRD-101",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2026-00021-1",
    "occurredAt": "2026-07-07T08:20:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000278",
    "productId": "PRD-112",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00021-2",
    "occurredAt": "2026-07-07T08:20:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000279",
    "productId": "PRD-003",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00021-3",
    "occurredAt": "2026-07-07T08:20:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000280",
    "productId": "PRD-106",
    "type": "outbound",
    "quantity": 23,
    "referenceNo": "SO-SS-2026-00022-1",
    "occurredAt": "2026-01-10T09:27:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000281",
    "productId": "PRD-111",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00023-1",
    "occurredAt": "2026-02-13T10:34:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000282",
    "productId": "PRD-002",
    "type": "outbound",
    "quantity": 7,
    "referenceNo": "SO-SS-2026-00023-2",
    "occurredAt": "2026-02-13T10:34:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000283",
    "productId": "PRD-116",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00024-1",
    "occurredAt": "2026-03-16T11:41:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000284",
    "productId": "PRD-007",
    "type": "outbound",
    "quantity": 8,
    "referenceNo": "SO-SS-2026-00024-2",
    "occurredAt": "2026-03-16T11:41:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000285",
    "productId": "PRD-018",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00024-3",
    "occurredAt": "2026-03-16T11:41:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000286",
    "productId": "PRD-001",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00025-1",
    "occurredAt": "2026-04-19T12:48:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000287",
    "productId": "PRD-006",
    "type": "outbound",
    "quantity": 3,
    "referenceNo": "SO-SS-2026-00026-1",
    "occurredAt": "2026-05-22T13:55:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000288",
    "productId": "PRD-017",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00026-2",
    "occurredAt": "2026-05-22T13:55:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000289",
    "productId": "PRD-011",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00027-1",
    "occurredAt": "2026-06-25T14:02:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000290",
    "productId": "PRD-022",
    "type": "outbound",
    "quantity": 11,
    "referenceNo": "SO-SS-2026-00027-2",
    "occurredAt": "2026-06-25T14:02:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000291",
    "productId": "PRD-033",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00027-3",
    "occurredAt": "2026-06-25T14:02:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000292",
    "productId": "PRD-016",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00028-1",
    "occurredAt": "2026-07-01T15:09:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000293",
    "productId": "PRD-021",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2026-00029-1",
    "occurredAt": "2026-01-04T16:16:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000294",
    "productId": "PRD-032",
    "type": "outbound",
    "quantity": 26,
    "referenceNo": "SO-SS-2026-00029-2",
    "occurredAt": "2026-01-04T16:16:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000295",
    "productId": "PRD-031",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00031-1",
    "occurredAt": "2026-03-10T08:30:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000296",
    "productId": "PRD-036",
    "type": "outbound",
    "quantity": 18,
    "referenceNo": "SO-SS-2026-00032-1",
    "occurredAt": "2026-04-13T09:37:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000297",
    "productId": "PRD-047",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00032-2",
    "occurredAt": "2026-04-13T09:37:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000298",
    "productId": "PRD-041",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00033-1",
    "occurredAt": "2026-05-16T10:44:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000299",
    "productId": "PRD-052",
    "type": "outbound",
    "quantity": 17,
    "referenceNo": "SO-SS-2026-00033-2",
    "occurredAt": "2026-05-16T10:44:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000300",
    "productId": "PRD-063",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00033-3",
    "occurredAt": "2026-05-16T10:44:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000301",
    "productId": "PRD-046",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2026-00034-1",
    "occurredAt": "2026-06-19T11:51:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000302",
    "productId": "PRD-051",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00035-1",
    "occurredAt": "2026-07-22T12:58:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000303",
    "productId": "PRD-062",
    "type": "outbound",
    "quantity": 19,
    "referenceNo": "SO-SS-2026-00035-2",
    "occurredAt": "2026-07-22T12:58:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000304",
    "productId": "PRD-056",
    "type": "outbound",
    "quantity": 13,
    "referenceNo": "SO-SS-2026-00036-1",
    "occurredAt": "2026-01-25T13:05:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000305",
    "productId": "PRD-067",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2026-00036-2",
    "occurredAt": "2026-01-25T13:05:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000306",
    "productId": "PRD-078",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2026-00036-3",
    "occurredAt": "2026-01-25T13:05:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000307",
    "productId": "PRD-061",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2026-00037-1",
    "occurredAt": "2026-02-01T14:12:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000308",
    "productId": "PRD-066",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00038-1",
    "occurredAt": "2026-03-04T15:19:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000309",
    "productId": "PRD-077",
    "type": "outbound",
    "quantity": 44,
    "referenceNo": "SO-SS-2026-00038-2",
    "occurredAt": "2026-03-04T15:19:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000310",
    "productId": "PRD-071",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00039-1",
    "occurredAt": "2026-04-07T16:26:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000311",
    "productId": "PRD-082",
    "type": "outbound",
    "quantity": 46,
    "referenceNo": "SO-SS-2026-00039-2",
    "occurredAt": "2026-04-07T16:26:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000312",
    "productId": "PRD-093",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00039-3",
    "occurredAt": "2026-04-07T16:26:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000313",
    "productId": "PRD-081",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00041-1",
    "occurredAt": "2026-06-13T08:40:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000314",
    "productId": "PRD-092",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00041-2",
    "occurredAt": "2026-06-13T08:40:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000315",
    "productId": "PRD-086",
    "type": "outbound",
    "quantity": 38,
    "referenceNo": "SO-SS-2026-00042-1",
    "occurredAt": "2026-07-16T09:47:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000316",
    "productId": "PRD-097",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00042-2",
    "occurredAt": "2026-07-16T09:47:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000317",
    "productId": "PRD-108",
    "type": "outbound",
    "quantity": 9,
    "referenceNo": "SO-SS-2026-00042-3",
    "occurredAt": "2026-07-16T09:47:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000318",
    "productId": "PRD-091",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2026-00043-1",
    "occurredAt": "2026-01-19T10:54:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000319",
    "productId": "PRD-096",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2026-00044-1",
    "occurredAt": "2026-02-22T11:01:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000320",
    "productId": "PRD-107",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00044-2",
    "occurredAt": "2026-02-22T11:01:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000321",
    "productId": "PRD-101",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2026-00045-1",
    "occurredAt": "2026-03-25T12:08:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000322",
    "productId": "PRD-112",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00045-2",
    "occurredAt": "2026-03-25T12:08:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000323",
    "productId": "PRD-003",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00045-3",
    "occurredAt": "2026-03-25T12:08:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000324",
    "productId": "PRD-106",
    "type": "outbound",
    "quantity": 23,
    "referenceNo": "SO-SS-2026-00046-1",
    "occurredAt": "2026-04-01T13:15:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000325",
    "productId": "PRD-111",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00047-1",
    "occurredAt": "2026-05-04T14:22:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000326",
    "productId": "PRD-002",
    "type": "outbound",
    "quantity": 7,
    "referenceNo": "SO-SS-2026-00047-2",
    "occurredAt": "2026-05-04T14:22:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000327",
    "productId": "PRD-116",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00048-1",
    "occurredAt": "2026-06-07T15:29:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000328",
    "productId": "PRD-007",
    "type": "outbound",
    "quantity": 8,
    "referenceNo": "SO-SS-2026-00048-2",
    "occurredAt": "2026-06-07T15:29:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000329",
    "productId": "PRD-018",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00048-3",
    "occurredAt": "2026-06-07T15:29:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000330",
    "productId": "PRD-001",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00049-1",
    "occurredAt": "2026-07-10T16:36:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000331",
    "productId": "PRD-011",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00051-1",
    "occurredAt": "2026-02-16T08:50:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000332",
    "productId": "PRD-022",
    "type": "outbound",
    "quantity": 11,
    "referenceNo": "SO-SS-2026-00051-2",
    "occurredAt": "2026-02-16T08:50:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000333",
    "productId": "PRD-033",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00051-3",
    "occurredAt": "2026-02-16T08:50:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000334",
    "productId": "PRD-016",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00052-1",
    "occurredAt": "2026-03-19T09:57:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000335",
    "productId": "PRD-021",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2026-00053-1",
    "occurredAt": "2026-04-22T10:04:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000336",
    "productId": "PRD-032",
    "type": "outbound",
    "quantity": 26,
    "referenceNo": "SO-SS-2026-00053-2",
    "occurredAt": "2026-04-22T10:04:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000337",
    "productId": "PRD-026",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2026-00054-1",
    "occurredAt": "2026-05-25T11:11:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000338",
    "productId": "PRD-037",
    "type": "outbound",
    "quantity": 28,
    "referenceNo": "SO-SS-2026-00054-2",
    "occurredAt": "2026-05-25T11:11:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000339",
    "productId": "PRD-048",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2026-00054-3",
    "occurredAt": "2026-05-25T11:11:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000340",
    "productId": "PRD-031",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00055-1",
    "occurredAt": "2026-06-01T12:18:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000341",
    "productId": "PRD-036",
    "type": "outbound",
    "quantity": 18,
    "referenceNo": "SO-SS-2026-00056-1",
    "occurredAt": "2026-07-04T13:25:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000342",
    "productId": "PRD-047",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00056-2",
    "occurredAt": "2026-07-04T13:25:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000343",
    "productId": "PRD-041",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00057-1",
    "occurredAt": "2026-01-07T14:32:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000344",
    "productId": "PRD-052",
    "type": "outbound",
    "quantity": 17,
    "referenceNo": "SO-SS-2026-00057-2",
    "occurredAt": "2026-01-07T14:32:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000345",
    "productId": "PRD-063",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00057-3",
    "occurredAt": "2026-01-07T14:32:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000346",
    "productId": "PRD-046",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2026-00058-1",
    "occurredAt": "2026-02-10T15:39:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000347",
    "productId": "PRD-051",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00059-1",
    "occurredAt": "2026-03-13T16:46:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000348",
    "productId": "PRD-062",
    "type": "outbound",
    "quantity": 19,
    "referenceNo": "SO-SS-2026-00059-2",
    "occurredAt": "2026-03-13T16:46:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000349",
    "productId": "PRD-061",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2026-00061-1",
    "occurredAt": "2026-05-19T08:00:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000350",
    "productId": "PRD-066",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00062-1",
    "occurredAt": "2026-06-22T09:07:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000351",
    "productId": "PRD-077",
    "type": "outbound",
    "quantity": 44,
    "referenceNo": "SO-SS-2026-00062-2",
    "occurredAt": "2026-06-22T09:07:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000352",
    "productId": "PRD-071",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00063-1",
    "occurredAt": "2026-07-25T10:14:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000353",
    "productId": "PRD-082",
    "type": "outbound",
    "quantity": 46,
    "referenceNo": "SO-SS-2026-00063-2",
    "occurredAt": "2026-07-25T10:14:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000354",
    "productId": "PRD-093",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00063-3",
    "occurredAt": "2026-07-25T10:14:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000355",
    "productId": "PRD-076",
    "type": "outbound",
    "quantity": 34,
    "referenceNo": "SO-SS-2026-00064-1",
    "occurredAt": "2026-01-01T11:21:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000356",
    "productId": "PRD-081",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00065-1",
    "occurredAt": "2026-02-04T12:28:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000357",
    "productId": "PRD-092",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00065-2",
    "occurredAt": "2026-02-04T12:28:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000358",
    "productId": "PRD-086",
    "type": "outbound",
    "quantity": 38,
    "referenceNo": "SO-SS-2026-00066-1",
    "occurredAt": "2026-03-07T13:35:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000359",
    "productId": "PRD-097",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00066-2",
    "occurredAt": "2026-03-07T13:35:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000360",
    "productId": "PRD-108",
    "type": "outbound",
    "quantity": 9,
    "referenceNo": "SO-SS-2026-00066-3",
    "occurredAt": "2026-03-07T13:35:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000361",
    "productId": "PRD-091",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2026-00067-1",
    "occurredAt": "2026-04-10T14:42:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000362",
    "productId": "PRD-096",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2026-00068-1",
    "occurredAt": "2026-05-13T15:49:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000363",
    "productId": "PRD-107",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00068-2",
    "occurredAt": "2026-05-13T15:49:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000364",
    "productId": "PRD-101",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2026-00069-1",
    "occurredAt": "2026-06-16T16:56:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000365",
    "productId": "PRD-112",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00069-2",
    "occurredAt": "2026-06-16T16:56:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000366",
    "productId": "PRD-003",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00069-3",
    "occurredAt": "2026-06-16T16:56:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000367",
    "productId": "PRD-111",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00071-1",
    "occurredAt": "2026-01-22T08:10:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000368",
    "productId": "PRD-002",
    "type": "outbound",
    "quantity": 7,
    "referenceNo": "SO-SS-2026-00071-2",
    "occurredAt": "2026-01-22T08:10:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000369",
    "productId": "PRD-116",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00072-1",
    "occurredAt": "2026-02-25T09:17:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000370",
    "productId": "PRD-007",
    "type": "outbound",
    "quantity": 8,
    "referenceNo": "SO-SS-2026-00072-2",
    "occurredAt": "2026-02-25T09:17:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000371",
    "productId": "PRD-018",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00072-3",
    "occurredAt": "2026-02-25T09:17:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000372",
    "productId": "PRD-001",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00073-1",
    "occurredAt": "2026-03-01T10:24:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000373",
    "productId": "PRD-006",
    "type": "outbound",
    "quantity": 3,
    "referenceNo": "SO-SS-2026-00074-1",
    "occurredAt": "2026-04-04T11:31:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000374",
    "productId": "PRD-017",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00074-2",
    "occurredAt": "2026-04-04T11:31:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000375",
    "productId": "PRD-011",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00075-1",
    "occurredAt": "2026-05-07T12:38:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000376",
    "productId": "PRD-022",
    "type": "outbound",
    "quantity": 11,
    "referenceNo": "SO-SS-2026-00075-2",
    "occurredAt": "2026-05-07T12:38:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000377",
    "productId": "PRD-033",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00075-3",
    "occurredAt": "2026-05-07T12:38:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000378",
    "productId": "PRD-016",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00076-1",
    "occurredAt": "2026-06-10T13:45:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000379",
    "productId": "PRD-021",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2026-00077-1",
    "occurredAt": "2026-07-13T14:52:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000380",
    "productId": "PRD-032",
    "type": "outbound",
    "quantity": 26,
    "referenceNo": "SO-SS-2026-00077-2",
    "occurredAt": "2026-07-13T14:52:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000381",
    "productId": "PRD-026",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2026-00078-1",
    "occurredAt": "2026-01-16T15:59:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000382",
    "productId": "PRD-037",
    "type": "outbound",
    "quantity": 28,
    "referenceNo": "SO-SS-2026-00078-2",
    "occurredAt": "2026-01-16T15:59:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000383",
    "productId": "PRD-048",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2026-00078-3",
    "occurredAt": "2026-01-16T15:59:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000384",
    "productId": "PRD-031",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00079-1",
    "occurredAt": "2026-02-19T16:06:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000385",
    "productId": "PRD-041",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00081-1",
    "occurredAt": "2026-04-25T08:20:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000386",
    "productId": "PRD-052",
    "type": "outbound",
    "quantity": 17,
    "referenceNo": "SO-SS-2026-00081-2",
    "occurredAt": "2026-04-25T08:20:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000387",
    "productId": "PRD-063",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00081-3",
    "occurredAt": "2026-04-25T08:20:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000388",
    "productId": "PRD-046",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2026-00082-1",
    "occurredAt": "2026-05-01T09:27:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000389",
    "productId": "PRD-051",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00083-1",
    "occurredAt": "2026-06-04T10:34:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000390",
    "productId": "PRD-062",
    "type": "outbound",
    "quantity": 19,
    "referenceNo": "SO-SS-2026-00083-2",
    "occurredAt": "2026-06-04T10:34:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000391",
    "productId": "PRD-056",
    "type": "outbound",
    "quantity": 13,
    "referenceNo": "SO-SS-2026-00084-1",
    "occurredAt": "2026-07-07T11:41:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000392",
    "productId": "PRD-067",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2026-00084-2",
    "occurredAt": "2026-07-07T11:41:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000393",
    "productId": "PRD-078",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2026-00084-3",
    "occurredAt": "2026-07-07T11:41:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000394",
    "productId": "PRD-061",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2026-00085-1",
    "occurredAt": "2026-01-10T12:48:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000395",
    "productId": "PRD-066",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00086-1",
    "occurredAt": "2026-02-13T13:55:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000396",
    "productId": "PRD-077",
    "type": "outbound",
    "quantity": 44,
    "referenceNo": "SO-SS-2026-00086-2",
    "occurredAt": "2026-02-13T13:55:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000397",
    "productId": "PRD-071",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2026-00087-1",
    "occurredAt": "2026-03-16T14:02:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000398",
    "productId": "PRD-082",
    "type": "outbound",
    "quantity": 46,
    "referenceNo": "SO-SS-2026-00087-2",
    "occurredAt": "2026-03-16T14:02:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000399",
    "productId": "PRD-093",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00087-3",
    "occurredAt": "2026-03-16T14:02:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000400",
    "productId": "PRD-076",
    "type": "outbound",
    "quantity": 34,
    "referenceNo": "SO-SS-2026-00088-1",
    "occurredAt": "2026-04-19T15:09:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000401",
    "productId": "PRD-081",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00089-1",
    "occurredAt": "2026-05-22T16:16:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000402",
    "productId": "PRD-092",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00089-2",
    "occurredAt": "2026-05-22T16:16:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000403",
    "productId": "PRD-091",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2026-00091-1",
    "occurredAt": "2026-07-01T08:30:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000404",
    "productId": "PRD-096",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2026-00092-1",
    "occurredAt": "2026-01-04T09:37:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000405",
    "productId": "PRD-107",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00092-2",
    "occurredAt": "2026-01-04T09:37:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000406",
    "productId": "PRD-101",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2026-00093-1",
    "occurredAt": "2026-02-07T10:44:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000407",
    "productId": "PRD-112",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2026-00093-2",
    "occurredAt": "2026-02-07T10:44:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000408",
    "productId": "PRD-003",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2026-00093-3",
    "occurredAt": "2026-02-07T10:44:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000409",
    "productId": "PRD-106",
    "type": "outbound",
    "quantity": 23,
    "referenceNo": "SO-SS-2026-00094-1",
    "occurredAt": "2026-03-10T11:51:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000410",
    "productId": "PRD-111",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2026-00095-1",
    "occurredAt": "2026-04-13T12:58:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000411",
    "productId": "PRD-002",
    "type": "outbound",
    "quantity": 7,
    "referenceNo": "SO-SS-2026-00095-2",
    "occurredAt": "2026-04-13T12:58:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000412",
    "productId": "PRD-116",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2026-00096-1",
    "occurredAt": "2026-05-16T13:05:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000413",
    "productId": "PRD-007",
    "type": "outbound",
    "quantity": 8,
    "referenceNo": "SO-SS-2026-00096-2",
    "occurredAt": "2026-05-16T13:05:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000414",
    "productId": "PRD-018",
    "type": "outbound",
    "quantity": 15,
    "referenceNo": "SO-SS-2026-00096-3",
    "occurredAt": "2026-05-16T13:05:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000415",
    "productId": "PRD-001",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2026-00097-1",
    "occurredAt": "2026-06-19T14:12:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000416",
    "productId": "PRD-006",
    "type": "outbound",
    "quantity": 3,
    "referenceNo": "SO-SS-2026-00098-1",
    "occurredAt": "2026-07-22T15:19:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000417",
    "productId": "PRD-017",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2026-00098-2",
    "occurredAt": "2026-07-22T15:19:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000418",
    "productId": "PRD-011",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2026-00099-1",
    "occurredAt": "2026-01-25T16:26:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000419",
    "productId": "PRD-022",
    "type": "outbound",
    "quantity": 11,
    "referenceNo": "SO-SS-2026-00099-2",
    "occurredAt": "2026-01-25T16:26:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000420",
    "productId": "PRD-033",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2026-00099-3",
    "occurredAt": "2026-01-25T16:26:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000421",
    "productId": "PRD-021",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2025-00101-1",
    "occurredAt": "2025-11-04T08:40:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000422",
    "productId": "PRD-032",
    "type": "outbound",
    "quantity": 26,
    "referenceNo": "SO-SS-2025-00101-2",
    "occurredAt": "2025-11-04T08:40:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000423",
    "productId": "PRD-026",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2025-00102-1",
    "occurredAt": "2025-12-07T09:47:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000424",
    "productId": "PRD-037",
    "type": "outbound",
    "quantity": 28,
    "referenceNo": "SO-SS-2025-00102-2",
    "occurredAt": "2025-12-07T09:47:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000425",
    "productId": "PRD-048",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2025-00102-3",
    "occurredAt": "2025-12-07T09:47:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000426",
    "productId": "PRD-031",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2025-00103-1",
    "occurredAt": "2025-11-10T10:54:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000427",
    "productId": "PRD-036",
    "type": "outbound",
    "quantity": 18,
    "referenceNo": "SO-SS-2025-00104-1",
    "occurredAt": "2025-12-13T11:01:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000428",
    "productId": "PRD-047",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2025-00104-2",
    "occurredAt": "2025-12-13T11:01:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000429",
    "productId": "PRD-041",
    "type": "outbound",
    "quantity": 10,
    "referenceNo": "SO-SS-2025-00105-1",
    "occurredAt": "2025-11-16T12:08:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000430",
    "productId": "PRD-052",
    "type": "outbound",
    "quantity": 17,
    "referenceNo": "SO-SS-2025-00105-2",
    "occurredAt": "2025-11-16T12:08:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000431",
    "productId": "PRD-063",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2025-00105-3",
    "occurredAt": "2025-11-16T12:08:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000432",
    "productId": "PRD-046",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2025-00106-1",
    "occurredAt": "2025-12-19T13:15:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000433",
    "productId": "PRD-051",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2025-00107-1",
    "occurredAt": "2025-11-22T14:22:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000434",
    "productId": "PRD-062",
    "type": "outbound",
    "quantity": 19,
    "referenceNo": "SO-SS-2025-00107-2",
    "occurredAt": "2025-11-22T14:22:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000435",
    "productId": "PRD-056",
    "type": "outbound",
    "quantity": 13,
    "referenceNo": "SO-SS-2025-00108-1",
    "occurredAt": "2025-12-25T15:29:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000436",
    "productId": "PRD-067",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2025-00108-2",
    "occurredAt": "2025-12-25T15:29:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000437",
    "productId": "PRD-078",
    "type": "outbound",
    "quantity": 6,
    "referenceNo": "SO-SS-2025-00108-3",
    "occurredAt": "2025-12-25T15:29:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000438",
    "productId": "PRD-061",
    "type": "outbound",
    "quantity": 14,
    "referenceNo": "SO-SS-2025-00109-1",
    "occurredAt": "2025-11-01T16:36:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000439",
    "productId": "PRD-071",
    "type": "outbound",
    "quantity": 16,
    "referenceNo": "SO-SS-2025-00111-1",
    "occurredAt": "2025-11-07T08:50:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000440",
    "productId": "PRD-082",
    "type": "outbound",
    "quantity": 46,
    "referenceNo": "SO-SS-2025-00111-2",
    "occurredAt": "2025-11-07T08:50:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000441",
    "productId": "PRD-093",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2025-00111-3",
    "occurredAt": "2025-11-07T08:50:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000442",
    "productId": "PRD-076",
    "type": "outbound",
    "quantity": 34,
    "referenceNo": "SO-SS-2025-00112-1",
    "occurredAt": "2025-12-10T09:57:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000443",
    "productId": "PRD-081",
    "type": "outbound",
    "quantity": 36,
    "referenceNo": "SO-SS-2025-00113-1",
    "occurredAt": "2025-11-13T10:04:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000444",
    "productId": "PRD-092",
    "type": "outbound",
    "quantity": 25,
    "referenceNo": "SO-SS-2025-00113-2",
    "occurredAt": "2025-11-13T10:04:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000445",
    "productId": "PRD-086",
    "type": "outbound",
    "quantity": 38,
    "referenceNo": "SO-SS-2025-00114-1",
    "occurredAt": "2025-12-16T11:11:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000446",
    "productId": "PRD-097",
    "type": "outbound",
    "quantity": 2,
    "referenceNo": "SO-SS-2025-00114-2",
    "occurredAt": "2025-12-16T11:11:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000447",
    "productId": "PRD-108",
    "type": "outbound",
    "quantity": 9,
    "referenceNo": "SO-SS-2025-00114-3",
    "occurredAt": "2025-12-16T11:11:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000448",
    "productId": "PRD-091",
    "type": "outbound",
    "quantity": 20,
    "referenceNo": "SO-SS-2025-00115-1",
    "occurredAt": "2025-11-19T12:18:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000449",
    "productId": "PRD-096",
    "type": "outbound",
    "quantity": 42,
    "referenceNo": "SO-SS-2025-00116-1",
    "occurredAt": "2025-12-22T13:25:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000450",
    "productId": "PRD-107",
    "type": "outbound",
    "quantity": 4,
    "referenceNo": "SO-SS-2025-00116-2",
    "occurredAt": "2025-12-22T13:25:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000451",
    "productId": "PRD-101",
    "type": "outbound",
    "quantity": 22,
    "referenceNo": "SO-SS-2025-00117-1",
    "occurredAt": "2025-11-25T14:32:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000452",
    "productId": "PRD-112",
    "type": "outbound",
    "quantity": 5,
    "referenceNo": "SO-SS-2025-00117-2",
    "occurredAt": "2025-11-25T14:32:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000453",
    "productId": "PRD-003",
    "type": "outbound",
    "quantity": 12,
    "referenceNo": "SO-SS-2025-00117-3",
    "occurredAt": "2025-11-25T14:32:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000454",
    "productId": "PRD-106",
    "type": "outbound",
    "quantity": 23,
    "referenceNo": "SO-SS-2025-00118-1",
    "occurredAt": "2025-12-01T15:39:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000455",
    "productId": "PRD-111",
    "type": "outbound",
    "quantity": 24,
    "referenceNo": "SO-SS-2025-00119-1",
    "occurredAt": "2025-11-04T16:46:00",
    "createdBy": "staff@smartstock.local"
  },
  {
    "id": "MOV-000456",
    "productId": "PRD-002",
    "type": "outbound",
    "quantity": 7,
    "referenceNo": "SO-SS-2025-00119-2",
    "occurredAt": "2025-11-04T16:46:00",
    "createdBy": "staff@smartstock.local"
  }
];
