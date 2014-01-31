var crypto = require('crypto');


/**
 * Encrypt the text using the secret key.
 * @param secret - the secret key.
 * @param data - the text to encrypt.
 * @returns {String} - the encrypted string.
 */
function encrypt(secret, data) {
    if (data === null) {
        return null;
    }
    else if (typeof data === 'undefined') {
        return undefined;
    }
    else if (data === '') {
        return '';
    }
    else {
        // Create a random initialization vector.
        var iv = crypto.randomBytes(16);

        // Create the key based on the secret pass-phrase.
        var md5 = crypto.createHash('md5');
        md5.update(secret);
        var key = md5.digest('hex');

        // Encrypt the data.
        var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        var encrypted = [cipher.update(data)];
        encrypted.push(cipher.final());

        return Buffer.concat([iv, Buffer.concat(encrypted)]).toString('base64');
    }
}

/**
 * Decrypt the text using the secret key.
 * @param secret - the secret key.
 * @param data - the text to decrypt.
 * @returns {String} - the decrypted text.
 */
function decrypt(secret, data) {
    if (data === null) {
        return null;
    }
    else if (typeof data == 'undefined') {
        return undefined;
    }
    else if (data === '') {
        return '';
    }
    else {
        var cipher = new Buffer(data, 'base64');
        var iv = cipher.slice(0, 16);
        var ciphertext = cipher.slice(16);

        // Create the key based on the secret pass-phrase.
        var md5 = crypto.createHash('md5');
        md5.update(secret);
        var key = md5.digest('hex')

        // Decrypt the data.
        var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        var decrypted = [decipher.update(ciphertext)];
        decrypted.push(decipher.final());

        return Buffer.concat(decrypted).toString('utf8');
    }
}

function encrypt2(secret, text) {
    var m = crypto.createHash('md5');
    m.update(secret);
    var key = m.digest('hex');

    m = crypto.createHash('md5');
    m.update(secret + key);
    var iv = m.digest('hex');

    var data = new Buffer(text, 'utf8').toString('binary');

    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv.slice(0, 16));
    var encrypted = cipher.update(data, 'binary') + cipher.final('binary');
    return new Buffer(encrypted, 'binary').toString('base64');
}

function decrypt2(secret, text) {
    // Convert url safe base64 to normal base64
    var input = text.replace(/\-/g, '+').replace(/_/g, '/');
    // Convert from base64 to binary string
    var encrypted_data = new Buffer(input, 'base64').toString('binary');

    // Create key from password
    var m = crypto.createHash('md5');
    m.update(secret);
    var key = m.digest('hex');

    // Create iv from password and key
    m = crypto.createHash('md5');
    m.update(secret + key);
    var iv = m.digest('hex');

    // Decipher encrypted data
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv.slice(0, 16));
    var decrypted = decipher.update(encrypted_data, 'binary') + decipher.final('binary');
    return new Buffer(decrypted, 'binary').toString('utf8');
}

function encrypt1(text) {
    var cipher = crypto.createCipher('aes-256-cbc', INITIALIZATION_VECTOR);
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt1(text) {
    var decipher = crypto.createDecipher('aes-256-cbc', INITIALIZATION_VECTOR);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;