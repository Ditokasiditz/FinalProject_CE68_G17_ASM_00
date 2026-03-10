import { PrismaClient } from '@prisma/client'
import "dotenv/config";

const prisma = new PrismaClient()

const dummyFactors = [
    { title: "Network Security", score: 99, issueCount: 4 },
    { title: "DNS Health", score: 90, issueCount: 0 },
    { title: "Patching Cadence", score: 40, issueCount: 12 },
    { title: "Application Security", score: 85, issueCount: 2 },
    { title: "Information Leakage", score: 100, issueCount: 0 },
    { title: "Endpoint Security", score: 72, issueCount: 3 },
]

async function main() {
    console.log(`Start seeding ...`)

    // Clear existing data
    await prisma.factor.deleteMany()
    await prisma.issue.deleteMany()
    await prisma.asset.deleteMany()

    // Seed Factors
    for (const factor of dummyFactors) {
        const createdFactor = await prisma.factor.create({
            data: factor,
        })
        console.log(`Created factor with id: ${createdFactor.id}`)
    }

    // Seed some dummy assets
    const asset1 = await prisma.asset.create({
        data: {
            hostname: "api.example.com",
            ipAddress: "192.168.1.10",
            type: "domain",
            isExposed: true,
            issues: {
                create: [
                    { title: "Open Port 22", severity: "High", status: "Open" },
                    { title: "Outdated TLS Version", severity: "Medium", status: "Open" }
                ]
            }
        }
    })

    console.log(`Created asset with id: ${asset1.id}`)

    console.log(`Seeding finished.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
