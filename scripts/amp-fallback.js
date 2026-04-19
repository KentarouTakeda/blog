hexo.extend.generator.register('amp', locals => locals.posts.map(post => ({
  data: '<meta http-equiv="refresh" content="0;URL=../">\n' ,
  path: post.path + 'amp/index.html'
})));
