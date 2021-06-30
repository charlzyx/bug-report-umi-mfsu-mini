import { defineConfig } from 'umi';

export default defineConfig({
  base: '/app',
  publicPath: '/app/',
  webpack5: {},
  mfsu: {},
  dynamicImport: {},
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
});
