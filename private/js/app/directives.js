app = angular.module('spgill.MonopolyManager.directives', ['spgill.MonopolyManager'])


// Directive for player controls
app.directive('playerControls', function() {
    return {
        restrict: 'E',
        templateUrl: '/html/template/controls.html',
        controller: function($attrs) { this.mode = $attrs.mode },
        controllerAs: 'control',
        scope: true
    }
})
