"use strict";

const { full_url_for } = require("hexo-util");

const collectEntries = (locals) => {
  const posts = [...locals.posts.toArray(), ...locals.posts_en.toArray()];

  const lastmodOf = (page) => page.updated ?? page.date;

  const byLastmod = posts.toSorted((a, b) => lastmodOf(a) - lastmodOf(b));

  const tagLastmod = new Map();

  // タグページ更新日時: 英語記事は locals.posts 管理外のため tag.posts ではなく全記事から集計
  byLastmod.forEach((post) =>
    post.tags
      .toArray()
      .forEach(({ name }) => tagLastmod.set(name, lastmodOf(post))),
  );

  const pages = locals.pages
    .toArray()
    .filter((page) => page.path.endsWith(".html"));

  return [
    {
      loc: full_url_for.call(hexo, "/"),
      lastmod: lastmodOf(byLastmod.at(-1)),
    },
    ...[...pages, ...posts].map((page) => ({
      loc: page.permalink.replace(/index\.html$/, ""),
      lastmod: lastmodOf(page),
    })),
    ...locals.tags
      .toArray()
      .filter((tag) => tagLastmod.has(tag.name))
      .map((tag) => ({
        loc: tag.permalink,
        lastmod: tagLastmod.get(tag.name),
      })),
  ].sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));
};

hexo.extend.generator.register("sitemap", (locals) => ({
  path: "sitemap.xml",
  data: [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...collectEntries(locals).flatMap(({ loc, lastmod }) => [
      "  <url>",
      `    <loc>${loc.replaceAll("&", "&amp;")}</loc>`, // URLエスケープではXMLに対応できない `&` のみ置換
      `    <lastmod>${lastmod.format()}</lastmod>`,
      "  </url>",
    ]),
    "</urlset>",
    "",
  ].join("\n"),
}));
