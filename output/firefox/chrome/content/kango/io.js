/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
fitotastic_kango.IO=function(){};fitotastic_kango.IO.prototype=fitotastic_kango.oop.extend(fitotastic_kango.IOBase,{getExtensionFileUrl:function(a){return"chrome://fitotastic_kango/content/"+a},getResourceUrl:function(a){return"resource://fitotastic_kango/"+a}});fitotastic_kango.io=new fitotastic_kango.IO;
