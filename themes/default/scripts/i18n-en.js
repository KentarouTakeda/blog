"use strict";

const baseSlug = (post) => post.slug.replace(/\.en$/, "");
const isEnFile = (post) => (post.source ?? "").endsWith(".en.md");
const altPaths = (slug) => ({ ja: `/post/${slug}/`, en: `/en/post/${slug}/` });

const pairedSlugs = new Set();
let basePosts;

const pairedSlugOf = (page) => {
  if (!page.__post) return null;
  const slug = baseSlug(page);
  return pairedSlugs.has(slug) ? slug : null;
};

// Default an .en.md article to lang "en" (front matter wins) so Hexo's i18n (__),
// og:locale and <html lang> resolve it natively.
hexo.extend.filter.register("before_post_render", (post) => {
  if (isEnFile(post)) post.lang ??= "en";
});

hexo.extend.filter.register(
  "post_permalink",
  (post) => {
    if (isEnFile(post)) post.__permalink = `en/post/${baseSlug(post)}/`;
  },
  1,
);

hexo.extend.filter.register(
  "before_generate",
  () => {
    basePosts ??= hexo.locals.getters.posts;

    const enSlugs = new Set();
    const jaSlugs = new Set();
    for (const post of basePosts().toArray()) {
      (isEnFile(post) ? enSlugs : jaSlugs).add(baseSlug(post));
    }
    pairedSlugs.clear();
    for (const slug of enSlugs) {
      if (jaSlugs.has(slug)) pairedSlugs.add(slug);
    }

    hexo.locals.set("posts", () => basePosts().filter((p) => !isEnFile(p)));
    hexo.locals.set("posts_en", () => basePosts().filter(isEnFile));
  },
  1,
);

hexo.extend.generator.register("post_en", (locals) =>
  locals.posts_en.toArray().map((post) => {
    post.__post = true;
    return { path: post.path, layout: ["post", "page", "index"], data: post };
  }),
);

// From an English article, point post_link at the target's English edition when
// one exists; otherwise hand the arguments to the built-in tag unchanged.
const builtinPostLink = hexo.extend.tag.env.getExtension("post_link").fn;
hexo.extend.tag.register("post_link", function (args) {
  if (isEnFile(this) && args[0]) {
    const Post = hexo.database.model("Post");
    const [slug, hash] = args[0].split("#");
    const target = Post.findOne({ slug }) || Post.findOne({ title: slug });
    const enSlug = target && `${target.slug}.en`;
    if (enSlug && Post.findOne({ slug: enSlug })) {
      args = [hash ? `${enSlug}#${hash}` : enSlug, ...args.slice(1)];
    }
  }
  return Reflect.apply(builtinPostLink, this, [args]);
});

hexo.extend.helper.register("i18n_alternates", function () {
  const slug = pairedSlugOf(this.page);
  if (!slug) return [];
  const { ja, en } = altPaths(slug);
  return [
    { hreflang: "ja", path: ja },
    { hreflang: "en", path: en },
  ];
});

hexo.extend.helper.register("i18n_default", function () {
  const slug = pairedSlugOf(this.page);
  return slug ? altPaths(slug).ja : null;
});

hexo.extend.helper.register("i18n_counterpart", function () {
  const slug = pairedSlugOf(this.page);
  if (!slug) return null;
  const { ja, en } = altPaths(slug);
  return isEnFile(this.page) ? ja : en;
});
