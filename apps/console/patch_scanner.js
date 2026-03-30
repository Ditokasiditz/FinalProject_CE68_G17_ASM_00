const fs = require('fs');
const path = 'j:/study KMITL/4th Year/ASM_final_project/prompt_ASM_00/apps/console/src/routes/scanner.ts';
let content = fs.readFileSync(path, 'utf8');

// The target string to replace
const oldSignature = "router.post('/run-all', async (req: Request, res: Response) => {";
const newSignature = `router.post('/run-all', (req: Request, res: Response) => {
    // 1) Acknowledge the request instantly so the browser doesn't hang
    res.status(202).json({ message: 'Scan started in background' });

    // 2) Detach the heavy lifting into an async background IIFE (Immediately Invoked Function Expression)
    (async () => {`;

content = content.replace(oldSignature, newSignature);

const oldEnding = `        res.json({ message: 'Scan complete', results });

    } catch (error) {
        console.error('Error running scanner:', error);
        res.status(500).json({ error: 'Internal server error while running scanner' });
    }
});`;

const newEnding = `        console.log('[Scanner] ✅ Background scan completely finished.');

    } catch (error) {
        console.error('[Scanner] ❌ Fatal error running background scanner:', error);
    }
    })(); // Execute the async wrapper
});`;

content = content.replace(oldEnding, newEnding);

fs.writeFileSync(path, content, 'utf8');
console.log("Scanner background patch applied successfully.");
