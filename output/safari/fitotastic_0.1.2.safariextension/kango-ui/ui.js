﻿/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
kango.ui={};kango.oop.mixin(kango.ui,kango.EventTarget.prototype);kango.oop.mixin(kango.ui,new kango.EventTarget);kango.ui._init=function(){throw new kango.NotImplementedException;};kango.ui.event={READY:"Ready"};kango.ui.ButtonBase=function(a){this._details=a;kango.oop.mixin(this,kango.EventTarget.prototype);kango.oop.mixin(this,new kango.EventTarget)};
kango.ui.ButtonBase.prototype={_details:null,event:{Command:"command",COMMAND:"command",PopupDocumentComplete:"PopupDocumentComplete"},setTooltipText:function(){throw new kango.NotImplementedException;},setCaption:function(){throw new kango.NotImplementedException;},setIcon:function(){throw new kango.NotImplementedException;},setBadgeValue:function(){throw new kango.NotImplementedException;},setBadgeBackgroundColor:function(){throw new kango.NotImplementedException;},setPopup:function(){throw new kango.NotImplementedException;
},setContextMenu:function(){throw new kango.NotImplementedException;}};kango.addEventListener(kango.event.READY,function(){kango.ui._init()});kango.ui.IOptionsPage=function(){};kango.ui.IOptionsPage.prototype={open:function(){throw new kango.NotImplementedException;}};kango.ui.NotificationBase=function(a,b){kango.oop.mixin(this,kango.EventTarget.prototype);kango.oop.mixin(this,new kango.EventTarget);this._id=a;b&&(this._impl=b)};
kango.ui.NotificationBase.prototype={_impl:null,event:{Click:"Click",Close:"Close",Show:"Show"},id:"",getId:function(){return this._id},show:function(){throw new kango.NotImplementedException;},close:function(){throw new kango.NotImplementedException;}};kango.ui.NotificationsBase=function(){};kango.ui.NotificationsBase.prototype={createNotification:function(){throw new kango.NotImplementedException;}};


// Merged from /Users/Aaron/bin/kango/src/js/chrome opera safari/kango-ui/ui.part.js

kango.ui._init=function(){var a=kango.getExtensionInfo().browser_button;kango.lang.isObject(a)&&(kango.ui.browserButton=new kango.ui.BrowserButton(a));return this.fireEvent(this.event.READY)};
