const { GOOGLE_GEOCODER_KEY } = process.env
const { html } = require('../helpers')

module.exports = () => {
  return html()`
    <script>
      var autocomplete1, autocomplete2;

      window.initMapsAutocomplete = function () {
        var input1 = document.getElementById('address_autocomplete_sidebar')
        var input2 = document.getElementById('address_autocomplete_mobileform')

        if (input1) {
          autocomplete1 = new window.google.maps.places.Autocomplete(input1, {
            types: ['address'],
            componentRestrictions: { country: 'us' },
          })
          window.google.maps.event.addDomListener(input1, 'keydown', function (event2) {
            var lat = document.getElementById('address_lat_sidebar')
            if (event2.keyCode === 13 && !lat.value) {
              event2.preventDefault();
            }
          })
          autocomplete1.addListener('place_changed', fillInAddress1)
        }
        if (input2) {
          autocomplete2 = new window.google.maps.places.Autocomplete(input2, {
            types: ['address'],
            componentRestrictions: { country: 'us' },
          })
          window.google.maps.event.addDomListener(input2, 'keydown', function (event2) {
            var lat = document.getElementById('address_lat_mobileform')
            if (event2.keyCode === 13 && !lat.value) {
              event2.preventDefault();
            }
          })
          autocomplete2.addListener('place_changed', fillInAddress2)
        }
      }

      function fillInAddress1() {
        var lat = document.getElementById('address_lat_sidebar')
        var lon = document.getElementById('address_lon_sidebar')
        var city = document.getElementById('city_sidebar')
        var state = document.getElementById('state_sidebar')
        var place = autocomplete1.getPlace()
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
      function fillInAddress2() {
        var lat = document.getElementById('address_lat_mobileform')
        var lon = document.getElementById('address_lon_mobileform')
        var city = document.getElementById('city_mobileform')
        var state = document.getElementById('state_mobileform')
        var place = autocomplete2.getPlace()
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
