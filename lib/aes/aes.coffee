crypto = require 'crypto'


###
    Encrypt the text using the secret key.

    Params:
        secret - the secret key.
        data - the text to encrypt.
    Returns:
        The encrypted string.
###
encrypt = (secret, data) ->
    if data is null
        return null;
    else if typeof data is 'undefined'
        return undefined
    else if data is ''
        return ''
    else
        # Create a random initialization vector.
        iv = crypto.randomBytes(16)

        # Create the key based on the secret pass-phrase.
        md5 = crypto.createHash('md5')
        md5.update(secret);
        key = md5.digest('hex')

        # Encrypt the data.
        cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
        encrypted = [cipher.update(data)]
        encrypted.push(cipher.final())

        Buffer.concat([iv, Buffer.concat(encrypted)]).toString('base64');


###
    Decrypt the text using the secret key.

    Params:
        secret - the secret key.
        data - the text to decrypt.
    Returns:
        The decrypted text.
###
decrypt = (secret, data) ->
    if data is null
        return null
    else if typeof data == 'undefined'
        return undefined
    else if data is ''
        return ''
    else
        cipher = new Buffer(data, 'base64')
        iv = cipher.slice(0, 16)
        ciphertext = cipher.slice(16)

        # Create the key based on the secret pass-phrase.
        md5 = crypto.createHash('md5')
        md5.update(secret)
        key = md5.digest('hex')

        # Decrypt the data.
        decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
        decrypted = [decipher.update(ciphertext)]
        decrypted.push(decipher.final())

        Buffer.concat(decrypted).toString('utf8');


exports.encrypt = encrypt
exports.decrypt = decrypt