import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DEFAULT_THEME_KEY, DEFAULT_THEME_TOKENS } from '../modules/theme/theme.tokens';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

type MenuSeed = {
  location: (typeof schema.menuLocationEnum.enumValues)[number];
  labelEn: string;
  labelBn: string;
  href: string;
  segment?: (typeof schema.audienceSegmentEnum.enumValues)[number];
  groupKey?: string;
  badgeText?: string;
  children?: MenuSeed[];
};

// ---------------------------------------------------------------------------
// Navigation — every row is admin-editable (reorder / hide / add) at runtime.
// ---------------------------------------------------------------------------

const HEADER_PRIMARY: MenuSeed[] = [
  {
    location: 'HEADER_PRIMARY',
    labelEn: 'Track Order',
    labelBn: 'অর্ডার ট্র্যাক',
    href: '/orders/track',
  },
  {
    location: 'HEADER_PRIMARY',
    labelEn: 'Store Locator',
    labelBn: 'স্টোর খুঁজুন',
    href: '/stores',
  },
  { location: 'HEADER_PRIMARY', labelEn: 'Help', labelBn: 'সহায়তা', href: '/help' },
];

const TOP_CATEGORY_BAR: MenuSeed[] = [
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'New Arrivals',
    labelBn: 'নতুন এসেছে',
    href: '/category/new-arrivals',
    badgeText: 'NEW',
  },
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'Skincare',
    labelBn: 'স্কিনকেয়ার',
    href: '/category/skincare',
  },
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'Makeup',
    labelBn: 'মেকআপ',
    href: '/category/makeup',
    segment: 'MAKEUP',
  },
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'Haircare',
    labelBn: 'হেয়ারকেয়ার',
    href: '/category/haircare',
  },
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'Fragrance',
    labelBn: 'সুগন্ধি',
    href: '/category/fragrance',
  },
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'Men',
    labelBn: 'পুরুষ',
    href: '/category/men',
    segment: 'MEN',
  },
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'Mom & Baby',
    labelBn: 'মা ও শিশু',
    href: '/category/mom-baby',
  },
  {
    location: 'TOP_CATEGORY_BAR',
    labelEn: 'Offers',
    labelBn: 'অফার',
    href: '/offers',
    badgeText: 'SALE',
  },
];

const SIDE_CATEGORY_PANEL: MenuSeed[] = [
  {
    location: 'SIDE_CATEGORY_PANEL',
    labelEn: 'Concern',
    labelBn: 'সমস্যা',
    href: '/shop?section=concern',
    children: [
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Acne & Blemishes',
        labelBn: 'ব্রণ ও দাগ',
        href: '/shop?concern=acne',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Dryness',
        labelBn: 'শুষ্কতা',
        href: '/shop?concern=dryness',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Pigmentation',
        labelBn: 'পিগমেন্টেশন',
        href: '/shop?concern=pigmentation',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Anti-ageing',
        labelBn: 'বয়সের ছাপ',
        href: '/shop?concern=anti-ageing',
      },
    ],
  },
  {
    location: 'SIDE_CATEGORY_PANEL',
    labelEn: 'Skin Type',
    labelBn: 'ত্বকের ধরন',
    href: '/shop?section=skin-type',
    children: [
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Oily',
        labelBn: 'তৈলাক্ত',
        href: '/shop?skinType=oily',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Dry',
        labelBn: 'শুষ্ক',
        href: '/shop?skinType=dry',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Combination',
        labelBn: 'মিশ্র',
        href: '/shop?skinType=combination',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Sensitive',
        labelBn: 'সংবেদনশীল',
        href: '/shop?skinType=sensitive',
      },
    ],
  },
  {
    location: 'SIDE_CATEGORY_PANEL',
    labelEn: 'Routine Step',
    labelBn: 'রুটিন ধাপ',
    href: '/shop?section=routine',
    children: [
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Cleanser',
        labelBn: 'ক্লেনজার',
        href: '/shop?step=cleanser',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Toner',
        labelBn: 'টোনার',
        href: '/shop?step=toner',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Serum',
        labelBn: 'সিরাম',
        href: '/shop?step=serum',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Moisturiser',
        labelBn: 'ময়েশ্চারাইজার',
        href: '/shop?step=moisturiser',
      },
      {
        location: 'SIDE_CATEGORY_PANEL',
        labelEn: 'Sunscreen',
        labelBn: 'সানস্ক্রিন',
        href: '/shop?step=sunscreen',
      },
    ],
  },
];

