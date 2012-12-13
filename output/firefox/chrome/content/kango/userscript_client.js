/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
fitotastic_kango.UserscriptEngineClient=function(){};fitotastic_kango.UserscriptEngineClient.prototype={run:function(c,b,a){var d=this;fitotastic_kango.invokeAsync("kango.userscript.getScripts",c.document.URL,b,a,function(a){for(var b in a)a.hasOwnProperty(b)&&d.executeScript(c,a[b].join("\n\n"))})},executeScript:function(c,b){try{var a=new fitotastic_kango.UserscriptApi(c);a.kango=fitotastic_kango;fitotastic_kango.lang.evalInSandbox(c,a,b)}catch(d){fitotastic_kango.console.log("US: "+d.message+"\n"+d.stack||"")}}};fitotastic_kango.UserscriptApi=function(){};
fitotastic_kango.UserscriptApi.prototype={};
