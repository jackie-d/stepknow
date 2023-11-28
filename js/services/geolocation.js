export const GeolocationService = {

  coords: {
    latitude: 0,
    longitude: 0
  },
  
  init: function(firebase) {

    if ("geolocation" in navigator) {
      this.initGeolocation();
    } else {
      alert('Your browser doesn\'t support location services. Please try with another one.');
    }


  },

  initGeolocation: async function() {

    //navigator.geolocation.getCurrentPosition();

    const coordsUpdateEvent = new Event("coordsUpdate");    

    const watchID = navigator.geolocation.watchPosition((position) => {
      this.coords = position.coords;
      console.log(this.coords);
      $('body').get(0).dispatchEvent(coordsUpdateEvent);
    });

  }

};