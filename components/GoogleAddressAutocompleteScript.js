const { GOOGLE_GEOCODER_KEY } = process.env
const { html } = require('../helpers')

module.exports = () => {
  return html()`
    <script>
      var autocomplete;

      window.initMapsAutocomplete = function () {
        var input = document.getElementById('address_autocomplete')

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
        var lat = document.getElementById('address_lat')
        var lon = document.getElementById('address_lon')
        var city = document.getElementById('city')
        var state = document.getElementById('state')
        var place = autocomplete.getPlace()
        var geocoords
        if (place.geometry && place.geometry.location) {
          geocoords = Object.assign({}, place.geometry.location)
          lat.value = geocoords.lat()
          lon.value = geocoords.lng()
          city.value = place.address_components.filter(function(item) {
            return item.types.some(function(type) {
              return type === 'locality'
            })
          }).map(function(item) {
            return item.long_name
          })[0] || ''
          state.value = place.address_components.filter(function(item) {
            return item.types.some(function(type) {
              return type === 'administrative_area_level_1'
            })
          }).map(function(item) {
            return item.short_name
          })[0] || ''
        }
      }
    </script>
    <script src=${`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_GEOCODER_KEY}&libraries=places&callback=initMapsAutocomplete`} async defer></script>
  `
}
