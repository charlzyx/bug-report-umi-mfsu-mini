# 最小复现 https://github.com/umijs/umi/issues/6766#issuecomment-871192776

# .umirc.ts

```diff
import { defineConfig } from 'umi';

export default defineConfig({
+ base: '/app',
+ publicPath: '/app/',
+ webpack5: {},
+ mfsu: {},
+ dynamicImport: {},
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
});

```

# 如何修正
NODE_ENV=development 的时候, 不设置 publicPath (未测试)

# 可能的修复方法

但是了解的不够深入, 不知道影响范围, 只能抛个砖

[getMfsuPath](https://github.com/umijs/umi/blob/master/packages/preset-built-in/src/plugins/features/mfsu/mfsu.ts#L39)

[addBeforeMiddlewares](https://github.com/umijs/umi/blob/master/packages/preset-built-in/src/plugins/features/mfsu/mfsu.ts#L238)

```diff
# L39
export const getMfsuPath = (api: IApi, { mode }: { mode: TMode }) => {
  if (mode === 'development') {
    const configPath = api.userConfig.mfsu?.development?.output;
+   // 形如 /app/ 这样的 publicPath, 需要修正一下输出路径
+   const publicPath = /^\/.*\/$/.test(api.config.publicPath) ?api.config.publicPath : '';
    return configPath
-     ? join(api.cwd, configPath)
-     : join(api.paths.absTmpPath!, '.cache', '.mfsu');
+     ? join(api.cwd, configPath, publicPath)
+     : join(api.paths.absTmpPath!, '.cache', '.mfsu', publicPath);

  } else {
+   // 生产环境不知道怎么处理
    const configPath = api.userConfig.mfsu?.production?.output;
    return configPath
      ? join(api.cwd, configPath)
      : join(api.cwd, './.mfsu-production');
  }
};
# L238
api.addBeforeMiddlewares(() => {
  return (req, res, next) => {
-   const { pathname } = url.parse(req.url);
+   const { pathname: originPathName } = url.parse(req.url);
+   // 形如 /app/ 这样的 publicPath, 需要修正一下输出路径
+   const publicPath = /^\/.*\/$/.test(api.config.publicPath) ?api.config.publicPath : '';
+   const pathname = originPathName.replace(publicPath, '');
+   // 没有后缀的请求, 不做处理
+   const noExtnameMaybeDir = !!require('path').extname(pathname);
    if (
+     noExtnameMaybeDir ||
      !api.userConfig.mfsu ||
      pathname === '/' ||
      !existsSync(
        join(getMfsuPath(api, { mode: 'development' }), '.' + pathname),
      )
    ) {
      next();
    } else {
      const value = readFileSync(
        join(getMfsuPath(api, { mode: 'development' }), '.' + pathname),
        'utf-8',
      );
      res.setHeader('content-type', mime.lookup(parse(pathname || '').ext));
      // 排除入口文件，因为 hash 是入口文件控制的
      if (!/remoteEntry.js/.test(req.url)) {
        res.setHeader('cache-control', 'max-age=31536000,immutable');
      }
      res.send(value);
    }
  };
});
```
