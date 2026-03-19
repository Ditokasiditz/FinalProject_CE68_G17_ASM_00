import { PrismaClient } from '@prisma/client'
import "dotenv/config";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

const dummyFactors = [
    { title: "Network Security", score: 65, issueCount: 4 },
    { title: "DNS Health", score: 90, issueCount: 0 },
    { title: "Patching Cadence", score: 40, issueCount: 12 },
    { title: "Application Security", score: 85, issueCount: 2 },
    { title: "Information Leakage", score: 100, issueCount: 0 },
    { title: "Endpoint Security", score: 72, issueCount: 3 },
]

async function main() {
    console.log(`Start seeding ...`)

    // Clear existing data in correct order (join table first)
    await prisma.user.deleteMany()
    await prisma.issueOnAsset.deleteMany()
    await prisma.issue.deleteMany()
    await prisma.asset.deleteMany()
    await prisma.factor.deleteMany()

    // Seed Admin User
    const adminPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
        data: {
            username: 'admin',
            password: adminPassword,
            role: 'ADMIN'
        }
    })
    console.log(`Created default Admin user`)

    // Seed Factors
    for (const factor of dummyFactors) {
        await prisma.factor.create({ data: factor })
    }
    console.log(`Created ${dummyFactors.length} factors`)

    // Create Assets
    const assets = await Promise.all([
        prisma.asset.create({ data: { hostname: "api.example.com", ipAddress: "8.8.8.8", type: "domain", isExposed: true, city: "San Francisco", country: "United States", countryCode: "US", latitude: 37.7749, longitude: -122.4194 } }),
        prisma.asset.create({ data: { hostname: "mail.example.com", ipAddress: "1.1.1.1", type: "domain", isExposed: true, city: "London", country: "United Kingdom", countryCode: "GB", latitude: 51.5074, longitude: -0.1278 } }),
        prisma.asset.create({ data: { hostname: "vpn.example.com", ipAddress: "208.67.222.222", type: "domain", isExposed: true, city: "Tokyo", country: "Japan", countryCode: "JP", latitude: 35.6895, longitude: 139.6917 } }),
        prisma.asset.create({ data: { hostname: "blog.example.com", ipAddress: "13.225.103.26", type: "subdomain", isExposed: false, city: "Singapore", country: "Singapore", countryCode: "SG", latitude: 1.3521, longitude: 103.8198 } }),
        prisma.asset.create({ data: { hostname: "staging.example.com", ipAddress: "185.199.108.153", type: "subdomain", isExposed: true, city: "Berlin", country: "Germany", countryCode: "DE", latitude: 52.5200, longitude: 13.4050 } }),
        prisma.asset.create({ data: { hostname: "erp.example.com", ipAddress: "104.244.42.129", type: "domain", isExposed: true, city: "Sydney", country: "Australia", countryCode: "AU", latitude: -33.8688, longitude: 151.2093 } }),
    ])
    console.log(`Created ${assets.length} assets`)

    // Create Issues (many-to-many with assets)
    const issueDefinitions = [
        {
            title: "Open Port 22 (SSH)",
            description: "SSH port is open and exposed to the internet without IP allowlisting.",
            severity: "High",
            impact: 7.5,
            factor: "Network Security",
            assetIndexes: [0, 1, 2, 4],
            statuses:     ["Open", "Open", "Open", "Resolved"],
        },
        {
            title: "Outdated TLS Version (TLS 1.0/1.1)",
            description: "Server supports deprecated TLS versions which are vulnerable to POODLE and BEAST attacks.",
            severity: "Medium",
            impact: 5.3,
            factor: "Application Security",
            assetIndexes: [0, 3, 5],
            statuses:     ["Open", "Open", "Resolved"],
        },
        {
            title: "HTTP Security Headers Missing",
            description: "Responses are missing recommended security headers such as X-Frame-Options, CSP, and HSTS.",
            severity: "Medium",
            impact: 4.2,
            factor: "Application Security",
            assetIndexes: [1, 2, 3, 4, 5],
            statuses:     ["Open", "Open", "Open", "Resolved", "Open"],
        },
        {
            title: "Default Admin Credentials",
            description: "Service is running with default credentials that have not been changed from vendor defaults.",
            severity: "Critical",
            impact: 9.8,
            factor: "Endpoint Security",
            assetIndexes: [2, 5],
            statuses:     ["Open", "Open"],
        },
        {
            title: "Unencrypted HTTP Endpoint",
            description: "Service accessible over plain HTTP without redirect to HTTPS.",
            severity: "Medium",
            impact: 5.0,
            factor: "Network Security",
            assetIndexes: [3, 4],
            statuses:     ["Open", "Resolved"],
        },
        {
            title: "Expired SSL Certificate",
            description: "The SSL/TLS certificate has expired or will expire within 30 days.",
            severity: "High",
            impact: 6.5,
            factor: "DNS Health",
            assetIndexes: [1, 5],
            statuses:     ["Open", "Open"],
        },
        {
            title: "Software Version Disclosure",
            description: "HTTP response headers reveal server software version, aiding attackers in targeting specific vulnerabilities.",
            severity: "Low",
            impact: 2.1,
            factor: "Information Leakage",
            assetIndexes: [0, 1, 2, 3, 4, 5],
            statuses:     ["Open", "Open", "Resolved", "Open", "Open", "Resolved"],
        },
        {
            title: "Weak Password Policy",
            description: "Login endpoint has no rate limiting or account lockout, making it vulnerable to brute-force attacks.",
            severity: "High",
            impact: 7.2,
            factor: "Endpoint Security",
            assetIndexes: [0, 4],
            statuses:     ["Resolved", "Resolved"],
        },
    ]

    for (const def of issueDefinitions) {
        const { assetIndexes, statuses, ...issueData } = def
        const issue = await prisma.issue.create({ data: issueData })

        // Link issue to multiple assets, each with its own status
        for (let i = 0; i < assetIndexes.length; i++) {
            await prisma.issueOnAsset.create({
                data: {
                    issueId: issue.id,
                    assetId: assets[assetIndexes[i]].id,
                    status: statuses[i],
                    lastObserved: new Date(),
                }
            })
        }
        console.log(`Created issue "${issue.title}" linked to ${assetIndexes.length} assets`)
    }

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
