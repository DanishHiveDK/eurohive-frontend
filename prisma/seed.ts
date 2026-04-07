import { PrismaClient, UserRole, Availability, ProjectStatus, BudgetType, ProposalStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Eurohive database...\n");

  // ── Users ──────────────────────────────────────────────────
  const passwordHash = await hash("EurohiveTest123!", 12);
  const now = new Date();

  const client1 = await prisma.user.create({
    data: {
      email: "marcus@techventures.de",
      passwordHash,
      role: UserRole.client,
      firstName: "Marcus",
      lastName: "Hoffmann",
      countryCode: "DE",
      status: "active",
      gdprConsentAt: now,
    },
  });

  const freelancer1 = await prisma.user.create({
    data: {
      email: "lena@bergstrom.se",
      passwordHash,
      role: UserRole.freelancer,
      firstName: "Lena",
      lastName: "Bergström",
      countryCode: "SE",
      status: "active",
      kycVerified: true,
      kycVerifiedAt: now,
      gdprConsentAt: now,
    },
  });

  const freelancer2 = await prisma.user.create({
    data: {
      email: "marco@rossi.it",
      passwordHash,
      role: UserRole.freelancer,
      firstName: "Marco",
      lastName: "Rossi",
      countryCode: "IT",
      status: "active",
      kycVerified: true,
      kycVerifiedAt: now,
      gdprConsentAt: now,
    },
  });

  const freelancer3 = await prisma.user.create({
    data: {
      email: "clara@jansen.nl",
      passwordHash,
      role: UserRole.freelancer,
      firstName: "Clara",
      lastName: "Jansen",
      countryCode: "NL",
      status: "active",
      kycVerified: true,
      kycVerifiedAt: now,
      gdprConsentAt: now,
    },
  });

  const freelancer4 = await prisma.user.create({
    data: {
      email: "erik@mueller.de",
      passwordHash,
      role: UserRole.freelancer,
      firstName: "Erik",
      lastName: "Müller",
      countryCode: "DE",
      status: "active",
      gdprConsentAt: now,
    },
  });

  const freelancer5 = await prisma.user.create({
    data: {
      email: "isabelle@dupont.fr",
      passwordHash,
      role: UserRole.freelancer,
      firstName: "Isabelle",
      lastName: "Dupont",
      countryCode: "FR",
      status: "active",
      gdprConsentAt: now,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@eurohive.eu",
      passwordHash,
      role: UserRole.admin,
      firstName: "Admin",
      lastName: "Eurohive",
      countryCode: "NL",
      status: "active",
      mfaEnabled: true,
      gdprConsentAt: now,
    },
  });

  console.log(`  ✅ Created ${7} users`);

  // ── Freelancer Profiles ────────────────────────────────────

  const profiles = [
    { userId: freelancer1.id, title: "Senior React & TypeScript Developer", bio: "Full-stack developer with 8 years of experience. Specializing in React, TypeScript, and Node.js for logistics and fintech.", hourlyRate: 95, availability: Availability.available, skills: ["React", "TypeScript", "Node.js", "AWS", "Tailwind CSS"], languages: ["en", "sv"], ratingAvg: 4.9, ratingCount: 47, completedProjects: 52, totalEarned: 186400 },
    { userId: freelancer2.id, title: "UI/UX Designer & Brand Strategist", bio: "Award-winning designer helping European startups build memorable brands. Expert in Figma and design systems.", hourlyRate: 85, availability: Availability.available, skills: ["Figma", "UI/UX", "Branding", "Illustration", "Webflow"], languages: ["en", "it", "fr"], ratingAvg: 4.8, ratingCount: 31, completedProjects: 38, totalEarned: 124800 },
    { userId: freelancer3.id, title: "Data Scientist & ML Engineer", bio: "Specializing in predictive analytics, NLP, and recommendation systems for e-commerce and fintech.", hourlyRate: 110, availability: Availability.busy, skills: ["Python", "TensorFlow", "SQL", "Spark", "NLP"], languages: ["en", "nl", "de"], ratingAvg: 4.9, ratingCount: 22, completedProjects: 24, totalEarned: 98600 },
    { userId: freelancer4.id, title: "DevOps & Cloud Infrastructure", bio: "AWS certified architect. Kubernetes, Terraform, and CI/CD specialist for enterprise-scale applications.", hourlyRate: 100, availability: Availability.available, skills: ["AWS", "Kubernetes", "Terraform", "Docker", "Go"], languages: ["en", "de"], ratingAvg: 4.9, ratingCount: 29, completedProjects: 31, totalEarned: 142000 },
    { userId: freelancer5.id, title: "SEO & Content Strategist", bio: "Multilingual content expert helping businesses grow organic traffic across European markets.", hourlyRate: 75, availability: Availability.available, skills: ["SEO", "Content Strategy", "Copywriting", "Analytics", "WordPress"], languages: ["en", "fr", "es"], ratingAvg: 4.7, ratingCount: 19, completedProjects: 22, totalEarned: 67200 },
  ];

  for (const p of profiles) {
    await prisma.freelancerProfile.create({ data: p });
  }
  console.log(`  ✅ Created ${profiles.length} freelancer profiles`);

  // ── Projects ───────────────────────────────────────────────

  const project1 = await prisma.project.create({
    data: {
      clientId: client1.id,
      title: "React Dashboard for Logistics SaaS",
      description: "Build a comprehensive logistics dashboard with real-time shipment tracking, analytics, driver management, and route optimization. Must handle 50K+ daily events. Tech stack: React, TypeScript, Tailwind CSS, REST API integration.",
      category: "Web Development",
      budgetType: BudgetType.fixed,
      budgetMin: 8000,
      budgetMax: 12000,
      skillsRequired: ["React", "TypeScript", "Tailwind CSS"],
      deadline: new Date("2026-03-30"),
      status: ProjectStatus.in_progress,
      proposalCount: 4,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      clientId: client1.id,
      title: "Brand Identity & Website for ClimateTech Startup",
      description: "Complete brand identity — logo, color palette, typography — plus a responsive marketing website with CMS integration.",
      category: "Design",
      budgetType: BudgetType.fixed,
      budgetMin: 5000,
      budgetMax: 8000,
      skillsRequired: ["Figma", "UI/UX", "Branding", "Webflow"],
      deadline: new Date("2026-04-15"),
      status: ProjectStatus.open,
      proposalCount: 6,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      clientId: client1.id,
      title: "ML-Powered Customer Churn Prediction",
      description: "Build and deploy a machine learning model to predict B2B customer churn using historical CRM and usage data.",
      category: "Data Science",
      budgetType: BudgetType.fixed,
      budgetMin: 6000,
      budgetMax: 9000,
      skillsRequired: ["Python", "TensorFlow", "SQL"],
      deadline: new Date("2026-05-01"),
      status: ProjectStatus.open,
      proposalCount: 2,
    },
  });

  console.log(`  ✅ Created 3 projects`);

  // ── Consent Logs (GDPR) ────────────────────────────────────

  const users = [client1, freelancer1, freelancer2, freelancer3, freelancer4, freelancer5, admin];
  for (const user of users) {
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        consentType: "terms",
        granted: true,
        ipAddress: "127.0.0.1",
        userAgent: "Eurohive Seed Script",
      },
    });
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        consentType: "privacy",
        granted: true,
        ipAddress: "127.0.0.1",
        userAgent: "Eurohive Seed Script",
      },
    });
  }

  console.log(`  ✅ Created ${users.length * 2} consent log entries`);

  console.log("\n🎉 Seeding complete!\n");
  console.log("  Login credentials (all users):");
  console.log("  Password: EurohiveTest123!");
  console.log("");
  console.log("  Client:     marcus@techventures.de");
  console.log("  Freelancer: lena@bergstrom.se");
  console.log("  Admin:      admin@eurohive.eu");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
