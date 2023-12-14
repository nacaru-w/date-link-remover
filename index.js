const loadDependencies = (callback) => {
    mw.loader.using('mediawiki.api', 'mediawiki.util', 'mediawiki.user');
    callback();
}

const initializeScript = () => {

}

loadDependencies(initializeScript());