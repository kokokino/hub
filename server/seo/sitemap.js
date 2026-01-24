import { WebApp } from 'meteor/webapp';
import { Apps } from '/lib/collections/apps';

const DOMAIN = 'https://kokokino.com';

/**
 * Generate XML sitemap dynamically from database
 */
async function generateSitemap() {
  const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/about', changefreq: 'monthly', priority: '0.8' },
    { loc: '/faq', changefreq: 'monthly', priority: '0.8' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
    { loc: '/privacy', changefreq: 'monthly', priority: '0.5' },
    { loc: '/secure-payments', changefreq: 'monthly', priority: '0.5' },
    { loc: '/sitemap', changefreq: 'weekly', priority: '0.6' }
  ];

  // Fetch all approved, active apps
  const apps = await Apps.find({
    isApproved: true,
    isActive: true
  }).fetchAsync();

  const appPages = apps.map(app => {
    const slug = app.slug || app._id;
    return {
      loc: `/apps/${slug}`,
      changefreq: 'monthly',
      priority: '0.9',
      lastmod: app.updatedAt ? app.updatedAt.toISOString().split('T')[0] : null
    };
  });

  const allPages = [...staticPages, ...appPages];

  const urlEntries = allPages.map(page => {
    let entry = `  <url>\n    <loc>${DOMAIN}${page.loc}</loc>\n`;
    if (page.lastmod) {
      entry += `    <lastmod>${page.lastmod}</lastmod>\n`;
    }
    entry += `    <changefreq>${page.changefreq}</changefreq>\n`;
    entry += `    <priority>${page.priority}</priority>\n`;
    entry += `  </url>`;
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

// Register sitemap endpoint
WebApp.connectHandlers.use('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.writeHead(200, {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error generating sitemap');
  }
});

console.log('Sitemap endpoint registered at /sitemap.xml');
