// Utility to parse code blocks from AI responses

export interface ParsedCodeFile {
    id: string;
    name: string;
    language: string;
    content: string;
}

// Language to file extension mapping
const languageToExtension: Record<string, string> = {
    'javascript': '.js',
    'js': '.js',
    'typescript': '.ts',
    'ts': '.ts',
    'tsx': '.tsx',
    'jsx': '.jsx',
    'html': '.html',
    'css': '.css',
    'scss': '.scss',
    'sass': '.sass',
    'json': '.json',
    'python': '.py',
    'py': '.py',
    'sql': '.sql',
    'markdown': '.md',
    'md': '.md',
    'yaml': '.yaml',
    'yml': '.yml',
    'bash': '.sh',
    'shell': '.sh',
    'sh': '.sh',
    'plaintext': '.txt',
    'text': '.txt',
};

// Parse code blocks from markdown/AI response
export function parseCodeBlocks(content: string): ParsedCodeFile[] {
    const codeBlockRegex = /```(\w+)?\s*(?:\n|\r\n)?(?:\/\/\s*(\S+)\s*(?:\n|\r\n))?([\s\S]+?)```/g;
    const files: ParsedCodeFile[] = [];
    let match;
    let index = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = (match[1] || 'plaintext').toLowerCase();
        let filename = match[2] || '';
        const code = match[3]?.trim() || '';

        // Generate filename if not provided
        if (!filename) {
            const ext = languageToExtension[language] || '.txt';
            if (language === 'html') {
                filename = 'index.html';
            } else if (language === 'css') {
                filename = 'styles.css';
            } else if (language === 'javascript' || language === 'js') {
                filename = 'script.js';
            } else if (language === 'typescript' || language === 'ts') {
                filename = 'index.ts';
            } else if (language === 'tsx') {
                filename = 'Component.tsx';
            } else if (language === 'jsx') {
                filename = 'Component.jsx';
            } else {
                filename = `code-${index + 1}${ext}`;
            }
        }

        // Normalize language for Monaco
        const monacoLanguage = language === 'js' ? 'javascript'
            : language === 'ts' ? 'typescript'
                : language === 'py' ? 'python'
                    : language;

        files.push({
            id: `file-${Date.now()}-${index}`,
            name: filename,
            language: monacoLanguage,
            content: code,
        });

        index++;
    }

    return files;
}

// Check if content contains code blocks
export function hasCodeBlocks(content: string): boolean {
    const codeBlockRegex = /```[\s\S]*?```/;
    return codeBlockRegex.test(content);
}

// Extract a single code block (for simple cases)
export function extractFirstCodeBlock(content: string): { language: string; code: string } | null {
    const match = /```(\w+)?\s*(?:\n|\r\n)?([\s\S]+?)```/.exec(content);
    if (match) {
        return {
            language: (match[1] || 'plaintext').toLowerCase(),
            code: match[2]?.trim() || '',
        };
    }
    return null;
}

// Merge multiple code blocks into combined HTML
export function mergeToHTML(files: ParsedCodeFile[]): string {
    const htmlFile = files.find(f => f.language === 'html');
    const cssFiles = files.filter(f => f.language === 'css' || f.language === 'scss');
    const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'typescript');

    let html = htmlFile?.content || `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;

    // Inject CSS
    if (cssFiles.length > 0) {
        const allCSS = cssFiles.map(f => f.content).join('\n');
        html = html.replace('</head>', `<style>\n${allCSS}\n</style>\n</head>`);
    }

    // Inject JS
    if (jsFiles.length > 0) {
        const allJS = jsFiles.map(f => f.content).join('\n');
        html = html.replace('</body>', `<script>\n${allJS}\n</script>\n</body>`);
    }

    return html;
}

// Determine if code is web-previewable (HTML/CSS/JS)
export function isWebPreviewable(files: ParsedCodeFile[]): boolean {
    const webLanguages = ['html', 'css', 'javascript', 'js', 'typescript', 'ts'];
    return files.some(f => webLanguages.includes(f.language));
}
