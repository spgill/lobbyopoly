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
app.controller('LobbyController', function($http, $state, $stateParams, $mdDialog, $mdToast, socket) {
    //- Unpack state params
    this.lobby_code = $stateParams.code
    this.lobby_name = $stateParams.name
    this.player = $stateParams.name

    //- VARIABLES
    this.loading = true
    this.balance = 0
    this.players = []
    this.bank = 0
    this.banker = false

    //- FUNCTIONS
    // Init function to connect to the lobby
    this.connect = () => {
        socket.emit('player.connect', {
            code: this.lobby_code,
            name: this.lobby_name
        })
    }

    // Function to determine if the local player is the banker or not
    this.is_banker = () => {
        return this.player == this.banker
    }

    // Function to generate the avatar URL
    this.avatar = (name=false) => {
        if (name == false) {
            name = this.lobby_name
        }
        return `http://api.adorable.io/avatars/196/${this.lobby_code}${name}.png`
    }

    //- Connection completion event
    socket.on('player.connect complete', () => {
        this.loading = false
    })

    //- Error handling event
    socket.on('error', (response) => {
        $mdDialog.show(
            $mdDialog.alert()
            .title('Problem loading lobby')
            .textContent(response.data.message)
            .ok('Dismiss')
        ).then(() => {
            if (this.loading) {
                $state.go('splash')
            }
        })
    })

    //- Update event handling
    socket.on('update', (response) => {
        console.log('Update Received', response)

        // Unpack the data
        this.bank = response.payload.bank
        this.banker = response.payload.banker
        this.players = response.payload.players
        this.balance = response.payload.balance
    })
})


// Controller for player controls (lol)
app.controller('PlayerControlsController', function() {
    this.what = 'is up, my dudes'
})
