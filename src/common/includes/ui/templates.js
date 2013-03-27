(function () {
var root = this, exports = {};

// The jade runtime:
var jade=function(exports){Array.isArray||(Array.isArray=function(arr){return"[object Array]"==Object.prototype.toString.call(arr)}),Object.keys||(Object.keys=function(obj){var arr=[];for(var key in obj)obj.hasOwnProperty(key)&&arr.push(key);return arr}),exports.merge=function merge(a,b){var ac=a["class"],bc=b["class"];if(ac||bc)ac=ac||[],bc=bc||[],Array.isArray(ac)||(ac=[ac]),Array.isArray(bc)||(bc=[bc]),ac=ac.filter(nulls),bc=bc.filter(nulls),a["class"]=ac.concat(bc).join(" ");for(var key in b)key!="class"&&(a[key]=b[key]);return a};function nulls(val){return val!=null}return exports.attrs=function attrs(obj,escaped){var buf=[],terse=obj.terse;delete obj.terse;var keys=Object.keys(obj),len=keys.length;if(len){buf.push("");for(var i=0;i<len;++i){var key=keys[i],val=obj[key];"boolean"==typeof val||null==val?val&&(terse?buf.push(key):buf.push(key+'="'+key+'"')):0==key.indexOf("data")&&"string"!=typeof val?buf.push(key+"='"+JSON.stringify(val)+"'"):"class"==key&&Array.isArray(val)?buf.push(key+'="'+exports.escape(val.join(" "))+'"'):escaped&&escaped[key]?buf.push(key+'="'+exports.escape(val)+'"'):buf.push(key+'="'+val+'"')}}return buf.join(" ")},exports.escape=function escape(html){return String(html).replace(/&(?!(\w+|\#\d+);)/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")},exports.rethrow=function rethrow(err,filename,lineno){if(!filename)throw err;var context=3,str=require("fs").readFileSync(filename,"utf8"),lines=str.split("\n"),start=Math.max(lineno-context,0),end=Math.min(lines.length,lineno+context),context=lines.slice(start,end).map(function(line,i){var curr=i+start+1;return(curr==lineno?"  > ":"    ")+curr+"| "+line}).join("\n");throw err.path=filename,err.message=(filename||"Jade")+":"+lineno+"\n"+context+"\n\n"+err.message,err},exports}({});

// create our folder objects
exports.mffs = {};

// friend.jade compiled template
exports.mffs.friend = function anonymous(locals, attrs, escape, rethrow, merge) {
    attrs = attrs || jade.attrs;
    escape = escape || jade.escape;
    rethrow = rethrow || jade.rethrow;
    merge = merge || jade.merge;
    var buf = [];
    with (locals || {}) {
        var interp;
        var __indent = [];
        buf.push("\n<td");
        buf.push(attrs({
            id: "user_" + id
        }, {
            id: true
        }));
        buf.push(">\n  <div");
        buf.push(attrs({
            "data-id": id,
            "class": "mffs_friend"
        }, {
            "data-id": true
        }));
        buf.push("><img");
        buf.push(attrs({
            src: pic_url,
            "class": "friend_pp"
        }, {
            src: true
        }));
        buf.push('/><span class="mffs_user">');
        var __val__ = username;
        buf.push(escape(null == __val__ ? "" : __val__));
        buf.push('</span>\n    <div class="mffs_detail">\n      <ul>\n        <li><a');
        buf.push(attrs({
            href: "/profile/" + username + "/"
        }, {
            href: true
        }));
        buf.push("><strong>");
        var __val__ = username;
        buf.push(escape(null == __val__ ? "" : __val__));
        buf.push("</strong><em>");
        var __val__ = " (" + level + ")";
        buf.push(escape(null == __val__ ? "" : __val__));
        buf.push('</em></a></li>\n        <li class="info">');
        var __val__ = info;
        buf.push(null == __val__ ? "" : __val__);
        buf.push('</li>\n      </ul>\n      <textarea maxlength="500" cols="27" rows="5"></textarea>\n      <button class="pill-btn munsell-blue-btn">Post</button>\n    </div>\n  </div>\n  <p class="proppables">');
        var __val__ = throbber;
        buf.push(null == __val__ ? "" : __val__);
        buf.push("</p>\n</td>");
    }
    return buf.join("");
};

// goto_link.jade compiled template
exports.mffs.goto_link = function anonymous(locals, attrs, escape, rethrow, merge) {
    attrs = attrs || jade.attrs;
    escape = escape || jade.escape;
    rethrow = rethrow || jade.rethrow;
    merge = merge || jade.merge;
    var buf = [];
    with (locals || {}) {
        var interp;
        var __indent = [];
        buf.push("<a");
        buf.push(attrs({
            href: "#",
            "data-mffs_page": page,
            "class": "mffs_goto"
        }, {
            href: true,
            "data-mffs_page": true
        }));
        buf.push(">");
        var __val__ = page;
        buf.push(escape(null == __val__ ? "" : __val__));
        buf.push("</a>");
    }
    return buf.join("");
};

// nav.jade compiled template
exports.mffs.nav = function anonymous(locals, attrs, escape, rethrow, merge) {
    attrs = attrs || jade.attrs;
    escape = escape || jade.escape;
    rethrow = rethrow || jade.rethrow;
    merge = merge || jade.merge;
    var buf = [];
    with (locals || {}) {
        var interp;
        var __indent = [];
        buf.push('\n<div class="mffs_nav"><a href="#" class="mffs_prev">&laquo;</a>\n  <div class="mffs_pages"></div><a href="#" class="mffs_next">&raquo;</a>\n  <button class="prop_all pill-btn munsell-blue-btn">Prop All</button>\n</div>');
    }
    return buf.join("");
};

// proppable.jade compiled template
exports.mffs.proppable = function anonymous(locals, attrs, escape, rethrow, merge) {
    attrs = attrs || jade.attrs;
    escape = escape || jade.escape;
    rethrow = rethrow || jade.rethrow;
    merge = merge || jade.merge;
    var buf = [];
    with (locals || {}) {
        var interp;
        var __indent = [];
        buf.push("<span");
        buf.push(attrs({
            "data-id": id,
            "class": "proppable"
        }, {
            "data-id": true
        }));
        buf.push("><a");
        buf.push(attrs({
            title: title,
            href: href,
            "data-activity-id": id
        }, {
            title: true,
            href: true,
            "data-activity-id": true
        }));
        buf.push("><img");
        buf.push(attrs({
            src: image_src
        }, {
            src: true
        }));
        buf.push('/></a><span class="mffs_detail">\n    <h4>');
        var __val__ = title;
        buf.push(escape(null == __val__ ? "" : __val__));
        buf.push("<span>");
        var __val__ = age !== "now" ? age + " ago" : age;
        buf.push(escape(null == __val__ ? "" : __val__));
        buf.push("</span></h4>\n    <ul>");
        if (details.length) {
            (function() {
                if ("number" == typeof details.length) {
                    for (var $index = 0, $$l = details.length; $index < $$l; $index++) {
                        var item = details[$index];
                        buf.push("\n      <li>");
                        var __val__ = item;
                        buf.push(escape(null == __val__ ? "" : __val__));
                        buf.push("</li>");
                    }
                } else {
                    var $$l = 0;
                    for (var $index in details) {
                        $$l++;
                        var item = details[$index];
                        buf.push("\n      <li>");
                        var __val__ = item;
                        buf.push(escape(null == __val__ ? "" : __val__));
                        buf.push("</li>");
                    }
                }
            }).call(this);
        }
        buf.push('\n    </ul>\n    <textarea maxlength="500" cols="27" rows="5"></textarea>\n    <button class="pill-btn munsell-blue-btn">Comment</button></span></span>');
    }
    return buf.join("");
};

// style.jade compiled template
exports.mffs.style = function anonymous(locals, attrs, escape, rethrow, merge) {
    attrs = attrs || jade.attrs;
    escape = escape || jade.escape;
    rethrow = rethrow || jade.rethrow;
    merge = merge || jade.merge;
    var buf = [];
    with (locals || {}) {
        var interp;
        var __indent = [];
        buf.push('<style>#mffs_modal h2 {\n  font-size: 24px;\n}\n#mffs_modal .modal_contents {\n  padding-top: 0;\n}\n#mffs_modal .widget-subsection:first-of-type {\n  padding: 6px 12px;\n}\n#mffs_modal .mffs_friend {\n  position: relative;\n  display: block;\n}\n#mffs_modal .mffs_friend img.friend_pp {\n  width: 128px;\n  height: 128px;\n}\n#mffs_modal .mffs_friend:hover .mffs_detail {\n  display: block;\n}\n#mffs_modal .mffs_user,\n#mffs_modal .mffs_level {\n  position: absolute;\n  left: 2px;\n  text-shadow: 2px 2px 1px #000;\n}\n#mffs_modal .mffs_user {\n  top: 1px;\n  color: #1da6da;\n}\n#mffs_modal .mffs_detail {\n  display: none;\n  position: absolute;\n  width: 200px;\n  top: 4px;\n  left: 4px;\n  z-index: 3;\n  padding: 0.25em 0.5em;\n  border-radius: 4px;\n  border: none;\n  background: #f4f5f5;\n  box-shadow: 3px 3px 6px #444;\n}\n#mffs_modal .mffs_detail textarea {\n  height: 48px;\n}\n#mffs_modal .mffs_detail li.info {\n  white-space: pre-line;\n}\n#mffs_modal .proppable {\n  position: relative;\n}\n#mffs_modal .proppable:hover .mffs_detail {\n  display: block;\n}\n#mffs_modal .proppables .mffs_detail {\n  left: 32px;\n}\n#mffs_modal .proppables .propped::before {\n  z-index: 2;\n  pointer-events: none;\n  position: absolute;\n  content: "";\n  width: 32px;\n  height: 16px;\n  top: -18px;\n  left: 8px;\n  background: url("data:image/png;base64,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") no-repeat;\n}\n#mffs_modal .proppables .propped img {\n  opacity: 0.6;\n}\n#mffs_modal .proppables .proppable img {\n  height: 42px;\n  width: 42px;\n}\n#mffs_modal .proppables h4 span {\n  margin-left: 1em;\n  display: inline-block;\n  font-size: 0.75em;\n  color: #0f536d;\n}\n#mffs_modal .mffs_nav {\n  position: absolute;\n  top: 12px;\n  left: 152px;\n  width: 300px;\n}\n#mffs_modal .mffs_nav .prop_all {\n  position: absolute;\n  top: -8px;\n  right: -100px;\n}\n#mffs_modal .mffs_nav .mffs_next,\n#mffs_modal .mffs_nav .mffs_prev {\n  line-height: 150%;\n  height: 1.5em;\n  position: absolute;\n  top: 0;\n}\n#mffs_modal .mffs_nav .mffs_next {\n  text-align: right;\n  right: 0px;\n}\n#mffs_modal .mffs_nav .mffs_prev {\n  left: 0px;\n}\n#mffs_modal .mffs_nav a {\n  min-width: 1em;\n  max-width: 1.5em;\n  font-size: 1.5em;\n  text-align: center;\n  text-decoration: none;\n  border-radius: 4px;\n}\n#mffs_modal .mffs_nav a:hover,\n#mffs_modal .mffs_nav a.mffs_active {\n  background: #c6e9f6;\n  color: #0f536d;\n}\n#mffs_modal .mffs_pages {\n  margin: 0 1.5em;\n  border: 1px solid #ccc;\n  border-width: 0px 1px;\n  overflow: hidden;\n  height: 35px;\n}\n#mffs_modal .mffs_goto {\n  display: inline-block;\n  line-height: 150%;\n  height: 1.5em;\n  margin-right: 0.15em;\n}\n#mffs_modal table tr:nth-of-type(n+3) .mffs_detail {\n  top: auto;\n  bottom: 20px;\n}\n#mffs_modal table tr td {\n  border: none;\n  width: 140px;\n  padding-left: 0;\n}\n#mffs_modal table tr td:nth-child(n+4) .mffs_detail {\n  left: auto;\n  right: 42px;\n}\n</style>');
    }
    return buf.join("");
};


// attach to window or export with commonJS
if (typeof module !== "undefined") {
    module.exports = exports;
} else if (typeof define === "function" && define.amd) {
    define(exports);
} else {
    root.templatizer = exports;
}

})();