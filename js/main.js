import firebase from './firebase-loader.js';

import { getMessaging, onMessage } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging.js";

import { GeolocationService } from './services/geolocation.js';

let user = null;
let geolocationService;


$(() => {init()});

async function init() {

	console.log('init');

	// user = await initAuth();
	// initNotification();

	initUI();
	initGeolocation();

	const pageId = $('body').attr("id");
	switch(pageId) {
		case 'signup':
			initSignup();
			break;
		case 'login':
			initLogin();
			break;
		case 'player-screen':
			initPlayer();
			break;
		default:
			console.log('Init default case page id');
	}

}


function initAuth(){
	return import("./services/auth.js").then((authModule) => {
		authModule = authModule.default;
		return authModule.init(firebase).then((user) => {
			initLayoutOnAuth(user);
			return user;
		})
	});
}


function initSignup() {
	import("./pages/signup.js").then((signupModule) => {
		signupModule = signupModule.default;
		signupModule.init(firebase);
	});
}

function initLogin() {
	import("./pages/login.js").then((loginModule) => {
		loginModule = loginModule.default;
		loginModule.init(firebase, user);
	});
}

function initPlayer() {
	import("./pages/player.js").then((module) => {
		module = module.default;
		module.init(firebase, user);
	});
}


function initUI() {
	$('#drawer-toogle-button').click(() => {
		$('#layout-drawer').toggleClass('small-hide');
		$('#layout-content').toggleClass('small-hide');
		$('#toggle-button-icon').toggleClass('navbar-toggler-icon');
		$('#toggle-button-icon').toggleClass('fa fa-times');
	});
}


function initLayoutOnAuth(user) {

	console.log(user);


	if ( user ) {
		$('#topbar-user').show();
	} else {
		$('#topbar-signup').show();
	}


}


function initGeolocation() {
	geolocationService = GeolocationService;
	geolocationService.init();
}