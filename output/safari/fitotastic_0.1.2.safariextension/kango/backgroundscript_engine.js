﻿/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
kango.BackgroundScriptEngine=function(){};
kango.BackgroundScriptEngine.prototype={_sandbox:null,_window:null,init:function(a){var b=this;this._sandbox=kango.lang.createHTMLSandbox("background.html",function(c){b._initScripts(c,a)})},getContext:function(){return this._window},_initScripts:function(a,b){this._window=a;a.kango=b;var c=a.document,d=kango.getExtensionInfo().background_scripts;if("undefined"!=typeof d){var e=0,f=function(){var a=c.createElement("script");a.setAttribute("type","text/javascript");a.setAttribute("src",kango.io.getExtensionFileUrl(d[e]));
var b=function(){e++;e<d.length&&f()};"undefined"!=typeof a.onreadystatechange?a.onreadystatechange=function(){"complete"==a.readyState&&b()}:a.onload=b;c.body.appendChild(a)};f()}}};kango.BackgroundScriptModule=function(){};kango.BackgroundScriptModule.prototype.init=function(a){kango.backgroundScript=new kango.BackgroundScriptEngine;kango.addEventListener(kango.event.READY,function(){kango.backgroundScript.init(a)})};kango.registerModule(kango.BackgroundScriptModule);
