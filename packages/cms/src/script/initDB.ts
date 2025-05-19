import { db } from "../db";
import { users, contents } from "../db/schema";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Insert users
  console.log("Seeding users...");
  const usersData = [
    {
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin User",
      role: "admin",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      email: "editor@example.com",
      password: await bcrypt.hash("editor123", 10),
      name: "Editor User",
      role: "editor",
      createdAt: new Date("2025-01-02T00:00:00Z"),
    },
    {
      email: "john.doe@example.com",
      password: await bcrypt.hash("password123", 10),
      name: "John Doe",
      role: "editor",
      createdAt: new Date("2025-01-03T00:00:00Z"),
    },
    {
      email: "jane.smith@example.com",
      password: await bcrypt.hash("password123", 10),
      name: "Jane Smith",
      role: "editor",
      createdAt: new Date("2025-01-04T00:00:00Z"),
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(usersData)
    .returning({ id: users.id });
  console.log(`Inserted ${insertedUsers.length} users`);

  // Insert contents
  console.log("Seeding contents...");
  const contentsData = [
    {
      title: "Getting Started Guide",
      slug: "getting-started",
      content:
        "# Getting Started\n\nWelcome to our platform! This guide will help you understand the basics of our system.\n\n## First Steps\n\n1. Create an account\n2. Set up your profile\n3. Explore the dashboard\n\n## Advanced Features\n\nOnce you're comfortable with the basics, try out our advanced features...",
      status: "published",
      authorId: insertedUsers[0].id,
      createdAt: new Date("2025-01-10T08:00:00Z"),
      updatedAt: new Date("2025-01-10T08:00:00Z"),
    },
    {
      title: "API Documentation",
      slug: "api-docs",
      content:
        "# API Documentation\n\n## Authentication\n\nAll API requests require authentication using JWT tokens.\n\n```js\nfetch('/api/data', {\n  headers: {\n    'Authorization': 'Bearer YOUR_TOKEN_HERE'\n  }\n})\n```\n\n## Endpoints\n\n### GET /api/users\n\nReturns a list of users...",
      status: "published",
      authorId: insertedUsers[0].id,
      createdAt: new Date("2025-01-15T10:30:00Z"),
      updatedAt: new Date("2025-01-16T14:20:00Z"),
    },
    {
      title: "Best Practices for Content Creation",
      slug: "content-best-practices",
      content:
        "# Content Creation Best Practices\n\nCreating engaging content is essential for user retention. Here are some tips to help you create better content:\n\n1. Know your audience\n2. Use clear, concise language\n3. Include relevant media\n4. Structure your content with headings\n5. End with a call to action",
      status: "published",
      authorId: insertedUsers[1].id,
      createdAt: new Date("2025-01-20T09:15:00Z"),
      updatedAt: new Date("2025-01-20T09:15:00Z"),
    },
    {
      title: "Upcoming Features - Q2 2025",
      slug: "upcoming-features-q2-2025",
      content:
        "# Upcoming Features\n\nWe're excited to announce our roadmap for Q2 2025:\n\n- Enhanced user dashboard\n- Integration with third-party services\n- Mobile application release\n- Advanced analytics\n\nStay tuned for more updates!",
      status: "draft",
      authorId: insertedUsers[0].id,
      createdAt: new Date("2025-02-01T11:45:00Z"),
      updatedAt: new Date("2025-02-05T16:30:00Z"),
    },
    {
      title: "User Onboarding Workflow",
      slug: "user-onboarding",
      content:
        "# User Onboarding Workflow\n\nThis document outlines the recommended onboarding process for new users.\n\n## Step 1: Welcome Email\n\nSend a personalized welcome email with account activation instructions.\n\n## Step 2: Product Tour\n\nGuide users through key features with an interactive tour.\n\n## Step 3: First Task\n\nEncourage users to complete a simple task to experience value quickly.",
      status: "draft",
      authorId: insertedUsers[2].id,
      createdAt: new Date("2025-02-10T13:20:00Z"),
      updatedAt: new Date("2025-02-10T13:20:00Z"),
    },
    {
      title: "System Architecture Overview",
      slug: "system-architecture",
      content:
        "# System Architecture\n\n## Frontend\n\n- React with TypeScript\n- TailwindCSS for styling\n- tRPC for type-safe API calls\n\n## Backend\n\n- Node.js with Express\n- PostgreSQL database\n- Drizzle ORM\n\n## Infrastructure\n\n- Docker containers\n- AWS hosting\n- CI/CD with GitHub Actions",
      status: "published",
      authorId: insertedUsers[0].id,
      createdAt: new Date("2025-02-15T10:00:00Z"),
      updatedAt: new Date("2025-02-16T09:30:00Z"),
    },
    {
      title: "Content Management Tips",
      slug: "content-management",
      content:
        "# Content Management Tips\n\nEffective content management is crucial for maintaining a quality website. Here are some tips:\n\n1. Establish a consistent publishing schedule\n2. Regularly audit existing content\n3. Use categories and tags effectively\n4. Monitor content performance\n5. Update outdated information promptly",
      status: "published",
      authorId: insertedUsers[3].id,
      createdAt: new Date("2025-02-20T14:10:00Z"),
      updatedAt: new Date("2025-02-20T14:10:00Z"),
    },
  ];

  const insertedContents = await db
    .insert(contents)
    .values(contentsData)
    .returning({ id: contents.id });
  console.log(`Inserted ${insertedContents.length} content items`);

  console.log("Database seeding completed successfully!");
}

// Run the seeding function
seedDatabase().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
