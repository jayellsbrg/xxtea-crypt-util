(function() {
    'use strict';

    angular.module('app', [
        'ngMaterial',
        'xxTeaCrypt'
    ])

    .controller('GtAppController', GtAppController);

    GtAppController.$inject = ['gtXXTEACrypt'];

    function GtAppController(gtXXTEACrypt) {
        var vm = this;

        vm.plain;
        vm.cipher;
        vm.password;

        vm.encrypt = encrypt;
        vm.decrypt = decrypt;

        function encrypt() {
            if (vm.plain) {
                vm.cipher = encodeURIComponent(gtXXTEACrypt.encrypt(vm.plain, vm.password || ''));
            } else {
                vm.cipher = undefined;
            }
        }

        function decrypt() {
            var plain;
            if (vm.cipher) {
                try {
                    plain = gtXXTEACrypt.decrypt(decodeURIComponent(vm.cipher), vm.password || '');
                } catch (e) {
                    plain = 'ERROR:' + angular.toJson(e);
                }
                vm.plain = plain;
            } else {
                vm.plain = undefined;
            }
        }
    }

})();
