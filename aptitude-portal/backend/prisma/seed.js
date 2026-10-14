"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const QUANTITATIVE_TOPICS = [
    'Number System',
    'HCF & LCM',
    'Percentages',
    'Profit & Loss',
    'Ratio & Proportion',
    'Averages',
    'Simple Interest',
    'Compound Interest',
    'Time & Work',
    'Pipes & Cisterns',
    'Time, Speed & Distance',
    'Problems on Trains',
    'Boats & Streams',
    'Mixtures & Alligation',
    'Probability',
    'Permutation & Combination',
    'Algebra',
    'Ages',
    'Data Interpretation',
    'Mensuration',
];
const LOGICAL_TOPICS = [
    'Logical Reasoning',
    'Number Series',
    'Letter Series',
    'Coding & Decoding',
    'Analogy',
    'Odd One Out',
    'Blood Relations',
    'Direction Sense',
    'Syllogism',
    'Seating Arrangement',
    'Puzzles',
    'Statement & Conclusion',
    'Data Sufficiency',
    'Venn Diagrams',
    'Clocks',
    'Calendars',
];
async function main() {
    console.log('--- Starting Seed: College Placement Aptitude Test Portal ---');
    // 1. Seed 36 Topics
    console.log('Seeding 36 Topics...');
    let displayOrder = 1;
    for (const name of QUANTITATIVE_TOPICS) {
        await prisma.topic.upsert({
            where: { name },
            update: {
                category: client_1.TopicCategory.QUANTITATIVE,
                displayOrder,
                isActive: true,
            },
            create: {
                name,
                category: client_1.TopicCategory.QUANTITATIVE,
                displayOrder,
                isActive: true,
            },
        });
        displayOrder++;
    }
    for (const name of LOGICAL_TOPICS) {
        await prisma.topic.upsert({
            where: { name },
            update: {
                category: client_1.TopicCategory.LOGICAL,
                displayOrder,
                isActive: true,
            },
            create: {
                name,
                category: client_1.TopicCategory.LOGICAL,
                displayOrder,
                isActive: true,
            },
        });
        displayOrder++;
    }
    console.log('All topics seeded successfully.');
    // NOTE: No demo/mock accounts are seeded in production.
    // Use the application UI (Login page → Create Account) to create real accounts.
    console.log('--- Database seeding completed successfully! (Topics only, no demo accounts) ---');
}
main()
    .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
