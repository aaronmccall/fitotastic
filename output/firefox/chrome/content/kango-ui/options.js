/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
fitotastic_kango.ui.OptionsPage=function(){var a=fitotastic_kango.getExtensionInfo();if("undefined"!=typeof a.options_page){var b=this._optionsUrl=fitotastic_kango.io.getExtensionFileUrl(a.options_page).toLowerCase();fitotastic_kango.browser.addEventListener("DOMContentLoaded",function(a){0==a.url.toLowerCase().indexOf(b)&&(a.window.kango=fitotastic_kango)})}};
fitotastic_kango.ui.OptionsPage.prototype=fitotastic_kango.oop.extend(fitotastic_kango.ui.IOptionsPage,{_optionsUrl:"",open:function(a){if(""!=this._optionsUrl){var b=this._optionsUrl;"undefined"!=typeof a&&(b+="#"+a);fitotastic_kango.browser.tabs.create({url:b,focused:!0,reuse:!0});return!0}return!1}});fitotastic_kango.ui.optionsPage=new fitotastic_kango.ui.OptionsPage;
