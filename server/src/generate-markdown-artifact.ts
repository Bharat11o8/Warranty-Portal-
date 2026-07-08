import fs from 'fs';
import path from 'path';

function generateArtifact() {
    try {
        const jsonPath = path.join(process.cwd(), 'products-list.json');
        if (!fs.existsSync(jsonPath)) {
            console.log('No products-list.json found. Run list-products first.');
            return;
        }

        const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const groups: { [key: string]: any[] } = {};

        for (const p of products) {
            const cat = p.category_name || 'Uncategorized';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(p);
        }

        let md = `# Added Products Catalog\n\n`;
        md += `This document contains the complete list of **${products.length} products** currently available in the database, grouped by category.\n\n`;
        
        md += `## Summary of Categories\n\n`;
        md += `| Category | Product Count |\n`;
        md += `| :--- | :--- |\n`;
        for (const [cat, items] of Object.entries(groups)) {
            md += `| **${cat}** | ${items.length} |\n`;
        }
        md += `\n---\n\n`;

        md += `## Detailed Product List\n\n`;
        for (const [cat, items] of Object.entries(groups)) {
            md += `### 📂 ${cat} (${items.length} products)\n\n`;
            md += `| ID | Product Name | Price | Status |\n`;
            md += `| :--- | :--- | :--- | :--- |\n`;
            for (const item of items) {
                const status = item.in_stock ? '✅ In Stock' : '❌ Out of Stock';
                md += `| \`${item.id}\` | ${item.name} | ₹${parseFloat(item.price).toLocaleString('en-IN')} | ${status} |\n`;
            }
            md += `\n`;
        }

        const artifactDir = 'C:\\Users\\prabh\\.gemini\\antigravity-ide\\brain\\74bd598d-16f7-47a8-81c8-c5eed76af786';
        if (!fs.existsSync(artifactDir)) {
            fs.mkdirSync(artifactDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(artifactDir, 'added_products_list.md'), md, 'utf-8');
        console.log('Artifact generated successfully!');
    } catch (e: any) {
        console.error('Error generating artifact:', e.message);
    }
}

generateArtifact();
