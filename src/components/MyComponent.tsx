import { analyzeAndFixCode } from '@/utils/jules_api'; // Adjust path if needed
import fs from 'fs';

async function fixMyComponent() {
    try {
        const filePath = 'src/components/MyComponent.tsx';

        const response = await fetch('/api/fix-component', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath }),
        });

        if (!response.ok) {
            console.error('Error calling fix-component API:', response.status, response.statusText);
            return;
        }

        try {
            const data: any = await response.json();

            if (data.success) {
                console.log('Component fixed successfully.');
            } else {
                console.warn('Failed to fix component:', data.message);
            }
        } catch (jsonError: any) {
            console.error('Error parsing JSON response:', jsonError.message, jsonError.stack);
        }
    } catch (error: any) {
        console.error('Error calling fix-component API:', error.message, error.stack);
    }
}

function MyComponent() {
    return (
        <div>
            <h1>My Component</h1>
            <button onClick={fixMyComponent}>Fix Component</button>
        </div>
    );
}

export default MyComponent;
