module.exports = {
  filters: {
    allowlist: {
      allow: ['/{% .+ %}/m'],
    },
    'node-types': {
      nodeTypes: ['BlockQuote'],
    },
  },
  rules: {
    'preset-ja-technical-writing': {
      'ja-no-mixed-period': {
        allowPeriodMarks: ['、', '…'],
      },
      'ja-no-successive-word': {
        allow: ['/〇/', '！'],
      },
      'ja-no-weak-phrase': false,
      'no-doubled-joshi': {
        allow: ['か', 'も', 'や'],
      },
      'no-exclamation-question-mark': false,
      'sentence-length': {
        max: 150,
      },
    },
  },
}