const MEGA_CATEGORY: MenuSeed[] = [
  {
    location: 'MEGA_CATEGORY',
    labelEn: 'Skincare',
    labelBn: 'স্কিনকেয়ার',
    href: '/category/skincare',
    children: [
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Serums',
        labelBn: 'সিরাম',
        href: '/category/skincare/serum',
      },
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Moisturisers',
        labelBn: 'ময়েশ্চারাইজার',
        href: '/category/skincare/moisturiser',
      },
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Sunscreen',
        labelBn: 'সানস্ক্রিন',
        href: '/category/skincare/sunscreen',
      },
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Cleansers',
        labelBn: 'ক্লেনজার',
        href: '/category/skincare/cleanser',
      },
    ],
  },
  {
    location: 'MEGA_CATEGORY',
    labelEn: 'Makeup',
    labelBn: 'মেকআপ',
    href: '/category/makeup',
    segment: 'MAKEUP',
    children: [
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Face',
        labelBn: 'ফেস',
        href: '/category/makeup/face',
        segment: 'MAKEUP',
      },
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Eyes',
        labelBn: 'চোখ',
        href: '/category/makeup/eyes',
        segment: 'MAKEUP',
      },
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Lips',
        labelBn: 'ঠোঁট',
        href: '/category/makeup/lips',
        segment: 'MAKEUP',
      },
    ],
  },
  {
    location: 'MEGA_CATEGORY',
    labelEn: 'Men',
    labelBn: 'পুরুষ',
    href: '/category/men',
    segment: 'MEN',
    children: [
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Beard Care',
        labelBn: 'দাড়ির যত্ন',
        href: '/category/men/beard',
        segment: 'MEN',
      },
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Face Wash',
        labelBn: 'ফেসওয়াশ',
        href: '/category/men/face-wash',
        segment: 'MEN',
      },
      {
        location: 'MEGA_CATEGORY',
        labelEn: 'Grooming Kits',
        labelBn: 'গ্রুমিং কিট',
        href: '/category/men/kits',
        segment: 'MEN',
      },
    ],
  },
];

const BRANDS = [
  { slug: 'cerave', name: 'CeraVe', country: 'USA', featured: true },
  { slug: 'the-ordinary', name: 'The Ordinary', country: 'Canada', featured: true },
  { slug: 'cosrx', name: 'COSRX', country: 'South Korea', featured: true },
  { slug: 'la-roche-posay', name: 'La Roche-Posay', country: 'France', featured: true },
  { slug: 'neutrogena', name: 'Neutrogena', country: 'USA' },
  { slug: 'himalaya', name: 'Himalaya', country: 'India' },
  { slug: 'nivea-men', name: 'NIVEA MEN', country: 'Germany' },
  { slug: 'maybelline', name: 'Maybelline', country: 'USA' },
  { slug: 'loreal-paris', name: "L'Oréal Paris", country: 'France' },
  { slug: 'garnier', name: 'Garnier', country: 'France' },
  { slug: 'skin1004', name: 'SKIN1004', country: 'South Korea' },
  { slug: 'beauty-of-joseon', name: 'Beauty of Joseon', country: 'South Korea', featured: true },
];

