import { Context, Schema } from 'koishi'
import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

export const name = 'azuretts'

export interface Config {
  speechKey: string
  speechRegion: string
  voiceName: string
}

// 中文config
export const Config: Schema<Config> = Schema.object({
  speechKey: Schema.string().description('你的 Azure 语音服务密钥。'),
  speechRegion: Schema.string().description('你的 Azure 语音服务区域。'),
  voiceName: Schema.string().description('语音模型名称，例如：zh-CN-XiaoxiaoNeural'),
})

export async function text2speech(text: string, config: Config): Promise<Buffer> {
  const speechConfig = sdk.SpeechConfig.fromSubscription(config.speechKey, config.speechRegion)
  speechConfig.speechSynthesisVoiceName = config.voiceName
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig)

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(text,
      async (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("合成完成。")
          if (result.audioData) {
            resolve(Buffer.from(result.audioData)) // 直接使用 result.audioData
          } else {
            console.error("没有可用的音频数据。")
            reject(new Error("合成失败：音频数据缺失"))
          }
        } else {
          console.error("语音合成取消，" + result.errorDetails +
            "\n请检查语音资源密钥和区域值是否设置正确。")
          reject(new Error(result.errorDetails))
        }
        synthesizer.close()
      },
      (err) => {
        console.trace("错误 - " + err)
        synthesizer.close()
        reject(err)
      })
  })
}

export function apply(ctx: Context, config: Config) {
  ctx.command('azuretts <text>', 'Convert text to speech')
    .action(async ({ session }, text) => {
      if (!text) {
        return session.send('请提供要转换的文本。')
      }

      try {
        const audioBuffer = await text2speech(text, config)
        const base64Audio = audioBuffer.toString('base64')
        await session.send(`<audio src="data:audio/wav;base64,${base64Audio}" controls/>`)
      } catch (error) {
        await session.send('语音合成失败：' + error.message)
      }
    })
}
