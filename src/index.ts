import {Context} from 'koishi';
import {AzureVits} from './vits';
import {Config} from './config';


export const name = 'azuretts';
export * from './config';

export function apply(ctx: Context, config: Config) {
  const vits = new AzureVits(ctx, config);
  ctx.plugin(AzureVits, vits); // 确保插件注册正确

  ctx.command('azuretts <text>', 'Convert text to speech')
    .action(async ({session}, text) => {
      if (!text) {
        return session.send('请提供要转换的文本。');
      }

      try {
        // 这里将 text 包装成一个符合 Result 接口的对象
        const audio = await vits.say({input: text});
        return session.send(audio);
      } catch (error) {
        return session.send(`合成失败：${error.message}`); // 修正模板字符串语法
      }
    });
}
