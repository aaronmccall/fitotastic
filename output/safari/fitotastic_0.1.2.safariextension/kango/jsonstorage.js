﻿/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
kango.Storage=function(){};
kango.Storage.prototype=kango.oop.extend(kango.IStorage,{getItem:function(a){a=kango.simpleStorage.getItem(a);return"undefined"!=typeof a&&null!=a?JSON.parse(a):null},setItem:function(a,b){if("undefined"!=typeof b){var c=JSON.stringify(b);"undefined"!=typeof c&&kango.simpleStorage.setItem(a,c)}else return this.removeItem(a)},removeItem:function(a){return kango.simpleStorage.removeItem(a)},clear:function(){return kango.simpleStorage.clear()},getKeys:function(){for(var a=[],b=kango.simpleStorage.getKeys(),
c=0;c<b.length;c++){var d=b[c];0!=d.indexOf(this.SYSTEM_STORAGE_PREFIX)&&a.push(d)}return a}});kango.storage=new kango.Storage;kango.SystemStorage=function(){this.PREFIX=kango.storage.SYSTEM_STORAGE_PREFIX};kango.SystemStorage.prototype={PREFIX:null,getItem:function(a){return kango.simpleStorage.getItem(this.PREFIX+a)},setItem:function(a,b){return kango.simpleStorage.setItem(this.PREFIX+a,b)},removeItem:function(a){return kango.simpleStorage.removeItem(this.PREFIX+a)}};kango.systemStorage=new kango.SystemStorage;
