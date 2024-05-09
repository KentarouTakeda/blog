module.exports = {
  filters: {
    allowlist: {
      allow: ['/{% .+ %}/m'],
    },
    "comments": true,
    'node-types': {
      nodeTypes: ['BlockQuote', 'CodeBlock'],
    },
  },
  rules: {
    'preset-ja-technical-writing': {
      'ja-no-mixed-period': {
        allowPeriodMarks: ['、', '…', ':'],
      },
      'ja-no-successive-word': {
        allow: ['/〇/', '！'],
      },
      'ja-no-weak-phrase': false,
      'max-kanji-continuous-len': false,
      "no-mix-dearu-desumasu": false,
      'no-doubled-joshi': {
        allow: ['か', 'も', 'や', 'に'],
      },
      'no-exclamation-question-mark': false,
      'sentence-length': {
        max: 150,
      },
    },
  },
}
