import { Context, h, Logger } from 'koishi';
import Vits from '@initencounter/vits';
import { Config } from './config';
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export class AzureVitsService {
    private synthesizer: sdk.SpeechSynthesizer;

    constructor(private config: Config) {
        if (!config.speechKey || !config.speechRegion) {
            throw new Error("speechKey and speechRegion must be defined in the config.");
        }
        const speechConfig = sdk.SpeechConfig.fromSubscription(config.speechKey, config.speechRegion);
        speechConfig.speechSynthesisVoiceName = config.voiceName;
        this.synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    }

    public async text2speech(text: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.synthesizer.speakTextAsync(text,
                (result) => {
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        console.log("合成完成。");
                        if (result.audioData) {
                            resolve(Buffer.from(result.audioData));
                        } else {
                            console.error("没有可用的音频数据。");
                            reject(new Error("合成失败：音频数据缺失"));
                        }
                    } else {
                        console.error("语音合成取消，" + result.errorDetails +
                            "\n请检查语音资源密钥和区域值是否设置正确。");
                        reject(new Error(result.errorDetails));
                    }
                    this.synthesizer.close();
                },
                (err) => {
                    console.trace("错误 - " + err);
                    this.synthesizer.close();
                    reject(err);
                });
        });
    }
}

export class AzureVits extends Vits {
    private logger: Logger;

    constructor(ctx: Context, public config: Config) {
        super(ctx);
        this.logger = ctx.logger('azure-vits');
    }

    async say(options: Vits.Result): Promise<h> {
        const input = options.input; // 假设 Result 中有 input 属性
        const configOptions = { ...this.config, ...options };

        const azureVitsService = new AzureVitsService(this.config);
        try {
            const audioBuffer = await azureVitsService.text2speech(input);
            const base64Audio = audioBuffer.toString('base64');
            return h.audio(`data:audio/wav;base64,${base64Audio}`);
        } catch (error) {
            this.logger.error('ERROR:', error);
            throw error;
        }
    }
}
