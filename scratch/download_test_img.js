import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fileUrl = 'https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776764987/warranty-portal/fosnpnpbikksxfdd0rtq.jpg';

const downloadedFilePath = path.join(__dirname, '../scratch/test_downloaded_image.jpg');

const file = fs.createWriteStream(downloadedFilePath);

https.get(fileUrl, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Downloaded successfully.');
  });
});
