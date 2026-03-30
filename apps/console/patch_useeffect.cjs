const fs = require('fs');

const frontendPath = 'j:/study KMITL/4th Year/ASM_final_project/prompt_ASM_00/apps/web-console/src/app/(protected)/issues/page.tsx';
let frontendStr = fs.readFileSync(frontendPath, 'utf8');

const regexUseEffect = /useEffect\(\(\) => \{\s*\/\/\s*Fetch dashboard summary for the Score and Grade\s*fetch\(`\$\{API_BASE\}\/api\/dashboard\/summary`\)\s*\.then\(res => res\.json\(\)\)\s*\.then\(data => setDashboardData\(data\)\)\s*\.catch\(err => console\.error\(err\)\)\s*\/\/\s*Fetch issues\s*fetchIssues\(\);\s*\}, \[\]\)/g;

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

if (regexUseEffect.test(frontendStr)) {
    frontendStr = frontendStr.replace(regexUseEffect, newUseEffect);
    fs.writeFileSync(frontendPath, frontendStr, 'utf8');
    console.log("Successfully replaced useEffect");
} else {
    console.log("Failed to find useEffect match");
}
