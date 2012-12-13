/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
fitotastic_kango.BackgroundScriptEngine=function(){};
fitotastic_kango.BackgroundScriptEngine.prototype={_sandbox:null,_window:null,init:function(a){var b=this;this._sandbox=fitotastic_kango.lang.createHTMLSandbox("background.html",function(c){b._initScripts(c,a)})},getContext:function(){return this._window},_initScripts:function(a,b){this._window=a;a.kango=b;var c=a.document,d=fitotastic_kango.getExtensionInfo().background_scripts;if("undefined"!=typeof d){var e=0,f=function(){var a=c.createElement("script");a.setAttribute("type","text/javascript");a.setAttribute("src",fitotastic_kango.io.getExtensionFileUrl(d[e]));
var b=function(){e++;e<d.length&&f()};"undefined"!=typeof a.onreadystatechange?a.onreadystatechange=function(){"complete"==a.readyState&&b()}:a.onload=b;c.body.appendChild(a)};f()}}};fitotastic_kango.BackgroundScriptModule=function(){};fitotastic_kango.BackgroundScriptModule.prototype.init=function(a){fitotastic_kango.backgroundScript=new fitotastic_kango.BackgroundScriptEngine;fitotastic_kango.addEventListener(fitotastic_kango.event.READY,function(){fitotastic_kango.backgroundScript.init(a)})};fitotastic_kango.registerModule(fitotastic_kango.BackgroundScriptModule);
