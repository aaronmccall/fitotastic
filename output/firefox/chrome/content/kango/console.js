/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
Fitotastic_kango.Console=function(){this._consoleService=Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService)};Fitotastic_kango.Console.prototype=Fitotastic_kango.oop.extend(Fitotastic_kango.IConsole,{_consoleService:null,log:function(a){1<arguments.length&&(a=Fitotastic_kango.string.format.apply(Fitotastic_kango.string,arguments));this._consoleService.logStringMessage(a)}});Fitotastic_kango.console=new Fitotastic_kango.Console;
