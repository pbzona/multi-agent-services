import type {
  cartItems,
  carts,
  inventory,
  orderItems,
  orders,
  products,
  productVariants,
  users,
  workspaces,
} from "./schema.ts";

type WorkspaceInsert = typeof workspaces.$inferInsert;
type UserInsert = typeof users.$inferInsert;
type ProductInsert = typeof products.$inferInsert;
type VariantInsert = typeof productVariants.$inferInsert;
type InventoryInsert = typeof inventory.$inferInsert;
type CartInsert = typeof carts.$inferInsert;
type CartItemInsert = typeof cartItems.$inferInsert;
type OrderInsert = typeof orders.$inferInsert;
type OrderItemInsert = typeof orderItems.$inferInsert;

export const SEED_WORKSPACE_ID = "wrk_reference_store";
export const SEED_CUSTOMER_ID = "usr_customer_avery";
export const SEED_ADMIN_ID = "usr_admin_riley";
export const SEED_CART_ID = "cart_avery_current";

const createdAt = new Date("2026-01-15T12:00:00.000Z");
const updatedAt = new Date("2026-07-15T12:00:00.000Z");
const imageBaseUrl = "/products";

export const seedWorkspaces = [
  {
    id: SEED_WORKSPACE_ID,
    name: "Field & Form",
    createdAt,
    updatedAt,
  },
] satisfies WorkspaceInsert[];

export const seedUsers = [
  {
    id: SEED_CUSTOMER_ID,
    workspaceId: SEED_WORKSPACE_ID,
    email: "avery@example.com",
    name: "Avery Morgan",
    role: "customer",
    createdAt,
    updatedAt,
  },
  {
    id: SEED_ADMIN_ID,
    workspaceId: SEED_WORKSPACE_ID,
    email: "riley@example.com",
    name: "Riley Chen",
    role: "admin",
    createdAt,
    updatedAt,
  },
  {
    id: "usr_customer_jordan",
    workspaceId: SEED_WORKSPACE_ID,
    email: "jordan@example.com",
    name: "Jordan Bell",
    role: "customer",
    createdAt,
    updatedAt,
  },
] satisfies UserInsert[];

const productDefinitions = [
  {
    id: "prod_horizonDesk",
    slug: "horizon-standing-desk",
    name: "Horizon Standing Desk",
    description:
      "A quiet dual-motor desk with solid ash edging, four memory presets, and integrated cable routing.",
    category: "desks",
    featured: true,
  },
  {
    id: "prod_slateDesk",
    slug: "slate-writing-desk",
    name: "Slate Writing Desk",
    description:
      "A compact writing desk with a slim steel frame and a soft-close drawer for small home offices.",
    category: "desks",
    featured: false,
  },
  {
    id: "prod_arcChair",
    slug: "arc-task-chair",
    name: "Arc Task Chair",
    description:
      "An adjustable task chair with a breathable knit back, synchronized tilt, and a five-year frame warranty.",
    category: "seating",
    featured: true,
  },
  {
    id: "prod_beamArm",
    slug: "beam-monitor-arm",
    name: "Beam Monitor Arm",
    description:
      "A tool-free aluminum monitor arm for displays up to 32 inches and 20 pounds.",
    category: "desk-accessories",
    featured: false,
  },
  {
    id: "prod_haloLamp",
    slug: "halo-desk-lamp",
    name: "Halo Desk Lamp",
    description:
      "A dimmable, glare-free task light with warm-to-cool color control and a weighted base.",
    category: "lighting",
    featured: true,
  },
  {
    id: "prod_gridMat",
    slug: "grid-felt-desk-mat",
    name: "Grid Felt Desk Mat",
    description:
      "A dense recycled-felt work surface that protects the desktop and keeps a keyboard from drifting.",
    category: "desk-accessories",
    featured: false,
  },
  {
    id: "prod_dockTray",
    slug: "dock-valet-tray",
    name: "Dock Valet Tray",
    description:
      "A molded cork tray with divided spaces for keys, earbuds, and the small tools that gather on a desk.",
    category: "organization",
    featured: false,
  },
  {
    id: "prod_cableRail",
    slug: "under-desk-cable-rail",
    name: "Under-Desk Cable Rail",
    description:
      "A powder-coated steel rail that keeps power bricks off the floor without disposable plastic clips.",
    category: "organization",
    featured: false,
  },
  {
    id: "prod_foldStand",
    slug: "fold-laptop-stand",
    name: "Fold Laptop Stand",
    description:
      "A folding aluminum stand with six height positions and silicone contact points.",
    category: "desk-accessories",
    featured: false,
  },
  {
    id: "prod_havenTable",
    slug: "haven-side-table",
    name: "Haven Side Table",
    description:
      "A small solid-wood table sized for a reading chair, with a lower shelf for books and cables.",
    category: "home",
    featured: false,
  },
  {
    id: "prod_mossPlanter",
    slug: "moss-self-watering-planter",
    name: "Moss Self-Watering Planter",
    description:
      "A ceramic planter with a hidden water reservoir and a removable drainage insert.",
    category: "home",
    featured: false,
  },
  {
    id: "prod_softlineThrow",
    slug: "softline-wool-throw",
    name: "Softline Wool Throw",
    description:
      "A light merino-blend throw woven with a subtle grid and finished with short fringe.",
    category: "home",
    featured: false,
  },
] as const;

