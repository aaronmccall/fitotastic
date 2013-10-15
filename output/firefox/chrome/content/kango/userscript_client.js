/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
Fitotastic_kango.UserscriptEngineClient=function(){};Fitotastic_kango.UserscriptEngineClient.prototype={run:function(c,b,a){var d=this;Fitotastic_kango.invokeAsync("kango.userscript.getScripts",c.document.URL,b,a,function(a){for(var b in a)a.hasOwnProperty(b)&&d.executeScript(c,a[b].join("\n\n"))})},executeScript:function(c,b){try{var a=new Fitotastic_kango.UserscriptApi(c);a.kango=Fitotastic_kango;Fitotastic_kango.lang.evalInSandbox(c,a,b)}catch(d){Fitotastic_kango.console.log("US: "+d.message+"\n"+d.stack||"")}}};Fitotastic_kango.UserscriptApi=function(){};
Fitotastic_kango.UserscriptApi.prototype={};
