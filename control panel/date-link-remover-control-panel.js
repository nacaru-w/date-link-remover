//<nowiki>

/** 
 * Este script solo debe de ser utilizado por bots. Si posees un bot y estás interesado en implementarlo, por favor contacta con el autor (Nacaru).
 * 
 * Este código está liberado bajo la licencia GPL-3.0 (según se estipula en su repositorio original en https://github.com/nacaru-w/date-link-remover).
 */

const dateLinkeRemoverControlPanel = (() => {
    // Regexes variables
    const regex = /\[\[((?:\d{1,2}º?\sde\s)?(?:(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\sde\s[1-9]\d{0,3})?)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)\]\]/i;
    const pipeRegex = /\[\[((?:\d{1,2}º?\sde\s)?(?:(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\sde\s[1-9]\d{0,3})?)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)(?:\|([^\]]*))\]\]/i;
    const templateRegex = /(\{\{(?:siglo|(?:Julgreg)?fecha)[^\}]+)(?:\|1|\|Link\s*=\s*(?:\"true\"|(?:s[ií]|pt)))\s*(\}\})/i;

    // This one is so that the function that finds the articles can discard them if they're within the calendar-related scope
    const titleRegex = /^((?:\d{1,2}º? de |Anexo:[A-Za-zÀ-ÖØ-öø-ÿ ]+ en )?(?:(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|año|día|mes)?(?:(?: de )?[1-9]\d{0,3})?)|(?:(?:Anexo:)?(?:Cronología|Día|Mes|Década|Siglo) de[A-Za-zÀ-ÖØ-öø-ÿ ]+)|(?:(?:Anexo:)?(Años?|Día (?:mundial|(?:inter)?nacional)) [A-Za-zÀ-ÖØ-öø-ÿ ]+)|(?:Calendario [A-Za-zÀ-ÖØ-öø-ÿ ]+)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}(?: \(desambiguación\))?|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)$/i;

    let articleList;
    let articleDict;
    let articlesFound = 0;

    const calendarCategories = ['[[Categoría:Anexos:Tablas anuales', "[[Categoría:Calendario"];

    let exceptions;

    const api = new mw.Api({
        ajax: {
            headers: { 'Api-User-Agent': 'Nacarubot/1.0 JavaScript/:w:es:User:Nacaru/date-link-remover-control-panel.js' }
        }
    });

    console.log('Loading date-link-remover control panel');
    const currentPage = mw.config.get('wgPageName');

    async function listUserGroups() {
        var params = {
            action: 'query',
            meta: 'userinfo',
            uiprop: 'groups',
            format: 'json'
        };

        const data = await api.get(params);
        return data.query.userinfo.groups;
    }

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

        let apiPromise = api.get(params).then(
            ((data) => {
                return data.query.pages[0].revisions[0].slots?.main?.content
            })
        );
        return apiPromise;
    }

    async function getExceptions() {
        const JSONexceptions = await getContent('Usuario:NacaruBot/date-link-remover-control-panel/exceptions.json');
        exceptions = JSON.parse(JSONexceptions);
    }

    function updateExceptions() {
        api.edit(
            'Usuario:NacaruBot/date-link-remover-control-panel/exceptions.json',
            () => {
                return {
                    text: JSON.stringify(exceptions),
                    summary: 'Bot: actualizando lista de excepciones',
                    minor: false,
                    token: 'crsf',
                    bot: true
                }
            }
        ).then(res => {
            console.log('Exception JSON list has been successfully updated', res.result);
        }).catch(error => {
            console.log(`Error updating exception list: ${error}`);
        });
    }

    async function genArticleList() {
        let promises = [];
        for (let i = 0; i < 10000; i++) {
            promises.push(genArticle())
        }
        let result = await Promise.all(promises);
        return result.flat(1);
    }

    async function genArticle() {
        const barFill = document.getElementById('barFill');

        let selectedArticle = null;
        const params = {
            action: 'query',
            format: 'json',
            list: 'random',
            rnnamespace: '0|104',
            rnlimit: '1'
        };

        while (selectedArticle === null) {
            const result = await api.get(params);
            const article = result.query.random[0].title;
            const content = await getContent(article);

            const useRegex = regex.test(content);
            const usePipeRegex = pipeRegex.test(content);
            const useTemplateRegex = templateRegex.test(content);

            const calendarArticle = titleRegex.test(article) || calendarCategories.some(e => content.includes(e)) || exceptions.some(e => article == e);

            if (calendarArticle) {
                console.log(article);
            }

            if (!calendarArticle && (useRegex || usePipeRegex || useTemplateRegex)) {
                selectedArticle = article;
                articleDict[selectedArticle] = {
                    regexEval: useRegex,
                    pipeRegexEval: usePipeRegex,
                    templateRegexEval: useTemplateRegex,
                };
            }
        }

        articlesFound++;
        updateLoadingMessage(articlesFound);
        if (articlesFound % 100 == 0) {
            barFill.style.width = `${articlesFound / 100}%`;
        }

        return selectedArticle;

    }

    // function wait(ms) {
    //     return new Promise(resolve => {
    //         setTimeout(resolve, ms);
    //     });
    // }

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
        const messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
        messageBox.style = 'font-weight: bold; font-size: 1.2em; height: auto; width: auto; text-align: center;'
        messageBox.innerText = 'Cargando artículos (0/10000)'
        parentElement.appendChild(messageBox);
    }

    function deleteLoadingElements() {
        const messageBox = document.getElementById('messageBox');
        const progressBar = document.getElementById('progressBarContainer');
        progressBar.remove();
        messageBox.remove();
        articlesFound = 0;
    }

    function updateLoadingMessage(number) {
        const messageBox = document.getElementById('messageBox');
        messageBox.innerText = `Cargando artículos (${number}/10000)`;
    }

    function loadProgressBar(parentElement) {
        const progressBarContainer = document.createElement('div');
        progressBarContainer.id = 'progressBarContainer';
        progressBarContainer.style.height = '2em';
        progressBarContainer.style.width = '25em';
        progressBarContainer.style.border = 'solid black 2px'
        progressBarContainer.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, .2);';
        progressBarContainer.style.borderRadius = '3px';
        progressBarContainer.style.margin = '0 auto';

        const barFill = document.createElement('div');
        barFill.id = 'barFill';
        barFill.style.height = '100%';
        barFill.style.transition = 'width 500ms ease-in-out;';
        barFill.style.width = '0%';
        barFill.style.borderRadius = '3px';
        barFill.style.backgroundColor = '#659cef';

        progressBarContainer.appendChild(barFill);
        parentElement.appendChild(progressBarContainer);
    }



    function submit() {
        articleDict = {};
        console.log('Loading articles...');
        const box = document.getElementById('articlesBox');
        generateLoadingMessage(box);
        loadProgressBar(box);
        const submitButton = document.querySelector('button.submitButtonProxy')
        submitButton.id = 'submitButton';
        submitButton.style = 'margin-right: 1em;';
        submitButton.setAttribute('disabled', '');
        if (!document.getElementById('initializeButton')) {
            const initializeButton = document.createElement("button");
            initializeButton.id = 'initializeButton';
            initializeButton.innerText = 'Iniciar';
            initializeButton.setAttribute('disabled', '');
            document.querySelector('span.morebits-dialog-buttons').append(initializeButton)
            initializeButton.addEventListener("click", async () => {
                initializeButton.setAttribute('disabled', '');
                cleanupButton.setAttribute('disabled', '');
                for (let article of articleList) {
                    await api.edit(
                        article,
                        (revision) => {
                            return {
                                text: textReplacer(
                                    revision.content,
                                    articleDict[article].regexEval,
                                    articleDict[article].pipeRegexEval,
                                    articleDict[article].templateRegexEval
                                ),
                                summary: 'Bot: eliminando enlaces según [[WP:ENLACESFECHAS]]',
                                minor: false,
                                token: 'crsf',
                                bot: true
                            }
                        }
                    ).then(() => {
                        const htmlElement = document.getElementById(article);
                        htmlElement.style.color = 'darkgreen';
                    }).catch((error) => {
                        const htmlElement = document.getElementById(article);
                        htmlElement.style.color = 'red';
                        console.log(`The following error happened: ${error}`);
                    })

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
            cleanupButton.setAttribute('disabled', '');
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
            deleteLoadingElements();
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
                        exceptions.push(article);
                        updateExceptions();
                    }
                })

                box.appendChild(spanElement);
                box.appendChild(button);

            }
        })
    }

    if (currentPage == 'Usuario:Nacaru/date-link-remover-control-panel') {
        (async () => {
            const userGroups = await listUserGroups();
            if (userGroups.includes('bot')) {
                await loadDependencies();
                await getExceptions();
                console.log("Exception list:", exceptions)
                const button = document.querySelector('span.control-panel-button')
                button.addEventListener("click", () => {
                    if (document.readyState !== 'loading') {
                        loadControlPanel();
                    } else {
                        document.addEventListener('DOMContentLoaded', loadControlPanel());
                    }
                })
            } else {
                alert('Lo siento, este script solo debe ser utilizado por bots');
            }
        })()
    }

})();

//</nowiki>
