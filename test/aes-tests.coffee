assert = require 'assert'
should = require 'should'
moment = require 'moment'

settings = require 'settings'
aes = require 'aes'
route_utils = require 'route-utils'

KEY = settings.get('uac:encryption_secret')
TEXT = 'ThisIsATest!'


describe 'aes-tests', ->

    describe '#encrypt()', ->
        it 'should encrypt a string without error', ->
            encrypted = aes.encrypt(KEY, TEXT)
            console.log('Encrypted text: ' + encrypted)
            should.exist encrypted
            encrypted.should.not.equal TEXT

    describe '#decrypt()', ->
        it 'should decrypt a string without error', ->
            encrypted = aes.encrypt(KEY, TEXT)
            should.exist(encrypted)
            decrypted = aes.decrypt(KEY, encrypted)
            console.log('Decrypted text: ' + decrypted)
            should.exist(decrypted)
            decrypted.should.equal(TEXT)


    # Credential test values.
    cluster = '12345'
    user = 'user'
    password = 'P@ssw0rd1'


    describe '#add_acquisition_credentials()', ->
        it 'should store credentials in the session encrypted', ->
            req = (
                session: {}
            )

            # Add the credentials to the session.
            route_utils.add_acquisition_credentials(req, cluster, user, password)

            # Dump the session.
            console.dir(req.session)

            # There should be a credential map in the session.
            credential_map = req.session['acquisition_credentials']
            should.exist(credential_map)

            # There should be an entry for the cluster in the credential map.
            credentials = credential_map[cluster]
            should.exist(credentials)

            # The credentials should match the cluster.
            should.exist(credentials.cluster_uuid)
            credentials.cluster_uuid.should.equal(cluster)

            # User should exist, the value is uniquely encrypted.
            should.exist(credentials.user)

            # Password should exist, the value is uniquely encrypted.
            should.exist(credentials.password)


    describe '#get_acquisition_credentials()', ->
        it 'should retrieve the credentials from the session and decrypt them', ->
            req = (
                session: (
                    acquisition_credentials: {}
                )
            )
            req.session.acquisition_credentials[cluster] = (
                cluster_uuid: cluster
                user: aes.encrypt(KEY, user)
                password: aes.encrypt(KEY, password)
            )

            console.dir(req.session)

            credentials = route_utils.get_acquisition_credentials(req, cluster)

            should.exist(credentials)
            should.exist(credentials.cluster_uuid)
            credentials.cluster_uuid.should.equal(cluster)
            should.exist(credentials.user)
            credentials.user.should.equal(user)
            should.exist credentials.password
            credentials.password.should.equal password
