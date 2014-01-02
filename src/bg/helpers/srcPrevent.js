// Prevent loading of images when loading html into $()
module.exports = function srcPrevent(html) {
    return (html||'').replace(/\bsrc\b/g, 'src-attr');
};