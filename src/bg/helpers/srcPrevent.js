// Prevent loading of images when loading html into $()
function srcPrevent(html) {
    return (html||'').replace(/\bsrc\b/g, 'src-attr');
}