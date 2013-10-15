/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
Fitotastic_kango.BackgroundScriptEngine=function(){};
Fitotastic_kango.BackgroundScriptEngine.prototype={_sandbox:null,_window:null,init:function(a){var b=this;this._sandbox=Fitotastic_kango.lang.createHTMLSandbox("background.html",function(c){b._initScripts(c,a)})},getContext:function(){return this._window},_initScripts:function(a,b){this._window=a;a.kango=b;var c=a.document,d=Fitotastic_kango.getExtensionInfo().background_scripts;if("undefined"!=typeof d){var e=0,f=function(){var a=c.createElement("script");a.setAttribute("type","text/javascript");a.setAttribute("src",Fitotastic_kango.io.getExtensionFileUrl(d[e]));
var b=function(){e++;e<d.length&&f()};"undefined"!=typeof a.onreadystatechange?a.onreadystatechange=function(){"complete"==a.readyState&&b()}:a.onload=b;c.body.appendChild(a)};f()}}};Fitotastic_kango.BackgroundScriptModule=function(){};Fitotastic_kango.BackgroundScriptModule.prototype.init=function(a){Fitotastic_kango.backgroundScript=new Fitotastic_kango.BackgroundScriptEngine;Fitotastic_kango.addEventListener(Fitotastic_kango.event.READY,function(){Fitotastic_kango.backgroundScript.init(a)})};Fitotastic_kango.registerModule(Fitotastic_kango.BackgroundScriptModule);
