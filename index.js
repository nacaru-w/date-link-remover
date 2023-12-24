//<nowiki>

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

// Regexes constants
let regex = /\[\[((?:\d{1,2} de )?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años|década de)\s)?(?:\d{1,4}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)\]\]/i;
let pipeRegex = /\[\[((?:\d{1,2} de )?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(?:(?:años|década de)\s)?(?:\d{1,4}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)(?:\|([^\]]*))\]\]/i;
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
    // Same applies to the current namespace
    getContent(page).then((content) => {
        if (regex.test(content) || pipeRegex.test(content) || templateRegex.test(content)) {
            console.log("found a date with brackets");
            // This will add the button to remove the square brackets from dates if it finds such occurence in an article
            const portletLink = mw.util.addPortletLink('p-views', '#', 'WP:ENLACESFECHAS', 'enlaces-fechas', 'Se han detectado enlaces en fechas, clic aquí para eliminarlos');
            const useRegex = regex.test(content);
            const usePipeRegex = pipeRegex.test(content);
            const useTemplateRegex = templateRegex.test(content);
            if (portletLink) {
                portletLink.addEventListener("click", () => {
                    // Call mw API to carry out the edit 
                    new mw.Api().edit(
                        page,
                        (revision) => {
                            return {
                                text: textReplacer(revision.content, useRegex, usePipeRegex, useTemplateRegex),
                                summary: 'Eliminando enlaces según [[WP:ENLACESFECHAS]] mediante [[Usuario:Nacaru/date-link-remover.js|script]]',
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
    const namespace = await mw.config.get('wgNamespaceNumber');
    if (namespace == 0 || namespace == 104 || namespace == 2) {
        loadDependencies(initializeScript);
    }
})();

//</nowiki>
