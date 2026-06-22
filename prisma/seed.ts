// Seeds the global DefaultCategory / DefaultSubCategory master list.
// Idempotent: matches by name, creates missing rows only.
// Per-user copies are made at signup (SeedDefaultCategoriesUseCase) or lazily
// on first GET /categories for users created before this seed existed.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, AccountType } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Icon keys map to the mobile app's CategoryIcon glyph + tint table.
const DEFAULT_CATEGORIES: {
  name: string;
  icon: string;
  accountType: AccountType;
  subs: string[];
}[] = [
  { name: "Dining", icon: "coffee", accountType: "EXPENSE", subs: ["Coffee", "Restaurants", "Takeout"] },
  { name: "Fun", icon: "film", accountType: "EXPENSE", subs: ["Movies", "Subscriptions"] },
  { name: "Groceries", icon: "cart", accountType: "EXPENSE", subs: ["Supermarket", "Farmers market"] },
  { name: "Housing", icon: "home2", accountType: "EXPENSE", subs: ["Rent", "Insurance"] },
  { name: "Income", icon: "trendUp", accountType: "INCOME", subs: ["Salary", "Freelance"] },
  { name: "Transport", icon: "car", accountType: "EXPENSE", subs: ["Rideshare", "Transit", "Fuel"] },
  { name: "Utilities", icon: "zap", accountType: "EXPENSE", subs: [] },
];

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    let row = await prisma.defaultCategory.findFirst({ where: { name: cat.name } });
    if (!row) {
      row = await prisma.defaultCategory.create({
        data: { name: cat.name, icon: cat.icon, accountType: cat.accountType },
      });
    } else {
      row = await prisma.defaultCategory.update({
        where: { id: row.id },
        data: { icon: cat.icon, accountType: cat.accountType },
      });
    }
    for (const sub of cat.subs) {
      const existing = await prisma.defaultSubCategory.findFirst({
        where: { defaultCategoryId: row.id, name: sub },
      });
      if (!existing) {
        await prisma.defaultSubCategory.create({
          data: { defaultCategoryId: row.id, name: sub },
        });
      }
    }
  }
  const count = await prisma.defaultCategory.count();
  console.log(`Seeded default categories (${count} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
