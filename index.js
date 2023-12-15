

// These should be loaded to ensure that everything works properly
const loadDependencies = (callback) => {
    mw.loader.using('mediawiki.api', 'mediawiki.util', 'mediawiki.user');
    callback();
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
    const page = mw.config.get('wgPageName');
    if (document.readyState == 'complete') {
        const regex = /\[\[(31|30|[12]\d|0?[1-9]) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\]\]|\[\[20(?:[0-1]\d|20[0-2][0-3])\]\]|\[\[(19\d\d)\]\]|\[\d{1,2}\]\]/;
        getContent(page).then((content) => {
            if (regex.test(content)) {
                console.log("found a date with brackets");
                const portletLink = mw.util.addPortletLink('p-views', '', 'Eliminar enlaces de fechas', 'date-link-remover', 'Remove links from dates');
                if (portletLink)
                    portletLink.addEventListener("click", (e) => {
                        console.log('testing')
                    })
            }
        })


    }
}

loadDependencies(initializeScript());