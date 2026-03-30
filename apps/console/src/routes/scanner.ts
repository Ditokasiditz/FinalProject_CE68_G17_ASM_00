import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import dotenv from 'dotenv';
import { SCANNER_MODULES } from '../lib/scannerConfig.js';

const execPromise = util.promisify(exec);

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

// Absolute path to where our Python modules will live
const PYTHON_MODULES_DIR = path.join(process.cwd(), 'python_modules');

// Global lock tracking scanner status
let isScanRunning = false;

router.get('/status', (req: Request, res: Response) => {
    res.json({ isScanning: isScanRunning });
});

/**
 * POST /api/scanner/run-all
 * Fetches all assets possessing an IP address from the DB.
 * For each asset, invokes the configured Python scan modules.
 * Parses the { found: boolean } response and updates the DB.
 */
router.post('/run-all', (req: Request, res: Response) => {
    if (isScanRunning) {
        return res.status(409).json({ error: 'Scan active already' });
    }
    
    // Lock the scanner explicitly 
    isScanRunning = true; 

    if (isScanRunning) {
        return res.status(409).json({ error: 'Scan active already' });
    }
    
    // Lock the scanner explicitly 
    isScanRunning = true; 

    // 1) Acknowledge the request instantly so the browser doesn't hang
    res.status(202).json({ message: 'Scan started in background' });

    // 2) Detach the heavy lifting into an async background IIFE
    (async () => {
    try {
        console.log(`[Scanner] Fetching assets to scan...`);
        // Fetch ALL assets that have an IP address
        const assets = await prisma.asset.findMany({
            where: {
                ipAddress: { not: null }
            }
        });

        const results = [];

        for (const asset of assets) {
            if (!asset.ipAddress) continue;

            for (const moduleConfig of SCANNER_MODULES) {
                try {
                    // Run Python script directly using child_process
                    console.log(`[Scanner] Executing: python ${moduleConfig.moduleName}.py --ip ${asset.ipAddress}`);
                    const scriptPath = path.join(PYTHON_MODULES_DIR, `${moduleConfig.moduleName}.py`);
                    
                    // We expect the script to output JSON string like `{"found": true}` to standard output
                    const { stdout } = await execPromise(`python "${scriptPath}" --ip ${asset.ipAddress}`);
                    
                    const data = JSON.parse(stdout.trim()) as { found: boolean };
                    
                    // Upsert the Issue template in DB first so it definitely exists
                    const issueRecord = await prisma.issue.upsert({
                        where: { title: moduleConfig.title },
                        update: {
                            severity: moduleConfig.severity,
                            impact: moduleConfig.impact,
                            factor: moduleConfig.factor,
                            description: moduleConfig.description
                        },
                        create: {
                            title: moduleConfig.title,
                            severity: moduleConfig.severity,
                            impact: moduleConfig.impact,
                            factor: moduleConfig.factor,
                            description: moduleConfig.description
                        }
                    });

                    if (data.found === true) {
                        // Create or update the link in IssueOnAsset 
                        await prisma.issueOnAsset.upsert({
                            where: {
                                issueId_assetId: {
                                    issueId: issueRecord.id,
                                    assetId: asset.id
                                }
                            },
                            update: {
                                status: "Open",
                                lastObserved: new Date()
                            },
                            create: {
                                issueId: issueRecord.id,
                                assetId: asset.id,
                                status: "Open"
                            }
                        });
                        
                        results.push({ ip: asset.ipAddress, module: moduleConfig.moduleName, status: "Open" });
                    } else {
                        // If it's NOT found, but it *used* to be found, mark it Resolved.
                        const existingLink = await prisma.issueOnAsset.findUnique({
                             where: {
                                 issueId_assetId: {
                                     issueId: issueRecord.id,
                                     assetId: asset.id
                                 }
                             }
                        });
                        
                        // Only mark as resolved if it is currently tracked as Open
                        if (existingLink && existingLink.status === "Open") {
                             await prisma.issueOnAsset.update({
                                  where: { id: existingLink.id },
                                  data: {
                                      status: "Resolved",
                                      lastObserved: new Date()
                                  }
                             });
                             results.push({ ip: asset.ipAddress, module: moduleConfig.moduleName, status: "Resolved" });
                        } else {
                           results.push({ ip: asset.ipAddress, module: moduleConfig.moduleName, status: "Not Vulnerable" });
                        }
                    }

                } catch (err) {
                    console.error(`[Scanner] Error scanning ${asset.ipAddress} with module ${moduleConfig.moduleName}:`, err);
                    results.push({ ip: asset.ipAddress, module: moduleConfig.moduleName, status: "Error" });
                }
            }
        }

        console.log('[Scanner] ✅ Background scan completely finished.');
    } catch (error) {
        console.error('[Scanner] ❌ Fatal error running background scanner:', error);
    } finally {
        isScanRunning = false;
        console.log('[Scanner] 🔓 Scanner unlocked.');
    }
    })(); // Execute the async wrapper
});

export default router;
