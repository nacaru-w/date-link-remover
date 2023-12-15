const loadDependencies = (callback) => {
    mw.loader.using('mediawiki.api', 'mediawiki.util', 'mediawiki.user');
    callback();
}

const initializeScript = () => {
    if (document.readyState == 'complete') {
        const portletLink = mw.util.addPortletLink('p-views', '', 'Eliminar enlaces de fechas', 'date-link-remover', 'Remove links from dates');
        if (portletLink)
            portletLink.addEventListener("click", (e) => {

            })
    }
}

loadDependencies(initializeScript());