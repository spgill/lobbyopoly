app = angular.module('spgill.MonopolyManager.controllers', ['spgill.MonopolyManager'])


// Controller for splash state
app.controller('SplashController', function($state) {
    this.join = () => {
        if (this.code && this.name) {
            $state.go('lobby', {
                code: this.code,
                name: this.name
            })
        }
    }

    this.create = () => {
        if (this.name) {

        }
    }
})


// Controller for lobby state
app.controller('LobbyController', function($state) {

})


// Controller for player controls (lol)
app.controller('PlayerControlsController', function() {
    this.what = 'is up, my dudes'
})
