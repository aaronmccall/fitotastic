/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
fitotastic_kango.Console=function(){this._consoleService=Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService)};fitotastic_kango.Console.prototype=fitotastic_kango.oop.extend(fitotastic_kango.IConsole,{_consoleService:null,log:function(a){1<arguments.length&&(a=fitotastic_kango.string.format.apply(fitotastic_kango.string,arguments));this._consoleService.logStringMessage(a)}});fitotastic_kango.console=new fitotastic_kango.Console;
