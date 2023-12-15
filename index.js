//<nowiki>

// These should be loaded to ensure that everything works properly
const loadDependencies = (callback) => {
    mw.loader.using('mediawiki.api', 'mediawiki.util', 'mediawiki.user');
    callback;
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
    }

    let apiPromise = new mw.Api().get(params).then(
        ((data) => {
            return data.query.pages[0].revisions[0].slots?.main?.content
        })
    );
    return apiPromise
}

// Main script function
const initializeScript = () => {
    // Find the name of the current page and assign it to a variable
    const page = mw.config.get('wgPageName');
    // Same applies to the current namespace
    const namespace = mw.config.get('wgNamespaceNumber');
    if (document.readyState == 'complete' && (namespace == 0 || namespace == 104 || namespace == 2)) {
        const regex = /\[\[(31|30|[12]\d|0?[1-9]) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\]\]|\[\[20(?:[0-1]\d|20[0-2][0-3])\]\]|\[\[(19\d\d)\]\]|\[\d{1,2}\]\]/;
        getContent(page).then((content) => {
            if (regex.test(content)) {
                console.log("found a date with brackets");
                const portletLink = mw.util.addPortletLink('p-views', '#', 'Eliminar enlaces de fechas', 'date-link-remover', 'Remove links from dates');
                if (portletLink) {
                    portletLink.addEventListener("click", (e) => {
                        console.log('testing')
                        const sanitizerRegex = /\[\[(\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|\d{1,4})\]\]/g;
                        // Call mw API to carry out the edit 
                        new mw.Api().edit(
                            page,
                            (revision) => {
                                return {
                                    text: revision.content.replace(sanitizerRegex, '$1'),
                                    summary: 'Eliminando enlaces según [[WP:ENLACESFECHAS]]',
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
                            alert(`Se ha producido un error: ${error.message}`);
                            setTimeout(() => {
                                location.reload()
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