app = angular.module('spgill.MonopolyManager.states', ['spgill.MonopolyManager'])

app.config(function($stateProvider, $urlRouterProvider) {
    // Define default route
    $urlRouterProvider.otherwise('/splash')

    // Splash screen state
    $stateProvider.state('splash', {
        'url': '/splash',
        'templateUrl': '/html/state/splash.html'
    })
})
