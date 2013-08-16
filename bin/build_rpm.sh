#!/bin/bash

# Version settings.
Name:       {{NAME}}
Version:    {{VERSION}}
Release:    {{RELEASE}}

# The git branch to build.
BRANCH=master
# The repo to build.
REPO=git@github.mandiant.com:amilano/uac-node.git

# The build directory.
BUILD_DIR=/root/build
# The source project directory.
PROJECT_DIR=$BUILD_DIR/opt/web/apps/uac

# The RPM build output directory.
RPMBUILD_DIR=$PROJECT_DIR/rpmbuild
RPM_FILE=$NAME-$VERSION.tgz
TAR_FILE=$RPMBUILD_DIR/SOURCES/$RPM_FILE


echo

if [ -z "$BRANCH" ]; then
    echo "BRANCH is not set."
    exit 1
fi

if [ -z "$BUILD_DIR" ]; then
    echo "BUILD_DIR is not set."
    exit 1
fi

if [ -e "$SPEC_FILE" ]; then
    echo "$SPEC_FILE does not exist."
    exit 1
fi

# Remove any existing aritfacts.
read -p "Delete build directory: $BUILD_DIR? (y/n)# " -n 1
if [ "x$REPLY" = "xy" ]; then
    rm -rf $BUILD_DIR
else
    exit 1
fi

# Create the build output directory.
mkdir -p $BUILD_DIR

# Pull the code into the build directory.
git clone -b $BRANCH $REPO $PROJECT_DIR

echo 'Creating the build area...'
cd $PROJECT_DIR
mkdir $RPMBUILD_DIR
mkdir $RPMBUILD_DIR/BUILD
mkdir $RPMBUILD_DIR/RPMS
mkdir $RPMBUILD_DIR/SOURCES
mkdir $RPMBUILD_DIR/SPECS
mkdir $RPMBUILD_DIR/SRPMS
mkdir $RPMBUILD_DIR/tmp
echo 'OK'


# Create the rpm spec file.
echo 'Generating the spec file...'
sed -e s,{{NAME}},$NAME,g \
    -e s,{{VERSION}},$VERSION,g \
    -e s,{{RELEASE}},$RELEASE,g \
    $PROJECT_DIR/conf/$NAME.spec > $RPMBUILD_DIR/SPECS/$NAME.spec
if [ $? -gt 0 ]; then
    # Error
    echo 'Error creating spec file.'
    exit 1
fi
echo 'OK'

# Make the bin directory writable.
chmod +x ./bin/*

# Download the node dependencies.
./bin/install_libs.sh

# Create the rpm tar.
tar -czf $TARFILE --exclude=./rpmbuild --exclude=conf/settings_local.json --exclude=./logs --exclude=./sql ./*
if [ $? -gt 0 ]; then
    # Error
    echo 'Error creating tar file.'
    exit 1
fi
echo 'OK'

# Create the rpm.
echo 'Building the RPM...'
rpmbuild --define "_topdir $RPMBUILD_DIR" -bb rpmbuild/SPECS/$NAME.spec
if [ $? -gt 0 ]; then
    # Error
    echo 'Error creating the RPM package.'
    exit 0
fi
echo 'OK'
