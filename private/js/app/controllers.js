app = angular.module('spgill.MonopolyManager.controllers', ['spgill.MonopolyManager'])


// Controller for toolbar
app.controller('ToolbarController', function($rootScope, $mdDialog) {
    this.global = $rootScope

    this.rules = (ev) => {
        $mdDialog.show({
            templateUrl: '/html/template/rules.html',
            autoWrap: false,
            targetEvent: ev,
            controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {
                $scope.cancel = $mdDialog.cancel
            }],
            fullscreen: true
        })
    }
})


// Controller for splash state
app.controller('SplashController', function($rootScope, $http, $state) {
    this.toolbar_wipe = () => {
        $rootScope.lobby_code = ''
    }

    this.join = () => {
        if (this.code && this.name) {
            $state.go('lobby', {
                code: this.code.toUpperCase(),
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


pad = (n) => {
    return ('00' + n).slice(-2)
}


// Controller for lobby state
app.controller('LobbyController', function($rootScope, $http, $state, $stateParams, $mdDialog, $mdToast, socket) {
    //- Unpack state params
    this.lobby_code = $stateParams.code
    this.lobby_name = $stateParams.name
    this.player = $stateParams.name

    //- VARIABLES
    this.loading = true
    this.players = {}
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
        return `http://api.adorable.io/avatars/192/${this.lobby_code}${name}.png`
    }

    // Prompt the user for an amount to send
    this.prompt_amount = (ev, from) => {
        // Get the correct balance for the prompt's math special buttons
        let balance = this.players[this.player]
        if (from == '__bank__') {
            balance = this.bank
        } else if (from == '__parking__') {
            balance = this.parking
        }

        // Show the dialog
        return $mdDialog.show({
            templateUrl: '/html/template/prompt.html',
            autoWrap: true,
            openFrom: ev,
            closeTo: 'div.lobby-log-card',
            controller: 'PromptAmountController',
            controllerAs: 'prompt',
            locals: {
                balance: balance
            },
            bindToController: true
        })
    }

    // Transfer money
    this.transfer = (ev, from, to) => {
        if (from == 'player') {
            from = this.player
        } else {
            from = `__${from}__`
        }

        this.prompt_amount(ev, from).then((n) => {
            socket.emit('transfer', {
                code: this.lobby_code,
                amount: n,
                from: from,
                to: to
            })
        })
    }

    // Open the player list
    this.player_list = (ev) => {
        $mdDialog.show({
            templateUrl: '/html/template/players.html',
            autoWrap: false,
            openFrom: ev,
            controller: 'PlayerListController',
            controllerAs: 'list',
            locals: {
                'players': this.players,
                'lobby_code': this.lobby_code,
                'banker': this.banker
            },
            bindToController: true
        })
    }

    // Connection completion event
    socket.on('player.connect complete', () => {
        this.loading = false
        $rootScope.lobby_code = this.lobby_code
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
        this.parking = response.payload.parking

        // Set the toolbar button flag
        if (this.banker == this.player) {
            $rootScope.lobby_button = this.player_list
        } else {
            $rootScope.lobby_button = null
        }

        // If there's a message attached, add it to the log
        if (response.message) {
            let date = new Date()
            let stamp = `${pad(date.getHours())}:${pad(date.getMinutes())}`
            this.log.splice(0, 0, [stamp, response.message])
        }
    })

    // You've been kicked
    socket.on('kicked', (response) => {
        $state.go('splash')
    })
})


//- Controller for Amount prompt
app.controller('PromptAmountController', function($mdDialog) {
    // VARIABLES
    this.amount = 0

    // FUNCTIONS
    this.add = (n) => {
        this.amount += Math.floor(n)
    }

    this.send = () => {
        $mdDialog.hide(this.amount)
    }

    this.cancel = () => {
        $mdDialog.cancel(null)
    }
})


//- Controller for player list
app.controller('PlayerListController', function($mdDialog, socket) {
    this.avatar = (name) => {
        return `http://api.adorable.io/avatars/192/${this.lobby_code}${name}.png`
    }

    this.kick = (ev, name) => {
        $mdDialog.show(
            $mdDialog.confirm()
                .title('Kick player?')
                .textContent(`Are you sure you want to kick ${name} from the lobby?`)
                .ok('Yes')
                .cancel('No')
                .targetEvent(ev)
        ).then(() => {
            socket.emit('kick', {
                'code': this.lobby_code,
                'name': name
            })
        })
    }

    this.promote = (ev, name) => {
        $mdDialog.show(
            $mdDialog.confirm()
                .title('Promote player?')
                .textContent(`Are you sure you want to promote ${name} to banker? You will lose all priveleges as the current banker.`)
                .ok('Yes')
                .cancel('No')
                .targetEvent(ev)
        ).then(() => {
            socket.emit('promote', {
                'code': this.lobby_code,
                'name': name
            })
        })
    }

    this.cancel = () => {
        $mdDialog.cancel()
    }
})
