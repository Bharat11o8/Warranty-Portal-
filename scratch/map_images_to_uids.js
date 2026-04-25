import fs from 'fs';

const recoveredData = JSON.parse(fs.readFileSync('../scratch/recovered_car_data.json', 'utf8'));
const cloudinaryResources = JSON.parse(fs.readFileSync('../scratch/cloudinary_resources.json', 'utf8')); // I'll need to save this first

console.log(`Processing ${recoveredData.length} warranties and ${cloudinaryResources.length} Cloudinary resources...`);

const finalRestoration = [];

for (const warranty of recoveredData) {
    const submissionTime = new Date(warranty.date).getTime();
    
    // Find images uploaded within 5 minutes BEFORE the email was sent
    // (Upload happens first, then email is sent)
    const matchedPhotos = cloudinaryResources.filter(res => {
        const uploadTime = new Date(res.created_at).getTime();
        const diff = (submissionTime - uploadTime) / 1000;
        return diff >= 0 && diff < 300; // 0 to 5 minutes
    });

    console.log(`Warranty ${warranty.uid} (${warranty.registrationNumber}) -> Found ${matchedPhotos.length} photos`);

    // In a real submission, there's usually 1 invoice and multiple photos.
    // We'll pick the most likely one as the invoice (often first or last)
    // and put the others in the photos object
    if (matchedPhotos.length > 0) {
        const invoice = matchedPhotos.find(p => p.public_id.includes('invoice')) || matchedPhotos[0];
        const photos = {};
        matchedPhotos.forEach((p, i) => {
            if (p !== invoice) {
                photos[`photo_${i}`] = p.secure_url;
            }
        });

        finalRestoration.push({
            ...warranty,
            invoiceFileName: invoice.secure_url,
            photos: photos
        });
    } else {
        finalRestoration.push({
            ...warranty,
            invoiceFileName: 'N/A',
            photos: {}
        });
    }
}

fs.writeFileSync('../scratch/final_restoration_mapping.json', JSON.stringify(finalRestoration, null, 2));
console.log('Saved final mapping to scratch/final_restoration_mapping.json');
