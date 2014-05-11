define ->

    SF_IOC_SEARCH:              'sf:ioc:search'             # Triggered when a user submits an IOC search.
    SF_IOC_RESET:               'sf:ioc:reset'              # Triggered when a user resets the IOC search parameters.
    SF_IOCSUMMARY_SELECT:       'sf:iocsummary:select'      # Triggered when a user selects an IOC summary.
    SF_EXPKEY_SELECT:           'sf:exp_key:select'         # Triggered when a user selects an IOC expression.
    SF_IOCNAMEHASH_SELECT:      'sf:iocnamehash:select'     # Triggered when a user selects an IOC name hash.
    SF_IOCUUID_SELECT:          'sf:iocuuid:select'         # Triggered when a user selects an IOC uuid.
    SF_HITS_RENDER:             'sf:hits:render'            # Triggered when hits are displayed.
    SF_IDENTITY_SELECT:         'sf:identity:select'        # Triggered when a user selects a specific identity version.
    SF_IOC_TAB_SELECT:          'sf:ioc_tab:select'         # Triggered when a user selects an IOC into focus.

    SF_MERGE:                   'sf:merge'                  # Triggered when a hit is merged.
    SF_MERGE_ALL:               'sf:merge_all'              # Triggered when all versions of a hit are merged.

    SF_SUPPRESSION_SELECT:      'sf:suppression:select'     # Triggered when a user has selected a suppression.
    SF_SUPPRESS_ACTION:         'sf:suppress:action'        # Triggered when a user has selected the suppress option.
    SF_SUPPRESS_CREATE:         'sf:suppress:create'        # Triggered when a suppression has been created.
    SF_SUPPRESS_DELETE:         'sf:suppress:delete'        # Triggered when a suppression has been deleted.

    SF_AUTO_SUPPRESS_ACTION:    'sf:auto_suppress:action'   # Triggered when a user has selected the auto-suppress option.

    SF_TAG_CREATE:              'sf:tag:create'             # Triggered when a user has applied a tag to a hit.
    SF_TAG_SELECT:              'sf:tag:select'             # Triggered when a user has selected a tag on the hits by tag view.

    SF_MASS_TAG_ACTION:         'sf:mass_tag:action'        # Triggered when a user has selected the option to mass tag.
    SF_MASS_TAG_CREATE:         'sf:mass_tag:create'        # Triggered when a user has completed a mass tag operation.

    SF_ACQUIRE_ACTION:          'sf:acquire:action'         # Triggered when a user has selected the option to acquire.
    SF_ACQUIRE_CREATE:          'sf:acquire:create'         # Triggered when a user has created an acquisition.
