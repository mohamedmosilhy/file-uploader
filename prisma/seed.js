const bcrypt = require("bcryptjs");

const { prisma } = require("../lib/prisma");

async function main() {
  console.log("Starting database seeding...");

  // Clear existing data (optional - remove if you want to keep existing data)
  await prisma.file.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared existing data");

  // Reset auto-increment sequences
  await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "Folder_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "File_id_seq" RESTART WITH 1`;
  console.log("Reset ID sequences");

  // Create users
  const hashedPassword1 = await bcrypt.hash("password123", 10);
  const hashedPassword2 = await bcrypt.hash("password456", 10);

  const user1 = await prisma.user.create({
    data: {
      username: "john_doe",
      password: hashedPassword1,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "jane_smith",
      password: hashedPassword2,
    },
  });

  console.log(`Created users: ${user1.username}, ${user2.username}`);

  // Create folders for user1
  const documentsFolder = await prisma.folder.create({
    data: {
      name: "Documents",
      userId: user1.id,
    },
  });

  const imagesFolder = await prisma.folder.create({
    data: {
      name: "Images",
      userId: user1.id,
    },
  });

  const workFolder = await prisma.folder.create({
    data: {
      name: "Work",
      userId: user1.id,
      parentFolderId: documentsFolder.id,
    },
  });

  console.log(
    `Created folders: ${documentsFolder.name}, ${imagesFolder.name}, ${workFolder.name}`
  );

  // Create folders for user2
  const projectsFolder = await prisma.folder.create({
    data: {
      name: "Projects",
      userId: user2.id,
    },
  });

  console.log(`Created folder: ${projectsFolder.name}`);

  // Create files for user1
  const file1 = await prisma.file.create({
    data: {
      name: "resume.pdf",
      path: "/uploads/resume.pdf",
      size: 245760, // 240 KB
      userId: user1.id,
      folderId: documentsFolder.id,
    },
  });

  const file2 = await prisma.file.create({
    data: {
      name: "vacation.jpg",
      path: "/uploads/vacation.jpg",
      size: 2097152, // 2 MB
      userId: user1.id,
      folderId: imagesFolder.id,
    },
  });

  const file3 = await prisma.file.create({
    data: {
      name: "project-plan.docx",
      path: "/uploads/project-plan.docx",
      size: 102400, // 100 KB
      userId: user1.id,
      folderId: workFolder.id,
    },
  });

  const file4 = await prisma.file.create({
    data: {
      name: "notes.txt",
      path: "/uploads/notes.txt",
      size: 5120, // 5 KB
      userId: user1.id,
    },
  });

  console.log(
    `Created files for user1: ${file1.name}, ${file2.name}, ${file3.name}, ${file4.name}`
  );

  // Create files for user2
  const file5 = await prisma.file.create({
    data: {
      name: "code.zip",
      path: "/uploads/code.zip",
      size: 5242880, // 5 MB
      userId: user2.id,
      folderId: projectsFolder.id,
    },
  });

  const file6 = await prisma.file.create({
    data: {
      name: "readme.md",
      path: "/uploads/readme.md",
      size: 2048, // 2 KB
      userId: user2.id,
      folderId: projectsFolder.id,
    },
  });

  console.log(`Created files for user2: ${file5.name}, ${file6.name}`);

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
