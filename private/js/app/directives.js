app = angular.module('spgill.MonopolyManager.directives', ['spgill.MonopolyManager'])


// Directive for player controls
app.directive('playerControls', function() {
    return {
        restrict: 'E',
        templateUrl: '/html/template/controls.html',
        controller: 'PlayerControlsController as controls',
        link: (scope, element, attributes) => {
            if (attributes.banker) {
                scope.banker = true
            }
            else {
                scope.banker = false
            }
        }
    }
})
