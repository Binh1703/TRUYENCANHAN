import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Extract public Google Drive folder contents directly
  app.get('/api/drive/public-folder/:folderId', async (req, res) => {
    try {
      const folderId = req.params.folderId.trim();
      const url = `https://drive.google.com/drive/folders/${folderId}`;

      const driveRes = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
        },
      });

      if (!driveRes.ok) {
        return res.status(driveRes.status).json({
          error: `Không thể đọc thư mục Google Drive (${driveRes.status})`,
        });
      }

      const html = await driveRes.text();

      // Extract folder name from <title>
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      let folderTitle = titleMatch ? titleMatch[1].replace(/\s*-\s*Google Drive.*$/i, '').trim() : 'Thư mục truyện Google Drive';

      const map = new Map<string, string>();

      // Pattern 1: data-id="([a-zA-Z0-9_-]+)"...data-tooltip="([^"]+)"
      const regex1 = /data-id="([a-zA-Z0-9_-]{20,})"[^>]*?data-tooltip="([^"]+)"/g;
      let match;
      while ((match = regex1.exec(html)) !== null) {
        const id = match[1];
        const name = match[2].replace(/\s+Audio.*$/i, '').trim();
        if (!map.has(id)) map.set(id, name);
      }

      // Pattern 2: aria-label="([^"]+)"...data-id="([a-zA-Z0-9_-]+)"
      const regex2 = /aria-label="([^"]+)"[^>]*?data-id="([a-zA-Z0-9_-]{20,})"/g;
      while ((match = regex2.exec(html)) !== null) {
        const name = match[1].replace(/\s+Audio.*$/i, '').replace(/\s+Shared.*$/i, '').trim();
        const id = match[2];
        if (!map.has(id)) map.set(id, name);
      }

      // Pattern 3: data-id="([a-zA-Z0-9_-]+)" ... aria-label="([^"]+)"
      const regex3 = /data-id="([a-zA-Z0-9_-]{20,})"[\s\S]{1,300}?aria-label="([^"]+)"/g;
      while ((match = regex3.exec(html)) !== null) {
        const id = match[1];
        const name = match[2].replace(/\s+Audio.*$/i, '').replace(/\s+Shared.*$/i, '').trim();
        if (!map.has(id)) map.set(id, name);
      }

      // Pattern 4: JS data arrays containing ["FILE_ID", "NAME.mp3", ...]
      const regex4 = /\["([a-zA-Z0-9_-]{20,40})",\s*"([^"]+\.(?:mp3|m4a|wav|aac|ogg|flac|txt|md))"/gi;
      while ((match = regex4.exec(html)) !== null) {
        const id = match[1];
        const name = match[2].trim();
        if (!map.has(id)) map.set(id, name);
      }

      const files: Array<{ id: string; name: string }> = [];
      const subfoldersMap = new Map<string, string>();

      // Extract subfolders pattern: /folders/([a-zA-Z0-9_-]{20,})
      const subfolderRegex = /\/folders\/([a-zA-Z0-9_-]{20,})/g;
      let sfMatch;
      while ((sfMatch = subfolderRegex.exec(html)) !== null) {
        const sfId = sfMatch[1];
        if (sfId !== folderId && !subfoldersMap.has(sfId)) {
          const sfName = map.get(sfId) || `Thư mục truyện ${subfoldersMap.size + 1}`;
          subfoldersMap.set(sfId, sfName);
        }
      }

      for (const [id, rawName] of map.entries()) {
        const isFolderItem =
          /shared folder|folder|thư mục/i.test(rawName) ||
          subfoldersMap.has(id);

        if (isFolderItem && id !== folderId) {
          const cleanName = rawName
            .replace(/\s*shared folder.*$/i, '')
            .replace(/\s*folder.*$/i, '')
            .trim();
          subfoldersMap.set(id, cleanName || rawName);
        } else {
          files.push({ id, name: rawName });
        }
      }

      // Natural sort by chapter/part number
      files.sort((a, b) => {
        const numA = (a.name.match(/\d+/) || [0])[0];
        const numB = (b.name.match(/\d+/) || [0])[0];
        return parseInt(numA.toString(), 10) - parseInt(numB.toString(), 10);
      });

      const subfolders: Array<{ id: string; name: string }> = [];
      for (const [id, name] of subfoldersMap.entries()) {
        const cleanName = name
          .replace(/\s*shared folder.*$/i, '')
          .replace(/\s*folder.*$/i, '')
          .trim();
        subfolders.push({ id, name: cleanName || name });
      }

      return res.json({
        folderId,
        folderTitle,
        total: files.length,
        files,
        subfolders,
      });
    } catch (err: unknown) {
      console.error('Error fetching public folder:', err);
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Lỗi lấy dữ liệu từ Google Drive',
      });
    }
  });

  // Proxy direct audio stream with Range support for seamless playback & seeking
  app.get('/api/drive/stream/:fileId', async (req, res) => {
    try {
      const fileId = req.params.fileId;
      const streamUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const driveRes = await fetch(streamUrl, {
        headers,
        redirect: 'follow',
      });

      res.status(driveRes.status);
      res.setHeader('Content-Type', driveRes.headers.get('content-type') || 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');

      const cl = driveRes.headers.get('content-length');
      if (cl) res.setHeader('Content-Length', cl);

      const cr = driveRes.headers.get('content-range');
      if (cr) res.setHeader('Content-Range', cr);

      if (driveRes.body) {
        const reader = driveRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        res.end();
      }
    } catch (err: unknown) {
      console.error('Audio stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Lỗi phát âm thanh từ Google Drive');
      }
    }
  });

  // Mount Vite middlewares in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
