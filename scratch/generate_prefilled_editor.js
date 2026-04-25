import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the previously submitted manual mapping
const mappingFile = path.resolve(__dirname, '../scratch/final_perfect_mapping_manual.json');
let previousData = [];
if (fs.existsSync(mappingFile)) {
    previousData = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
}

const UIDS = [
    '26041302432606', '26041302432620', '26032502427391', '26032302426664',
    '26031902425824', '26031602424705', '26031602424404', '25122902403812',
    '261480004540587', '26030202421275', '25122302402392', '25102302384412',
    '25100402380610', '25081602368091', '26010302405294' // Excluded Parag
];

let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Edit Manual Cloudinary Mapping</title>
    <style>
        body { font-family: Arial, sans-serif; background: #222; color: #fff; padding: 20px; max-width: 1300px; margin: 0 auto; }
        .record { background: #333; margin-bottom: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
        .record h2 { margin-top: 0; color: #4CAF50; border-bottom: 1px solid #555; padding-bottom: 10px; }
        
        .row-container { display: flex; gap: 20px; align-items: flex-start; }
        .inputs { flex: 1; }
        .preview { display: flex; gap: 10px; flex-wrap: wrap; flex: 1; background: #111; padding: 10px; border-radius: 6px; min-height: 100px; border: 1px solid #444; }
        
        .input-group { margin-bottom: 15px; display: flex; align-items: center; }
        .input-group label { width: 180px; font-weight: bold; color: #aaa; }
        .input-group input { flex: 1; padding: 10px; border-radius: 4px; border: 1px solid #555; background: #111; color: #0f0; font-family: monospace; }
        .input-group input:focus { outline: none; border-color: #4CAF50; }

        .img-thumb { width: auto; height: 120px; object-fit: contain; background: #000; border: 1px solid #666; border-radius: 4px; }
        .thumb-wrap { text-align: center; font-size: 11px; color: #888; }

        #result-box { margin-top: 30px; background: #111; padding: 20px; border-radius: 8px; display: none; }
        button.generate { background: #008CBA; color: white; border: none; padding: 15px 30px; font-size: 18px; border-radius: 8px; cursor: pointer; display: block; margin: 30px auto; width: 100%; font-weight: bold; }
        button.generate:hover { background: #007399; }
        
        .clear-btn { background: #E91E63; border: none; color: white; padding: 8px 12px; margin-left: 10px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1 style="text-align:center;">Fix Mapping Mistakes</h1>
    <p style="text-align:center; color: #ccc;">I have pre-filled this with the exact links you provided. I also added a visual preview to the right so you can instantly see if the image is correct. Just fix the wrong ones and generate again!</p>
    
    <div id="records-container">
`;

UIDS.forEach((uid, index) => {
    // Find previous data if exists
    const prev = previousData.find(d => d.uid === uid) || { 
        invoiceFileName: '', 
        photos: { vehicle: '', seatCover: '', carOuter: '' } 
    };

    const inv = prev.invoiceFileName || '';
    const veh = prev.photos?.vehicle || '';
    const seat = prev.photos?.seatCover || '';
    const out = prev.photos?.carOuter || '';

    htmlContent += `
        <div class="record" id="record-${uid}">
            <h2>${index + 1}. UID: ${uid}</h2>
            <div class="row-container">
                <div class="inputs">
                    <div class="input-group">
                        <label>Invoice (1):</label>
                        <input type="text" class="input-invoice" value="${inv}" oninput="updatePreview('${uid}')" />
                        <button class="clear-btn" onclick="this.previousElementSibling.value=''; updatePreview('${uid}')">X</button>
                    </div>
                    <div class="input-group">
                        <label>Num Plate (2):</label>
                        <input type="text" class="input-vehicle" value="${veh}" oninput="updatePreview('${uid}')" />
                        <button class="clear-btn" onclick="this.previousElementSibling.value=''; updatePreview('${uid}')">X</button>
                    </div>
                    <div class="input-group">
                        <label>Seat Cover (3):</label>
                        <input type="text" class="input-seat" value="${seat}" oninput="updatePreview('${uid}')" />
                        <button class="clear-btn" onclick="this.previousElementSibling.value=''; updatePreview('${uid}')">X</button>
                    </div>
                    <div class="input-group">
                        <label>Exterior (4):</label>
                        <input type="text" class="input-outer" value="${out}" oninput="updatePreview('${uid}')" />
                        <button class="clear-btn" onclick="this.previousElementSibling.value=''; updatePreview('${uid}')">X</button>
                    </div>
                </div>
                <div class="preview" id="preview-${uid}">
                    <!-- Image previews injected here -->
                </div>
            </div>
        </div>
    `;
});

htmlContent += `
    </div>

    <button class="generate" onclick="generateJSON()">Generate Perfect Database JSON</button>

    <div id="result-box">
        <h3 style="color: #4CAF50;">Success! Copy this JSON and send it to the AI Assistant:</h3>
        <textarea id="result-text" style="width: 100%; min-height: 400px; background: #000; color: #0f0; border: 1px solid #333; padding: 10px; font-family: monospace;"></textarea>
    </div>

    <script>
        const UIDS = ${JSON.stringify(UIDS)};

        function updatePreview(uid) {
            const record = document.getElementById('record-' + uid);
            const previewContainer = document.getElementById('preview-' + uid);
            
            const inv = record.querySelector('.input-invoice').value.trim();
            const veh = record.querySelector('.input-vehicle').value.trim();
            const seat = record.querySelector('.input-seat').value.trim();
            const out = record.querySelector('.input-outer').value.trim();

            let html = '';
            if(inv) html += '<div class="thumb-wrap"><img src="'+inv+'" class="img-thumb" onerror="this.style.display=\\'none\\'"><br/>1. Invoice</div>';
            if(veh) html += '<div class="thumb-wrap"><img src="'+veh+'" class="img-thumb" onerror="this.style.display=\\'none\\'"><br/>2. Plate</div>';
            if(seat) html += '<div class="thumb-wrap"><img src="'+seat+'" class="img-thumb" onerror="this.style.display=\\'none\\'"><br/>3. Seat</div>';
            if(out) html += '<div class="thumb-wrap"><img src="'+out+'" class="img-thumb" onerror="this.style.display=\\'none\\'"><br/>4. Outer</div>';
            
            previewContainer.innerHTML = html;
        }

        // Initialize previews on load
        window.onload = () => { UIDS.forEach(uid => updatePreview(uid)); };

        function generateJSON() {
            const result = [];
            
            UIDS.forEach(uid => {
                const record = document.getElementById('record-' + uid);
                
                const getVal = (className) => {
                    let val = record.querySelector('.' + className).value.trim();
                    return val === '' ? null : val;
                };

                const invoice = getVal('input-invoice');
                const vehicle = getVal('input-vehicle');
                const seatCover = getVal('input-seat');
                const carOuter = getVal('input-outer');

                if(invoice || vehicle || seatCover || carOuter) {
                    result.push({
                        uid: uid,
                        invoiceFileName: invoice,
                        photos: {
                            vehicle: vehicle,
                            seatCover: seatCover,
                            carOuter: carOuter
                        }
                    });
                }
            });

            document.getElementById('result-box').style.display = 'block';
            document.getElementById('result-text').value = JSON.stringify(result, null, 2);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    </script>
</body>
</html>`;

const outPath = path.resolve(__dirname, '../scratch/prefilled_manual_sorter.html');
fs.writeFileSync(outPath, htmlContent);
console.log('Prefilled editor created at scratch/prefilled_manual_sorter.html');
