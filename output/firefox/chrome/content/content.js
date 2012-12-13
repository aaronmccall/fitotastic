// ==UserScript==
// @name Main Content Script
// @include https://www.fitocracy.com/*
// @include http://www.fitocracy.com/*
// @require lib/jquery.1.8.3.min.js
// @require lib/jquery-ui.1.9.2.min.js
// @require lib/underscore.1.4.3.min.js
// @require includes/conversationalist.js
// @require includes/top_of_the_props.js
// @require includes/nsfw_hider.js
// ==/UserScript==

Totp.init();
Conversationalist.init();
HideNSFW.init();