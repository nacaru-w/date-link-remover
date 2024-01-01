//<nowiki>
let articleList;

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

    function getContent(pageName) {
        let params = {
            action: 'query',
            prop: 'revisions',
            titles: pageName,
            rvprop: 'content',
            rvslots: 'main',
            formatversion: '2',
            format: 'json'
        };

        let apiPromise = new mw.Api().get(params).then(
            ((data) => {
                return data.query.pages[0].revisions[0].slots?.main?.content
            })
        );
        return apiPromise;
    }

    function genArticleList() {
        const params = {
            action: 'query',
            format: 'json',
            list: 'random',
            rnnamespace: '0|104',
            rnlimit: '100'
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

    function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    function makeRegexGlobal(expression) {
        return new RegExp(expression, "gi");
    }

    // Regexes variables
    const regex = /\[\[((?:\d{1,2}º? de )?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)\]\]/i;
    const pipeRegex = /\[\[((?:\d{1,2}º? de )?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)(?:\|([^\]]*))\]\]/i;
    const templateRegex = /(\{\{(?:siglo|(?:Julgreg)?fecha)[^\}]+)(?:\|1|\|Link\s*=\s*(?:\"true\"|(?:s[ií]|pt)))\s*(\}\})/i;

    function textReplacer(articleText, applyRegex, applyPipeRegex, applyTemplateRegex) {
        let newText = articleText;
        if (applyRegex) {
            const newRegex = makeRegexGlobal(regex);
            newText = newText.replace(newRegex, "$1");
        }
        if (applyPipeRegex) {
            const newPipeRegex = makeRegexGlobal(pipeRegex);
            newText = newText.replace(newPipeRegex, "$2");
        }
        if (applyTemplateRegex) {
            const newTemplateRegex = makeRegexGlobal(templateRegex);
            newText = newText.replace(newTemplateRegex, "$1$2");
        }
        return newText;
    }

    function loadControlPanel() {
        console.log('loading window');
        let Window = new Morebits.simpleWindow(1000, 400);
        Window.setScriptName('date-link-remover-control-panel.js');
        Window.setTitle('Eliminar fechas');

        let form = new Morebits.quickForm(submit);

        form.append({
            type: 'div',
            name: 'articlesBox',
            id: 'articlesBox',
        })

        form.append({
            type: 'submit',
            label: 'Generar lista',
            id: 'createArray',
        });

        let result = form.render();
        Window.setContent(result);
        Window.display();
    }

    function submit() {
        console.log('submitted');
        const box = document.getElementById('articlesBox');
        const submitButton = document.querySelector('button.submitButtonProxy')
        submitButton.id = 'submitButton';
        submitButton.style = 'margin-right: 1em;';
        submitButton.setAttribute('disabled', '');
        if (!document.getElementById('initializeButton')) {
            const initializeButton = document.createElement("button");
            initializeButton.id = 'initializeButton';
            initializeButton.innerText = 'Iniciar';
            document.querySelector('span.morebits-dialog-buttons').append(initializeButton)
            initializeButton.addEventListener("click", async () => {
                initializeButton.setAttribute('disabled', '');
                cleanupButton.setAttribute('disabled', '');
                for (let article of articleList) {
                    const content = await getContent(article);
                    const useRegex = regex.test(content);
                    const usePipeRegex = pipeRegex.test(content);
                    const useTemplateRegex = templateRegex.test(content);
                    if (useRegex || usePipeRegex || useTemplateRegex) {
                        await new mw.Api().edit(
                            article,
                            (revision) => {
                                return {
                                    text: textReplacer(revision.content, useRegex, usePipeRegex, useTemplateRegex),
                                    summary: 'Eliminando enlaces según [[WP:ENLACESFECHAS]]',
                                    minor: false,
                                    token: 'crsf'
                                }
                            }
                        ).then(() => {
                            const htmlElement = document.getElementById(article);
                            htmlElement.style.color = 'darkgreen';
                        }).catch((error) => {
                            console.log(error);
                        })

                        await wait(12000);

                    }

                    if (!useRegex && !usePipeRegex && !useTemplateRegex) {
                        const htmlElement = document.getElementById(article);
                        htmlElement.style.color = 'darkgray';
                    }
                }
                alert("Tarea finalizada");
                cleanupButton.removeAttribute('disabled');
            })
        }
        if (!document.getElementById('cleanupButton')) {
            const cleanupButton = document.createElement("button");
            cleanupButton.id = 'cleanupButton';
            cleanupButton.style = 'margin-left: 1em;';
            cleanupButton.innerText = 'Limpiar lista';
            cleanupButton.style.backgroundColor = '#E7EBDA';
            document.querySelector('span.morebits-dialog-buttons').append(cleanupButton);
            cleanupButton.addEventListener('click', () => {
                articleList = [];
                box.innerHTML = '';
                cleanupButton.setAttribute('disabled', '');
                initializeButton.setAttribute('disabled', '');
                submitButton.removeAttribute('disabled');
            })
        }

        genArticleList().then((result) => {
            articleList = result;
            cleanupButton.removeAttribute('disabled');
            initializeButton.removeAttribute('disabled');
            for (let article of articleList) {
                let spanElement = document.createElement("span");
                spanElement.id = article
                spanElement.textContent = article;
                spanElement.style = 'margin-right: 0.25em;'
                let button = document.createElement("button");
                button.innerText = '❌';
                button.type = 'button';
                button.style = 'margin-right: 1.25em;'
                button.addEventListener('click', () => {
                    const index = articleList.indexOf(article);
                    if (index !== -1) {
                        articleList.splice(index, 1);
                        spanElement.style = 'text-decoration: line-through;';
                    }
                })

                box.appendChild(spanElement);
                box.appendChild(button);

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
