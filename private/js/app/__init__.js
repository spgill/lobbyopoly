app = angular.module('spgill.MonopolyManager', [
    'ngMaterial',
    'ui.router',
    'btford.socket-io',

    'spgill.MonopolyManager.config',
    'spgill.MonopolyManager.controllers',
    'spgill.MonopolyManager.directives',
    'spgill.MonopolyManager.states'
])
