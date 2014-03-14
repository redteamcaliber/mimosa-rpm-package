define (require) ->
    # Load the theme view on page load for every page.
    ThemeView = require('uac/views/ThemeView')
    new ThemeView(el: "#uac-user-nav")