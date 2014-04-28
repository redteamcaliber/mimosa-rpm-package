define ->

    #
    # Tag descriptions.
    #
    NOTREVIEWED_DESCRIPTION = 'This tag represents a current hit that has been looked at by an analyst. It currently ' +
        'requires more information such as (but not limited to) a File Acquisition, File Listing, or Prefetch ' +
        'information. What the analyst is acquiring should be listed in the comments section.'
    INVESTIGATING_DESCRIPTION = 'This is a hit that can not easily be determined as being malicious and needs additional ' +
        'analysis by a senior analyst.'
    ESCALATE_DESCRIPTION = 'This is a hit that can not easily be determined as being malicious and needs additional ' +
        'analysis by a senior analyst.'
    REPORTABLE_DESCRIPTION = 'This is an interim state for when a hit(s) has been identified as malicious and are ' +
        'currently being written up in Portal.'
    REPORTED_DESCRIPTION = 'This state is for after a Portal Compromise has been created. The comments NEED to list the ' +
        'Portal compromise number.'
    UNREPORTABLE_DESCRIPTION = 'This is used to represent a \'Benign\' hit. Meaning the IOC matched the intended item ' +
        'but it is not considered malicious. Examples include a registry key where the binary for commodity is no longer ' +
        'present or a password dumper located in a specific directory or host of someone working on the security team.'
    DELETE_DESCRIPTION = 'Everything else.'

    tags = [
        {id: 'notreviewed', title: 'Not Reviewed', description: NOTREVIEWED_DESCRIPTION, category: 'new'}
        {id: 'investigating', title: 'Investigating', description: INVESTIGATING_DESCRIPTION, category: 'open'}
        {id: 'escalate', title: 'Escalate', description: ESCALATE_DESCRIPTION, category: 'open'}
        {id: 'reportable', title: 'Reportable', description: REPORTABLE_DESCRIPTION, category: 'open'}
        {id: 'reported', title: 'Reported', description: REPORTED_DESCRIPTION, category: 'closed'}
        {id: 'unreported', title: 'Unreported', description: UNREPORTABLE_DESCRIPTION, category: 'closed'}
        {id: 'delete', title: 'Delete', description: DELETE_DESCRIPTION, category: 'closed'}
    ]

    resources =
        tags: tags

    for tag in tags
        resources[tag.id] = tag

    resources