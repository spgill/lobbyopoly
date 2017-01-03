app = angular.module('spgill.MonopolyManager.config', ['spgill.MonopolyManager'])

// Configure the theme
app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('red', {
            'default': '600'
        })
        .accentPalette('blue', {
            'default': '900'
        })
        .warnPalette('yellow')

    $mdThemingProvider.enableBrowserColor({hue: '600'})
})
