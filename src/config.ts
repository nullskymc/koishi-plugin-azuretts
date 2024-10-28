import {Schema} from 'koishi';

export interface Config {
  speechKey: string;
  speechRegion: string;
  voiceName: string;
}


// 中文config
export const Config: Schema<Config> = Schema.object({
  speechKey: Schema.string().description('你的 Azure 语音服务密钥。'),
  speechRegion: Schema.string().description('你的 Azure 语音服务区域。'),
  voiceName: Schema.string().description('语音模型名称，例如：zh-CN-XiaoxiaoNeural'),
});

export const inject = {
    optional: ['vits'],
};