export const seedProducts = productDefinitions.map((product) => ({
  ...product,
  workspaceId: SEED_WORKSPACE_ID,
  imageUrls: [`${imageBaseUrl}/${product.slug}.jpg`],
  status: "active",
  createdAt,
  updatedAt,
})) satisfies ProductInsert[];

const variantDefinitions = [
  [
    "var_horizon48Walnut",
    "prod_horizonDesk",
    "DSK-HOR-48-WAL",
    "48 in / Walnut",
    89900,
    { size: "48 in", finish: "Walnut" },
  ],
  [
    "var_horizon60Oak",
    "prod_horizonDesk",
    "DSK-HOR-60-OAK",
    "60 in / White Oak",
    99900,
    { size: "60 in", finish: "White Oak" },
  ],
  [
    "var_horizon60Black",
    "prod_horizonDesk",
    "DSK-HOR-60-BLK",
    "60 in / Black",
    94900,
    { size: "60 in", finish: "Black" },
  ],
  [
    "var_slateOak",
    "prod_slateDesk",
    "DSK-SLT-OAK",
    "White Oak",
    54900,
    { finish: "White Oak" },
  ],
  [
    "var_slateWalnut",
    "prod_slateDesk",
    "DSK-SLT-WAL",
    "Walnut",
    57900,
    { finish: "Walnut" },
  ],
  [
    "var_arcSand",
    "prod_arcChair",
    "CHR-ARC-SND",
    "Sand",
    44900,
    { color: "Sand" },
  ],
  [
    "var_arcGraphite",
    "prod_arcChair",
    "CHR-ARC-GRA",
    "Graphite",
    44900,
    { color: "Graphite" },
  ],
  [
    "var_arcMoss",
    "prod_arcChair",
    "CHR-ARC-MOS",
    "Moss",
    46900,
    { color: "Moss" },
  ],
  [
    "var_beamSilver",
    "prod_beamArm",
    "ACC-BEM-SIL",
    "Brushed Aluminum",
    12900,
    { finish: "Brushed Aluminum" },
  ],
  [
    "var_haloBlack",
    "prod_haloLamp",
    "LGT-HAL-BLK",
    "Matte Black",
    14900,
    { color: "Matte Black" },
  ],
  [
    "var_haloBrass",
    "prod_haloLamp",
    "LGT-HAL-BRS",
    "Soft Brass",
    15900,
    { color: "Soft Brass" },
  ],
  [
    "var_gridCharcoal",
    "prod_gridMat",
    "ACC-GRD-CHR",
    "Charcoal",
    5900,
    { color: "Charcoal" },
  ],
  [
    "var_gridNavy",
    "prod_gridMat",
    "ACC-GRD-NAV",
    "Navy",
    5900,
    { color: "Navy" },
  ],
  ["var_gridOat", "prod_gridMat", "ACC-GRD-OAT", "Oat", 5900, { color: "Oat" }],
  [
    "var_dockNatural",
    "prod_dockTray",
    "ORG-DCK-NAT",
    "Natural Cork",
    6900,
    { color: "Natural Cork" },
  ],
  [
    "var_dockInk",
    "prod_dockTray",
    "ORG-DCK-INK",
    "Ink",
    6900,
    { color: "Ink" },
  ],
  [
    "var_rail24Black",
    "prod_cableRail",
    "ORG-RAL-24-BLK",
    "24 in / Black",
    3900,
    { size: "24 in", color: "Black" },
  ],
  [
    "var_rail36White",
    "prod_cableRail",
    "ORG-RAL-36-WHT",
    "36 in / White",
    4900,
    { size: "36 in", color: "White" },
  ],
  [
    "var_foldSilver",
    "prod_foldStand",
    "ACC-FLD-SIL",
    "Silver",
    7900,
    { color: "Silver" },
  ],
  [
    "var_foldBlack",
    "prod_foldStand",
    "ACC-FLD-BLK",
    "Black",
    7900,
    { color: "Black" },
  ],
  [
    "var_havenOak",
    "prod_havenTable",
    "HOM-HVN-OAK",
    "White Oak",
    22900,
    { finish: "White Oak" },
  ],
  [
    "var_havenWalnut",
    "prod_havenTable",
    "HOM-HVN-WAL",
    "Walnut",
    24900,
    { finish: "Walnut" },
  ],
  [
    "var_mossSage",
    "prod_mossPlanter",
    "HOM-MOS-SAG",
    "Sage / 6 in",
    4900,
    { color: "Sage", size: "6 in" },
  ],
  [
    "var_mossSand",
    "prod_mossPlanter",
    "HOM-MOS-SND",
    "Sand / 8 in",
    5900,
    { color: "Sand", size: "8 in" },
  ],
  [
    "var_softlineClay",
    "prod_softlineThrow",
    "HOM-SFT-CLY",
    "Clay",
    11900,
    { color: "Clay" },
  ],
  [
    "var_softlineInk",
    "prod_softlineThrow",
    "HOM-SFT-INK",
    "Ink",
    11900,
    { color: "Ink" },
  ],
] as const;

