app = angular.module('spgill.MonopolyManager.controllers', ['spgill.MonopolyManager'])


// Controller for splash state
app.controller('SplashController', function($http, $state) {
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
            $http.get('/api/lobby_create', {
                params: {
                    name: this.name
                }
            })
            .then((response) => {
                $state.go('lobby', {
                    code: response.data,
                    name: this.name
                })
            })
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
    this.parking = 0
    this.log = []

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

    // Transfer money
    this.transfer = (from, to) => {
        if (from == 'player') {
            from = this.player
        } else {
            from = `__${from}__`
        }

        socket.emit('transfer', {
            code: this.lobby_code,
            amount: 100,
            from: from,
            to: to
        })
    }

    // Connection completion event
    socket.on('player.connect complete', () => {
        this.loading = false
    })

    // Error handling event
    socket.on('error', (response) => {
        $mdDialog.show(
            $mdDialog.alert()
            .title('Error encountered')
            .textContent(response.message)
            .ok('Dismiss')
        ).then(() => {
            if (this.loading) {
                $state.go('splash')
            }
        })
    })

    // Update event handling
    socket.on('update', (response) => {
        console.log('Update Received', response)

        // Unpack the data
        this.bank = response.payload.bank
        this.banker = response.payload.banker
        this.players = response.payload.players
        this.balance = response.payload.balance
        this.parking = response.payload.parking

        // If there's a message attached, add it to the log
        if (response.message) {
            let date = new Date()
            let stamp = `${date.getHours()}:${date.getMinutes()}`
            this.log.splice(0, 0, [stamp, response.message])
        }
    })
})
