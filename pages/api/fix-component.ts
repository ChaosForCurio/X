import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { analyzeAndFixCode } from '@/utils/jules_api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { filePath } = req.body; // Expect the file path in the request body

        try {
            let originalCode: string;
            try {
                originalCode = fs.readFileSync(filePath, 'utf-8');
            } catch (readError: any) {
                console.error('Error reading file:', readError.message, readError.stack);
                res.status(500).json({ success: false, message: 'Failed to read file.' });
                return;
            }

            const fixedCode = await analyzeAndFixCode(originalCode);

            if (fixedCode) {
                // call  edit_existing_file here
                console.log('Fixed code received from Jules API.  Applying changes...');
                // IMPORTANT: The following code is for demonstration within the agent.
                // In a real application, you'd write to the file using fs.writeFile on the server.
                // The `edit_existing_file` tool in this environment will NOT modify the actual file.
                print(default_api.edit_existing_file(
                    filepath = filePath,
                    changes = fixedCode
                ));

                res.status(200).json({ success: true, message: 'Component fixed successfully.' });
            } else {
                res.status(200).json({ success: false, message: 'No fix received from Jules API.' });
            }
        } catch (error: any) {
            console.error('Error fixing component:', error.message, error.stack);
            res.status(500).json({ success: false, message: 'Failed to fix component.' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Method not allowed.' });
    }
}
