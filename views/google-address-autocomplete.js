const { GOOGLE_GEOCODER_KEY } = process.env

module.exports = `
  <script>
    var autocomplete;
    window.lastSelectedGooglePlacesAddress = {};

    window.initGoogleAddressAutocomplete = function (elemId) {
      var input = document.getElementById(elemId)

      autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      })

      window.google.maps.event.addDomListener(input, 'keydown', function (event2) {
        var lat = document.getElementById('address_lat')
        if (event2.keyCode === 13 && !lat.value) {
          event2.preventDefault();
        }
      });

      autocomplete.addListener('place_changed', fillInAddress)
    }

    function fillInAddress() {
      var lastAddress = window.lastSelectedGooglePlacesAddress;
      var place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        var geocoords = Object.assign({}, place.geometry.location);
        lastAddress.lat = geocoords.lat();
        lastAddress.lon = geocoords.lng();
        lastAddress.city = place.address_components.filter(function(item) {
          return item.types.some(function(type) {
            return type === 'locality';
          });
        }).map(function(item) {
          return item.long_name
        }).shift() || '';
        lastAddress.state = place.address_components.filter(function(item) {
          return item.types.some(function(type) {
            return type === 'administrative_area_level_1';
          });
        }).map(function(item) {
          return item.short_name
        }).shift() || '';
      }
    }
  </script>
  <script src="${`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_GEOCODER_KEY}&libraries=places`}" async defer></script>
`