const RBAC_MODULES = [
  ['catalog', ['read', 'write', 'publish']],
  ['orders', ['read', 'write', 'override', 'refund']],
  ['inventory', ['read', 'write', 'transfer']],
  ['marketing', ['read', 'write', 'publish']],
  ['theme', ['read', 'write', 'publish']],
  ['customers', ['read', 'write']],
  ['accounting', ['read', 'write']],
  ['staff', ['read', 'write']],
] as const;

async function seedThemes(): Promise<void> {
  const [theme] = await db
    .insert(schema.themes)
    .values({
      key: DEFAULT_THEME_KEY,
      name: 'Aabha Signature',
      description: 'Creamy white, light gold and pinkish-gold accents on a warm off-black ink.',
      isActive: true,
      publishedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.themes.key,
      set: { isActive: true, name: 'Aabha Signature' },
    })
    .returning();

  if (!theme) throw new Error('Failed to seed theme');

  for (const [index, token] of DEFAULT_THEME_TOKENS.entries()) {
    await db
      .insert(schema.themeSettings)
      .values({
        themeId: theme.id,
        key: token.key,
        type: token.type,
        group: token.group,
        label: token.label,
        description: token.description,
        value: token.value,
        segmentValues: token.segmentValues,
        position: index,
        isPublic: token.isPublic ?? true,
      })
      .onConflictDoUpdate({
        target: [schema.themeSettings.themeId, schema.themeSettings.key],
        set: { label: token.label, type: token.type, group: token.group, position: index },
      });
  }
  console.info(`  ✓ theme "${theme.key}" with ${DEFAULT_THEME_TOKENS.length} tokens`);
}

async function seedMenu(items: MenuSeed[], parentId: string | null = null): Promise<void> {
  for (const [index, item] of items.entries()) {
    const [row] = await db
      .insert(schema.menuItems)
      .values({
        location: item.location,
        parentId,
        labelEn: item.labelEn,
        labelBn: item.labelBn,
        href: item.href,
        badgeText: item.badgeText,
        groupKey: item.groupKey,
        segment: item.segment ?? 'UNISEX',
        position: index,
      })
      .returning();
    if (item.children?.length && row) {
      await seedMenu(item.children, row.id);
    }
  }
}

async function seedCategories(): Promise<void> {
  const topBar = [
    { slug: 'skincare', en: 'Skincare', bn: 'স্কিনকেয়ার', segment: 'UNISEX' as const },
    { slug: 'makeup', en: 'Makeup', bn: 'মেকআপ', segment: 'MAKEUP' as const },
    { slug: 'haircare', en: 'Haircare', bn: 'হেয়ারকেয়ার', segment: 'UNISEX' as const },
    { slug: 'fragrance', en: 'Fragrance', bn: 'সুগন্ধি', segment: 'UNISEX' as const },
    { slug: 'men', en: 'Men', bn: 'পুরুষ', segment: 'MEN' as const },
    { slug: 'mom-baby', en: 'Mom & Baby', bn: 'মা ও শিশু', segment: 'UNISEX' as const },
  ];

  for (const [index, cat] of topBar.entries()) {
    const [parent] = await db
      .insert(schema.categories)
      .values({
        system: 'TOP_BAR',
        slug: cat.slug,
        nameEn: cat.en,
        nameBn: cat.bn,
        segment: cat.segment,
        position: index,
        metaTitleEn: `${cat.en} — Aabha Bangladesh`,
        metaDescriptionEn: `Shop authentic ${cat.en.toLowerCase()} products in Bangladesh with cash on delivery.`,
      })
      .onConflictDoNothing()
      .returning();

    if (parent && cat.slug === 'skincare') {
      const subs = [
        { slug: 'serum', en: 'Serum', bn: 'সিরাম' },
        { slug: 'moisturiser', en: 'Moisturiser', bn: 'ময়েশ্চারাইজার' },
        { slug: 'sunscreen', en: 'Sunscreen', bn: 'সানস্ক্রিন' },
        { slug: 'cleanser', en: 'Cleanser', bn: 'ক্লেনজার' },
      ];
      for (const [i, sub] of subs.entries()) {
        await db
          .insert(schema.categories)
          .values({
            system: 'TOP_BAR',
            parentId: parent.id,
            slug: `${cat.slug}/${sub.slug}`,
            nameEn: sub.en,
            nameBn: sub.bn,
            position: i,
          })
          .onConflictDoNothing();
      }
    }
  }

  const sidePanel = [
    { slug: 'concern', en: 'Concern', bn: 'সমস্যা' },
    { slug: 'skin-type', en: 'Skin Type', bn: 'ত্বকের ধরন' },
    { slug: 'routine-step', en: 'Routine Step', bn: 'রুটিন ধাপ' },
    { slug: 'price-range', en: 'Price Range', bn: 'দামের সীমা' },
  ];
  for (const [index, cat] of sidePanel.entries()) {
    await db
      .insert(schema.categories)
      .values({
        system: 'SIDE_PANEL',
        slug: cat.slug,
        nameEn: cat.en,
        nameBn: cat.bn,
        position: index,
      })
      .onConflictDoNothing();
  }
  console.info('  ✓ categories (both parallel systems)');
}

