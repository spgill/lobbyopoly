app = angular.module('spgill.MonopolyManager.states', ['spgill.MonopolyManager'])

app.config(function($stateProvider, $urlRouterProvider) {
    // Define default route
    $urlRouterProvider.otherwise('/splash')

    // Splash screen state
    $stateProvider.state('splash', {
        url: '/splash',
        templateUrl: '/html/state/splash.html',
        controller: 'SplashController as main'
    })

    // Lobby state
    $stateProvider.state('lobby', {
        url: '/lobby/:code/:name',
        templateUrl: '/html/state/lobby.html',
        controller: 'LobbyController as main'
    })
})
