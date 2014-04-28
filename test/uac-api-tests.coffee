async = require 'async'
chai = require 'chai'
should = chai.Should()

utils = require './test-utils'

moment = require 'moment'

# Setup underscore.
_ = require 'underscore'

settings = require 'settings'
uuid = require 'node-uuid'
api = require 'uac-api'

log = require 'winston'
log.remove log.transports.Console
log.add log.transports.Console, (
    level: 'debug'
    colorize: true
)


mcube_timeout = settings.get 'uac:mcube_api_timeout'

# An MD5 that is not detected by AV.
UNDETECTED_MD5 = '681b80f1ee0eb1531df11c6ae115d711'
DETECTED_MD5 = 'c100bde0c1e0d7e77dcbc6e00bc165f3'


describe 'uac-api-tests', ->
    describe '#get_ioc_terms()', ->
        it 'should return all ioc terms for ArpEntryItem', (done) ->
            api.get_ioc_terms 'ArpEntryItem', (err, terms) ->
                try
                    should.not.exist err
                    should.exist terms
                    terms.length.should.equal 4
                    done()
                catch e
                    done(e)

        it 'should return all ioc terms for DiskItem', (done) ->
            api.get_ioc_terms 'DiskItem', (err, terms) ->
                try
                    should.not.exist(err)
                    should.exist(terms)
                    terms.length.should.equal(6)
                    done()
                catch e
                    done(e)

    describe '#create_activity()', ->
        activity_uuid = undefined

        afterEach (done) ->
            if activity_uuid
                api.delete_activity activity_uuid, (err) ->
                    try
                        should.not.exist err
                        console.log 'Successfully deleted activity with id: ' + activity_uuid
                        done()
                    catch e
                        done(e)
            else
                done()

        it 'should create a new activity record', (done) ->
            api.create_activity 'tag', {tag: 'escalate'}, {uid: 'anthony.milano@mandiant.com'}, (err, activity) ->
                try
                    should.not.exist err
                    should.exist activity

                    attr = activity.attributes
                    attr.uuid.should.exist
                    activity_uuid = attr.uuid
                    should.exist attr.created
                    attr.activity_type.should.equal 'tag'
                    attr.data.should.exist
                    o = JSON.parse attr.data
                    o.should.exist
                    o.tag.should.equal 'escalate'

                    done()
                catch e
                    done e

    describe '#get_alert_activity()', ->
        it 'should return the alerts activity', (done) ->
            # TODO: Need to make this test resilient.
            api.get_alert_activity '06874854-d403-4659-941e-285e0d3f9313', (err, activity) ->
                try
                    should.exist activity
                    utils.should_be_list activity
                    done()
                catch e
                    done e

    describe '#create_alert_activity_fk()', ->
        activity_uuid = undefined
        alert_activity_uuid = undefined

        beforeEach (done) ->
            api.create_activity 'tag', {tag: 'escalate'}, {uid: 'anthony.milano@mandiant.com'}, (err, activity) ->
                try
                    should.not.exist err
                    activity_uuid = activity.get('uuid')
                    done()
                catch e
                    done(e)

        it 'should create a new alert activity foreign key record', (done) ->
            api.create_alert_activity_fk uuid.v4(), activity_uuid, (err, alert_activity) ->
                try
                    should.not.exist err
                    should.exist alert_activity
                    attr = alert_activity.attributes
                    should.exist attr
                    should.exist attr.uuid
                    alert_activity_uuid = attr.uuid
                    done()
                catch e
                    done(e)

        afterEach (done) ->
            if activity_uuid
                api.delete_activity activity_uuid, (err) ->
                    try
                        should.not.exist err
                        done()
                    catch e
                        done(e)
            else
                done()

    describe '#create_alert_tag_activity()', ->
        activity_uuid = undefined

        it 'should create an alert tag activity', (done) ->
            api.create_alert_tag_activity uuid.v4(), 'escalate', {uid: 'anthony.milano@mandiant.com'}, (err, activity, alert_activity) ->
                try
                    should.not.exist err

                    should.exist activity

                    attr = activity.attributes
                    should.exist attr
                    should.exist attr.uuid
                    should.exist attr.created
                    attr.activity_type.should.equal 'tag'
                    should.exist attr.data
                    o = JSON.parse(attr.data)
                    o.tag.should.equal 'escalate'

                    activity_uuid = attr.uuid
                    done()
                catch e
                    done e

        afterEach (done) ->
            if activity_uuid
                api.delete_activity activity_uuid, (err) ->
                    try
                        should.not.exist err
                        done()
                    catch e
                        done e
            else
                done()

    describe '#create_identity_acquisition()', ->
        identity_acquisition_uuid = undefined
        acquisition_uuid = uuid.v4()
        user_uuid = uuid.v4()
        uid = 'Anthony.Milano@Mandiant.com'

        it 'should create an identity acquisition record', (done) ->
            api.create_identity_acquisition(
                'TestIdentity',
                acquisition_uuid,
                user_uuid,
                uid,
            (err, model) ->
                try
                    done()

                    should.not.exist err
                    should.exist model

                    attributes = model.attributes
                    should.exist(attributes)
                    should.exist(attributes.uuid)
                    attributes.acquisition_uuid.should.equal(acquisition_uuid)
                    attributes.user_uuid.should.equal(user_uuid)
                    attributes.uid.should.equal(uid)

                    # Save the uuid in order to delete.
                    identity_acquisition_uuid = attributes.uuid
                catch e
                    done(e)
            )

        after (done) ->
            if identity_acquisition_uuid
                # Delete the identity acquisition record.
                api.delete_identity_acquisition identity_acquisition_uuid, (err) ->
                    should.not.exist(err)

            done()

    describe '#get_identity_acquisitions_by_identity', ->
        it 'should return an empty collection for an invalid identity', (done) ->
            api.get_identity_acquisitions_by_identity 'invalidIdentity', (err, collection) ->
                try
                    should.not.exist(err)
                    should.exist(collection)
                    collection.length.should.equal(0)
                    done()
                catch e
                    done(e)

    describe '#get_vt_details()', ->
        this.timeout(mcube_timeout)
        url = undefined
        before(->
            url = settings.get('uac:mcube_api_url')
        )

        it 'should return null when the MD5 sample does not exist', (done) ->
            api.get_vt_details UNDETECTED_MD5, (err, result) ->
                try
                    should.not.exist(err)
                    should.exist(result)
                    should.exist(result.md5)
                    should.exist(result.found)
                    result.found.should.equal(false)
                    done()
                catch e
                    done(e)


        it 'should return detected details when the sample', (done) ->
            api.get_vt_details DETECTED_MD5, (err, result) ->
                try
                    should.not.exist(err)
                    should.exist(result)

                    assert_vt_details(result, true)

                    done()
                catch e
                    done e


        it 'should return an err when there is a configuration error', (done) ->
            invalid_url = 'invalidurl!'
            settings.set('uac:mcube_api_url', invalid_url)
            should.equal(invalid_url, settings.get('uac:mcube_api_url'))

            api.get_vt_details(DETECTED_MD5, (err, result) ->
                try
                    should.exist(err)
                    should.not.exist(result)

                    done()
                catch e
                    done e
            )

        afterEach ->
            settings.set('uac:mcube_api_url', url)

    describe '#get_md5_details()', ->
        this.timeout(3000)
        url = {}

        before ->
            url = settings.get('uac:mcube_api_url')

        it 'should return found == false when the sample does not exist', (done) ->
            api.get_md5_details UNDETECTED_MD5, (err, result) ->
                try
                    should.not.exist err
                    should.exist result
                    should.exist result.vt
                    should.exist result.vt.found
                    result.vt.found.should.be.false
                    should.exist result.vt.is_detected
                    result.vt.is_detected.should.be.false
                    done()
                catch e
                    done e

        it 'should return vt detected details for a detected sample', (done) ->
            api.get_md5_details(DETECTED_MD5, (err, result) ->
                try
                    should.not.exist(err)
                    should.exist(result)

                    should.not.exist(result.vt_err)
                    should.exist(result.vt)
                    assert_vt_details(result.vt, true)

                    done()
                catch e
                    done e
            )

        it 'does-what?', (done) ->
            api.get_md5_details '4718d26a8072a7db42c75f588b0ca38f', (err, result) ->
                try
                    should.not.exist err
                    should.exist result

                    console.dir result

                    should.exist result.vt
                    result.vt.found.should.be.false
                    result.vt.is_detected.should.be.false

                    done()
                catch e
                    done e

        afterEach ->
            settings.set('uac:mcube_api_url', url)


assert_vt_details = (result, is_detected) ->
    # Assert the meta data.
    should.exist(result.md5)
    should.exist(result.sha1)
    should.exist(result.count)
    result.count.should.be.greaterThan(0)

    # Assert the detected details.
    should.exist(result.detected)
    should.exist(result.detected.length)
    result.detected.length.should.be.greaterThan(0)
    found_detected = false
    result.detected.forEach (detected) ->
        should.exist(detected.detected)
        # Version can be null.
        should.exist(detected.update)
        should.exist(detected.antivirus)

        if detected.detected
            found_detected = true
    # Should have found at least one item that was detected.
    found_detected.should.equal(is_detected)
