import express from 'express';
import { ExecException } from "child_process";
const { exec } = require("child_process");
const { spawn } = require("child_process");
const path = require('path');

const isWin = process.platform === "win32";
const youtubeDlBin = path.resolve('tools/bin/youtube-dl' +(isWin ? '.exe' : ''));
const ffmpegBin = 'ffmpeg';

export class YoutubeDl {
    public static async getVideoMetadata(url: string, options?: string, schema?: string[]) {
        options = options ||  '-f \"best\"';
        const command = `${youtubeDlBin} ${options} --dump-single-json ${url}`;
        return await new Promise<any>((resolve, reject) => {
            exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
                if(error) {
                    reject({error: error.message, stderr, stdout});
                    return
                }
                try {
                    let resultObject = JSON.parse(stdout);
                    if(schema) {
                        resultObject = YoutubeDl.filterKeys(resultObject, schema);
                    }
                    resolve(resultObject);
                } catch (e) {
                    reject({error: e, stderr, stdout});
                }
            });
        });
    }

    private static filterKeys(obj: { [name: string]: any }, keys: string[]){
        if(!Array.isArray(keys)) {
            keys = [keys];
        }
        const reducer = function(accumulator: { [name: string]: any }, currentValue: string) {
            if(obj[currentValue]) {
                accumulator[currentValue] = obj[currentValue];
            }
            return accumulator;
        };
        return keys.reduce((reducer), {});
    }

    public static sendAudioStream(url: string, res: express.Response, inputFormat?: string, outputFormat?: string) {
        inputFormat = inputFormat || "bestaudio";
        outputFormat = outputFormat || "mp3";
        let contentType = '';
        switch (outputFormat) {
            case "mp3":
                contentType = "audio/mpeg";
                break;
            case "ogg":
                contentType = "audio/ogg";
                break;
            case "wav":
                contentType = "audio/wav";
                break;
            default:
                res.status(400);
                res.send(`Bad format: ${outputFormat} not supported`);
                return;
        }
        const command = `${youtubeDlBin} -f "${inputFormat}" -o - ${url} | ${ffmpegBin} -i - -f ${outputFormat} -`;
        const proc = spawn("sh", ["-c", command]);
        res.socket?.addListener("close", () => {
            proc.kill();
        });
        res.setHeader("Content-Type", contentType)
        proc.stdout.pipe(res);
    }
}
