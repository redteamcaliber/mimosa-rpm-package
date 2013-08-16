import datetime
from fabric.decorators import task
from fabric.operations import put, local, prompt
from fabric.api import env, run, cd, lcd

# The UAC git repository.
env.uac_repo = 'git@github.mandiant.com:amilano/uac-node.git'
# The id of the user the build will run as.
env.user = 'root'
# The password of the user the build will run as.
env.password = 'devnet'
# The hosts the build will run on.
env.hosts = ['vm.mandiant.com']
# The directory to run the build in.
env.build_dir = '/root/build'
# The git branch to build off of.
env.build_branch = 'master'


@task(default=True)
def rpm():
    # Ensure the build directory exists.
    build_dir = env.build_dir

    if not build_dir:
        print 'Error: Invalid env.build_dir setting.'
        return

    # Create the build directory.
    mkdir(build_dir)

    # Create the application root directory.
    uac_dir = build_dir + '/opt/web/apps/uac'
    mkdir(uac_dir)

    if not env.build_branch:
        print 'Error: Invalid env.build_branch setting.'
        return

    # Pull the latest code to the build directory.
    local('git clone -b %s %s %s' % (env.build_branch, env.uac_repo, uac_dir))

    # Change the bin permissions.
    uac_bin_dir = '%s/bin' % uac_dir
    chmod('+x %s/*' % uac_bin_dir)

    with lcd(uac_dir):
        # Install the node dependencies.
        local('./bin/install_libs.sh')
        # Run the RPM script.
        local('./bin/build_rpm.sh')


@task(default=True)
def buildsdfold():
    """
    Build the UAC application off of a git repo.
    """

    # Ensure the build directory exists.
    build_dir = env.build_dir
    mkdir(build_dir)

    # Create the venvs directory.
    venvs_dir = '%s/%s' % (build_dir, 'opt/venvs')
    mkdir(venvs_dir)

    # Create a virtual environment.
    venv_dir = '%s/%s' % (venvs_dir, 'uac')
    virtualenv(venv_dir)

    # Create the site directory.
    site_dir = '%s/%s' % (venv_dir, 'site')
    mkdir(site_dir)

    # Create an archive of the current project based on the branch.
    archive_file = 'uac-build.tar'
    local('git archive %s > %s' % (env.build_branch, archive_file))

    # Copy the archive to the site dir.
    remote_archive_file = '%s/%s' % (site_dir, archive_file)
    put(archive_file, remote_archive_file)

    # Extract the remote archive file.
    with cd(site_dir):
        run('tar -xf %s' % remote_archive_file)
        # Remove the remote archive file.
    run('rm -rf %s' % remote_archive_file)
    # Remove the local archive file.
    local('rm -rf %s' % archive_file)

    python = '%s/bin/python' % venv_dir
    pip = '%s/bin/pip' % venv_dir

    # Install the requirements.
    print 'Installing UAC python requirements...'
    reqs_file = site_dir + '/requirements.txt'
    run('%s install -qr %s' % (pip, reqs_file))

    # with cd(site_dir):
    #     # Collect the static files.
    #     run('%s manage.py collectstatic -v0 --noinput' % python)
    #     # Compress the static files.
    #     run('%s manage.py compress' % python)

    # Update the absolute paths in the virtual environment.
    print 'venv_dir: ' + venv_dir
    run("sed -i 's|%s||g' %s/bin/*" % (build_dir, venv_dir))

    with cd(site_dir):
        print('building the rpm...')
        chmod('+x ./build_rpm.sh')
        run('./build_rpm.sh')


@task
def clean():
    """
    Clean the build directory.
    """
    if prompt('Delete directory: %s? >' % env.build_dir):
        local('rm -rf %s' % env.build_dir)
    else:
        exit()


def chmod(params):
    """
    Run the UNIX chmod command.
    """
    local('chmod %s' % params)


def get_datetime():
    now = datetime.datetime.now()
    return '%02d-%02d-%02d-%02d%02d%02d' % (now.year, now.month, now.day, now.hour, now.minute, now.second)


def mkdir(build_dir):
    """
    Run the UNIX mkdir command.
    """
    local('mkdir -p {0}'.format(build_dir))


def virtualenv(d):
    """
    Run the virtualenv command.
    """
    local('virtualenv %s' % d)