async function seedBrands(): Promise<void> {
  for (const [index, brand] of BRANDS.entries()) {
    await db
      .insert(schema.brands)
      .values({
        slug: brand.slug,
        name: brand.name,
        countryOfOrigin: brand.country,
        isFeatured: brand.featured ?? false,
        position: index,
        descriptionEn: `Authentic ${brand.name} products, imported and quality-checked by Aabha.`,
      })
      .onConflictDoNothing();

    // A–Z brand mega-menu entry.
    await db.insert(schema.menuItems).values({
      location: 'MEGA_BRAND',
      labelEn: brand.name,
      labelBn: brand.name,
      href: `/brand/${brand.slug}`,
      groupKey: brand.name
        .replace(/[^A-Za-z]/g, '')
        .charAt(0)
        .toUpperCase(),
      position: index,
    });
  }
  console.info(`  ✓ ${BRANDS.length} brands + A–Z mega-menu`);
}

async function seedRbac(): Promise<void> {
  const permissionIds: string[] = [];
  for (const [moduleName, actions] of RBAC_MODULES) {
    for (const action of actions) {
      const [perm] = await db
        .insert(schema.permissions)
        .values({
          key: `${moduleName}:${action}`,
          module: moduleName,
          action,
          description: `${action} access to the ${moduleName} module`,
        })
        .onConflictDoUpdate({ target: schema.permissions.key, set: { module: moduleName } })
        .returning();
      if (perm) permissionIds.push(perm.id);
    }
  }

  const roleSeeds = [
    { key: 'super-admin', name: 'Super Admin', all: true },
    { key: 'orders-manager', name: 'Orders Manager', modules: ['orders', 'customers'] },
    { key: 'inventory-manager', name: 'Inventory Manager', modules: ['inventory', 'catalog'] },
    { key: 'marketing-manager', name: 'Marketing Manager', modules: ['marketing', 'theme'] },
  ];

  for (const seed of roleSeeds) {
    const [role] = await db
      .insert(schema.roles)
      .values({ key: seed.key, name: seed.name, isSystem: true })
      .onConflictDoUpdate({ target: schema.roles.key, set: { name: seed.name } })
      .returning();
    if (!role) continue;

    const perms = await db.select().from(schema.permissions);
    const scoped = seed.all ? perms : perms.filter((p) => (seed.modules ?? []).includes(p.module));
    for (const perm of scoped) {
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: role.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
  }
  console.info(`  ✓ RBAC: ${permissionIds.length} permissions, ${roleSeeds.length} roles`);
}

async function seedUsers(): Promise<void> {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const admin = {
    email: 'admin@aabha.com.bd',
    phone: '01700000000',
    fullName: 'Aabha Admin',
    password: 'Aabha@2026',
  };

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, admin.email) });
  if (!existing) {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: admin.email,
        phone: admin.phone,
        fullName: admin.fullName,
        passwordHash: await bcrypt.hash(admin.password, rounds),
        role: 'SUPER_ADMIN',
        origin: 'ADMIN_CREATED',
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      })
      .returning();

    if (user) {
      const [staff] = await db
        .insert(schema.staffUsers)
        .values({ userId: user.id, employeeNo: 'AAB-0001', department: 'Management' })
        .returning();
      const superAdminRole = await db.query.roles.findFirst({
        where: eq(schema.roles.key, 'super-admin'),
      });
      if (staff && superAdminRole) {
        await db
          .insert(schema.staffRoles)
          .values({ staffUserId: staff.id, roleId: superAdminRole.id })
          .onConflictDoNothing();
      }
    }
    console.info(`  ✓ admin user ${admin.email} / ${admin.password}`);
  } else {
    console.info('  · admin user already present');
  }

  const shopper = await db.query.users.findFirst({
    where: eq(schema.users.email, 'shopper@example.com'),
  });
  if (!shopper) {
    await db.insert(schema.users).values({
      email: 'shopper@example.com',
      phone: '01811111111',
      fullName: 'Nusrat Jahan',
      passwordHash: await bcrypt.hash('Shopper@2026', rounds),
      role: 'CUSTOMER',
      locale: 'BN',
      emailVerifiedAt: new Date(),
    });
    console.info('  ✓ demo customer shopper@example.com / Shopper@2026');
  }
}

