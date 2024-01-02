Project created to easily apply the [[[WP:ENLACESFECHAS]]](https://es.wikipedia.org/wiki/Wikipedia:Manual_de_estilo#Enlaces_internos) rule on the Spanish Wikipedia.

The script is then transcluded on [this page](https://es.wikipedia.org/wiki/Usuario:Nacaru/date-link-remover.js).

To be able to use it, you must paste the following code in your common.js page:

```js
mw.loader.load("https://es.wikipedia.org/w/index.php?title=Usuario:Nacaru/date-link-remover.js&action=raw&ctype=text/javascript");
```

There's also a way to apply the script massively through the [control panel](https://github.com/nacaru-w/date-link-remover/blob/main/control%20panel/control-panel.js). This approach is only to be carried out by a Wikipedia bot.

To access it from the Spanish Wikipedia, go on `https://es.wikipedia.org/wiki/Usuario:<YOUR USERNAME>/common.js` where `<YOUR USERNAME>` is well... literally your user name. If you're logged in, you can also access it from [this link](https://es.wikipedia.org/wiki/Especial:MiP%C3%A1gina/common.js).