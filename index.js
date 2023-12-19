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

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function makeRegex(expression) {
    expression = escapeRegExp(expression);
    return new RegExp(expression, "i");
}

function makeRegexGlobal(expression) {
    return new RegExp(expression, "gi");
}

// Regexes constants
const dateLink = "\[\[((?:\d{1,2} de )?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(?:años\s)?(?:\d{1,4}|siglo(?:\s|&nbsp;)*\w+)(?:(?:\s|&nbsp;)*(?:a|d)\.(?:\s|&nbsp;)*C\.)?)\]\]";
const pipeDateLink = dateLink.replace("\]\]", "(\|[^\]]*)*\]\]");
const centuries = "(\{\{siglo[^\}]+)1\s*(\}\})";

const regex = makeRegex(dateLink);
const pipeRegex = makeRegex(pipeDateLink);
const centuriesRegex = makeRegex(centuries);

function replace(revision) {
    let newText;
    if (regex.test(revision)) {
        regex = makeRegexGlobal(regex);
        newText = revision.content.replace(regex, "$1");
    }
    if (pipeRegex.test(revision)) {
        pipeRegex = makeRegexGlobal(pipeRegex);
        newText = revision.content.replace(pipeRegex, "$2");
    }
    if (centuriesRegex.test(revision)) {
        centuriesRegex = makeRegexGlobal(centuriesRegex);
        newText = revision.content.replace(centuriesRegex, "$1$2");
    }
    return newText;
}

// Main script function
const initializeScript = () => {
    // Find the name of the current page and assign it to a variable
    const page = mw.config.get('wgPageName');
    // Same applies to the current namespace
    console.log(document.readyState);
    getContent(page).then((content) => {
        if (regex.test(content) || pipeRegex.test(content) || centuriesRegex.test(content)) {
            console.log("found a date with brackets");
            // This will add the button to remove the square brackets from dates if it finds such occurence in an article
            const portletLink = mw.util.addPortletLink('p-views', '#', 'WP:ENLACESFECHAS', 'enlaces-fechas', 'Se han detectado enlaces en fechas, clic aquí para eliminarlos');
            if (portletLink) {
                portletLink.addEventListener("click", () => {
                    // Call mw API to carry out the edit 
                    new mw.Api().edit(
                        page,
                        (revision) => {
                            return {
                                text: replace(revision),
                                summary: 'Eliminando enlaces según [[WP:ENLACESFECHAS]] mediante [[Usuario:Nacaru/date-link-remover.js|script]]',
                                minor: false
                            }
                        }
                        // Reload the page
                    ).then(() => {
                        setTimeout(() => {
                            console.log('Reloading page');
                            location.reload();
                        }, 500);
                        // Catch any execution errors
                    }).catch((error) => {
                        alert(`Se ha producido un error: ${error}`);
                        setTimeout(() => {
                            location.reload();
                        }, 3000);
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
