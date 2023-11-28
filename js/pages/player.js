import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-storage.js";

import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging.js";

import metroL1 from '../../sources/metro-l1.js';

import { GeolocationService } from '../services/geolocation.js';


const module = {

	firebase: null,
	user: null,
	db: null,
	userData: null,
	userId: null,
	storage: null,
	
	init: async function(firebase, user) {

		this.firebase = firebase;
		this.user = user;
		this.storage = getStorage(firebase);


		this.initPlayerUI();
		this.initTts();

		this.initUI();
		
	},

	initPlayerUI: function() {

		const $list = $('#current-collection-list');
		for ( const step of metroL1.list ) {
			const overrideNameAttribute = step.overrideName ? 'data-override-name="' + step.overrideName + '"' : '';
			$list.append(`<button type="button" class="list-location list-group-item list-group-item-action" ${overrideNameAttribute}>${step.name}</button>`);
		}
		$list.children().eq(0).addClass('active');
	
	},

	isReading: false,
	ttsId: 0,

	/*initTts: function() {

		window.speechSynthesis.getVoices();

		const $readButton = $('#read-tts-button');

		$readButton.click(() => {
			if ( !this.isReading ) {
				console.log('start');
				//$readButton.children('span').removeClass('fa-volume-high').addClass('fa-pause');
				var msg = new window.SpeechSynthesisUtterance();
				msg.text = 'hi';//$('#current-text').text();
				msg.volume = 1;
				msg.rate = 1;
				msg.pitch = 2;
				msg.lang = 'es';

				window.speechSynthesis.cancel();
				window.speechSynthesis.speak(msg);
				this.isReading = true;
			} else {
				console.log('stop');
				$readButton.children('span').addClass('fa-volume-high').removeClass('fa-pause');
				window.speechSynthesis.pause();
				this.isReading = false;
			}
		});
	},*/

	initTts: function() {

		meSpeak.loadVoice('es');



		const $readButton = $('#read-tts-button');
		const $progressIndicator = $('.play-progress-indicator');
		$readButton.click(() => {

			if ( !this.isReading ) {
				$readButton.children('span').removeClass('fa-volume-high').addClass('fa-spinner fa-spin');
				setTimeout(() => {
					$readButton.children('span').removeClass('fa-spinner fa-spin').addClass('fa-pause');
				}, 1750);
				//$progressIndicator.show();

				const text = $('#current-text').text();
				//speak(text, {voice: 'en/en-us'});
				this.ttsId = meSpeak.speak(text, {speed: 160, variant: 'f5'}, () => {
					$readButton.children('span').removeClass('fa-pause').addClass('fa-volume-high');
					this.isReading = false;
				});

				this.isReading = true;
			} else {
				const isSuccessStopping = meSpeak.stop() > 0;
				if ( isSuccessStopping ) {
					console.log('stop');
					$readButton.children('span').addClass('fa-volume-high').removeClass('fa-pause');
					//$progressIndicator.hide();
					//$('#player')[0].pause();
					this.isReading = false;
				}
			}

		});

		/*const that = this;
		$("#audio").bind("DOMSubtreeModified", async function() {
			console.log('edit');
			await new Promise(r => setTimeout(r, 500));
			$('#player')[0].onplay = function() {
				console.log('play');
				$readButton.children('span').removeClass('fa-spinner fa-spin').addClass('fa-pause');
			}

			if ( !$('#player')[0].paused ) {
				$readButton.children('span').removeClass('fa-spinner fa-spin').addClass('fa-pause');
			}

			$('#player').on('ended', function() {
				console.log('ended');
				$readButton.children('span').removeClass('fa-pause').addClass('fa-volume-high');
				that.isReading = false;
			});
		});*/

	},

	initUI: function() {

		const that = this;
		$('body').get(0).addEventListener(
			"coordsUpdate",
		  	(e) => {
		    	const coords = GeolocationService.coords;
		    	$('#current-coords').text(`${coords.latitude}, ${coords.longitude}`);
		    	that.lookupNearLocation(coords);
		  	},
		  	false
		);

		this.bindNavigation();

		$('#current-collection-list .list-location').click(function(){
			$('#current-text').text('');
			$('#current-collection-list .list-location').removeClass('active');
			$('#current-title').text($(this).text());
			console.log($(this).text());
			that.loadLocation($(this).attr('data-override-name') ?? $(this).text());
			$(this).addClass('active');
			console.log(this);
			that.updateNavigationUX();
			if ( !$('#layout-drawer').hasClass('small-hide') ) {
				$('#drawer-toogle-button').click();
			}
		})

		$('#current-collection-list').children().eq(0).click();

		$('#current-nearby').click(function(){

			const currentNearby = $(this).text();
			const $list = $('#current-collection-list').children();
			for ( const el of $list ) {
				if ( $(el).text() == currentNearby ) {
					$(el).click();
				}
			}

		});

	},

	prevStep: null,
	nextStep: null,

	bindNavigation: function() {

		this.prevStep = $('#current-collection-list .active').prev();
		this.nextStep = $('#current-collection-list .active').next();

		const $goToPrevStepButton = $('.button-prev-step');
		const $goToNextStepButton = $('.button-next-step');

		const that = this;
		$goToPrevStepButton.click(function() {
			console.log('go prev');
			that.prevStep.click();
		});

		$goToNextStepButton.click(function() {
			console.log('go next');
			that.nextStep.click();
		});

	},

	updateNavigationUX: function() {

		const $goToPrevStepButton = $('.button-prev-step');
		const $goToNextStepButton = $('.button-next-step');

		this.prevStep = $('#current-collection-list .active').prev();
		this.nextStep = $('#current-collection-list .active').next();

		if ( this.prevStep.length ) {
			console.log('yes');
			$('.button-prev-step').removeClass('disabled');
		} else {
			console.log('no', $('.button-prev-step').attr('class'));
			$('.button-prev-step').addClass('disabled');
		}

		if ( this.nextStep.length ) {
			$goToNextStepButton.removeClass('disabled');
		} else {
			$goToNextStepButton.addClass('disabled');
		}
		

	},

	loadLocation: function(name) {
		const apiUrl = `https://es.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exlimit=max&explaintext=false&titles=${name}&redirects=&origin=*
`;

		const that = this;
		$.ajax({
			url: apiUrl,
			success: (data) => {
				console.log(data);
				try{
					const text = data?.query?.pages[Object.keys(data?.query?.pages)[0]]?.extract;
					//console.log(text)
					if ( !text ) {
						that.loadLocation2(name);
						return;
					}
					if ( this.isIndexPage(text) ) {
						this.loadLocation2(name);
						return;
					}
					//$('#current-text').text(text ?? 'No description available.');
					this.summarize(text);
				} catch( error ) {
					console.log(error);
				}
			},
			error: (error) => {

			}
		})
	},

	loadLocation2: async function(name) {

		let apiUrl = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${name}&limit=1&namespace=0&format=json&origin=*
`;

		const that = this;
		const response = await $.ajax({
			url: apiUrl
		})

		let pageName;
		try{
			pageName = response[3][0] ?? undefined;
			//console.log(response, pageName);
			if ( !pageName ) {
				//that.loadLocation3(name);
				$('#current-text').text('No description available.');
				return;
			}
		} catch( error ) {
			console.log(error);
		}
	
		pageName = pageName.split('/')[pageName.split('/').length - 1];
		apiUrl = `https://es.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exlimit=max&explaintext=false&titles=${pageName}&redirects=&origin=*
`;

		console.log(apiUrl);


		$.ajax({
			url: apiUrl,
			success: (data) => {
				//console.log(data);
				try{
					const text = data?.query?.pages[Object.keys(data?.query?.pages)[0]]?.extract;
					//console.log(text)
					if ( !text ) {
						//that.loadLocation3(name);
						$('#current-text').text('No description available.');
						return;
					}
					//$('#current-text').text(text ?? 'No description available.');
					this.summarize(text);
				} catch( error ) {
					console.log(error);
				}
			},
			error: (error) => {
				console.log(error);
				$('#current-text').text('No description available.');
			}
		})

	},

	isIndexPage: function(text) {

		const indexTexts = [
			'hace referencia a varios artículos:'
		];

		for ( let indexText of indexTexts ) {
			console.log(indexText, text.indexOf(indexText));
			if ( text.indexOf(indexText) != -1 ) {
				return true;
			}
		}

		return false;
	},

	summarize: async function(text) {

		text = this.removeUnusedSections(text);

		//
		text = text.substring(0,5000);

		const settings = {
			async: true,
			crossDomain: true,
			url: 'https://us-central1-stepknow-c839d.cloudfunctions.net/summary/summarize/',
			method: 'POST',
			data: {
				text: text
			}
		};

		$.ajax(settings).done(function (response) {
			//console.log(response.summary);
			let summary = response.summary;
			summary = summary.replace(/(\w)\.(\w)/gi, '$1. $2');
			$('#current-text').text(summary ?? text + ' v. ext.' );
		})
		.fail(function (error) {
			console.log( error );
			$('#current-text').text( text + ' v. ext.' );
		});

		/*var fd = new FormData();    
		fd.append( 'key', '91d93c876ea4487c940e659bfc7375cf' );
		fd.append( 'of', 'json' );
		fd.append( 'txt', text );
		fd.append( 'lang', 'auto' );
		fd.append( 'sentences', 5 );

		const settings = {
			url: 'https://api.meaningcloud.com/summarization-1.0',
			method: 'POST',
			contentType: false,
			processData: false,
			data: fd
		};

		const response = await $.ajax(settings);

		console.log(response);

		try{

		let summary = response.summary;
		summary = summary.replace(/(\w)\.(\w)/gi, '$1. $2');
		$('#current-text').text(summary ?? 'No description available.');

		} catch (error) {
			console.log(error);
			$('#current-text').text('No description available.');
		}*/
	},

	removeUnusedSections: function(text) {

		const ignores = [
			'== Véase también ==',
			'== Referencias ==',
			'== Bibliografía ==',
			'== Enlaces externos =='
		];

		//console.log('clean 0', text);


		for ( const ignore of ignores ) {
			if ( text.indexOf(ignore) == -1 ) {
				continue;
			}
			console.log(text.indexOf(ignore));
			text = text.substring(0, text.indexOf(ignore));
		}

		//console.log('clean 1', text);

		text = text.replace(/===(.+)?===/gi, '');
		text = text.replace(/==(.+)?==/gi, '');

		//console.log('clean', text);

		return text;
	},

	lookupNearLocation: function(coords) {

		let minLocation = metroL1.list[0];
		let min = this.calcCrow(coords.latitude, metroL1.list[0].lat, coords.longitude, metroL1.list[0].lon);
		for ( const location of metroL1.list ) {
			const currentDistance = this.calcCrow(coords.latitude, coords.longitude, location.lat, location.lon);
			if ( currentDistance < min ) {
				min = currentDistance;
				minLocation = location;
			}
		}

		console.log(minLocation);
		//alert(minLocation.name);

		$('#current-nearby').text(minLocation.name);

		const $list = $('#current-collection-list').children();
		$list.removeClass('highlight');
		for ( const el of $list ) {
			if ( $(el).text() == minLocation.name ) {
				$(el).addClass('highlight');
			}
		}

	},

	//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
    calcCrow: function(lat1, lon1, lat2, lon2) 
    {
      var R = 6371; // km
      var dLat = this.toRad(lat2-lat1);
      var dLon = this.toRad(lon2-lon1);
      var lat1 = this.toRad(lat1);
      var lat2 = this.toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;
    },

    // Converts numeric degrees to radians
    toRad: function(Value) 
    {
        return Value * Math.PI / 180;
    }

};

export default module;