import { v2 as cloudinary } from 'cloudinary';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const cloudConfig = {
    cloud_name: 'dmwt4rg4m',
    api_key: '378684481618874',
    api_secret: 'trMuVYVbpid6RIqyxk4DotnMhk4'
};

const dbConfig = {
    host: 'srv839.hstgr.io',
    user: 'u823909847_warr',
    password: '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

cloudinary.config(cloudConfig);

async function generateTargetedSorter() {
    try {
        console.log('--- Fetching targeted Cloudinary images (April 21-22) ---');
        
        let allResources = [];
        let nextCursor = null;
        
        // Fetch resources from last few days
        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'warranty-portal/',
                max_results: 500,
                next_cursor: nextCursor
            });
            allResources = allResources.concat(result.resources);
            nextCursor = result.next_cursor;
        } while (nextCursor);

        // Filter for April 21 and 22
        const filteredImages = allResources.filter(res => {
            const date = res.created_at.split('T')[0];
            return date === '2026-04-21' || date === '2026-04-22';
        }).map(res => res.secure_url);

        console.log(`Found ${filteredImages.length} images from April 21-22.`);

        // Fetch current DB state for target UIDs
        const uids = ['26041002431893', '2203210281154', '26032502427391', '26010802406519', '26041302432606', '261480004540587'];
        const db = await mysql.createConnection(dbConfig);
        const [rows] = await db.query(
            'SELECT uid, registration_number, customer_name, product_details FROM warranty_registrations WHERE uid IN (?)',
            [uids]
        );
        await db.end();

        // Map DB rows to UID lookup
        const dbMap = {};
        rows.forEach(row => {
            const details = JSON.parse(row.product_details || '{}');
            dbMap[row.uid] = {
                name: row.customer_name,
                reg: row.registration_number,
                invoice: details.invoiceFileName || '',
                vehicle: details.photos?.vehicle || details.photos?.frontReg || '',
                seatCover: details.photos?.seatCover || details.photos?.seatCoverFront || '',
                carOuter: details.photos?.carOuter || ''
            };
        });

        // Generate HTML
        let html = `<!DOCTYPE html>
<html>
<head>
    <title>Visual Sorter - Targeted (April 21-22)</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; background: #1a1a1a; color: white; padding: 20px; }
        .container { display: flex; gap: 20px; }
        .pool { flex: 1; background: #2a2a2a; padding: 15px; border-radius: 8px; max-height: 90vh; overflow-y: auto; }
        .assignments { flex: 2; display: grid; grid-template-columns: 1fr; gap: 20px; }
        .card { background: #333; padding: 15px; border-radius: 8px; border-left: 5px solid #4CAF50; }
        .card h3 { margin-top: 0; color: #4CAF50; }
        .img-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
        .drop-zone { background: #222; border: 2px dashed #444; border-radius: 4px; padding: 10px; text-align: center; font-size: 11px; position: relative; min-height: 120px; }
        .drop-zone img { max-width: 100%; height: 100px; object-fit: contain; }
        .pool-img { width: 100%; height: 120px; object-fit: cover; border-radius: 4px; cursor: move; border: 1px solid #444; margin-bottom: 5px; }
        .pool-img:hover { border-color: #4CAF50; }
        .label { font-weight: bold; margin-bottom: 5px; color: #888; font-size: 12px; }
        .output-zone { margin-top: 30px; background: #111; padding: 20px; border-radius: 8px; }
        textarea { width: 100%; height: 200px; background: #000; color: #0f0; font-family: monospace; }
        button { background: #4CAF50; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; width: 100%; font-size: 18px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Manual Image Sorter (April 21-22 Entries)</h1>
    <p>Drag images from the pool on the left into the correct slots. Pre-filled with current DB links.</p>
    
    <div class="container">
        <div class="pool">
            <h3>Image Pool (April 21-22)</h3>
            ${filteredImages.map((src, i) => `<img src="${src}" class="pool-img" draggable="true" ondragstart="drag(event, '${src}')" id="img-${i}">`).join('')}
        </div>
        <div class="assignments">
            ${uids.map(uid => {
                const data = dbMap[uid] || { name: 'Unknown', reg: 'Unknown', invoice: '', vehicle: '', seatCover: '', carOuter: '' };
                return `
                <div class="card" data-uid="${uid}">
                    <h3>${data.name} (${data.reg}) - UID: ${uid}</h3>
                    <div class="img-grid">
                        <div>
                            <div class="label">Invoice</div>
                            <div class="drop-zone" ondrop="drop(event, 'invoice')" ondragover="allowDrop(event)">
                                ${data.invoice ? `<img src="${data.invoice}">` : 'Drop here'}
                            </div>
                        </div>
                        <div>
                            <div class="label">Number Plate</div>
                            <div class="drop-zone" ondrop="drop(event, 'vehicle')" ondragover="allowDrop(event)">
                                ${data.vehicle ? `<img src="${data.vehicle}">` : 'Drop here'}
                            </div>
                        </div>
                        <div>
                            <div class="label">Seat Cover</div>
                            <div class="drop-zone" ondrop="drop(event, 'seatCover')" ondragover="allowDrop(event)">
                                ${data.seatCover ? `<img src="${data.seatCover}">` : 'Drop here'}
                            </div>
                        </div>
                        <div>
                            <div class="label">Exterior</div>
                            <div class="drop-zone" ondrop="drop(event, 'carOuter')" ondragover="allowDrop(event)">
                                ${data.carOuter ? `<img src="${data.carOuter}">` : 'Drop here'}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>

    <div class="output-zone">
        <button onclick="generateJSON()">Generate Perfect Mapping JSON</button>
        <h3>Resulting JSON Path:</h3>
        <textarea id="output"></textarea>
    </div>

    <script>
        function allowDrop(ev) { ev.preventDefault(); }
        function drag(ev, src) { ev.dataTransfer.setData("text", src); }
        function drop(ev, type) {
            ev.preventDefault();
            var src = ev.dataTransfer.getData("text");
            ev.target.closest('.drop-zone').innerHTML = '<img src="' + src + '">';
        }

        function generateJSON() {
            const results = [];
            document.querySelectorAll('.card').forEach(card => {
                const uid = card.getAttribute('data-uid');
                const imgs = card.querySelectorAll('.drop-zone img');
                const zones = card.querySelectorAll('.drop-zone');
                
                const getSrc = (index) => {
                    const img = zones[index].querySelector('img');
                    return img ? img.src : null;
                };

                results.push({
                    uid: uid,
                    invoiceFileName: getSrc(0),
                    photos: {
                        vehicle: getSrc(1),
                        seatCover: getSrc(2),
                        carOuter: getSrc(3)
                    }
                });
            });
            document.getElementById('output').value = JSON.stringify(results, null, 2);
        }
    </script>
</body>
</html>`;

        const outputPath = path.join(__dirname, '../scratch/targeted_sorter.html');
        fs.writeFileSync(outputPath, html);
        console.log(`\n✅ Sorter generated at: ${outputPath}`);
        console.log(`Open this file in your browser to sort the images.`);

    } catch (e) {
        console.error(e);
    }
}

generateTargetedSorter();