async function seedWarehouse(): Promise<void> {
  await db
    .insert(schema.warehouses)
    .values({
      code: 'DHK-01',
      name: 'Dhaka Main Warehouse',
      city: 'Dhaka',
      address: 'Banani, Dhaka 1213',
      isDefault: true,
    })
    .onConflictDoNothing();
  console.info('  ✓ default warehouse');
}

async function seedPageMeta(): Promise<void> {
  const pages = [
    {
      path: '/',
      titleEn: 'Aabha — Beauty & Personal Care in Bangladesh',
      titleBn: 'আভা — বাংলাদেশের বিউটি ও পার্সোনাল কেয়ার',
      descriptionEn:
        'Shop 100% authentic skincare, makeup, haircare and grooming essentials with cash on delivery across Bangladesh.',
      descriptionBn:
        'সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে ১০০% অরিজিনাল স্কিনকেয়ার, মেকআপ ও গ্রুমিং পণ্য কিনুন।',
    },
    {
      path: '/login',
      titleEn: 'Sign in or create your Aabha account',
      titleBn: 'আভা অ্যাকাউন্টে সাইন ইন বা রেজিস্টার করুন',
      noIndex: true,
    },
  ];
  for (const page of pages) {
    await db.insert(schema.pageMeta).values(page).onConflictDoNothing();
  }
  console.info('  ✓ page meta defaults');
}

async function main(): Promise<void> {
  console.info('Seeding Aabha database…');
  await seedThemes();

  const menuCount = await db.select().from(schema.menuItems);
  if (menuCount.length === 0) {
    await seedMenu(HEADER_PRIMARY);
    await seedMenu(TOP_CATEGORY_BAR);
    await seedMenu(SIDE_CATEGORY_PANEL);
    await seedMenu(MEGA_CATEGORY);
    console.info('  ✓ navigation (header, top bar, side panel, mega-menus)');
  } else {
    console.info('  · navigation already present');
  }

  await seedCategories();

  const brandCount = await db.select().from(schema.brands);
  if (brandCount.length === 0) await seedBrands();
  else console.info('  · brands already present');

  await seedRbac();
  await seedUsers();
  await seedWarehouse();
  await seedPageMeta();

  console.info('Seed complete.');
  await pool.end();
}

main().catch(async (error) => {
  console.error('Seed failed:', error);
  await pool.end();
  process.exit(1);
});
