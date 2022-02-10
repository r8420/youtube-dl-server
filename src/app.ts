const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Create Express Server
const app = express();

const cors = require('cors');
const compression = require('compression')

import { YoutubeDl } from "./YoutubeDl";

const port = process.env.PORT || 3000;

app.use(compression())
app.use(cors())

let API_SERVICE_URL = "";


// Proxy endpoints
app.use('/watch_video', createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: function(path: any, req: any) {
        return '';
    },
    // Custom router function (string target)
    router: function (req: any) {
        let ytURL = req._parsedUrl.query;
        let search = ytURL.split("//")[1];
        search = search.split(".")[1] + search.split(".")[2];
        search = search.split("/")[0];
        if (ytURL.includes("googlevideo.com") && search === 'googlevideocom') {
            return ytURL;
        } else {
            return "";
        }

    }
}));

app.get('/v1/video', async (req: any, res: any) => {
    try {
        const url = req.query.url as string;
        const options = req.query.options as string;
        if (!url) {
            res.status(400);
            res.send('Missing url');
            return;
        }
        let schema = req.query.schema as string[];
        let metadata = await YoutubeDl.getVideoMetadata(url, options, schema);
        res.json(metadata);
    } catch (e) {
        console.error(e)
        res.status(500);
        res.send(e);
    }
});

app.get('/watch', async (req: any, res: any) => {
    try {
        const v = req.query.v as string;
        const options = req.query.options as string;
        if (!v) {
            res.status(400);
            res.send('Missing video id!');
            return;
        }
        // res.redirect(metadata.url);
        let videoUrl = await YoutubeDl.getVideoUrl(v, options, ['url']);
        res.redirect('./watch_video?' + videoUrl);
    } catch (e) {
        console.error(e)
        res.status(500);
        res.send(e);
    }
});

app.listen(port, () => {
    return console.log(`server is listening on http://localhost:${port}`);
});
