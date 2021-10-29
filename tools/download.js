const fs = require('fs')
const request = require("request");

const isWin = process.platform === "win32";

let url = 'https://github.com/yt-dlp/yt-dlp/releases/download/2021.10.22/yt-dlp.exe'
const destFolder = './tools/bin'
let destFile = destFolder + '/youtube-dl' + (isWin ? '.exe' : '')

function download(url, dest, cb) {
    request(url, cb).pipe(fs.createWriteStream(dest))
}

fs.mkdirSync(destFolder, {recursive: true});
download(url, destFile, function (err) {
    if(err) {
        throw err;
    }
    if(!isWin) {
        fs.chmodSync(destFile, '755');
    }
})
