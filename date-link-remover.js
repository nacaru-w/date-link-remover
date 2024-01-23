//<nowiki>

/** 
 * Si quieres usar el script, copia y pega el código que aparece a continuación en tu página common.js (puedes acceder a ella mediante este enlace: https://es.wikipedia.org/wiki/Especial:MiP%C3%A1gina/common.js):
 *
 * mw.loader.load("https://es.wikipedia.org/w/index.php?title=Usuario:Nacaru/date-link-remover.js&action=raw&ctype=text/javascript");
 *
 * El script funciona creando un enlace con el texto «[[WP:FECHASENLACES]]» (en la versión móvil, aparecerá simplemente una «F») en el menú de edición superior en páginas en las que detecta que hay enlaces internos a fechas.
 * Al hacer clic en él, eliminará automáticamente los enlaces internos que encuentre en las fechas según esa regla del manual de estilo.
 * Recuerda que los artículos que traten temas directamente relacionados con el calendario están exentos de cumplir esta norma.
 * Además, si existe un acuerdo en la PD un artículo, deberá respetarse siempre el consenso local.
 * 
 * Este código está liberado bajo la licencia GPL-3.0 (según se estipula en su repositorio original en https://github.com/nacaru-w/date-link-remover).
 */

const dateLinkRemover = (() => {
    const skin = mw.config.get('skin');

    // These should be loaded to ensure that everything works properly, the callback function that loads the script will only be called once DOM has been loaded
    const loadDependencies = (callback) => {
        mw.loader.using('mediawiki.api', 'mediawiki.util', 'mediawiki.user');
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback());
        }
    }

    // Function that gets the content of a page
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

    function makeRegexGlobal(expression) {
        return new RegExp(expression, "gi");
    }

    // Regexes variables
    let regex = /\[\[\s*((?:(?:0?[1-9]|[12]\d|3[01])º?\sde\s)?(?:(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\sde\s[1-9]\d{0,3})?)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)\s*\]\]/i;
    let pipeRegex = /\[\[\s*((?:(?:0?[1-9]|[12]\d|3[01])º?\sde\s)?(?:(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\sde\s[1-9]\d{0,3})?)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años?|década de)\s)?(?:[1-9]\d{0,3}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)(?:\s*\|([^\]]*))\s*\]\]/i;
    let templateRegex = /(\{\{(?:siglo|(?:Julgreg)?fecha)[^\}]+)(?:\|1|\|Link\s*=\s*(?:\"true\"|(?:s[ií]|pt)))\s*(\}\})/i;

    function textReplacer(articleText, applyRegex, applyPipeRegex, applyTemplateRegex) {
        let newText = articleText;
        if (applyRegex) {
            regex = makeRegexGlobal(regex);
            newText = newText.replace(regex, "$1");
        }
        if (applyPipeRegex) {
            pipeRegex = makeRegexGlobal(pipeRegex);
            newText = newText.replace(pipeRegex, "$2");
        }
        if (applyTemplateRegex) {
            templateRegex = makeRegexGlobal(templateRegex);
            newText = newText.replace(templateRegex, "$1$2");
        }
        return newText;
    }

    // Main script function
    const initializeScript = () => {
        // Find the name of the current page and assign it to a variable
        const page = mw.config.get('wgPageName');
        getContent(page).then((content) => {
            const useRegex = regex.test(content);
            const usePipeRegex = pipeRegex.test(content);
            const useTemplateRegex = templateRegex.test(content);
            if (useRegex || usePipeRegex || useTemplateRegex) {
                console.log("found at least one date with brackets");
                // This will add the button to remove the square brackets from dates if it finds such occurence in an article
                const portletLink = mw.util.addPortletLink('p-views', '#', 'WP:ENLACESFECHAS', 'enlaces-fechas', 'Se han detectado enlaces en fechas, clic aquí para eliminarlos');
                if (skin == 'minerva') {
                    const icon = document.getElementsByClassName('minerva-icon minerva-icon-portletlink-enlaces-fechas mw-ui-icon-portletlink-enlaces-fechas');
                    icon[0].style.backgroundImage = "url(https://upload.wikimedia.org/wikipedia/commons/2/2c/Tabler-icons_letter-f.svg)";
                }
                // Let's store the evaluations in constants while the user takes their time to click the button

                if (portletLink) {
                    portletLink.addEventListener("click", () => {
                        // Call mw API to carry out the edit 
                        new mw.Api().edit(
                            page,
                            (revision) => {
                                return {
                                    text: textReplacer(revision.content, useRegex, usePipeRegex, useTemplateRegex),
                                    summary: 'Eliminando enlaces según [[WP:ENLACESFECHAS]] mediante [[Usuario:Nacaru/date-link-remover.js|script]] #DateLinkRemover',
                                    minor: false
                                }
                            }
                            // Reload the page
                        ).then(() => {
                            setTimeout(() => {
                                location.reload();
                            }, 500);
                            // Catch any execution errors
                        }).catch((error) => {
                            alert(`Se ha producido un error: ${error}`);
                        })
                    })
                }
            }
        })
    }

    (async () => {
        // The script shouldn't load if the user is not in the right namespace
        const namespace = await mw.config.get('wgNamespaceNumber');
        if (namespace == 0 || namespace == 104 || namespace == 2) {
            loadDependencies(initializeScript);
        }
    })();

})();

//</nowiki>
