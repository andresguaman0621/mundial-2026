import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// Plugin de desarrollo: ejecuta las funciones serverless de /api dentro del
// dev server de Vite, para que `npm run dev` funcione igual que en Vercel
// (sin necesidad de instalar el CLI de Vercel). En producción, Vercel publica
// /api automáticamente y este plugin no interviene.
function devApiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        const url = new URL(req.url, 'http://localhost');
        const name = url.pathname.replace(/^\/api\//, '').replace(/\/+$/, '');

        // Adapta el res de Node al estilo Vercel (res.status().json()).
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
          return res;
        };
        req.query = Object.fromEntries(url.searchParams);

        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          await mod.default(req, res);
        } catch (e) {
          if (e?.code === 'ERR_LOAD_URL' || /Cannot find|Failed to load/.test(e?.message || '')) {
            res.status(404).json({ ok: false, error: `No existe /api/${name}` });
          } else {
            console.error(`[dev-api] /api/${name}:`, e);
            res.status(500).json({ ok: false, error: e?.message || 'Error interno' });
          }
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Carga .env (sin filtro de prefijo) y expónelo a process.env para que los
  // handlers de /api vean TURSO_* y ADMIN_PASSWORD durante el dev.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [vue(), devApiPlugin()],
  };
});
