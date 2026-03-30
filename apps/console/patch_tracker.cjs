const fs = require('fs');

const scannerPath = 'j:/study KMITL/4th Year/ASM_final_project/prompt_ASM_00/apps/console/src/routes/scanner.ts';
let content = fs.readFileSync(scannerPath, 'utf8');

const importsSection = "const PYTHON_MODULES_DIR = path.join(process.cwd(), 'python_modules');";
const globalState = `const PYTHON_MODULES_DIR = path.join(process.cwd(), 'python_modules');\n\n// Global lock tracking scanner status\nlet isScanRunning = false;\n\nrouter.get('/status', (req: Request, res: Response) => {\n    res.json({ isScanning: isScanRunning });\n});`;
if (!content.includes('let isScanRunning')) {
    content = content.replace(importsSection, globalState);
}

const runAllSig = "router.post('/run-all', (req: Request, res: Response) => {";
const runAllStart = `router.post('/run-all', (req: Request, res: Response) => {
    if (isScanRunning) {
        return res.status(409).json({ error: 'Scan active already' });
    }
    
    // Lock the scanner explicitly 
    isScanRunning = true; 
`;
content = content.replace(runAllSig, runAllStart);

const oldEnd = `        // Output done to console instead of returning to HTTP client
        console.log('[Scanner] ✅ Background scan completely finished.');

    } catch (error) {
        console.error('[Scanner] ❌ Fatal error running background scanner:', error);
    }
    })(); // Execute the async wrapper
});`;

const newEnd = `        console.log('[Scanner] ✅ Background scan completely finished.');
    } catch (error) {
        console.error('[Scanner] ❌ Fatal error running background scanner:', error);
    } finally {
        isScanRunning = false;
        console.log('[Scanner] 🔓 Scanner unlocked.');
    }
    })(); // Execute the async wrapper
});`;
content = content.replace(oldEnd, newEnd);

fs.writeFileSync(scannerPath, content, 'utf8');


const frontendPath = 'j:/study KMITL/4th Year/ASM_final_project/prompt_ASM_00/apps/web-console/src/app/(protected)/issues/page.tsx';
let frontendStr = fs.readFileSync(frontendPath, 'utf8');

const oldHandleScan = `    const handleScanAll = async () => {
        if (isScanning) return
        setIsScanning(true)
        try {
            const res = await fetch(\`\${API_BASE}/api/scanner/run-all\`, { method: 'POST' })
            if (!res.ok) throw new Error('Scan failed')
            fetchIssues()
        } catch (error) {
            console.error('Error running scan:', error)
            alert('Failed to run scanner')
        } finally {
            setIsScanning(false)
        }
    }`;

const newHandleScan = `    const handleScanAll = async () => {
        if (isScanning) return
        setIsScanning(true)
        try {
            const res = await fetch(\`\${API_BASE}/api/scanner/run-all\`, { method: 'POST' })
            if (!res.ok && res.status !== 202) throw new Error('Scan failed')
            // Don't auto-fetch here, the polling system inside useEffect handles completion!
        } catch (error) {
            console.error('Error running scan:', error)
            setIsScanning(false)
        }
    }`;
if (frontendStr.includes('const handleScanAll')) {
    frontendStr = frontendStr.replace(oldHandleScan, newHandleScan);
}

const oldUseEffect = `    useEffect(() => {
        fetch(\`\${API_BASE}/api/dashboard/summary\`)
            .then(res => res.json())
            .then(data => setDashboardData(data))
            .catch(err => console.error(err))
        fetchIssues()
    }, [])`;

const newUseEffect = `    // Auto-polling the scanner endpoint globally
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(\`\${API_BASE}/api/scanner/status\`)
                const data = await res.json()
                
                setIsScanning((prev) => {
                    // if it WAS scanning but now is NOT scanning, trigger table refresh immediately!
                    if (prev && !data.isScanning) {
                        fetchIssues()
                    }
                    return data.isScanning
                })
            } catch (err) {
                console.error("Failed to check scanner status", err)
            }
        }
        
        // Initial dashboard & base issues grid fetches
        fetch(\`\${API_BASE}/api/dashboard/summary\`)
            .then(r => r.json())
            .then(d => setDashboardData(d))
            .catch(e => console.error(e))
        fetchIssues()
        
        // Poll scanner status every 3 seconds
        checkStatus()
        const interval = setInterval(checkStatus, 3000)
        
        return () => clearInterval(interval)
    }, [])`;
if (frontendStr.includes('fetchIssues()')) {
    frontendStr = frontendStr.replace(oldUseEffect, newUseEffect);
}

fs.writeFileSync(frontendPath, frontendStr, 'utf8');
console.log('Task Successfully finished!');
