const util = require('hexo-util');

const ARGS = [
    'classes:',
    'mode:'
];

hexo.extend.tag.register('details', async (args, content) => {
    const summary = args.filter(s => {
        for(const ARG of ARGS) {
            if(s.startsWith(ARG)) {
                return false;
            }
        }
        return true;
    }).join(' ');
  
    const classes = args
        .filter(s => s.startsWith('classes:'))
        .map(s => s.slice('classes:'.length));
    if(0 === classes.length) {
        classes.push('default');
    }

    const attrs = {
        'class': classes.join(' '),
    };
    if (args.includes('mode:open')) {
        attrs.open = 'open';
    }

    return util.htmlTag('details', attrs,
        util.htmlTag('summary', {}, summary) +
        await hexo.render.render({ text: content, engine: 'markdown' }),
        false
    );
}, { ends: true, async: true });
