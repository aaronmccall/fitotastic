/*
Built using Kango - Cross-browser extension framework
http://kangoextensions.com/
*/
Fitotastic_kango.ui.OptionsPage=function(){var a=Fitotastic_kango.getExtensionInfo();if("undefined"!=typeof a.options_page){var b=this._optionsUrl=Fitotastic_kango.io.getExtensionFileUrl(a.options_page).toLowerCase();Fitotastic_kango.browser.addEventListener("DOMContentLoaded",function(a){0==a.url.toLowerCase().indexOf(b)&&(a.window.kango=Fitotastic_kango)})}};
Fitotastic_kango.ui.OptionsPage.prototype=Fitotastic_kango.oop.extend(Fitotastic_kango.ui.IOptionsPage,{_optionsUrl:"",open:function(a){if(""!=this._optionsUrl){var b=this._optionsUrl;"undefined"!=typeof a&&(b+="#"+a);Fitotastic_kango.browser.tabs.create({url:b,focused:!0,reuse:!0});return!0}return!1}});Fitotastic_kango.ui.optionsPage=new Fitotastic_kango.ui.OptionsPage;
