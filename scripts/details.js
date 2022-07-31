const util = require('hexo-util');

const ARGS = [
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
  
    const attrs = {};
    if (args.includes('mode:open')) {
        attrs.open = 'open';
    }

    return util.htmlTag('details', attrs,
        util.htmlTag('summary', {}, summary) +
        await hexo.render.render({ text: content, engine: 'markdown' }),
        false
    );
}, { ends: true, async: true });