export const seedVariants = variantDefinitions.map(
  ([id, productId, sku, name, priceCents, attributes]) => ({
    id,
    productId,
    sku,
    name,
    priceCents,
    attributes: { ...attributes },
    active: true,
    createdAt,
    updatedAt,
  }),
) satisfies VariantInsert[];

const inventoryLevels = [
  ["var_horizon48Walnut", 8, 2, 3, false],
  ["var_horizon60Oak", 3, 1, 3, false],
  ["var_horizon60Black", 0, 0, 3, true],
  ["var_slateOak", 11, 1, 3, false],
  ["var_slateWalnut", 2, 0, 3, false],
  ["var_arcSand", 14, 3, 5, false],
  ["var_arcGraphite", 5, 1, 5, false],
  ["var_arcMoss", 0, 0, 5, false],
  ["var_beamSilver", 26, 4, 5, false],
  ["var_haloBlack", 19, 2, 5, false],
  ["var_haloBrass", 4, 0, 5, false],
  ["var_gridCharcoal", 42, 6, 8, false],
  ["var_gridNavy", 17, 1, 8, false],
  ["var_gridOat", 0, 0, 8, false],
  ["var_dockNatural", 31, 2, 6, false],
  ["var_dockInk", 3, 0, 6, false],
  ["var_rail24Black", 23, 4, 5, false],
  ["var_rail36White", 0, 0, 5, true],
  ["var_foldSilver", 15, 2, 5, false],
  ["var_foldBlack", 1, 0, 5, false],
  ["var_havenOak", 7, 1, 3, false],
  ["var_havenWalnut", 0, 0, 3, false],
  ["var_mossSage", 28, 3, 8, false],
  ["var_mossSand", 5, 0, 8, false],
  ["var_softlineClay", 12, 1, 5, false],
  ["var_softlineInk", 0, 0, 5, true],
] as const;

export const seedInventory = inventoryLevels.map(
  ([variantId, quantity, reserved, lowStockThreshold, backorder]) => {
    const available = quantity - reserved;
    const state =
      quantity === 0
        ? backorder
          ? "backorder"
          : "out_of_stock"
        : available <= lowStockThreshold
          ? "low_stock"
          : "in_stock";

    return {
      variantId,
      workspaceId: SEED_WORKSPACE_ID,
      quantity,
      reserved,
      lowStockThreshold,
      state,
      version: 1,
      updatedAt,
    };
  },
) satisfies InventoryInsert[];

export const seedCarts = [
  {
    id: SEED_CART_ID,
    workspaceId: SEED_WORKSPACE_ID,
    customerId: SEED_CUSTOMER_ID,
    status: "active",
    version: 3,
    createdAt,
    updatedAt,
  },
] satisfies CartInsert[];

export const seedCartItems = [
  {
    cartId: SEED_CART_ID,
    variantId: "var_gridNavy",
    quantity: 1,
    createdAt,
    updatedAt,
  },
  {
    cartId: SEED_CART_ID,
    variantId: "var_haloBlack",
    quantity: 1,
    createdAt,
    updatedAt,
  },
  {
    cartId: SEED_CART_ID,
    variantId: "var_rail24Black",
    quantity: 2,
    createdAt,
    updatedAt,
  },
] satisfies CartItemInsert[];

