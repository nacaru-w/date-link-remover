//<nowiki>

const dateLinkeRemoverControlPanel = (() => {
    console.log('Loading control panel');
    const currentPage = mw.config.get('wgPageName');

    const loadDependencies = async (callback) => {
        await mw.loader.using(
            'mediawiki.user',
            'mediawiki.util',
            'mediawiki.Title',
            'jquery.ui',
            'mediawiki.api'
        );
        await mw.loader.load('https://en.wikipedia.org/w/index.php?title=MediaWiki:Gadget-morebits.js&action=raw&ctype=text/javascript', 'text/javascript');
        await mw.loader.load('https://en.wikipedia.org/w/index.php?title=MediaWiki:Gadget-morebits.css&action=raw&ctype=text/css', 'text/css');
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback());
        }
    }

    function genArticleList() {
        const params = {
            action: 'query',
            format: 'json',
            list: 'random',
            rnnamespace: '0|104',
            rnlimit: '5'
        },
            api = new mw.Api();

        let apiPromise = api.get(params).then((data) => {
            let finalList = []
            var randoms = data.query.random,
                r;
            for (r in randoms) {
                finalList.push(randoms[r].title);
            }
            return finalList
        });
        return apiPromise
    }

    function loadControlPanel() {
        console.log('loading window');
        let Window = new Morebits.simpleWindow(1000, 7000);
        Window.setScriptName('date-link-remover.js');
        Window.setTitle('Eliminar fechas');

        let form = new Morebits.quickForm(submit);

        form.append({
            type: 'div',
            name: 'articlesBox',
            id: 'articlesBox',
        })

        form.append({
            type: 'submit',
            label: 'Aceptar',
        });

        let result = form.render();
        Window.setContent(result);
        Window.display();
    }

    function submit() {
        console.log('submitted');
        const box = document.getElementById('articlesBox');
        genArticleList().then((result) => {
            const articleList = result;
            for (let article of articleList) {
                console.log(article);
                let spanElement = document.createElement("span");
                spanElement.id = "article-line"
                spanElement.textContent = article + ' ';

                box.appendChild(spanElement);
            }
        })
    }

    if (currentPage == 'Usuario:Nacaru/date-link-remover-control-panel') {
        console.log('In the right page');
        const button = document.querySelector('span.control-panel-button')
        button.addEventListener("click", () => {
            loadDependencies(loadControlPanel);
        })
    }

})();

//</nowiki>
