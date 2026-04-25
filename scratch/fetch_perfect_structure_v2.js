import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const auditFile = path.resolve(__dirname, '../scratch/exhaustive_email_audit.json');
const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));

const cloudinaryFile = path.resolve(__dirname, '../scratch/cloudinary_resources.json');
const cloudinaryData = JSON.parse(fs.readFileSync(cloudinaryFile, 'utf8'));

cloudinaryData.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

const TARGET_UIDS = [
    '26041302432606', '26041302432620', '26032502427391', '26032302426664',
    '26031902425824', '26031602424705', '26031602424404', '25122902403812',
    '261480004540587', '26030202421275', '25122302402392', '25102302384412',
    '25100402380610', '25082902371655', '25081602368091', '26010302405294'
];

let pristineMapping = [];

// For 25082902371655 (Parag) we manually noted the date earlier was approx 2026-04-21T09:49:51.000Z
const manualOverrides = {
    '25082902371655': new Date('2026-04-21T09:49:51.000Z').getTime()
};

TARGET_UIDS.forEach(uid => {
    let emailTime;
    if (manualOverrides[uid]) {
        emailTime = manualOverrides[uid];
    } else if (auditData[uid] && auditData[uid].found_emails && auditData[uid].found_emails.length > 0) {
        // use oldest email (first confirmation)
        auditData[uid].found_emails.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        emailTime = new Date(auditData[uid].found_emails[0].date).getTime();
    } else {
        console.warn('No email time found for UID:', uid);
        return;
    }
    
    // Find cloudinary images clustered within 5 mins before email
    const matchingImages = cloudinaryData.filter(img => {
        const imgTime = new Date(img.created_at).getTime();
        const diffSec = (emailTime - imgTime) / 1000;
        return diffSec >= -60 && diffSec <= 400; // 6.5 minutes before email, up to 1 min after
    });

    let customerName = 'Unknown';
    if (auditData[uid] && auditData[uid].found_emails.length > 0) {
        const firstEmail = auditData[uid].found_emails[0];
        const content = (firstEmail.html || firstEmail.text || '');
        const cn = content.match(/Customer Name:?\s*<\/strong>\s*([^<]+)/i) || content.match(/Customer Name:?\s*([^\r\n\|\-<]+)/i);
        if (cn) customerName = cn[1].trim();
    }
    if (uid === '25082902371655') customerName = 'Parag Agarwal';
    if (uid === '26030202421275') customerName = 'Jignesh Rathwa';
    if (uid === '25081602368091') customerName = 'Huzfa sir';

    const cleanImages = matchingImages.map(m => m.secure_url).filter(l => !l.includes('logo') && !l.includes('favicon'));
    
    pristineMapping.push({
        uid,
        customer_name: customerName,
        photos: cleanImages
    });
});

fs.writeFileSync(path.resolve(__dirname, '../scratch/pristine_cluster_mapping.json'), JSON.stringify(pristineMapping, null, 2));
console.log('Successfully wrote pristine_cluster_mapping.json with strict email chronological bounds.');
