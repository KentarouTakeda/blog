const { readFileSync } = require("fs");
const { join, dirname } = require("path");
const { default: satori } = require("satori");
const sharp = require("sharp");
const { loadDefaultJapaneseParser } = require("budoux");

const parser = loadDefaultJapaneseParser();

const fetchAvatar = async (url) => {
  const png = await fetch(url + "?s=96")
    .then((res) => res.arrayBuffer())
    .then((buf) => sharp(Buffer.from(buf)).resize(48, 48).png().toBuffer());

  return `data:image/png;base64,${png.toString("base64")}`;
};

const fontDir = join(
  dirname(require.resolve("@fontsource/noto-sans-jp/package.json")),
  "files",
);

const SUBSETS = ["japanese", "latin"];

const loadFonts = (weight) =>
  SUBSETS.map((subset) => ({
    name: "Noto Sans JP",
    data: readFileSync(
      join(fontDir, `noto-sans-jp-${subset}-${weight}-normal.woff`),
    ),
    weight,
    style: "normal",
  }));

const fonts = [...loadFonts(700), ...loadFonts(400)];

const segmentText = (text) => {
  const result = [];

  parser.parse(text).forEach((segment, i) => {
    if (i > 0) {
      result.push({ type: "wbr", props: {} });
    }

    segment.split(/(\s+)/).forEach((part) => {
      if (!part) {
        return;
      }

      if (/^\s+$/.test(part)) {
        const nbsp = part.replace(/ /g, "\u00A0");

        if (
          result.length > 0 &&
          typeof result[result.length - 1] === "string"
        ) {
          result[result.length - 1] += nbsp;
        }

        result.push({ type: "wbr", props: {} });
      } else {
        result.push(part);
      }
    });
  });

  return result;
};

const TITLE_FONT_SIZE = 56;
const SUBTITLE_FONT_SIZE = Math.round(TITLE_FONT_SIZE * 0.83);
const TEXT_COLOR = "#000000d1";

const FRAME_COLOR = "#052d49";
const FRAME_WIDTH = 24;

const buildLayout = (title, subtitle, blogTitle, authorLabel, avatarSrc) => {
  const titleElement = {
    type: "div",
    props: {
      style: {
        color: TEXT_COLOR,
        fontSize: `${TITLE_FONT_SIZE}px`,
        fontWeight: 700,
        lineHeight: 1.4,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
      },
      children: segmentText(title),
    },
  };

  const contentChildren = subtitle
    ? [
        titleElement,
        {
          type: "div",
          props: {
            style: {
              color: TEXT_COLOR,
              fontSize: `${SUBTITLE_FONT_SIZE}px`,
              fontWeight: 400,
              lineHeight: 1.4,
              marginTop: `${Math.round(TITLE_FONT_SIZE * 1.4 * 0.5)}px`,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            },
            children: segmentText(subtitle),
          },
        },
      ]
    : titleElement;

  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: FRAME_COLOR,
      },
      children: [
        // 上部ヘッダー（サイト名）
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              paddingLeft: `${FRAME_WIDTH}px`,
              height: "100px",
            },
            children: {
              type: "div",
              props: {
                style: {
                  color: "#ffffff",
                  fontSize: "36px",
                  fontWeight: 400,
                },
                children: blogTitle,
              },
            },
          },
        },
        // メインコンテンツ（白い領域）
        {
          type: "div",
          props: {
            style: {
              flex: 1,
              margin: `0 ${FRAME_WIDTH}px ${FRAME_WIDTH}px ${FRAME_WIDTH}px`,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
            },
            children: [
              // コンテンツエリア
              {
                type: "div",
                props: {
                  style: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "32px 48px",
                  },
                  children: contentChildren,
                },
              },
              // 署名エリア（右下）
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    padding: "24px 32px",
                    gap: "18px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          color: TEXT_COLOR,
                          fontSize: "33px",
                          fontWeight: 400,
                        },
                        children: authorLabel,
                      },
                    },
                    {
                      type: "img",
                      props: {
                        src: avatarSrc,
                        width: 60,
                        height: 60,
                        style: { borderRadius: "50%" },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
};

hexo.extend.generator.register("ogimage", async (locals) => {
  const avatarSrc = hexo.config.avatar
    ? await fetchAvatar(hexo.config.avatar)
    : "";
  const authorLabel = hexo.config.author_display
    ? `${hexo.config.author_display} / @${hexo.config.author}`
    : hexo.config.author;

  const results = await Promise.all(
    locals.posts.map(async (post) => {
      const svg = await satori(
        buildLayout(
          post.title,
          post.subtitle,
          hexo.config.title,
          authorLabel,
          avatarSrc,
        ),
        { width: 1200, height: 630, fonts },
      );

      const png = await sharp(Buffer.from(svg)).png().toBuffer();

      return { path: post.path + "_ogimage-default.png", data: png };
    }),
  );

  return results;
});
