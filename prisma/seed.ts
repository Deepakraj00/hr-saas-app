import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@hrportal.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@hrportal.com",
      password: hashPassword("admin123"),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "hr@hrportal.com" },
    update: {},
    create: {
      name: "HR Manager",
      email: "hr@hrportal.com",
      password: hashPassword("hr123"),
      role: "HR",
    },
  });

  const candidates = [
    { name: "Aarav Sharma", email: "aarav.s@gmail.com", phone: "9876543210", status: "NEW" },
    { name: "Priya Patel", email: "priya.p@gmail.com", phone: "9876543211", status: "IN_REVIEW" },
    { name: "Rohan Gupta", email: "rohan.g@gmail.com", phone: "9876543212", status: "INTERVIEW", interviewDate: new Date("2026-05-12"), interviewTime: "10:00" },
    { name: "Sneha Reddy", email: "sneha.r@gmail.com", phone: "9876543213", status: "HIRED", joiningDate: new Date("2026-05-15") },
    { name: "Vikram Singh", email: "vikram.s@gmail.com", phone: "9876543214", status: "REJECTED" },
    { name: "Ananya Iyer", email: "ananya.i@gmail.com", phone: "9876543215", status: "NEW" },
    { name: "Karthik Nair", email: "karthik.n@gmail.com", phone: "9876543216", status: "IN_REVIEW" },
    { name: "Meera Joshi", email: "meera.j@gmail.com", phone: "9876543217", status: "INTERVIEW", interviewDate: new Date("2026-05-11"), interviewTime: "14:30" },
    { name: "Arjun Das", email: "arjun.d@gmail.com", phone: "9876543218", status: "NEW" },
    { name: "Divya Menon", email: "divya.m@gmail.com", phone: "9876543219", status: "IN_REVIEW" },
  ];

  for (const c of candidates) {
    await prisma.candidate.create({ data: c });
  }

  const allCandidates = await prisma.candidate.findMany();
  const interviewCandidates = allCandidates.filter((c) => c.status === "INTERVIEW");

  for (const c of interviewCandidates) {
    await prisma.interview.create({
      data: {
        candidateId: c.id,
        scheduledAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        type: "TECHNICAL",
        status: "SCHEDULED",
        notes: `Technical interview for ${c.name}`,
      },
    });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
