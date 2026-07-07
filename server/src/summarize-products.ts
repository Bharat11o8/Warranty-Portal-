import fs from 'fs';
import path from 'path';

function summarize() {
    try {
        const filePath = path.join(process.cwd(), 'products-list.json');
        if (!fs.existsSync(filePath)) {
            console.log('No products-list.json found. Run list-products first.');
            return;
        }

        const products = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const groups: { [key: string]: any[] } = {};

        for (const p of products) {
            const cat = p.category_name || 'Uncategorized';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(p);
        }

        let output = '=== PRODUCT SUMMARY BY CATEGORY ===\n';
        for (const [cat, items] of Object.entries(groups)) {
            output += `\n📂 Category: ${cat} (${items.length} products)\n`;
            items.forEach((item, index) => {
                output += `  ${index + 1}. [${item.id}] ${item.name} - ₹${item.price} ${item.in_stock ? '' : '(Out of Stock)'}\n`;
            });
        }

        fs.writeFileSync(path.join(process.cwd(), 'products-summary.txt'), output, 'utf-8');
        console.log('Successfully saved summary to server/products-summary.txt');
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

summarize();
