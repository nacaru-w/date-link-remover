//<nowiki>

const dateLinkeRemoverControlPanel = (() => {
    // Regexes variables
    const regex = /\[\[((?:\d{1,2}º? de )?(?:(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?: de [1-9]\d{0,3})?)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)\]\]/i;
    const pipeRegex = /\[\[((?:\d{1,2}º? de )?(?:(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?: de [1-9]\d{0,3})?)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)(?:\|([^\]]*))\]\]/i;
    const templateRegex = /(\{\{(?:siglo|(?:Julgreg)?fecha)[^\}]+)(?:\|1|\|Link\s*=\s*(?:\"true\"|(?:s[ií]|pt)))\s*(\}\})/i;

    let articleList;
    let articleDict;

    console.log('Loading control panel');
    const currentPage = mw.config.get('wgPageName');

    async function loadDependencies() {
        await mw.loader.using([
            'mediawiki.user',
            'mediawiki.util',
            'mediawiki.Title',
            'jquery.ui',
            'mediawiki.api',
        ]);
        console.log('Dependencies have been loaded');
        await mw.loader.load('https://en.wikipedia.org/w/index.php?title=MediaWiki:Gadget-morebits.js&action=raw&ctype=text/javascript', 'text/javascript');
        await mw.loader.load('https://en.wikipedia.org/w/index.php?title=MediaWiki:Gadget-morebits.css&action=raw&ctype=text/css', 'text/css');
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

    let articlesFound = 0;

    async function genArticleList() {
        let promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(genArticle())
        }
        let result = await Promise.all(promises);
        return result.flat(1)
    }

    async function genArticle() {
        let selectedArticle = null;
        const params = {
            action: 'query',
            format: 'json',
            list: 'random',
            rnnamespace: '0|104',
            rnlimit: '1'
        },
            api = new mw.Api();

        while (selectedArticle === null) {
            const result = await api.get(params);
            const article = result.query.random[0].title;
            const content = await getContent(article);

            const useRegex = regex.test(content);
            const usePipeRegex = pipeRegex.test(content);
            const useTemplateRegex = templateRegex.test(content);

            if (useRegex || usePipeRegex || useTemplateRegex) {
                selectedArticle = article;
                articleDict[selectedArticle] = {
                    regexEval: useRegex,
                    pipeRegexEval: usePipeRegex,
                    templateRegexEval: useTemplateRegex,
                }
            }
        }

        articlesFound++
        updateLoadingMessage(articlesFound)
        console.log(`Found ${articlesFound} articles so far`)
        return selectedArticle;

    }

    function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    function makeRegexGlobal(expression) {
        return new RegExp(expression, "gi");
    }

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

    function generateLoadingMessage(parentElement) {
        const messageBox = document.createElement('div')
        messageBox.id = 'messageBox';
        messageBox.style = 'font-weight: bold; font-size: 1.2em; height: auto; width: auto; text-align: center;'
        messageBox.innerText = 'Cargando artículos (0/100)'
        parentElement.appendChild(messageBox);
    }

    function deleteLoadingMessage() {
        const messageBox = document.getElementById('messageBox');
        messageBox.remove();
    }

    function updateLoadingMessage(number) {
        const messageBox = document.getElementById('messageBox');
        messageBox.innerText = `Cargando artículos (${number}/100)`
    }

    function submit() {
        articleDict = {};
        console.log('submitted');
        const box = document.getElementById('articlesBox');
        generateLoadingMessage(box);
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
                    await new mw.Api().edit(
                        article,
                        (revision) => {
                            return {
                                text: textReplacer(
                                    revision.content,
                                    articleDict[article].regexEval,
                                    articleDict[article].pipeRegexEval,
                                    articleDict[article].templateRegexEval
                                ),
                                summary: 'Eliminando enlaces según [[WP:ENLACESFECHAS]]',
                                minor: false,
                                token: 'crsf'
                            }
                        }
                    ).then(() => {
                        const htmlElement = document.getElementById(article);
                        htmlElement.style.color = 'darkgreen';
                    }).catch((error) => {
                        const htmlElement = document.getElementById(article);
                        htmlElement.style.color = 'red';
                        console.log(`Se ha producido un error: ${error}`);
                    })

                    await wait(12000);

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
            deleteLoadingMessage();
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
        (async () => {
            await loadDependencies();
            console.log('In the right page');
            const button = document.querySelector('span.control-panel-button')
            button.addEventListener("click", () => {
                if (document.readyState !== 'loading') {
                    loadControlPanel();
                } else {
                    document.addEventListener('DOMContentLoaded', loadControlPanel());
                }
            })
        })()
    }

})();

//</nowiki>