export const seedOrders = [
  {
    id: "ord_1001",
    workspaceId: SEED_WORKSPACE_ID,
    customerId: SEED_CUSTOMER_ID,
    number: "ORD-2026A001",
    status: "delivered",
    subtotalCents: 106700,
    shippingCents: 0,
    taxCents: 9069,
    totalCents: 115769,
    placedAt: new Date("2026-02-12T16:24:00.000Z"),
    createdAt: new Date("2026-02-12T16:24:00.000Z"),
    updatedAt: new Date("2026-02-18T14:05:00.000Z"),
  },
  {
    id: "ord_1002",
    workspaceId: SEED_WORKSPACE_ID,
    customerId: SEED_CUSTOMER_ID,
    number: "ORD-2026A002",
    status: "delivered",
    subtotalCents: 50800,
    shippingCents: 0,
    taxCents: 4318,
    totalCents: 55118,
    placedAt: new Date("2026-04-03T19:42:00.000Z"),
    createdAt: new Date("2026-04-03T19:42:00.000Z"),
    updatedAt: new Date("2026-04-09T17:31:00.000Z"),
  },
  {
    id: "ord_1003",
    workspaceId: SEED_WORKSPACE_ID,
    customerId: SEED_CUSTOMER_ID,
    number: "ORD-2026A003",
    status: "shipped",
    subtotalCents: 38700,
    shippingCents: 0,
    taxCents: 3290,
    totalCents: 41990,
    placedAt: new Date("2026-07-29T13:17:00.000Z"),
    createdAt: new Date("2026-07-29T13:17:00.000Z"),
    updatedAt: new Date("2026-08-01T08:45:00.000Z"),
  },
  {
    id: "ord_1004",
    workspaceId: SEED_WORKSPACE_ID,
    customerId: SEED_CUSTOMER_ID,
    number: "ORD-2026A004",
    status: "cancelled",
    subtotalCents: 19800,
    shippingCents: 1200,
    taxCents: 1683,
    totalCents: 22683,
    placedAt: new Date("2026-06-21T10:08:00.000Z"),
    createdAt: new Date("2026-06-21T10:08:00.000Z"),
    updatedAt: new Date("2026-06-21T11:02:00.000Z"),
  },
] satisfies OrderInsert[];

const productById = new Map<string, (typeof seedProducts)[number]>();
for (const product of seedProducts) productById.set(product.id, product);

const variantById = new Map<string, (typeof seedVariants)[number]>();
for (const variant of seedVariants) variantById.set(variant.id, variant);

function makeOrderItem(
  id: string,
  orderId: string,
  variantId: string,
  quantity: number,
  itemCreatedAt: Date,
) {
  const variant = variantById.get(variantId);
  const product = variant ? productById.get(variant.productId) : undefined;
  if (!variant || !product)
    throw new Error(`Invalid seed variant: ${variantId}`);

  return {
    id,
    orderId,
    productId: product.id,
    variantId: variant.id,
    productName: product.name,
    productSlug: product.slug,
    variantName: variant.name,
    sku: variant.sku,
    quantity,
    unitPriceCents: variant.priceCents,
    lineTotalCents: variant.priceCents * quantity,
    createdAt: itemCreatedAt,
  };
}

const order1At = new Date("2026-02-12T16:24:00.000Z");
const order2At = new Date("2026-04-03T19:42:00.000Z");
const order3At = new Date("2026-07-29T13:17:00.000Z");
const order4At = new Date("2026-06-21T10:08:00.000Z");

export const seedOrderItems = [
  makeOrderItem(
    "item_1001_desk",
    "ord_1001",
    "var_horizon48Walnut",
    1,
    order1At,
  ),
  makeOrderItem("item_1001_arm", "ord_1001", "var_beamSilver", 1, order1At),
  makeOrderItem("item_1001_rail", "ord_1001", "var_rail24Black", 1, order1At),
  makeOrderItem("item_1002_chair", "ord_1002", "var_arcSand", 1, order2At),
  makeOrderItem("item_1002_mat", "ord_1002", "var_gridCharcoal", 1, order2At),
  makeOrderItem("item_1003_lamps", "ord_1003", "var_haloBrass", 2, order3At),
  makeOrderItem("item_1003_tray", "ord_1003", "var_dockNatural", 1, order3At),
  makeOrderItem("item_1004_stand", "ord_1004", "var_foldSilver", 1, order4At),
  makeOrderItem("item_1004_throw", "ord_1004", "var_softlineClay", 1, order4At),
] satisfies OrderItemInsert[];
