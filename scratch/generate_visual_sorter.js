import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mappingFile = path.resolve(__dirname, '../scratch/pristine_cluster_mapping.json');
const data = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Image Sorter for Corrupted Warranties</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f0f0f0; padding: 20px; }
        .record { background: white; margin-bottom: 30px; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .record h2 { margin-top: 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        
        .images-container { display: flex; gap: 20px; margin-top: 15px; overflow-x: auto; padding-bottom: 15px; }
        .source-images, .target-boxes { display: flex; flex-wrap: wrap; gap: 15px; width: 100%; }
        
        .image-wrapper { width: 180px; text-align: center; background: #fafafa; border: 1px solid #ddd; padding: 5px; border-radius: 4px; cursor: grab; }
        .image-wrapper img { width: 100%; height: 180px; object-fit: contain; pointer-events: none; }
        .image-wrapper .url { display: none; }
        
        .drop-box { width: 220px; min-height: 220px; border: 3px dashed #ccc; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 10px; background: #fff; transition: background 0.2s; position: relative; }
        .drop-box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #555; pointer-events: none; }
        .drop-box.drag-over { background: #e3f2fd; border-color: #2196F3; }
        
        .box-invoice { border-color: orange; }
        .box-vehicle { border-color: blue; }
        .box-seat { border-color: green; }
        .box-outer { border-color: purple; }

        #result-box { position: fixed; bottom: 0; left: 0; right: 0; background: #222; color: #0f0; padding: 20px; max-height: 300px; overflow-y: auto; display: none; z-index: 1000; box-shadow: 0 -5px 15px rgba(0,0,0,0.3); }
        button.generate { background: #E91E63; color: white; border: none; padding: 15px 30px; font-size: 18px; border-radius: 8px; cursor: pointer; display: block; margin: 40px auto; font-weight: bold; }
        button.generate:hover { background: #C2185B; }
    </style>
</head>
<body>
    <h1>Correct the Misplaced Photos</h1>
    <p>We have isolated the exact 16 registries using strict IMAP timestamps! The crossover/duplicates are gone. Drag the images to their correct boxes, then Generate JSON.</p>
`;

data.forEach((record, index) => {
    htmlContent += `    <div class="record" id="${record.uid}" data-uid="${record.uid}">\n`;
    htmlContent += `        <h2>UID: ${record.uid} | ${record.customer_name || 'N/A'}</h2>\n`;
    
    htmlContent += `        <div class="source-images" ondragover="allowDrop(event)" ondrop="drop(event, this)">\n`;
    htmlContent += `            <h3 style="width: 100%; color: #666; margin-bottom: 5px;">Unsorted Images (Drag these):</h3>\n`;
    
    let allImages = record.photos || [];
    allImages.forEach((imgUrl, imgIndex) => {
        let uniqueId = `img_${record.uid}_${imgIndex}`;
        htmlContent += `            <div class="image-wrapper" id="${uniqueId}" draggable="true" ondragstart="drag(event)">\n`;
        htmlContent += `                <img src="${imgUrl}" />\n`;
        htmlContent += `                <div class="url">${imgUrl}</div>\n`;
        htmlContent += `            </div>\n`;
    });
    htmlContent += `        </div>\n`;
    
    htmlContent += `        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;"/>\n`;
    
    htmlContent += `        <div class="target-boxes">\n`;
    htmlContent += `            <div class="drop-box box-invoice" data-cat="invoiceFileName" ondragover="allowDrop(event)" ondrop="drop(event, this)"><h3>1. Invoice / Sticker</h3></div>\n`;
    htmlContent += `            <div class="drop-box box-vehicle" data-cat="vehicle" ondragover="allowDrop(event)" ondrop="drop(event, this)"><h3>2. Number Plate</h3></div>\n`;
    htmlContent += `            <div class="drop-box box-seat" data-cat="seatCover" ondragover="allowDrop(event)" ondrop="drop(event, this)"><h3>3. Fitted Seat Cover</h3></div>\n`;
    htmlContent += `            <div class="drop-box box-outer" data-cat="carOuter" ondragover="allowDrop(event)" ondrop="drop(event, this)"><h3>4. Car Exterior</h3></div>\n`;
    htmlContent += `        </div>\n`;
    htmlContent += `    </div>\n`;
});

htmlContent += `
    <button class="generate" onclick="generateJSON()">Generate Final JSON Mapping</button>

    <div id="result-box">
        <h3>Copy this text and paste it to the AI Assistant:</h3>
        <textarea id="result-text" style="width: 100%; height: 200px; background: #111; color: #0f0; border: 1px solid #333; padding: 10px; font-family: monospace;"></textarea>
    </div>

    <script>
        function allowDrop(ev) {
            ev.preventDefault();
            if(ev.target.classList.contains('drop-box') || ev.target.classList.contains('source-images')) {
                ev.target.classList.add('drag-over');
            }
        }
        
        function getParentBox(el) {
            if(el.classList.contains('drop-box') || el.classList.contains('source-images')) return el;
            return el.closest('.drop-box') || el.closest('.source-images');
        }

        document.addEventListener('dragleave', function(ev) {
            let box = getParentBox(ev.target);
            if(box) box.classList.remove('drag-over');
        });

        function drag(ev) {
            ev.dataTransfer.setData("text", ev.target.id);
        }

        function drop(ev, targetElement) {
            ev.preventDefault();
            let box = getParentBox(targetElement);
            if(box) {
                box.classList.remove('drag-over');
                var data = ev.dataTransfer.getData("text");
                box.appendChild(document.getElementById(data));
            }
        }

        function generateJSON() {
            let result = {};
            document.querySelectorAll('.record').forEach(recordDiv => {
                let uid = recordDiv.getAttribute('data-uid');
                let entry = { uid: uid, invoiceFileName: null, photos: { vehicle: null, seatCover: null, carOuter: null } };
                
                let invoiceBox = recordDiv.querySelector('.box-invoice .image-wrapper');
                if(invoiceBox) entry.invoiceFileName = invoiceBox.querySelector('.url').innerText;
                
                let vehicleBox = recordDiv.querySelector('.box-vehicle .image-wrapper');
                if(vehicleBox) entry.photos.vehicle = vehicleBox.querySelector('.url').innerText;
                
                let seatBox = recordDiv.querySelector('.box-seat .image-wrapper');
                if(seatBox) entry.photos.seatCover = seatBox.querySelector('.url').innerText;
                
                let outerBox = recordDiv.querySelector('.box-outer .image-wrapper');
                if(outerBox) entry.photos.carOuter = outerBox.querySelector('.url').innerText;
                
                result[uid] = entry;
            });
            
            document.getElementById('result-box').style.display = 'block';
            document.getElementById('result-text').value = JSON.stringify(Object.values(result), null, 2);
            document.getElementById('result-text').select();
        }
    </script>
</body>
</html>
`;

const outPath = path.resolve(__dirname, '../scratch/visual_sorter.html');
fs.writeFileSync(outPath, htmlContent);
console.log('Interactive GUI created at scratch/visual_sorter.html using pristine data!');
