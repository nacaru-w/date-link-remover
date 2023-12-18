//<nowiki>

// These should be loaded to ensure that everything works properly, the callback function that loads the script will only be called once DOM has been loaded
const loadDependencies = (callback) => {
    mw.loader.using('mediawiki.api', 'mediawiki.util', 'mediawiki.user');
    if (document.readyState !== 'loading') {
        callback;
    } else {
        document.addEventListener('DOMContentLoaded', callback)
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

// Main script function
const initializeScript = () => {
    // Find the name of the current page and assign it to a variable
    const page = mw.config.get('wgPageName');
    // Same applies to the current namespace
    const namespace = mw.config.get('wgNamespaceNumber');
    console.log(document.readyState);
    if (namespace == 0 || namespace == 104 || namespace == 2) {
        const regex = /\[\[((\d{1,2} de )?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|(\d{1,4}|siglo(\s|&nbsp;)*\w+)((\s|&nbsp;)*(a|d)\.(\s|&nbsp;)*C\.)?)(\|[^\]]*)*\]\]/i;
        getContent(page).then((content) => {
            if (regex.test(content)) {
                console.log("found a date with brackets");
                // This will add the button to remove the square brackets from dates if it finds such occurence in an article
                const portletLink = mw.util.addPortletLink('p-views', '#', 'WP:ENLACESFECHAS', 'enlaces-fechas', 'Se han detectado enlaces en fechas, clic aquí para eliminarlos');
                if (portletLink) {
                    portletLink.addEventListener("click", () => {
                        const sanitizerRegex = new RegExp(regex, "gi");
                        // Call mw API to carry out the edit 
                        new mw.Api().edit(
                            page,
                            (revision) => {
                                return {
                                    text: revision.content.replace(sanitizerRegex, '$1'),
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
}

loadDependencies(initializeScript());

//</nowiki>
