(function () {

    /**
     * gtXXTEA service
     * @module app.core/gtXXTEA
     *
     * Simple encryption service
     *
     */
    angular.module('xxTeaCrypt')
        .factory('gtXXTEACrypt', serviceFunction);

    serviceFunction.$inject = ['gtBase64Encoder', 'gtUtf8Encoder'];

    /* @ngInject */
    function serviceFunction(gtBase64Encoder, gtUtf8Encoder) {

        return {
            encrypt: encrypt,
            decrypt: decrypt
        };

        /*
         * encrypt text using Corrected Block TEA (xxtea) algorithm
         *
         * @param {string} plaintext String to be encrypted (multi-byte safe)
         * @param {string} password  Password to be used for encryption (1st 16 chars)
         * @returns {string} encrypted text
         */
        function encrypt(plaintext, password) {
            if (plaintext.length == 0) return (''); // nothing to encrypt
            // convert string to array of longs after converting any multi-byte chars to UTF-8
            var v = strToLongs(gtUtf8Encoder.encode(plaintext));
            if (v.length <= 1) v[1] = 0; // algorithm doesn't work for n<2 so fudge by adding a null
            // simply convert first 16 chars of password as key
            var k = strToLongs(gtUtf8Encoder.encode(password).slice(0, 16));
            var n = v.length;

            // ---- <TEA coding> ----
            var z = v[n - 1],
                y = v[0],
                delta = 0x9E3779B9;
            var mx, e, q = Math.floor(6 + 52 / n),
                sum = 0;

            while (q-- > 0) { // 6 + 52/n operations gives between 6 & 32 mixes on each word
                sum += delta;
                e = sum >>> 2 & 3;
                for (var p = 0; p < n; p++) {
                    y = v[(p + 1) % n];
                    mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
                    z = v[p] += mx;
                }
            }

            // ---- </TEA> ----
            var ciphertext = longsToStr(v);

            return gtBase64Encoder.encode(ciphertext);
        }

        /*
         * decrypt text using Corrected Block TEA (xxtea) algorithm
         *
         * @param {string} ciphertext String to be decrypted
         * @param {string} password   Password to be used for decryption (1st 16 chars)
         * @returns {string} decrypted text
         */
        function decrypt(ciphertext, password) {
            if (ciphertext.length == 0) return ('');
            var v = strToLongs(gtBase64Encoder.decode(ciphertext));
            var k = strToLongs(gtUtf8Encoder.encode(password).slice(0, 16));
            var n = v.length;

            // ---- <TEA decoding> ----
            var z = v[n - 1],
                y = v[0],
                delta = 0x9E3779B9;
            var mx, e, q = Math.floor(6 + 52 / n),
                sum = q * delta;

            while (sum != 0) {
                e = sum >>> 2 & 3;
                for (var p = n - 1; p >= 0; p--) {
                    z = v[p > 0 ? p - 1 : n - 1];
                    mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
                    y = v[p] -= mx;
                }
                sum -= delta;
            }

            // ---- </TEA> ----
            var plaintext = longsToStr(v);

            // strip trailing null chars resulting from filling 4-char blocks:
            plaintext = plaintext.replace(/\0+$/, '');

            return gtUtf8Encoder.decode(plaintext);
        }

        /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

        // supporting functions
        function strToLongs(s) { // convert string to array of longs, each containing 4 chars
            // note chars must be within ISO-8859-1 (with Unicode code-point < 256) to fit 4/long
            var l = new Array(Math.ceil(s.length / 4));
            for (var i = 0; i < l.length; i++) {
                // note little-endian encoding - endianness is irrelevant as long as
                // it is the same in longsToStr()
                l[i] = s.charCodeAt(i * 4) + (s.charCodeAt(i * 4 + 1) << 8) + (s.charCodeAt(i * 4 + 2) << 16) + (s.charCodeAt(i * 4 + 3) << 24);
            }
            return l; // note running off the end of the string generates nulls since
        } // bitwise operators treat NaN as 0

        function longsToStr(l) { // convert array of longs back to string
            var a = new Array(l.length);
            for (var i = 0; i < l.length; i++) {
                a[i] = String.fromCharCode(l[i] & 0xFF, l[i] >>> 8 & 0xFF, l[i] >>> 16 & 0xFF, l[i] >>> 24 & 0xFF);
            }
            return a.join(''); // use Array.join() rather than repeated string appends for efficiency in IE
        }

    }

})();
